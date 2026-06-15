import type { FastifyInstance } from "fastify";
import { env, hasRequiredEnv, missingRequiredEnv } from "../config/env.js";
import { configPage } from "../pages/config-page.js";
import {
  appendActionLog,
  listActionLogs
} from "../repositories/action-log.repository.js";
import {
  listAgentAutomationRules,
  upsertAgentAutomationRules
} from "../repositories/agent-automation-rule.repository.js";
import {
  createClientConfig,
  findClientConfigById,
  listClientConfigs,
  setActiveClientConfig,
  setPublicBaseUrl,
  updateClientConfig
} from "../repositories/client-config.repository.js";
import { listWebhookLogs } from "../repositories/webhook-log.repository.js";
import {
  findSession,
  listRecentSessions
} from "../repositories/session-timeout.repository.js";
import {
  listFlwAgents,
  listFlwDepartments,
  listFlwSessionMessages
} from "../services/flw.service.js";
import { getSessionTimerTtlSeconds } from "../services/redis-timer.service.js";
import { createAiTransferNote } from "../services/transfer-note.service.js";
import { transferSession } from "../services/wts.service.js";
import type { ClientConfigInput } from "../types/client-config.js";
import type {
  ClientConfig,
  ClientConfigState
} from "../types/client-config.js";

type ClientParams = {
  clientId: string;
};

type SessionParams = ClientParams & {
  sessionId: string;
};

type ActiveClientBody = {
  clientId?: string;
};

type PublicUrlBody = {
  publicBaseUrl?: string | null;
};

type TestTransferBody = {
  sessionId?: string;
  createAiNote?: boolean;
};

type AgentAutomationRulesBody = {
  rules?: Array<{
    agentId?: string;
    agentName?: string | null;
    enabled?: boolean;
    transferWindowStart?: string | null;
    transferWindowEnd?: string | null;
  }>;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "fetch failed") {
      return "Nao foi possivel conectar ao Supabase. Confira SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente do Vercel.";
    }

    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      code?: string;
      message?: string;
    };

    if (
      maybeError.message?.includes("transfer_window_") &&
      (maybeError.code === "42703" || maybeError.message.includes("schema cache"))
    ) {
      return "As colunas de horario ainda nao existem no Supabase. Rode o SQL de migracao das janelas de transferencia.";
    }

    if (maybeError.message) {
      return maybeError.message;
    }
  }

  return "Unexpected error";
}

function externalApiErrorMessage(error: unknown): string {
  const maybeAxiosError = error as {
    response?: {
      status?: number;
      data?: {
        text?: string;
        error?: string;
        message?: string;
      };
    };
    message?: string;
  };
  const status = maybeAxiosError.response?.status;
  const data = maybeAxiosError.response?.data;
  const apiMessage = data?.text ?? data?.message ?? data?.error;

  if (apiMessage && status) {
    return `API FLW/CECI respondeu ${status}: ${apiMessage}`;
  }

  if (apiMessage) {
    return `API FLW/CECI respondeu: ${apiMessage}`;
  }

  return errorMessage(error);
}

function publicClient(client: ClientConfig) {
  const { wtsApiToken: _wtsApiToken, ...safeClient } = client;

  return {
    ...safeClient,
    hasWtsApiToken: Boolean(_wtsApiToken)
  };
}

function publicState(state: ClientConfigState) {
  return {
    activeClientId: state.activeClientId,
    publicBaseUrl: state.publicBaseUrl,
    clients: state.clients.map(publicClient)
  };
}

function fallbackRemainingSeconds(expiresAt: string | null): number | null {
  if (!expiresAt) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringFromRecords(
  records: Record<string, unknown>[],
  keys: string[]
): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
    }
  }

  return null;
}

