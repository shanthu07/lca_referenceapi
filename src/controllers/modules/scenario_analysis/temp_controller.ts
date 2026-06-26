import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { successResponse } from "../../../utils/response";
import { getPool, getPool2 } from "../../../config/db";
import {
  GET_PROCESS_CATEGORY_MASTER,
  GET_PROCESS_CATEGORY_MASTER_WITH_PROCESSES,
  GET_MY_PROCESS,
  ADD_MY_PROCESS,
  DELETE_MY_PROCESS,
  DELETE_SCENARIO,
  CREATE_SCENARIO,
  GET_MY_SCENARIOS,
  GET_SCENARIO_BY_ID,
  GET_SCENARIO_DETAILS,
  GET_SCENARIO_AI_WORKSPACE,
  UPSERT_SCENARIO_AI_WORKSPACE_ASSESSMENT,
  UPSERT_SCENARIO_AI_WORKSPACE_GOAL_SCOPE,
  UPSERT_SCENARIO_AI_WORKSPACE_INSIGHTS,
  UPSERT_SCENARIO_PROCESS,
} from "../../../queries/temp.queries";

export const getProcessCategoryMaster = asyncHandler(
  async (req: Request, res: Response) => {
    const industryId = Number(req.params.industryId);
    const includeProcesses = req.query.includeProcesses === "true";

    const pool = await getPool();

    // Categories only
    if (!includeProcesses) {
      const result = await pool
        .request()
        .input("industryId", industryId)
        .query(GET_PROCESS_CATEGORY_MASTER);

      return res.json(
        successResponse(
          result.recordset,
          "Process Category Master fetched successfully"
        )
      );
    }

    // Categories + Processes
    const result = await pool
      .request()
      .input("industryId", industryId)
      .query(GET_PROCESS_CATEGORY_MASTER_WITH_PROCESSES);

    const categoryMap = new Map<number, any>();

    result.recordset.forEach((row) => {
      const categoryId = row.ProcessCategoryID;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          ProcessCategoryID: row.ProcessCategoryID,
          IndustryId: row.IndustryId,
          CategoryName: row.CategoryName,
          Description: row.Description,
          ParentCategoryID: row.ParentCategoryID,
          IsActive: row.IsActive,
          IsRecycled: row.IsRecycled,
          ProcessMaster: [],
        });
      }

      if (row.ProcessID) {
        categoryMap.get(categoryId).ProcessMaster.push({
          ProcessID: row.ProcessID,
          IndustryID: row.IndustryId,
          ProcessCategoryID: row.ProcessCategoryID,
          ProcessName: row.ProcessName,
          Description: row.ProcessDescription,
          IsMandatoryDefault: row.IsMandatoryDefault,
          IsActive: row.ProcessIsActive,
        });
      }
    });

    return res.json(
      successResponse(
        Array.from(categoryMap.values()),
        "Process Category Master fetched successfully"
      )
    );
  }
);

export const getMyProcess = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);

  if (!tenantId || !userId) {
    return res.status(400).json({
      success: false,
      message: "tenantId and userId are required",
    });
  }

  const pool = await getPool2();

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .query(GET_MY_PROCESS);

  return res.json(
    successResponse(result.recordset, "My Process fetched successfully")
  );
});


export const addMyProcess = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);
  const processId = Number(req.body.processId);
  const activityDescription = req.body.activityDescription;

  if (!tenantId || !userId || !processId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and processId are required",
    });
  }

  const pool = await getPool2();

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ProcessId", processId)
    .input("ActivityDescription", req.body.activityDescription)
    .query(ADD_MY_PROCESS);

  const inserted = result.recordset?.[0]?.Inserted;

  return res.json({
    success: true,
    message: inserted
      ? "Process added successfully."
      : "Process already exists.",
  });
});


