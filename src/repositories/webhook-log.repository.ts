import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";

export type WebhookLogEntry = {
  id: string;
  clientId: string;
  receivedAt: string;
  eventType: string;
  sessionId: string | null;
  companyId: string | null;
  handled: boolean;
  statusCode: number;
  reason: string | null;
  error: string | null;
  payload: unknown;
};

type WebhookLogInput = Omit<WebhookLogEntry, "id" | "receivedAt">;

type WebhookLogRow = {
  id: string;
  client_id: string;
  received_at: string;
  event_type: string;
  session_id: string | null;
  company_id: string | null;
  handled: boolean;
  status_code: number;
  reason: string | null;
  error: string | null;
  payload: unknown;
};

const table = "webhook_logs";

function toWebhookLogEntry(row: WebhookLogRow): WebhookLogEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    receivedAt: row.received_at,
    eventType: row.event_type,
    sessionId: row.session_id,
    companyId: row.company_id,
    handled: row.handled,
    statusCode: row.status_code,
    reason: row.reason,
    error: row.error,
    payload: row.payload
  };
}

export async function appendWebhookLog(
  input: WebhookLogInput
): Promise<WebhookLogEntry> {
  const { data, error } = await supabase
    .from(table)
    .insert({
      id: randomUUID(),
      client_id: input.clientId,
      event_type: input.eventType,
      session_id: input.sessionId,
      company_id: input.companyId,
      handled: input.handled,
      status_code: input.statusCode,
      reason: input.reason,
      error: input.error,
      payload: input.payload
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toWebhookLogEntry(data as WebhookLogRow);
}

export async function listWebhookLogs(
  clientId: string,
  limit = 50
): Promise<WebhookLogEntry[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("client_id", clientId)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as WebhookLogRow[]).map(toWebhookLogEntry);
}
