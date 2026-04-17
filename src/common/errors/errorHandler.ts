import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError, errors } from "./AppError.js";
import { logger } from "../../observability/logger.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = errors.validation(err.flatten());
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    appError =
      err.code === "P2002"
        ? errors.conflict("Resource already exists", { target: err.meta?.target })
        : new AppError(500, "DB_ERROR", "Database operation failed");
  } else {
    appError = errors.internal();
  }

  const payload = {
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details ?? undefined,
      correlationId: req.correlationId
    }
  };

  if (appError.statusCode >= 500) {
    logger.error({ err, correlationId: req.correlationId }, "request_failed");
  } else {
    logger.warn({ err: appError, correlationId: req.correlationId }, "request_rejected");
  }

  res.status(appError.statusCode).json(payload);
};