export const deleteMyProcess = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);
  const processId = Number(req.body.processId);

  if (!tenantId || !userId || !processId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and processId are required",
    });
  }

  const pool = await getPool2();

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ProcessId", processId)
    .query(DELETE_MY_PROCESS);

  const deleted = result.rowsAffected?.[0];

  return res.json({
    success: true,
    message: deleted
      ? "Process deleted successfully."
      : "Process not found.",
  });
});

const addScenarioInputs = (request: any, body: any, tenantId: number, userId: number) => {
  return request
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioName", body.scenarioName)
    .input("Description", body.description || null)
    .input("Ext1", body.ext1 || null)
    .input("Ext2", body.ext2 || null)
    .input("Ext3", body.ext3 || null)
    .input("Ext4", body.ext4 || null)
    .input("Ext5", body.ext5 || null);
};

export const createScenario = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);
  const scenarioName = req.body.scenarioName?.trim();

  if (!tenantId || !userId || !scenarioName) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioName are required",
    });
  }

  const pool = await getPool2();

  const result = await addScenarioInputs(
    pool.request(),
    { ...req.body, scenarioName },
    tenantId,
    userId
  ).query(CREATE_SCENARIO);

  return res.status(201).json(
    successResponse(result.recordset?.[0], "Scenario created successfully")
  );
});

export const getMyScenarios = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);

  if (!tenantId || !userId) {
    return res.status(400).json({
      success: false,
      message: "tenantId and userId are required",
    });
  }

  const pool = await getPool2();

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .query(GET_MY_SCENARIOS);

  return res.json(
    successResponse(result.recordset, "Scenarios fetched successfully")
  );
});

export const deleteScenario = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);
  const scenarioId = Number(req.params.scenarioId || req.body.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(DELETE_SCENARIO);

  const deleted = result.rowsAffected?.[0];

  return res.json({
    success: true,
    message: deleted
      ? "Scenario deleted successfully."
      : "Scenario not found.",
  });
});

