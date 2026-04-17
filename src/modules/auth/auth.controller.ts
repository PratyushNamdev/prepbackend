import type { Request, Response } from "express";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { sendValidated } from "../../common/middleware/validateRequest.js";
import { toSafeUser } from "../users/user.service.js";
import {
  authResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  type LoginInput,
  type RegisterInput
} from "./auth.schemas.js";
import { authService } from "./auth.service.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.register(req.body as RegisterInput);
  sendValidated(res, authResponseSchema, payload, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.login(req.body as LoginInput);
  sendValidated(res, authResponseSchema, payload);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.refresh(req.body.refreshToken as string);
  sendValidated(res, authResponseSchema, payload);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const payload = await authService.logout(req.body.refreshToken as string);
  sendValidated(res, logoutResponseSchema, payload);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  sendValidated(res, meResponseSchema, { user: toSafeUser(req.user!) });
});
