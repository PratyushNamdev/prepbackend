import { Router } from "express";
import { requireAuth } from "../../common/middleware/authMiddleware.js";
import { authRateLimit } from "../../common/middleware/rateLimitMiddleware.js";
import { validateRequest } from "../../common/middleware/validateRequest.js";
import { login, logout, me, refresh, register } from "./auth.controller.js";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "./auth.schemas.js";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimit, validateRequest({ body: registerSchema }), register);
authRoutes.post("/login", authRateLimit, validateRequest({ body: loginSchema }), login);
authRoutes.post("/refresh", authRateLimit, validateRequest({ body: refreshSchema }), refresh);
authRoutes.post("/logout", validateRequest({ body: logoutSchema }), logout);
authRoutes.get("/me", requireAuth, me);
