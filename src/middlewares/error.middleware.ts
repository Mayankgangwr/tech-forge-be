import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import logger from "../config/logger";
import { AppError } from "../utils/appError";
import { sendError } from "../utils/apiResponse";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`);

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message);
  }

  if (err instanceof ZodError) {
    return sendError(
      res,
      400,
      "Validation failed",
      err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }))
    );
  }

  if (err?.name === "ValidationError") {
    return sendError(res, 400, "Validation failed");
  }

  if (err?.code === 11000) {
    return sendError(res, 409, "Duplicate resource");
  }

  return sendError(res, 500, "Internal Server Error");
};
