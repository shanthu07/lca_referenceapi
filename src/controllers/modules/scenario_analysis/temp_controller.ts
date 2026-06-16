import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { successResponse } from "../../../utils/response";
import { getPool } from "../../../config/db";
import {
  GET_PROCESS_CATEGORY_MASTER,
  GET_PROCESS_MASTER_BY_INDUSTRY,
} from "../../../queries/temp.queries";

export const getProcessCategoryMaster = asyncHandler(
  async (_req: Request, res: Response) => {
    const pool = await getPool();
    const request = pool.request();
    const industryId = _req.params.industryId as string | undefined;
    const includeProcesses = _req.query.includeProcesses === "true";

    if (industryId) {
      request.input("industryId", industryId);
    }

    const categoryResult = await request.query(GET_PROCESS_CATEGORY_MASTER);
    let data: any[] = categoryResult.recordset;

    if (includeProcesses) {
      const processRequest = pool.request();
      processRequest.input("industryId", industryId);

      const processResult = await processRequest.query(
        GET_PROCESS_MASTER_BY_INDUSTRY
      );
      const processesByCategory = processResult.recordset.reduce(
        (acc: Record<string, any[]>, process) => {
          const categoryId = String(process.ProcessCategoryID);
          acc[categoryId] = acc[categoryId] ?? [];
          acc[categoryId].push(process);
          return acc;
        },
        {}
      );

      data = categoryResult.recordset.map((category) => {
        return {
          ...category,
          ProcessMaster:
            processesByCategory[String(category.ProcessCategoryID)] ?? [],
        };
      });
    }

    res.json(
      successResponse(
        data,
        "Process Category Master fetched successfully"
      )
    );
  }
);