function payloadRecords(payload: unknown): Record<string, unknown>[] {
  if (!isRecord(payload)) {
    return [];
  }

  const envelopeBody = isRecord(payload.body) ? payload.body : null;
  const root = envelopeBody ?? payload;
  const data = isRecord(root.data) ? root.data : {};
  const content = isRecord(root.content) ? root.content : {};
  const payloadNode = isRecord(root.payload) ? root.payload : {};
  const user = isRecord(content.user) ? content.user : {};
  const assignedUser = isRecord(content.assignedUser) ? content.assignedUser : {};
  const rootUser = isRecord(root.user) ? root.user : {};

  return [user, assignedUser, rootUser, content, data, payloadNode, root, payload];
}

function payloadUserRecords(payload: unknown): Record<string, unknown>[] {
  if (!isRecord(payload)) {
    return [];
  }

  const envelopeBody = isRecord(payload.body) ? payload.body : null;
  const root = envelopeBody ?? payload;
  const content = isRecord(root.content) ? root.content : {};

  return [
    isRecord(content.user) ? content.user : {},
    isRecord(content.assignedUser) ? content.assignedUser : {},
    isRecord(content.userInfo) ? content.userInfo : {},
    isRecord(root.user) ? root.user : {},
    isRecord(root.assignedUser) ? root.assignedUser : {}
  ];
}

function attendantFromPayload(payload: unknown): {
  attendantId: string | null;
  attendantName: string | null;
} {
  const records = payloadRecords(payload);
  const userRecords = payloadUserRecords(payload);

  return {
    attendantId:
      readStringFromRecords(records, ["user_id", "userId", "UserId"]) ??
      readStringFromRecords(userRecords, ["id"]),
    attendantName: readStringFromRecords(records, [
      "user_name",
      "userName",
      "UserName",
      "userFullName",
      "fullName",
      "displayName",
      "name",
      "agentName",
      "attendantName",
      "operatorName",
      "assignedUserName"
    ])
  };
}

async function agentsByIdForClient(
  client: ClientConfig,
  log: FastifyInstance["log"]
): Promise<Map<string, string>> {
  const agentsById = new Map<string, string>();

  if (!client.wtsApiToken) {
    return agentsById;
  }

  try {
    const agents = await listFlwAgents(client.wtsApiToken);

    for (const agent of agents) {
      agentsById.set(agent.id, agent.name);

      if (agent.agentId) {
        agentsById.set(agent.agentId, agent.name);
      }
    }
  } catch (error) {
    log.warn(
      { err: error, clientId: client.id },
      "failed to list agents"
    );
  }

  return agentsById;
}

function agentName(
  agentsById: Map<string, string>,
  attendantId: string | null | undefined,
  fallbackName?: string | null
): string {
  return fallbackName ?? agentsById.get(attendantId ?? "") ?? attendantId ?? "Nao identificado";
}

function compactMessageText(text: string | null): string {
  if (!text?.trim()) {
    return "[sem texto]";
  }

  return text.trim().replace(/\s+/g, " ");
}

function probableTransferReason(input: {
  status: string | null | undefined;
  timeoutMinutes: number;
  remainingSeconds: number | null;
}): string {
  if (input.status === "RETURNED_TO_QUEUE") {
    return `Transferido automaticamente porque o cliente ficou sem resposta por ${input.timeoutMinutes} minuto(s) apos a ultima mensagem.`;
  }

  if (input.status === "WAITING_SELLER") {
    return input.remainingSeconds === null
      ? "Cliente aguardando resposta do atendente."
      : `Cliente aguardando resposta. Restam cerca de ${input.remainingSeconds} segundo(s) para transferencia.`;
  }

  if (input.status === "SELLER_RESPONDED") {
    return "Atendente respondeu depois da ultima mensagem do cliente.";
  }

  if (input.status === "CLOSED") {
    return "Atendimento finalizado.";
  }

  if (input.status === "IN_PROGRESS") {
    return "Atendimento iniciado e monitorado; timer ainda nao foi iniciado pela ultima mensagem do cliente.";
  }

  return "Sem motivo critico identificado nas mensagens carregadas.";
}

function clientWebhookSessionIds(
  logs: Array<{ sessionId: string | null }>
): Set<string> {
  return new Set(
    logs
      .map((log) => log.sessionId)
      .filter((sessionId): sessionId is string => Boolean(sessionId))
  );
}

