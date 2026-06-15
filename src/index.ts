import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { buildApp } from "./app.js";
import { closeRedisConnections } from "./lib/redis.js";
import { startRedisTimeoutWorker } from "./workers/redis-timeout.worker.js";
import { startTimeoutWorker } from "./workers/timeout.worker.js";

const app = await buildApp();
const cronWorker = env.redisEnabled ? null : startTimeoutWorker();
const redisWorker = await startRedisTimeoutWorker();

const shutdown = async (signal: string) => {
  logger.info({ signal }, "shutdown requested");
  cronWorker?.stop();
  await redisWorker.stop();
  await closeRedisConnections();
  await app.close();
  process.exit(0);
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

try {
  await app.listen({ port: env.port, host: env.host });
  logger.info({ host: env.host, port: env.port }, "server started");
} catch (error) {
  logger.fatal({ err: error }, "server failed to start");
  process.exit(1);
}
