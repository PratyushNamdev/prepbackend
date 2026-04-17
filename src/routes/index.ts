import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { redis } from "../config/redis.js";
import { requireAdmin, requireAuth } from "../common/middleware/authMiddleware.js";
import { validateRequest } from "../common/middleware/validateRequest.js";
import { asyncHandler } from "../common/utils/asyncHandler.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { sessionRoutes } from "../modules/interviews/sessions/session.routes.js";
import { turnRoutes } from "../modules/interviews/turns/turn.routes.js";
import { env } from "../config/env.js";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/interviews/sessions", sessionRoutes);
apiRoutes.use("/interviews/sessions/:id/turns", turnRoutes);

const adminSessionParams = z.object({ id: z.string().uuid() });

apiRoutes.get(
  "/admin/health",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    const redisOk = await redis.get("__health__").then(() => true).catch(() => false);
    res.json({
      status: "ok",
      database: "ok",
      redis: redisOk ? "ok" : "degraded",
      timestamp: new Date().toISOString()
    });
  })
);

apiRoutes.get(
  "/admin/providers",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({
      providers: {
        llm: { primary: env.GROQ_API_KEY ? "groq" : "deterministic-fallback", fallback: "deterministic-fallback" },
        stt: { primary: "browser-transcript", fallback: "text-input" },
        tts: { primary: "browser-tts", fallback: "text-only" }
      }
    });
  })
);

apiRoutes.get(
  "/admin/sessions/:id/debug",
  requireAuth,
  requireAdmin,
  validateRequest({ params: adminSessionParams }),
  asyncHandler(async (req, res) => {
    const session = await prisma.interviewSession.findUnique({
      where: { id: String(req.params.id) },
      include: {
        turns: { include: { evaluation: true }, orderBy: [{ turnIndex: "asc" }, { createdAt: "asc" }] },
        providerLogs: { orderBy: { createdAt: "desc" }, take: 50 },
        feedback: true
      }
    });
    res.json({ session });
  })
);
