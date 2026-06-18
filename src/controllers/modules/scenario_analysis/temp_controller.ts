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
  CREATE_SCENARIO,
  GET_MY_SCENARIOS,
  GET_SCENARIO_BY_ID,
  GET_SCENARIO_DETAILS,
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

export const saveScenarioProcess = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);

  const {
    processId,
    amount,
    activityDescription,
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
