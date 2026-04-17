import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./common/errors/errorHandler.js";
import { standardRateLimit } from "./common/middleware/rateLimitMiddleware.js";
import { requestLogger } from "./observability/requestLogger.js";
import { apiRoutes } from "./routes/index.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);
  app.use(standardRateLimit);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  app.use("/api/v1", apiRoutes);
  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });
  app.use(errorHandler);
  return app;
};

export const app = createApp();
