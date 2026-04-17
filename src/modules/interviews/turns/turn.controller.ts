import type { Request, Response } from "express";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { sendValidated } from "../../../common/middleware/validateRequest.js";
import { turnResponseSchema, type SubmitTurnInput } from "./turn.schemas.js";
import { turnService } from "./turn.service.js";

export const submitTurn = asyncHandler(async (req: Request, res: Response) => {
  const payload = await turnService.submit(req.user!.id, String(req.params.id), req.body as SubmitTurnInput);
  sendValidated(res, turnResponseSchema, payload);
});
