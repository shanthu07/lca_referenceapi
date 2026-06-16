import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { successResponse } from "../../../utils/response";
import { getPool } from "../../../config/db";
import {
  GET_PROCESS_CATEGORY_MASTER,
  GET_PROCESS_CATEGORY_MASTER_WITH_PROCESSES,
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