import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { getRedisClient, getRedisSubscriber } from "../lib/redis.js";
import { appendActionLog } from "../repositories/action-log.repository.js";
import { findClientConfigById } from "../repositories/client-config.repository.js";
import {
  findSession,
  saveSessionState
} from "../repositories/session-timeout.repository.js";
import { parseTimerKey } from "../services/redis-timer.service.js";
import { startSessionTimer } from "../services/redis-timer.service.js";
import { resolveAgentAutomationPolicy } from "../services/agent-automation-policy.service.js";
import { createAiTransferNote } from "../services/transfer-note.service.js";
import {
  isTransferWindowOpen,
  nextTransferWindowStart,
  transferWindowLabel
} from "../services/transfer-window.service.js";
import { transferSession } from "../services/wts.service.js";
import { SESSION_STATUSES } from "../types/session-timeout.js";

async function ensureKeyspaceNotifications(): Promise<void> {
  const redis = await getRedisClient();
  await redis.configSet("notify-keyspace-events", "Ex");
}

async function handleExpiredTimer(key: string): Promise<void> {
  const parsed = parseTimerKey(key);

  if (!parsed) {
    return;
  }

  const { clientId, sessionId } = parsed;

  try {
    const [client, session] = await Promise.all([
      findClientConfigById(clientId),
      findSession(sessionId)
    ]);

    if (!client) {
      logger.warn({ clientId, sessionId }, "redis timer expired without client config");
      return;
    }

    if (!session || session.status !== SESSION_STATUSES.WAITING_SELLER) {
      logger.info(
        { clientId, sessionId, status: session?.status },
        "redis expired session skipped because state changed"
      );
      return;
    }

    const policy = await resolveAgentAutomationPolicy({ client, session });

    if (!policy.enabled) {
      await appendActionLog({
        clientId: client.id,
        actionType: "TRANSFER",
        sessionId,
        status: "SKIPPED",
        message: policy.reason,
        details: {
          source: "redis",
          userId: session.user_id,
          policySource: policy.source,
          agentRuleId: policy.agentRuleId
        }
      }).catch((error) => {
        logger.warn({ err: error }, "failed to append action log");
      });

      logger.info(
        { clientId, sessionId, userId: session.user_id },
        "redis expired session skipped by agent automation policy"
      );
      return;
    }

    if (!isTransferWindowOpen(policy.window)) {
      const nextAllowedAt = nextTransferWindowStart(policy.window);
      const ttlSeconds = Math.max(
        60,
        Math.ceil((nextAllowedAt.getTime() - Date.now()) / 1000)
      );

      await saveSessionState({
        session_id: sessionId,
        company_id: session.company_id,
        department_id: session.department_id,
        user_id: session.user_id,
        status: SESSION_STATUSES.WAITING_SELLER,
        expires_at: nextAllowedAt.toISOString()
      });

      await startSessionTimer({
        clientId: client.id,
        sessionId,
        ttlSeconds
      });

      await appendActionLog({
        clientId: client.id,
        actionType: "TRANSFER",
        sessionId,
        status: "SKIPPED",
        message: "Transferencia aguardando janela de atendimento.",
        details: {
          source: "redis",
          window: transferWindowLabel(policy.window),
          userId: session.user_id,
          policySource: policy.source,
          agentRuleId: policy.agentRuleId,
          nextAllowedAt: nextAllowedAt.toISOString()
        }
      }).catch((error) => {
        logger.warn({ err: error }, "failed to append action log");
      });

      logger.info(
        {
          clientId,
          sessionId,
          ttlSeconds,
          nextAllowedAt: nextAllowedAt.toISOString()
        },
        "redis expired session rescheduled for transfer window"
      );
      return;
    }

    await transferSession(sessionId, {
      transferSessionUrl: client.wtsTransferSessionUrl,
      apiToken: client.wtsApiToken,
      departmentId: client.transferDepartmentId ?? session.department_id
    });

    await appendActionLog({
      clientId: client.id,
      actionType: "TRANSFER",
      sessionId,
      status: "SUCCESS",
      message: "Transferencia automatica por timeout executada.",
      details: {
        source: "redis",
        departmentId: client.transferDepartmentId ?? session.department_id
      }
    }).catch((error) => {
      logger.warn({ err: error }, "failed to append action log");
    });

    await saveSessionState({
      session_id: sessionId,
      company_id: session.company_id,
      department_id: session.department_id,
      user_id: session.user_id,
      status: SESSION_STATUSES.RETURNED_TO_QUEUE,
      expires_at: null
    });

    await createAiTransferNote({
      client,
      session
    });

    logger.info(
      { clientId, sessionId },
      "session returned to queue after redis timer expired"
    );
  } catch (error) {
    if (parsed) {
      const client = await findClientConfigById(parsed.clientId).catch(() => null);

      if (client) {
        await appendActionLog({
          clientId: client.id,
          actionType: "TRANSFER",
          sessionId: parsed.sessionId,
          status: "ERROR",
          message: "Falha na transferencia automatica por timeout.",
          details: {
            source: "redis",
            error: error instanceof Error ? error.message : "Unexpected error"
          }
        }).catch((logError) => {
          logger.warn({ err: logError }, "failed to append action log");
        });
      }
    }

    logger.error(
      { err: error, clientId, sessionId },
      "failed to return redis expired session to queue"
    );
  }
}

export async function startRedisTimeoutWorker(): Promise<{
  stop: () => Promise<void>;
}> {
  if (!env.redisEnabled) {
    logger.info("redis timeout worker disabled");
    return {
      stop: async () => {}
    };
  }

  await ensureKeyspaceNotifications();

  const subscriber = await getRedisSubscriber();
  const channel = "__keyevent@0__:expired";

  await subscriber.subscribe(channel, (message) => {
    void handleExpiredTimer(message);
  });

  logger.info({ channel }, "redis timeout worker started");

  return {
    stop: async () => {
      await subscriber.unsubscribe(channel);
    }
  };
}
