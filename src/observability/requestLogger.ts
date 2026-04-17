import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export const requestLogger = [
  (req: Request, res: Response, next: NextFunction) => {
    req.correlationId = req.header("x-correlation-id") ?? crypto.randomUUID();
    res.setHeader("x-correlation-id", req.correlationId);
    const startedAt = Date.now();
    res.on("finish", () => {
      logger.info(
        {
          correlationId: req.correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          latencyMs: Date.now() - startedAt,
          userId: req.user?.id
        },
        "request_completed"
      );
    });
    next();
  }
];
