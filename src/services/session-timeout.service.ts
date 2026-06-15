import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import {
  findSession,
  saveSessionState
} from "../repositories/session-timeout.repository.js";
import type { ClientConfig } from "../types/client-config.js";
import { SESSION_STATUSES } from "../types/session-timeout.js";
import type { NormalizedWebhookEvent } from "../types/webhook.js";
import { addMinutes, toIso } from "../utils/date.js";
import {
  startSessionTimer,
  stopSessionTimer
} from "./redis-timer.service.js";

const statusesThatStartSellerTimer = new Set<string>([
  SESSION_STATUSES.IN_PROGRESS,
  SESSION_STATUSES.WAITING_SELLER,
  SESSION_STATUSES.SELLER_RESPONDED
]);

function baseSessionInput(event: NormalizedWebhookEvent, client?: ClientConfig | null) {
  if (!event.sessionId) {
    throw new Error("Webhook event is missing session_id/sessionId");
  }

  return {
    session_id: event.sessionId,
    company_id: event.companyId ?? client?.ceciCompanyId ?? null,
    department_id: event.departmentId,
    user_id: event.userId
  };
}

function isSellerAssignmentUpdate(event: NormalizedWebhookEvent): boolean {
  const property = event.property?.toLowerCase();

  if (property === "status") {
    return event.oldValue === "PENDING" && event.newValue === "IN_PROGRESS";
  }

  return property === "userid" || property === "user_id";
}

function clientIdForTimer(client: ClientConfig | null | undefined): string | null {
  return client?.id ?? null;
}

export async function processWebhookEvent(
  event: NormalizedWebhookEvent,
  client?: ClientConfig | null
): Promise<{ handled: boolean; reason?: string }> {
  const sessionTimeoutMinutes =
    client?.timeoutMinutes ?? env.sessionTimeoutMinutes;

  switch (event.eventType) {
    case "SESSION_UPDATE": {
      if (!isSellerAssignmentUpdate(event)) {
        return { handled: false, reason: "session update is not monitorable" };
      }

      await saveSessionState({
        ...baseSessionInput(event, client),
        status: SESSION_STATUSES.IN_PROGRESS,
        expires_at: null
      });

      logger.info({ sessionId: event.sessionId }, "session monitoring started");
      return { handled: true };
    }

    case "MESSAGE_RECEIVED": {
      const input = baseSessionInput(event, client);
      const session = await findSession(input.session_id);

      if (!session || !statusesThatStartSellerTimer.has(session.status)) {
        return {
          handled: false,
          reason: "session is not waiting for seller timer reset"
        };
      }

      await saveSessionState({
        ...input,
        user_id: input.user_id ?? session.user_id,
        status: SESSION_STATUSES.WAITING_SELLER,
        expires_at: toIso(addMinutes(new Date(), sessionTimeoutMinutes))
      });

      const clientId = clientIdForTimer(client);

      if (env.redisEnabled && clientId) {
        await startSessionTimer({
          clientId,
          sessionId: input.session_id,
          ttlSeconds: sessionTimeoutMinutes * 60
        });
      }

      logger.info({ sessionId: event.sessionId }, "seller response timer started");
      return { handled: true };
    }

    case "MESSAGE_SENT": {
      const input = baseSessionInput(event, client);

      if (event.origin === "BOT") {
        return { handled: false, reason: "bot message ignored" };
      }

      if (event.origin !== "DEFAULT" || !event.userId) {
        return {
          handled: false,
          reason: "message was not sent by an identified seller"
        };
      }

      await saveSessionState({
        ...input,
        status: SESSION_STATUSES.SELLER_RESPONDED,
        expires_at: null
      });

      const clientId = clientIdForTimer(client);

      if (env.redisEnabled && clientId) {
        await stopSessionTimer({
          clientId,
          sessionId: input.session_id
        });
      }

      logger.info({ sessionId: event.sessionId }, "seller response recorded");
      return { handled: true };
    }

    case "SESSION_COMPLETE": {
      await saveSessionState({
        ...baseSessionInput(event, client),
        status: SESSION_STATUSES.CLOSED,
        expires_at: null
      });

      const clientId = clientIdForTimer(client);

      if (env.redisEnabled && clientId && event.sessionId) {
        await stopSessionTimer({
          clientId,
          sessionId: event.sessionId
        });
      }

      logger.info({ sessionId: event.sessionId }, "session closed");
      return { handled: true };
    }

    default:
      return { handled: false, reason: "unknown event type" };
  }
}
