import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { sendValidated } from "../../../common/middleware/validateRequest.js";
import { feedbackService } from "../feedback/feedback.service.js";
import { feedbackResponseSchema } from "../feedback/feedback.schemas.js";
import {
  createSessionResponseSchema,
  progressResponseSchema,
  sessionDetailResponseSchema,
  sessionListResponseSchema,
  startSessionResponseSchema,
  stateChangeResponseSchema,
  transcriptResponseSchema,
  type CreateSessionInput
} from "./session.schemas.js";
import { sessionService } from "./session.service.js";

export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const payload = await sessionService.create(req.user!.id, req.body as CreateSessionInput);
  sendValidated(res, createSessionResponseSchema, payload, 201);
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, sessionListResponseSchema, await sessionService.list(req.user!.id));
});

export const getSession = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, sessionDetailResponseSchema, await sessionService.get(req.user!.id, String(req.params.id)));
});

export const startSession = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, startSessionResponseSchema, await sessionService.start(req.user!.id, String(req.params.id)));
});

export const pauseSession = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, stateChangeResponseSchema, await sessionService.pause(req.user!.id, String(req.params.id)));
});

export const resumeSession = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, stateChangeResponseSchema, await sessionService.resume(req.user!.id, String(req.params.id)));
});

export const completeSession = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, stateChangeResponseSchema, await sessionService.complete(req.user!.id, String(req.params.id)));
});

export const getTranscript = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, transcriptResponseSchema, await sessionService.transcript(req.user!.id, String(req.params.id)));
});

export const getFeedback = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, feedbackResponseSchema, await feedbackService.getOrGenerate(String(req.params.id), req.user!.id));
});

export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, progressResponseSchema, await sessionService.progress(req.user!.id, String(req.params.id)));
});
