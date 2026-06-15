import cron from "node-cron";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import {
  findClientConfigByCompanyId,
  getActiveClientConfig
} from "../repositories/client-config.repository.js";
import { appendActionLog } from "../repositories/action-log.repository.js";
import {
  findSession,
  listExpiredWaitingSellerSessions,
  saveSessionState
} from "../repositories/session-timeout.repository.js";
import { createAiTransferNote } from "../services/transfer-note.service.js";
import { resolveAgentAutomationPolicy } from "../services/agent-automation-policy.service.js";
import {
  isTransferWindowOpen,
  nextTransferWindowStart,
  transferWindowLabel
} from "../services/transfer-window.service.js";
import { startSessionTimer } from "../services/redis-timer.service.js";
import { transferSession } from "../services/wts.service.js";
import { SESSION_STATUSES } from "../types/session-timeout.js";

let isRunning = false;

export async function runTimeoutWorkerOnce(): Promise<void> {
  if (isRunning) {
    logger.warn("timeout worker skipped because previous execution is still running");
    return;
  }

  isRunning = true;

  try {
    const nowIso = new Date().toISOString();
    const expiredSessions = await listExpiredWaitingSellerSessions(nowIso);

    if (expiredSessions.length === 0) {
      logger.debug("timeout worker found no expired sessions");
      return;
    }

    logger.info(
      { count: expiredSessions.length },
      "timeout worker found expired sessions"
    );

    for (const session of expiredSessions) {
      try {
        const latestSession = await findSession(session.session_id);

        if (
          !latestSession ||
          latestSession.status !== SESSION_STATUSES.WAITING_SELLER ||
          !latestSession.expires_at ||
          latestSession.expires_at > new Date().toISOString()
        ) {
          logger.info(
            { sessionId: session.session_id },
            "expired session skipped because state changed"
          );
          continue;
        }

        const client =
          (await findClientConfigByCompanyId(latestSession.company_id)) ??
          (await getActiveClientConfig());

        if (client) {
          const policy = await resolveAgentAutomationPolicy({
            client,
            session: latestSession
          });

          if (!policy.enabled) {
            await appendActionLog({
              clientId: client.id,
              actionType: "TRANSFER",
              sessionId: session.session_id,
              status: "SKIPPED",
              message: policy.reason,
              details: {
                source: "cron",
                userId: latestSession.user_id,
                policySource: policy.source,
                agentRuleId: policy.agentRuleId
              }
            }).catch((error) => {
              logger.warn({ err: error }, "failed to append action log");
            });

            logger.info(
              {
                sessionId: session.session_id,
                userId: latestSession.user_id
              },
              "expired session skipped by agent automation policy"
            );
            continue;
          }

          if (!isTransferWindowOpen(policy.window)) {
            const nextAllowedAt = nextTransferWindowStart(policy.window);

            await saveSessionState({
              session_id: session.session_id,
              company_id: session.company_id,
              department_id: session.department_id,
              user_id: session.user_id,
              status: SESSION_STATUSES.WAITING_SELLER,
              expires_at: nextAllowedAt.toISOString()
            });

            if (env.redisEnabled) {
              await startSessionTimer({
                clientId: client.id,
                sessionId: session.session_id,
                ttlSeconds: Math.max(
                  60,
                  Math.ceil((nextAllowedAt.getTime() - Date.now()) / 1000)
                )
              });
            }

            await appendActionLog({
              clientId: client.id,
              actionType: "TRANSFER",
              sessionId: session.session_id,
              status: "SKIPPED",
              message: "Transferencia aguardando janela de atendimento.",
              details: {
                source: "cron",
                window: transferWindowLabel(policy.window),
                userId: latestSession.user_id,
                policySource: policy.source,
                agentRuleId: policy.agentRuleId,
                nextAllowedAt: nextAllowedAt.toISOString()
              }
            }).catch((error) => {
              logger.warn({ err: error }, "failed to append action log");
            });

            logger.info(
              {
                sessionId: session.session_id,
                nextAllowedAt: nextAllowedAt.toISOString()
              },
              "expired session rescheduled for transfer window"
            );
            continue;
          }
        }

        await transferSession(session.session_id, {
          transferSessionUrl: client?.wtsTransferSessionUrl,
          apiToken: client?.wtsApiToken,
          departmentId:
            client?.transferDepartmentId ?? latestSession.department_id
        });

        if (client) {
          await appendActionLog({
            clientId: client.id,
            actionType: "TRANSFER",
            sessionId: session.session_id,
            status: "SUCCESS",
            message: "Transferencia automatica por timeout executada.",
            details: {
              source: "cron",
              departmentId:
                client.transferDepartmentId ?? latestSession.department_id
            }
          }).catch((error) => {
            logger.warn({ err: error }, "failed to append action log");
          });
        }

        await saveSessionState({
          session_id: session.session_id,
          company_id: session.company_id,
          department_id: session.department_id,
          user_id: session.user_id,
          status: SESSION_STATUSES.RETURNED_TO_QUEUE,
          expires_at: null
        });

        await createAiTransferNote({
          client,
          session: latestSession
        });

        logger.info(
          { sessionId: session.session_id },
          "session returned to queue after timeout"
        );
      } catch (error) {
        const client =
          (await findClientConfigByCompanyId(session.company_id).catch(() => null)) ??
          (await getActiveClientConfig().catch(() => null));

        if (client) {
          await appendActionLog({
            clientId: client.id,
            actionType: "TRANSFER",
            sessionId: session.session_id,
            status: "ERROR",
            message: "Falha na transferencia automatica por timeout.",
            details: {
              source: "cron",
              error: error instanceof Error ? error.message : "Unexpected error"
            }
          }).catch((logError) => {
            logger.warn({ err: logError }, "failed to append action log");
          });
        }

        logger.error(
          { err: error, sessionId: session.session_id },
          "failed to return expired session to queue"
        );
      }
    }
  } catch (error) {
    logger.error({ err: error }, "timeout worker execution failed");
  } finally {
    isRunning = false;
  }
}

export function startTimeoutWorker(): cron.ScheduledTask {
  const task = cron.schedule(env.workerCron, runTimeoutWorkerOnce, {
    scheduled: true,
    timezone: "UTC"
  });

  logger.info({ cron: env.workerCron }, "timeout worker started");
  return task;
}
