import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";

export const standardRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: Math.min(env.RATE_LIMIT_MAX_REQUESTS, 20),
  standardHeaders: true,
  legacyHeaders: false
});

export const turnRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: Math.min(env.RATE_LIMIT_MAX_REQUESTS, 60),
  standardHeaders: true,
  legacyHeaders: false
});
