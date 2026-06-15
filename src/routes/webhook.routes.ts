import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  findClientConfigByWebhookToken,
  getActiveClientConfig
} from "../repositories/client-config.repository.js";
import { appendWebhookLog } from "../repositories/webhook-log.repository.js";
import { processWebhookEvent } from "../services/session-timeout.service.js";
import type { ClientConfig } from "../types/client-config.js";
import type { WebhookPayload } from "../types/webhook.js";
import { normalizeWebhookPayload } from "../utils/webhook-normalizer.js";

type WebhookParams = {
  webhookToken: string;
};

async function handleWebhook(
  request: FastifyRequest<{ Body: WebhookPayload }>,
  reply: FastifyReply,
  client?: ClientConfig | null
) {
  const event = normalizeWebhookPayload(request.body ?? {});

  if (!event.sessionId) {
    request.log.warn({ eventType: event.eventType }, "webhook missing session id");
    if (client) {
      await appendWebhookLog({
        clientId: client.id,
        eventType: event.eventType,
        sessionId: null,
        companyId: event.companyId,
        handled: false,
        statusCode: 400,
        reason: "missing_session_id",
        error: null,
        payload: request.body ?? {}
      });
    }

    return reply.code(400).send({
      ok: false,
      error: "missing_session_id"
    });
  }

  let result: Awaited<ReturnType<typeof processWebhookEvent>>;

  try {
    result = await processWebhookEvent(event, client);
  } catch (error) {
    if (client) {
      await appendWebhookLog({
        clientId: client.id,
        eventType: event.eventType,
        sessionId: event.sessionId,
        companyId: event.companyId,
        handled: false,
        statusCode: 500,
        reason: "processing_error",
        error: error instanceof Error ? error.message : "Unexpected error",
        payload: request.body ?? {}
      });
    }

    throw error;
  }

  if (!result.handled) {
    request.log.info(
      {
        eventType: event.eventType,
        sessionId: event.sessionId,
        clientId: client?.id,
        reason: result.reason
      },
      "webhook ignored"
    );
  }

  if (client) {
    await appendWebhookLog({
      clientId: client.id,
      eventType: event.eventType,
      sessionId: event.sessionId,
      companyId: event.companyId,
      handled: result.handled,
      statusCode: 200,
      reason: result.reason ?? null,
      error: null,
      payload: request.body ?? {}
    });
  }

  return reply.code(200).send({
    ok: true,
    handled: result.handled,
    reason: result.reason,
    clientId: client?.id ?? null
  });
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: WebhookPayload }>("/webhook", async (request, reply) => {
    const client = await getActiveClientConfig();
    return handleWebhook(request, reply, client);
  });

  app.post<{ Params: WebhookParams; Body: WebhookPayload }>(
    "/webhooks/:webhookToken",
    async (request, reply) => {
      const client = await findClientConfigByWebhookToken(
        request.params.webhookToken
      );

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "client_webhook_not_found"
        });
      }

      return handleWebhook(request, reply, client);
    }
  );
}
