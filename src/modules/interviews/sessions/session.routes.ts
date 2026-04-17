import { Router } from "express";
import { requireAuth } from "../../../common/middleware/authMiddleware.js";
import { validateRequest } from "../../../common/middleware/validateRequest.js";
import { createSessionSchema, uuidParamsSchema } from "./session.schemas.js";
import {
  completeSession,
  createSession,
  getFeedback,
  getProgress,
  getSession,
  getTranscript,
  listSessions,
  pauseSession,
  resumeSession,
  startSession
} from "./session.controller.js";

export const sessionRoutes = Router();

sessionRoutes.use(requireAuth);
sessionRoutes.post("/", validateRequest({ body: createSessionSchema }), createSession);
sessionRoutes.get("/", listSessions);
sessionRoutes.get("/:id", validateRequest({ params: uuidParamsSchema }), getSession);
sessionRoutes.post("/:id/start", validateRequest({ params: uuidParamsSchema }), startSession);
sessionRoutes.post("/:id/pause", validateRequest({ params: uuidParamsSchema }), pauseSession);
sessionRoutes.post("/:id/resume", validateRequest({ params: uuidParamsSchema }), resumeSession);
sessionRoutes.post("/:id/complete", validateRequest({ params: uuidParamsSchema }), completeSession);
sessionRoutes.get("/:id/transcript", validateRequest({ params: uuidParamsSchema }), getTranscript);
sessionRoutes.get("/:id/feedback", validateRequest({ params: uuidParamsSchema }), getFeedback);
sessionRoutes.get("/:id/progress", validateRequest({ params: uuidParamsSchema }), getProgress);
