import { Router } from "express";
import { requireAuth } from "../../../common/middleware/authMiddleware.js";
import { turnRateLimit } from "../../../common/middleware/rateLimitMiddleware.js";
import { validateRequest } from "../../../common/middleware/validateRequest.js";
import { uuidParamsSchema } from "../sessions/session.schemas.js";
import { submitTurn } from "./turn.controller.js";
import { submitTurnSchema } from "./turn.schemas.js";

export const turnRoutes = Router({ mergeParams: true });

turnRoutes.use(requireAuth);
turnRoutes.post("/", turnRateLimit, validateRequest({ params: uuidParamsSchema, body: submitTurnSchema }), submitTurn);
