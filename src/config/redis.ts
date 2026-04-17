import { Redis } from "ioredis";
import { env, isTest } from "./env.js";
import { logger } from "../observability/logger.js";

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", ttlSeconds?: number): Promise<"OK" | null>;
  del(key: string): Promise<number>;
  quit(): Promise<unknown>;
}

class MemoryCache implements CacheClient {
  private readonly entries = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: "EX", ttlSeconds?: number): Promise<"OK"> {
    this.entries.set(key, {
      value,
      expiresAt: mode === "EX" && ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
    });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.entries.delete(key) ? 1 : 0;
  }

  async quit(): Promise<void> {
    this.entries.clear();
  }
}

class RedisCache implements CacheClient {
  constructor(private readonly client: Redis) {}

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, mode?: "EX", ttlSeconds?: number): Promise<"OK" | null> {
    if (mode === "EX" && ttlSeconds) return this.client.set(key, value, "EX", ttlSeconds);
    return this.client.set(key, value);
  }

  del(key: string): Promise<number> {
    return this.client.del(key);
  }

  quit(): Promise<unknown> {
    return this.client.quit();
  }
}

const redisClient = isTest
  ? null
  : new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true
    });

export const redis: CacheClient = isTest
  ? new MemoryCache()
  : new RedisCache(redisClient!);

if (redisClient) {
  redisClient.on("error", (error) => {
    logger.warn({ err: error }, "redis_error");
  });
}
