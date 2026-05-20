import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { errorResponse } from "../utils/response";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(err.status || 500).json(
    errorResponse(
      err.message || "Internal Server Error",
      {
        correlationId: req.correlationId,
        originalUrl: req.originalUrl,
        error: err,
      },
      err.code,
      err.field ?? null,
    ),
  );
};