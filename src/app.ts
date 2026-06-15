import Fastify from "fastify";
import { logger } from "./config/logger.js";
import { configRoutes } from "./routes/config.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { webhookRoutes } from "./routes/webhook.routes.js";

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request failed");
    return reply.code(500).send({
      ok: false,
      error: "internal_server_error"
    });
  });

  await app.register(configRoutes);
  await app.register(healthRoutes);
  await app.register(webhookRoutes);

  return app;
}