function clientScopedSessions<T extends { session_id: string }>(
  client: ClientConfig,
  sessions: T[],
  logs: Array<{ sessionId: string | null }>
): T[] {
  if (client.ceciCompanyId) {
    return sessions;
  }

  const knownSessionIds = clientWebhookSessionIds(logs);

  return sessions.filter((session) => knownSessionIds.has(session.session_id));
}

export async function configRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").send(configPage);
  });

  app.get("/api/automation-config", async () => {
    try {
      return publicState(await listClientConfigs());
    } catch (error) {
      return {
        activeClientId: null,
        publicBaseUrl: null,
        clients: [],
        configured: hasRequiredEnv,
        missingEnv: missingRequiredEnv,
        warning: errorMessage(error)
      };
    }
  });

  app.get("/api/client-ranking", async (request) => {
    const state = await listClientConfigs();

    const ranking = await Promise.all(
      state.clients.map(async (client) => {
        const [sessions, logs, actionLogs, agentsById] = await Promise.all([
          client.ceciCompanyId
            ? listRecentSessions({
                companyId: client.ceciCompanyId,
                limit: 1000
              })
            : Promise.resolve([]),
          listWebhookLogs(client.id, 1000),
          listActionLogs(client.id, 1000).catch((error) => {
            request.log.warn(
              { err: error, clientId: client.id },
              "failed to list action logs for client ranking"
            );
            return [];
          }),
          agentsByIdForClient(client, request.log)
        ]);
        const expirationsByAgentId = new Map<string, number>();
        const expirerNameByAgentId = new Map<string, string>();
        const monitoredSessionIds = new Set<string>();
        const automaticTransferSessionIds = new Set<string>();
        const sessionAttendantBySessionId = new Map<
          string,
          {
            attendantId: string | null;
            attendantName: string | null;
          }
        >();

        function incrementExpiration(
          agentId: string | null | undefined,
          fallbackName?: string | null
        ): void {
          const safeAgentId =
            agentId || (fallbackName ? `name:${fallbackName}` : "unknown");

          if (fallbackName) {
            expirerNameByAgentId.set(safeAgentId, fallbackName);
          }

          expirationsByAgentId.set(
            safeAgentId,
            (expirationsByAgentId.get(safeAgentId) ?? 0) + 1
          );
        }

        for (const session of sessions) {
          monitoredSessionIds.add(session.session_id);

          if (session.status !== "RETURNED_TO_QUEUE") {
            continue;
          }

          automaticTransferSessionIds.add(session.session_id);
          incrementExpiration(session.user_id);
        }

        let responseCount = 0;
        let totalResponseMs = 0;
        const pendingCustomerMessageBySessionId = new Map<string, number>();

        for (const log of [...logs].reverse()) {
          if (!log.sessionId || !log.handled) {
            continue;
          }

          monitoredSessionIds.add(log.sessionId);
          const attendant = attendantFromPayload(log.payload);

          if (attendant.attendantId || attendant.attendantName) {
            sessionAttendantBySessionId.set(log.sessionId, attendant);
          }

          if (log.eventType === "MESSAGE_RECEIVED") {
            pendingCustomerMessageBySessionId.set(
              log.sessionId,
              new Date(log.receivedAt).getTime()
            );
            continue;
          }

          if (log.eventType !== "MESSAGE_SENT") {
            continue;
          }

          const startedAt = pendingCustomerMessageBySessionId.get(log.sessionId);

          if (!startedAt) {
            continue;
          }

          const respondedAt = new Date(log.receivedAt).getTime();
          const responseMs = respondedAt - startedAt;

          if (responseMs < 0) {
            continue;
          }

          responseCount += 1;
          totalResponseMs += responseMs;
          pendingCustomerMessageBySessionId.delete(log.sessionId);
        }

        for (const actionLog of actionLogs) {
          const details = isRecord(actionLog.details) ? actionLog.details : {};
          const source = typeof details.source === "string" ? details.source : null;

          if (
            actionLog.actionType === "TRANSFER" &&
            actionLog.status === "SUCCESS" &&
            (source === "redis" || source === "cron") &&
            actionLog.sessionId
          ) {
            const wasAlreadyCounted = automaticTransferSessionIds.has(
              actionLog.sessionId
            );
            automaticTransferSessionIds.add(actionLog.sessionId);
            monitoredSessionIds.add(actionLog.sessionId);

            if (!wasAlreadyCounted) {
              const attendant = sessionAttendantBySessionId.get(actionLog.sessionId);
              incrementExpiration(
                attendant?.attendantId,
                attendant?.attendantName
              );
            }
          }
        }

        const topExpirer = [...expirationsByAgentId.entries()]
          .sort((left, right) => right[1] - left[1])[0];
        const topExpirerId = topExpirer?.[0] ?? null;

        return {
          clientId: client.id,
          clientName: client.name,
          monitoredSessions: monitoredSessionIds.size,
          automaticTransfers: automaticTransferSessionIds.size,
          averageResponseSeconds:
            responseCount > 0
              ? Math.round(totalResponseMs / responseCount / 1000)
              : null,
          responseCount,
          topExpirer:
            topExpirer && topExpirerId
              ? {
                  agentId:
                    topExpirerId === "unknown" || topExpirerId.startsWith("name:")
                      ? null
                      : topExpirerId,
                  agentName: agentName(
                    agentsById,
                    topExpirerId.startsWith("name:") || topExpirerId === "unknown"
                      ? null
                      : topExpirerId,
                    expirerNameByAgentId.get(topExpirerId)
                  ),
                  expirations: topExpirer[1]
                }
              : null
        };
      })
    );

    return {
      generatedAt: new Date().toISOString(),
      ranking: ranking.sort((left, right) => {
        if (right.automaticTransfers !== left.automaticTransfers) {
          return right.automaticTransfers - left.automaticTransfers;
        }

        return right.monitoredSessions - left.monitoredSessions;
      })
    };
  });

  app.post<{ Body: ClientConfigInput }>("/api/clients", async (request, reply) => {
    try {
      return publicState(await createClientConfig(request.body));
    } catch (error) {
      return reply.code(400).send({
        ok: false,
        error: errorMessage(error)
      });
    }
  });

  app.patch<{ Params: ClientParams; Body: Partial<ClientConfigInput> }>(
    "/api/clients/:clientId",
    async (request, reply) => {
      try {
        return publicState(
          await updateClientConfig(request.params.clientId, request.body)
        );
      } catch (error) {
        return reply.code(400).send({
          ok: false,
          error: errorMessage(error)
        });
      }
    }
  );

  app.get<{ Params: ClientParams }>(
    "/api/clients/:clientId/webhook-logs",
    async (request) => {
      return {
        logs: await listWebhookLogs(request.params.clientId)
      };
    }
  );

  app.get<{ Params: ClientParams }>(
    "/api/clients/:clientId/action-logs",
    async (request, reply) => {
      try {
        return {
          logs: await listActionLogs(request.params.clientId)
        };
      } catch (error) {
        request.log.warn(
          { err: error, clientId: request.params.clientId },
          "failed to list action logs"
        );

        return reply.code(200).send({
          logs: [],
          warning: "Tabela automation_action_logs ainda nao esta disponivel no Supabase."
        });
      }
    }
  );

  app.get<{ Params: ClientParams }>(
    "/api/clients/:clientId/monitored-sessions",
    async (request, reply) => {
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      const [rawSessions, logs] = await Promise.all([
        listRecentSessions({
          companyId: client.ceciCompanyId,
          limit: client.ceciCompanyId ? 80 : 1000
        }),
        listWebhookLogs(client.id, 500)
      ]);
      const sessions = clientScopedSessions(client, rawSessions, logs).slice(0, 80);
      const attendantBySessionId = new Map<
        string,
        { attendantId: string | null; attendantName: string | null }
      >();
      const agentsById = await agentsByIdForClient(client, request.log);

      for (const log of [...logs].reverse()) {
        if (!log.sessionId || attendantBySessionId.has(log.sessionId)) {
          continue;
        }

        if (log.eventType !== "SESSION_UPDATE" && log.eventType !== "MESSAGE_SENT") {
          continue;
        }

        const attendant = attendantFromPayload(log.payload);

        if (attendant.attendantId || attendant.attendantName) {
          attendantBySessionId.set(log.sessionId, attendant);
        }
      }

      const monitoredSessions = await Promise.all(
        sessions.map(async (session) => {
          let redisTtlSeconds: number | null = null;
          const attendant = attendantBySessionId.get(session.session_id);

          if (env.redisEnabled) {
            try {
              redisTtlSeconds = await getSessionTimerTtlSeconds({
                clientId: client.id,
                sessionId: session.session_id
              });
            } catch (error) {
              request.log.warn(
                { err: error, clientId: client.id, sessionId: session.session_id },
                "failed to read redis session ttl"
              );
            }
          }

          const remainingSeconds =
            redisTtlSeconds ?? fallbackRemainingSeconds(session.expires_at);

          return {
            clientId: client.id,
            clientName: client.name,
            sessionId: session.session_id,
            companyId: session.company_id,
            departmentId: session.department_id,
            userId: session.user_id,
            attendantId: attendant?.attendantId ?? session.user_id,
            attendantName:
              agentName(
                agentsById,
                attendant?.attendantId ?? session.user_id,
                attendant?.attendantName
              ),
            status: session.status,
            expiresAt: session.expires_at,
            createdAt: session.created_at,
            updatedAt: session.updated_at,
            redisEnabled: env.redisEnabled,
            redisTtlSeconds,
            remainingSeconds,
            remainingSource: redisTtlSeconds === null ? "database" : "redis"
          };
        })
      );

      return {
        sessions: monitoredSessions
      };
    }
  );

  app.get<{ Params: SessionParams }>(
    "/api/clients/:clientId/sessions/:sessionId/summary",
    async (request, reply) => {
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      if (!client.wtsApiToken) {
        return reply.code(400).send({
          ok: false,
          error: "Salve o token da API FLW/CECI neste cliente antes de buscar o resumo."
        });
      }

      const session = await findSession(request.params.sessionId);

      if (!session) {
        return reply.code(404).send({
          ok: false,
          error: "Sessao nao encontrada no monitoramento."
        });
      }

      if (
        client.ceciCompanyId &&
        session.company_id &&
        client.ceciCompanyId !== session.company_id
      ) {
        return reply.code(404).send({
          ok: false,
          error: "Sessao nao pertence ao cliente selecionado."
        });
      }

      const [messages, agentsById] = await Promise.all([
        listFlwSessionMessages({
          apiToken: client.wtsApiToken,
          sessionId: request.params.sessionId,
          pageSize: 30
        }),
        agentsByIdForClient(client, request.log)
      ]);
      const lastCustomerMessage =
        messages.find((message) => message.direction === "FROM_HUB") ?? null;
      const lastSellerMessage =
        messages.find((message) => message.direction === "TO_HUB") ?? null;
      let redisTtlSeconds: number | null = null;

      if (env.redisEnabled) {
        try {
          redisTtlSeconds = await getSessionTimerTtlSeconds({
            clientId: client.id,
            sessionId: session.session_id
          });
        } catch (error) {
          request.log.warn(
            { err: error, clientId: client.id, sessionId: session.session_id },
            "failed to read redis ttl for session summary"
          );
        }
      }

      const remainingSeconds =
        redisTtlSeconds ?? fallbackRemainingSeconds(session.expires_at);
      const sellerName = lastSellerMessage
        ? agentName(agentsById, lastSellerMessage.userId)
        : null;

      return {
        sessionId: session.session_id,
        status: session.status,
        attendantName: agentName(agentsById, session.user_id),
        remainingSeconds,
        probableReason: probableTransferReason({
          status: session.status,
          timeoutMinutes: client.timeoutMinutes,
          remainingSeconds
        }),
        lastCustomerMessage: lastCustomerMessage
          ? {
              id: lastCustomerMessage.id,
              createdAt: lastCustomerMessage.createdAt,
              text: compactMessageText(lastCustomerMessage.text),
              type: lastCustomerMessage.type
            }
          : null,
        lastSellerMessage: lastSellerMessage
          ? {
              id: lastSellerMessage.id,
              createdAt: lastSellerMessage.createdAt,
              text: compactMessageText(lastSellerMessage.text),
              type: lastSellerMessage.type,
              userId: lastSellerMessage.userId,
              agentName: sellerName
            }
          : null,
        messagesPreview: messages.slice(0, 8).map((message) => ({
          id: message.id,
          createdAt: message.createdAt,
          direction: message.direction,
          type: message.type,
          text: compactMessageText(message.text),
          agentName:
            message.direction === "TO_HUB"
              ? agentName(agentsById, message.userId)
              : "Cliente"
        }))
      };
    }
  );

  app.get<{ Params: ClientParams }>(
    "/api/clients/:clientId/agent-scoreboard",
    async (request, reply) => {
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      const [rawSessions, logs] = await Promise.all([
        listRecentSessions({
          companyId: client.ceciCompanyId,
          limit: 1000
        }),
        listWebhookLogs(client.id, 1000)
      ]);
      const sessions = clientScopedSessions(client, rawSessions, logs);
      const agentsById = await agentsByIdForClient(client, request.log);
      const sessionUserIdBySessionId = new Map<string, string | null>();
      const scoreByAgentId = new Map<string, {
        agentId: string;
        agentName: string;
        activeSessions: number;
        totalSessions: number;
        autoTransfers: number;
        responseCount: number;
        totalResponseMs: number;
      }>();

      function ensureScore(agentId: string | null | undefined): {
        agentId: string;
        agentName: string;
        activeSessions: number;
        totalSessions: number;
        autoTransfers: number;
        responseCount: number;
        totalResponseMs: number;
      } {
        const safeAgentId = agentId || "unknown";
        const existing = scoreByAgentId.get(safeAgentId);

        if (existing) {
          return existing;
        }

        const created = {
          agentId: safeAgentId,
          agentName: agentName(agentsById, agentId),
          activeSessions: 0,
          totalSessions: 0,
          autoTransfers: 0,
          responseCount: 0,
          totalResponseMs: 0
        };

        scoreByAgentId.set(safeAgentId, created);
        return created;
      }

      for (const session of sessions) {
        sessionUserIdBySessionId.set(session.session_id, session.user_id);

        if (!session.user_id) {
          continue;
        }

        const score = ensureScore(session.user_id);
        score.totalSessions += 1;

        if (
          session.status === "IN_PROGRESS" ||
          session.status === "WAITING_SELLER" ||
          session.status === "SELLER_RESPONDED"
        ) {
          score.activeSessions += 1;
        }

        if (session.status === "RETURNED_TO_QUEUE") {
          score.autoTransfers += 1;
        }
      }

      const pendingCustomerMessageBySessionId = new Map<string, number>();

      for (const log of [...logs].reverse()) {
        if (!log.sessionId || !log.handled) {
          continue;
        }

        if (log.eventType === "MESSAGE_RECEIVED") {
          pendingCustomerMessageBySessionId.set(
            log.sessionId,
            new Date(log.receivedAt).getTime()
          );
          continue;
        }

        if (log.eventType !== "MESSAGE_SENT") {
          continue;
        }

        const startedAt = pendingCustomerMessageBySessionId.get(log.sessionId);

        if (!startedAt) {
          continue;
        }

        const respondedAt = new Date(log.receivedAt).getTime();
        const responseMs = respondedAt - startedAt;

        if (responseMs < 0) {
          continue;
        }

        const attendant = attendantFromPayload(log.payload);
        const attendantId =
          attendant.attendantId ?? sessionUserIdBySessionId.get(log.sessionId);
        const score = ensureScore(attendantId);

        score.agentName = agentName(agentsById, attendantId, attendant.attendantName);
        score.responseCount += 1;
        score.totalResponseMs += responseMs;
        pendingCustomerMessageBySessionId.delete(log.sessionId);
      }

      const scoreboard = [...scoreByAgentId.values()]
        .map((score) => ({
          agentId: score.agentId === "unknown" ? null : score.agentId,
          agentName: score.agentName,
          activeSessions: score.activeSessions,
          totalSessions: score.totalSessions,
          autoTransfers: score.autoTransfers,
          responseCount: score.responseCount,
          averageResponseSeconds:
            score.responseCount > 0
              ? Math.round(score.totalResponseMs / score.responseCount / 1000)
              : null
        }))
        .sort((left, right) => {
          if (right.autoTransfers !== left.autoTransfers) {
            return right.autoTransfers - left.autoTransfers;
          }

          return (
            (right.averageResponseSeconds ?? 0) -
            (left.averageResponseSeconds ?? 0)
          );
        });

      return {
        generatedAt: new Date().toISOString(),
        scoreboard
      };
    }
  );

  app.get<{ Params: ClientParams }>(
    "/api/clients/:clientId/departments",
    async (request, reply) => {
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      if (!client.wtsApiToken) {
        return reply.code(400).send({
          ok: false,
          error: "Salve o token da API FLW/CECI neste cliente antes de buscar as filas."
        });
      }

      try {
        return {
          departments: await listFlwDepartments(client.wtsApiToken)
        };
      } catch (error) {
        request.log.error({ err: error, clientId: client.id }, "failed to list departments");
        return reply.code(502).send({
          ok: false,
          error: "Nao foi possivel buscar as filas na API FLW/CECI."
        });
      }
    }
  );

  app.get<{ Params: ClientParams }>(
    "/api/clients/:clientId/agent-automation-rules",
    async (request, reply) => {
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      if (!client.wtsApiToken) {
        return reply.code(400).send({
          ok: false,
          error: "Salve o token da API FLW/CECI neste cliente antes de buscar os usuarios."
        });
      }

      try {
        const [agents, rules] = await Promise.all([
          listFlwAgents(client.wtsApiToken),
          listAgentAutomationRules(client.id)
        ]);
        const ruleByAgentId = new Map(
          rules.map((rule) => [rule.agentId, rule])
        );

        return {
          agents: agents.map((agent) => {
            const rule = ruleByAgentId.get(agent.id) ??
              (agent.agentId ? ruleByAgentId.get(agent.agentId) : undefined);

            return {
              id: agent.id,
              agentId: agent.agentId,
              name: agent.name,
              email: agent.email,
              enabled: rule?.enabled ?? true,
              transferWindowStart: rule?.transferWindowStart ?? null,
              transferWindowEnd: rule?.transferWindowEnd ?? null,
              hasRule: Boolean(rule)
            };
          }),
          rules
        };
      } catch (error) {
        request.log.error(
          { err: error, clientId: client.id },
          "failed to list agent automation rules"
        );

        return reply.code(502).send({
          ok: false,
          error: "Nao foi possivel buscar os usuarios na API FLW/CECI."
        });
      }
    }
  );

  app.patch<{ Params: ClientParams; Body: AgentAutomationRulesBody }>(
    "/api/clients/:clientId/agent-automation-rules",
    async (request, reply) => {
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      try {
        return {
          rules: await upsertAgentAutomationRules(
            client.id,
            (request.body.rules ?? []).flatMap((rule) => {
              if (!rule.agentId) {
                return [];
              }

              return [{
                agentId: rule.agentId,
                agentName: rule.agentName ?? null,
                enabled: rule.enabled ?? true,
                transferWindowStart: rule.transferWindowStart ?? null,
                transferWindowEnd: rule.transferWindowEnd ?? null
              }];
            })
          )
        };
      } catch (error) {
        return reply.code(400).send({
          ok: false,
          error: errorMessage(error)
        });
      }
    }
  );

  app.post<{ Params: ClientParams; Body: TestTransferBody }>(
    "/api/clients/:clientId/test-transfer",
    async (request, reply) => {
      const sessionId = request.body.sessionId?.trim();
      const client = await findClientConfigById(request.params.clientId);

      if (!client) {
        return reply.code(404).send({
          ok: false,
          error: "Client not found"
        });
      }

      if (!sessionId) {
        return reply.code(400).send({
          ok: false,
          error: "Informe o ID do atendimento para testar a transferencia."
        });
      }

      if (!client.wtsApiToken) {
        return reply.code(400).send({
          ok: false,
          error: "Salve o token da API FLW/CECI neste cliente antes de testar."
        });
      }

      if (!client.transferDepartmentId) {
        return reply.code(400).send({
          ok: false,
          error: "Selecione e salve a fila/departamento de retorno antes de testar."
        });
      }

      try {
        await transferSession(sessionId, {
          transferSessionUrl: client.wtsTransferSessionUrl,
          apiToken: client.wtsApiToken,
          departmentId: client.transferDepartmentId
        });
        await appendActionLog({
          clientId: client.id,
          actionType: "TRANSFER",
          sessionId,
          status: "SUCCESS",
          message: request.body.createAiNote
            ? "Transferencia manual com resumo IA executada."
            : "Teste de transferencia manual executado.",
          details: {
            source: "manual",
            createAiNote: Boolean(request.body.createAiNote),
            departmentId: client.transferDepartmentId
          }
        }).catch((error) => {
          request.log.warn({ err: error }, "failed to append action log");
        });
        let aiNoteCreated = false;

        if (request.body.createAiNote) {
          const session = await findSession(sessionId);

          if (!session) {
            return reply.code(404).send({
              ok: false,
              error: "Transferencia feita, mas a sessao nao foi encontrada no monitoramento para criar a nota IA."
            });
          }

          try {
            await createAiTransferNote({
              client,
              session,
              failOnError: true
            });
          } catch (error) {
            return reply.code(502).send({
              ok: false,
              transferred: true,
              error: "Transferencia feita, mas falhou ao criar a nota IA: " + externalApiErrorMessage(error)
            });
          }

          aiNoteCreated = true;
        }

        return {
          ok: true,
          sessionId,
          transferDepartmentId: client.transferDepartmentId,
          transferDepartmentName: client.transferDepartmentName,
          aiNoteCreated
        };
      } catch (error) {
        await appendActionLog({
          clientId: client.id,
          actionType: "TRANSFER",
          sessionId,
          status: "ERROR",
          message: request.body.createAiNote
            ? "Falha na transferencia manual com resumo IA."
            : "Falha no teste de transferencia manual.",
          details: {
            source: "manual",
            createAiNote: Boolean(request.body.createAiNote),
            error: externalApiErrorMessage(error)
          }
        }).catch((logError) => {
          request.log.warn({ err: logError }, "failed to append action log");
        });

        request.log.error(
          {
            clientId: client.id,
            sessionId,
            error: externalApiErrorMessage(error)
          },
          "test transfer failed"
        );

        return reply.code(502).send({
          ok: false,
          error: externalApiErrorMessage(error)
        });
      }
    }
  );

  app.post<{ Body: ActiveClientBody }>(
    "/api/active-client",
    async (request, reply) => {
      if (!request.body.clientId) {
        return reply.code(400).send({
          ok: false,
          error: "clientId is required"
        });
      }

      try {
        return publicState(await setActiveClientConfig(request.body.clientId));
      } catch (error) {
        return reply.code(400).send({
          ok: false,
          error: errorMessage(error)
        });
      }
    }
  );

  app.post<{ Body: PublicUrlBody }>("/api/public-url", async (request, reply) => {
    const publicBaseUrl = request.body.publicBaseUrl?.trim() ?? null;

    if (publicBaseUrl && !/^https:\/\/.+/i.test(publicBaseUrl)) {
      return reply.code(400).send({
        ok: false,
        error: "Informe uma URL publica com HTTPS, exemplo: https://seu-dominio.com"
      });
    }

    return publicState(await setPublicBaseUrl(publicBaseUrl));
  });
}
