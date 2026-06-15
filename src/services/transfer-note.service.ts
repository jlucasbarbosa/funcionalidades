import { logger } from "../config/logger.js";
import { appendActionLog } from "../repositories/action-log.repository.js";
import type { ClientConfig } from "../types/client-config.js";
import type { SessionTimeoutRow } from "../types/session-timeout.js";
import {
  listAllFlwSessionMessages,
  saveFlwInternalNote
} from "./flw.service.js";
import { generateTransferSummaryNote } from "./openai-summary.service.js";

function safeError(error: unknown): {
  message: string;
  status?: number;
  apiText?: string;
} {
  const maybeAxiosError = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        text?: string;
        message?: string;
        error?: string;
      };
    };
  };

  const summary: {
    message: string;
    status?: number;
    apiText?: string;
  } = {
    message: maybeAxiosError.message ?? "Unexpected error"
  };
  const status = maybeAxiosError.response?.status;
  const apiText =
    maybeAxiosError.response?.data?.text ??
    maybeAxiosError.response?.data?.message ??
    maybeAxiosError.response?.data?.error;

  if (status !== undefined) {
    summary.status = status;
  }

  if (apiText !== undefined) {
    summary.apiText = apiText;
  }

  return summary;
}

export async function createAiTransferNote(input: {
  client: ClientConfig | null | undefined;
  session: SessionTimeoutRow;
  failOnError?: boolean;
}): Promise<void> {
  const { client, session } = input;

  if (!client?.wtsApiToken) {
    if (client?.id) {
      await appendActionLog({
        clientId: client.id,
        actionType: "AI_NOTE",
        sessionId: session.session_id,
        status: "SKIPPED",
        message: "Nota IA ignorada porque o cliente nao tem token CECI.",
        details: {}
      }).catch((error) => {
        logger.warn({ err: error }, "failed to append action log");
      });
    }

    logger.warn(
      { sessionId: session.session_id, clientId: client?.id },
      "ai transfer note skipped because client token is missing"
    );
    return;
  }

  try {
    const messages = await listAllFlwSessionMessages({
      apiToken: client.wtsApiToken,
      sessionId: session.session_id
    });
    const note = await generateTransferSummaryNote({
      sessionId: session.session_id,
      timeoutMinutes: client.timeoutMinutes,
      messages
    });

    await saveFlwInternalNote({
      apiToken: client.wtsApiToken,
      sessionId: session.session_id,
      text: note
    });

    await appendActionLog({
      clientId: client.id,
      actionType: "AI_NOTE",
      sessionId: session.session_id,
      status: "SUCCESS",
      message: "Nota interna com resumo IA criada.",
      details: {
        messagesCount: messages.length,
        noteLength: note.length
      }
    }).catch((error) => {
      logger.warn({ err: error }, "failed to append action log");
    });

    logger.info(
      { sessionId: session.session_id, clientId: client.id },
      "ai transfer note created"
    );
  } catch (error) {
    logger.error(
      {
        error: safeError(error),
        sessionId: session.session_id,
        clientId: client.id
      },
      "failed to create ai transfer note"
    );

    await appendActionLog({
      clientId: client.id,
      actionType: "AI_NOTE",
      sessionId: session.session_id,
      status: "ERROR",
      message: "Falha ao criar nota interna com resumo IA.",
      details: safeError(error)
    }).catch((logError) => {
      logger.warn({ err: logError }, "failed to append action log");
    });

    if (input.failOnError) {
      throw error;
    }
  }
}
