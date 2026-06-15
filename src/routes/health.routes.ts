import type { FastifyInstance } from "fastify";
import { configPage } from "../pages/config-page.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (request, reply) => {
    const acceptHeader = request.headers.accept ?? "";

    if (acceptHeader.includes("text/html")) {
      return reply.type("text/html; charset=utf-8").send(configPage);
    }

    return {
      status: "ok",
      service: "ceci-funcionalidades"
    };
  });
}
