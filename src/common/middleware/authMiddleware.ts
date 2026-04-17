import type { NextFunction, Request, Response } from "express";
import type { User } from "@prisma/client";
import { errors } from "../errors/AppError.js";
import { authService } from "../../modules/auth/auth.service.js";
import { userService } from "../../modules/users/user.service.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) throw errors.unauthorized();
    const token = header.slice("Bearer ".length);
    const payload = authService.verifyToken(token, "access");
    req.user = await userService.getActiveUser(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) return next(errors.unauthorized());
  if (req.user.role !== "admin") return next(errors.forbidden("Admin role required"));
  return next();
};
