import crypto from "node:crypto";
import { prisma } from "../../config/prisma.js";
import { redis } from "../../config/redis.js";
import { addSeconds } from "./time.js";
import { logger } from "../../observability/logger.js";

const ttlSeconds = 24 * 60 * 60;

export const responseHash = (payload: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

export const getIdempotentResponse = async <T>(scope: string, key: string): Promise<T | null> => {
  const cacheKey = `idempotency:${scope}:${key}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info({ scope, key }, "idempotency_hit_redis");
    return JSON.parse(cached) as T;
  }

  const record = await prisma.idempotencyRecord.findUnique({
    where: { scope_key: { scope, key } }
  });
  if (!record || record.expiresAt <= new Date()) return null;

  await redis.set(cacheKey, JSON.stringify(record.responseBody), "EX", ttlSeconds);
  logger.info({ scope, key }, "idempotency_hit_database");
  return record.responseBody as T;
};

export const saveIdempotentResponse = async (scope: string, key: string, payload: unknown): Promise<void> => {
  const cacheKey = `idempotency:${scope}:${key}`;
  const body = JSON.parse(JSON.stringify(payload));
  await prisma.idempotencyRecord.upsert({
    where: { scope_key: { scope, key } },
    create: {
      scope,
      key,
      responseHash: responseHash(payload),
      responseBody: body,
      expiresAt: addSeconds(new Date(), ttlSeconds)
    },
    update: {
      responseHash: responseHash(payload),
      responseBody: body,
      expiresAt: addSeconds(new Date(), ttlSeconds)
    }
  });
  await redis.set(cacheKey, JSON.stringify(payload), "EX", ttlSeconds);
};
