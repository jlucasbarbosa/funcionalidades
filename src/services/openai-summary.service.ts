import axios from "axios";
import { env } from "../config/env.js";
import type { FlwSessionMessage } from "./flw.service.js";

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

function messageAuthor(message: FlwSessionMessage): string {
  if (message.direction === "FROM_HUB") {
    return "Cliente";
  }

  if (message.direction === "TO_HUB") {
    return message.userId ? `Atendente ${message.userId}` : "Atendente";
  }

  return message.direction ?? "Sistema";
}

function messageText(message: FlwSessionMessage): string {
  return message.text?.trim() || `[${message.type ?? "mensagem sem texto"}]`;
}

function buildTranscript(messages: FlwSessionMessage[]): string {
  return messages
    .map((message) => {
      return [
        `[${message.createdAt}]`,
        messageAuthor(message) + ":",
        messageText(message)
      ].join(" ");
    })
    .join("\n")
    .slice(0, 90_000);
}

function outputText(response: OpenAiResponse): string {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((content): content is string => Boolean(content?.trim()))
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("OpenAI returned an empty summary");
  }

  return text;
}

export async function generateTransferSummaryNote(input: {
  sessionId: string;
  timeoutMinutes: number;
  messages: FlwSessionMessage[];
}): Promise<string> {
  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const transcript = buildTranscript(input.messages);
  const response = await axios.post<OpenAiResponse>(
    "https://api.openai.com/v1/responses",
    {
      model: env.openaiModel,
      input: [
        {
          role: "system",
          content:
            "Voce resume atendimentos de WhatsApp para notas internas. Escreva em portugues do Brasil, seja objetivo, nao invente dados e gere apenas o contexto geral da conversa."
        },
        {
          role: "user",
          content: [
            "Leia a conversa inteira abaixo e gere uma nota interna contendo apenas o contexto geral.",
            "",
            "Formato obrigatorio:",
            "Resumo automatico por IA",
            "",
            "Contexto geral:",
            "- Escreva de 2 a 5 bullets curtos.",
            "- Foque somente no que o cliente quer e no estado geral da conversa.",
            "- Nao inclua motivo da transferencia, proxima acao, tempo sem resposta, analise de atendente ou julgamento.",
            "",
            `ID do atendimento: ${input.sessionId}`,
            "",
            "Conversa:",
            transcript || "[nenhuma mensagem encontrada]"
          ].join("\n")
        }
      ],
      max_output_tokens: 450
    },
    {
      timeout: 45_000,
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  return outputText(response.data);
}