export const saveScenarioProcess = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);

  const {
    processId,
    amount,
    activityDescription,
    notes,
  } = req.body;
  let scenarioId = Number(req.body.scenarioId);
  const scenarioName = req.body.scenarioName?.trim();

  if (!tenantId || !userId || (!scenarioId && !scenarioName) || !processId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, processId, and either scenarioId or scenarioName are required",
    });
  }

  const pool = await getPool2();
  const transaction = pool.transaction();

  await transaction.begin();

  try {
    if (!scenarioId) {
      const scenarioResult = await addScenarioInputs(
        transaction.request(),
        { ...req.body, scenarioName },
        tenantId,
        userId
      ).query(CREATE_SCENARIO);

      scenarioId = Number(scenarioResult.recordset?.[0]?.ScenarioId);
    } else {
      const scenario = await transaction
        .request()
        .input("TenantId", tenantId)
        .input("UserId", userId)
        .input("ScenarioId", scenarioId)
        .query(GET_SCENARIO_BY_ID);

      if (!scenario.recordset?.length) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Scenario not found",
        });
      }
    }

    await transaction
      .request()
      .input("TenantId", tenantId)
      .input("UserId", userId)
      .input("ScenarioId", scenarioId)
      .input("ProcessId", processId)
      .input("Amount", amount)
      .input("ActivityDescription", activityDescription)
      .input("Notes", notes)
      .query(UPSERT_SCENARIO_PROCESS);

    await transaction.commit();

    return res.json({
      success: true,
      message: "Scenario process saved successfully",
      data: {
        scenarioId,
        processId,
      },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const saveScenarioProcessesBulk = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;

    const tenantId = Number(user?.tenantId || req.query.tenantId);
    const userId = Number(user?.id || req.query.userId);
    let scenarioId = Number(req.body.scenarioId);
    const scenarioName = req.body.scenarioName?.trim();
    const processes = req.body.processes;

    if (!tenantId || !userId || (!scenarioId && !scenarioName) || !Array.isArray(processes) || processes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "tenantId, userId, processes, and either scenarioId or scenarioName are required",
      });
    }

    const invalidProcess = processes.find((process: any) => !Number(process?.processId));

    if (invalidProcess) {
      return res.status(400).json({
        success: false,
        message: "Each process must include processId",
      });
    }

    const pool = await getPool2();
    const transaction = pool.transaction();

    await transaction.begin();

    try {
      if (!scenarioId) {
        const scenarioResult = await addScenarioInputs(
          transaction.request(),
          { ...req.body, scenarioName },
          tenantId,
          userId
        ).query(CREATE_SCENARIO);

        scenarioId = Number(scenarioResult.recordset?.[0]?.ScenarioId);
      } else {
        const scenario = await transaction
          .request()
          .input("TenantId", tenantId)
          .input("UserId", userId)
          .input("ScenarioId", scenarioId)
          .query(GET_SCENARIO_BY_ID);

        if (!scenario.recordset?.length) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: "Scenario not found",
          });
        }
      }

      for (const process of processes) {
        await transaction
          .request()
          .input("TenantId", tenantId)
          .input("UserId", userId)
          .input("ScenarioId", scenarioId)
          .input("ProcessId", Number(process.processId))
          .input("Amount", process.amount)
          .input("ActivityDescription", process.activityDescription)
            .input("Notes", process.notes)
          .query(UPSERT_SCENARIO_PROCESS);
      }

      await transaction.commit();

      return res.json({
        success: true,
        message: "Scenario processes saved successfully",
        data: {
          scenarioId,
          savedCount: processes.length,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const getScenarioDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;

    const tenantId = Number(user?.tenantId || req.query.tenantId);
    const userId = Number(user?.id || req.query.userId);
    const scenarioId = req.query.scenarioId
      ? Number(req.query.scenarioId)
      : null;

    if (!tenantId || !userId) {
      return res.status(400).json({
        success: false,
        message: "tenantId and userId are required",
      });
    }

    const pool = await getPool2();

    const result = await pool
      .request()
      .input("TenantId", tenantId)
      .input("UserId", userId)
      .input("ScenarioId", scenarioId)
      .query(GET_SCENARIO_DETAILS);

    return res.json(
      successResponse(
        {
          tenantId,
          userId,
          scenarioId,
          processes: result.recordset,
        },
        "Scenario details fetched successfully"
      )
    );
  }
);



// ---------------------------    AI Workspace Controllers  ------------------------------------- //

const parseJson = (value: any) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
};

const ensureJsonText = (value: any) => {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? value : JSON.stringify(value);
};

const buildAIInputPayload = (
  scenario: any,
  processes: any[],
  assessment: any,
  goalScope: any,
) => ({
  scenarioBlock: {
    scenario,
    processes,
  },
  aiSelfAssessmentBlock: assessment,
  goalScopeBlock: goalScope,
});

const buildAIInsightsPayload = (
  scenario: any,
  processes: any[],
  assessment: any,
  goalScope: any,
) => ({
  processInsights: {
    processCount: processes?.length ?? 0,
    summary: `AI generated insights for scenario "${scenario?.ScenarioName || ""}".`,
    assessmentSummary: assessment ? "Self-assessment available" : "No self-assessment provided",
    goalScopeSummary: goalScope ? "Goal and scope available" : "No goal and scope provided",
  },
  scenarioAnalysis: {
    scenarioName: scenario?.ScenarioName || null,
    processHighlights: processes?.map((process) => ({
      processId: process.ProcessId,
      activityDescription: process.ActivityDescription,
      amount: process.Amount,
    })),
    goalScope: goalScope || null,
  },
  executiveSummary: {
    overview: `Generated overview for scenario "${scenario?.ScenarioName || ""}".`,
    recommendation: "Review the result for process hotspots and goal alignment.",
  },
});

