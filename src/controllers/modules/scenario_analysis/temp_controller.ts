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

export const saveScenarioProcess = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const tenantId = Number(user?.tenantId || req.query.tenantId);
  const userId = Number(user?.id || req.query.userId);

  const {
    scenarioId,
    processId,
    amount,
    activityDescription,
  } = req.body;

  if (!tenantId || !userId || !scenarioId || !processId) {
    return res.status(400).json({
      success: false,
      message: "tenantId, userId, scenarioId and processId are required",
    });
  }

  const pool = await getPool2();

  const result = await pool
    .request()
    .input("TenantId", tenantId)
    .input("UserId", userId)
    .input("ScenarioId", scenarioId)
    .input("ProcessId", processId)
    .input("Amount", amount)
    .input("ActivityDescription", activityDescription)
    .query(UPSERT_SCENARIO_PROCESS);

  return res.json({
    success: true,
    message: "Scenario process saved successfully",
  });
});

export const saveScenarioProcessesBulk = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;

    const tenantId = Number(user?.tenantId || req.query.tenantId);
    const userId = Number(user?.id || req.query.userId);
    const scenarioId = Number(req.body.scenarioId);
    const processes = req.body.processes;

    if (!tenantId || !userId || !scenarioId || !Array.isArray(processes) || processes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "tenantId, userId, scenarioId and processes are required",
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
    // const scenarioId = Number(req.params.scenarioId);

    if (!tenantId || !userId) {
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
      // .input("ScenarioId", scenarioId)
      .query(GET_SCENARIO_DETAILS);

    return res.json(
      successResponse(
        {
          tenantId,
          userId,
          // scenarioId,
          processes: result.recordset,
        },
        "Scenario details fetched successfully"
      )
    );
  }
);
