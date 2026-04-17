import { env } from "./config/env.js";
import { app } from "./app.js";
import { logger } from "./observability/logger.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "server_started");
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "server_shutdown");
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit().catch(() => undefined);
    process.exit(0);
  });
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