const getWorkspaceRow = async (
  pool: any,
  tenantId: number,
  userId: number,
  scenarioId: number,
) => {
  const workspaceResult = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(GET_SCENARIO_AI_WORKSPACE);

  return workspaceResult.recordset?.[0] || null;
};

const assertScenarioExists = async (
  pool: any,
  tenantId: number,
  userId: number,
  scenarioId: number,
  res: Response,
) => {
  const scenarioResult = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(GET_SCENARIO_BY_ID);

  if (!scenarioResult.recordset?.length) {
    res.status(404).json({
      success: false,
      message: "Scenario not found",
    });
    return null;
  }

  return scenarioResult.recordset[0];
};

const saveInsightsSection = async (
  pool: any,
  tenantId: number,
  userId: number,
  scenarioId: number,
  sectionKey: "processInsights" | "scenarioAnalysis" | "executiveSummary",
  sectionValue: any,
  body: any,
) => {
  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);
  const existingInsights = parseJson(workspace?.AIInsightsJson) || {};

  const updatedInsights = {
    ...existingInsights,
    [sectionKey]: sectionValue,
  };

  const modelIdFromBody = body.modelId !== undefined ? Number(body.modelId) : null;
  const modelId = Number.isFinite(modelIdFromBody as number)
    ? modelIdFromBody
    : workspace?.ModelId ?? null;

  const promptVersion = body.promptVersion || workspace?.PromptVersion || "lca-insights-v1";

  const inputFromBody = body.aiInput || body.input || (sectionKey === "processInsights" ? sectionValue?.input : null);
  const aiInputPayload = inputFromBody ?? parseJson(workspace?.AIInputJson);

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .input("AIInputJson", ensureJsonText(aiInputPayload))
    .input("AIInsightsJson", ensureJsonText(updatedInsights))
    .input("ModelId", modelId)
    .input("PromptVersion", promptVersion)
    .input("Status", "Generated")
    .query(UPSERT_SCENARIO_AI_WORKSPACE_INSIGHTS);

  return {
    workspace: result.recordset?.[0] || null,
    updatedInsights,
  };
};

export const saveAIAssessment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const assessment = req.body.assessment;

  if (!tenantId || !userId || !scenarioId || !assessment) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId and assessment are required",
    });
  }

  const pool = await getPool2();

  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .input("AssessmentJson", ensureJsonText(assessment))
    .query(UPSERT_SCENARIO_AI_WORKSPACE_ASSESSMENT);

  return res.json(
    successResponse(
      {
        scenarioId,
      },
      "Assessment saved",
    ),
  );
});

export const getAIAssessment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);

  return res.json(
    successResponse(
      {
        scenarioId,
        tenantId,
        userId,
        assessment: parseJson(workspace?.AssessmentJson),
      },
      "Assessment fetched successfully",
    ),
  );
});

export const saveGoalScope = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const goalScope = req.body.goalScope;

  if (!tenantId || !userId || !scenarioId || !goalScope) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId and goalScope are required",
    });
  }

  const pool = await getPool2();

  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .input("GoalScopeJson", ensureJsonText(goalScope))
    .query(UPSERT_SCENARIO_AI_WORKSPACE_GOAL_SCOPE);

  return res.json(
    successResponse(
      {
        scenarioId,
      },
      "Goal and scope saved",
    ),
  );
});

export const getGoalScope = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);

  return res.json(
    successResponse(
      {
        scenarioId,
        tenantId,
        userId,
        goalScope: parseJson(workspace?.GoalScopeJson),
      },
      "Goal scope fetched successfully",
    ),
  );
});

export const saveProcessInsights = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const processInsights = req.body.processInsights;

  if (!tenantId || !userId || !scenarioId || !processInsights) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId and processInsights are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const result = await saveInsightsSection(
    pool,
    tenantId,
    userId,
    scenarioId,
    "processInsights",
    processInsights,
    req.body,
  );

  return res.json(
    successResponse(
      {
        scenarioId,
        section: "process-insights",
        savedAt: result.workspace?.ModifiedOn || new Date().toISOString(),
      },
      "Saved successfully",
    ),
  );
});

export const getProcessInsights = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);
  const insights = parseJson(workspace?.AIInsightsJson) || {};

  return res.json(
    successResponse(
      {
        scenarioId,
        tenantId,
        userId,
        processInsights: insights.processInsights || null,
      },
      "Fetched successfully",
    ),
  );
});

export const saveScenarioAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const scenarioAnalysis = req.body.scenarioAnalysis;

  if (!tenantId || !userId || !scenarioId || !scenarioAnalysis) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId and scenarioAnalysis are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const result = await saveInsightsSection(
    pool,
    tenantId,
    userId,
    scenarioId,
    "scenarioAnalysis",
    scenarioAnalysis,
    req.body,
  );

  return res.json(
    successResponse(
      {
        scenarioId,
        section: "scenario-analysis",
        savedAt: result.workspace?.ModifiedOn || new Date().toISOString(),
      },
      "Saved successfully",
    ),
  );
});

export const getScenarioAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);
  const insights = parseJson(workspace?.AIInsightsJson) || {};

  return res.json(
    successResponse(
      {
        scenarioId,
        tenantId,
        userId,
        scenarioAnalysis: insights.scenarioAnalysis || null,
      },
      "Fetched successfully",
    ),
  );
});

export const saveExecutiveSummary = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const executiveSummary = req.body.executiveSummary;

  if (!tenantId || !userId || !scenarioId || !executiveSummary) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId and executiveSummary are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const result = await saveInsightsSection(
    pool,
    tenantId,
    userId,
    scenarioId,
    "executiveSummary",
    executiveSummary,
    req.body,
  );

  return res.json(
    successResponse(
      {
        scenarioId,
        section: "executive-summary",
        savedAt: result.workspace?.ModifiedOn || new Date().toISOString(),
      },
      "Saved successfully",
    ),
  );
});

export const getExecutiveSummary = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);
  const insights = parseJson(workspace?.AIInsightsJson) || {};

  return res.json(
    successResponse(
      {
        scenarioId,
        tenantId,
        userId,
        executiveSummary: insights.executiveSummary || null,
      },
      "Fetched successfully",
    ),
  );
});

export const getAIWorkspaceSnapshot = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  const workspace = await getWorkspaceRow(pool, tenantId, userId, scenarioId);
  const insights = parseJson(workspace?.AIInsightsJson) || {};

  return res.json(
    successResponse(
      {
        scenarioId,
        tenantId,
        userId,
        assessment: parseJson(workspace?.AssessmentJson),
        goalScope: parseJson(workspace?.GoalScopeJson),
        processInsights: insights.processInsights || null,
        scenarioAnalysis: insights.scenarioAnalysis || null,
        executiveSummary: insights.executiveSummary || null,
        modelId: workspace?.ModelId ?? null,
        promptVersion: workspace?.PromptVersion ?? null,
        status: workspace?.Status ?? null,
      },
      "Fetched successfully",
    ),
  );
});

export const saveWorkspaceSection = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const section = String(req.params.section || "").toLowerCase();
  const sectionData = req.body.data;

  if (!tenantId || !userId || !scenarioId || !section || sectionData === undefined) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId, section and data are required",
    });
  }

  const allowedSections = [
    "assessment",
    "goal-scope",
    "process-insights",
    "scenario-analysis",
    "executive-summary",
  ];

  if (!allowedSections.includes(section)) {
    return res.status(400).json({
      success: false,
      message: "Invalid section. Allowed values: assessment, goal-scope, process-insights, scenario-analysis, executive-summary",
    });
  }

  const pool = await getPool2();
  const scenario = await assertScenarioExists(pool, tenantId, userId, scenarioId, res);

  if (!scenario) {
    return;
  }

  let savedAt: any = new Date().toISOString();

  if (section === "assessment") {
    const result = await pool
      .request()
      .input("TenantId", tenantId)
      .input("UserId", userId)
      .input("ScenarioId", scenarioId)
      .input("AssessmentJson", ensureJsonText(sectionData))
      .query(UPSERT_SCENARIO_AI_WORKSPACE_ASSESSMENT);

    savedAt = result.recordset?.[0]?.ModifiedOn || savedAt;
  } else if (section === "goal-scope") {
    const result = await pool
      .request()
      .input("TenantId", tenantId)
      .input("UserId", userId)
      .input("ScenarioId", scenarioId)
      .input("GoalScopeJson", ensureJsonText(sectionData))
      .query(UPSERT_SCENARIO_AI_WORKSPACE_GOAL_SCOPE);

    savedAt = result.recordset?.[0]?.ModifiedOn || savedAt;
  } else {
    const sectionMap: Record<string, "processInsights" | "scenarioAnalysis" | "executiveSummary"> = {
      "process-insights": "processInsights",
      "scenario-analysis": "scenarioAnalysis",
      "executive-summary": "executiveSummary",
    };

    const result = await saveInsightsSection(
      pool,
      tenantId,
      userId,
      scenarioId,
      sectionMap[section],
      sectionData,
      req.body,
    );

    savedAt = result.workspace?.ModifiedOn || savedAt;
  }

  return res.json(
    successResponse(
      {
        scenarioId,
        section,
        savedAt,
      },
      "Saved successfully",
    ),
  );
});

export const generateAIInsights = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);
  const modelId = req.body.modelId ? Number(req.body.modelId) : null;
  const promptVersion = req.body.promptVersion || "lca-insights-v1";

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();

  const scenarioResult = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(GET_SCENARIO_BY_ID);

  if (!scenarioResult.recordset?.length) {
    return res.status(404).json({
      success: false,
      message: "Scenario not found",
    });
  }

  const scenario = scenarioResult.recordset[0];

  const processResult = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(GET_SCENARIO_DETAILS);

  const workspaceResult = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(GET_SCENARIO_AI_WORKSPACE);

  const workspace = workspaceResult.recordset?.[0] || {};
  const assessment = parseJson(workspace.AssessmentJson);
  const goalScope = parseJson(workspace.GoalScopeJson);

  const aiInput = buildAIInputPayload(scenario, processResult.recordset, assessment, goalScope);
  const aiInsights = buildAIInsightsPayload(scenario, processResult.recordset, assessment, goalScope);

  await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .input("AIInputJson", ensureJsonText(aiInput))
    .input("AIInsightsJson", ensureJsonText(aiInsights))
    .input("ModelId", modelId)
    .input("PromptVersion", promptVersion)
    .input("Status", "Generated")
    .query(UPSERT_SCENARIO_AI_WORKSPACE_INSIGHTS);

  return res.json(
    successResponse(
      {
        scenarioId,
        insights: aiInsights,
      },
      "AI insights generated",
    ),
  );
});

export const getAIInsights = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = Number(req.params.tenantId);
  const userId = Number(req.params.userId);
  const scenarioId = Number(req.params.scenarioId);

  if (!tenantId || !userId || !scenarioId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId and scenarioId are required",
    });
  }

  const pool = await getPool2();

  const workspaceResult = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .query(GET_SCENARIO_AI_WORKSPACE);

  const workspace = workspaceResult.recordset?.[0];

  if (!workspace) {
    return res.status(404).json({
      success: false,
      message: "AI workspace not found for scenario",
    });
  }

  return res.json(
    successResponse(
      {
        scenarioId,
        status: workspace.Status,
        assessment: parseJson(workspace.AssessmentJson),
        goalScope: parseJson(workspace.GoalScopeJson),
        insights: parseJson(workspace.AIInsightsJson),
        modelId: workspace.ModelId,
        promptVersion: workspace.PromptVersion,
      },
      "AI insights fetched",
    ),
  );
});



