import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";

export type AutomationActionType =
  | "TRANSFER"
  | "AI_NOTE";

export type AutomationActionStatus =
  | "SUCCESS"
  | "ERROR"
  | "SKIPPED";

export type AutomationActionLogEntry = {
  id: string;
  clientId: string;
  createdAt: string;
  actionType: AutomationActionType | string;
  sessionId: string | null;
  status: AutomationActionStatus | string;
  message: string | null;
  details: unknown;
};

type AutomationActionLogInput = Omit<
  AutomationActionLogEntry,
  "id" | "createdAt"
>;

type AutomationActionLogRow = {
  id: string;
  client_id: string;
  created_at: string;
  action_type: string;
  session_id: string | null;
  status: string;
  message: string | null;
  details: unknown;
};

const table = "automation_action_logs";

function toEntry(row: AutomationActionLogRow): AutomationActionLogEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    createdAt: row.created_at,
    actionType: row.action_type,
    sessionId: row.session_id,
    status: row.status,
    message: row.message,
    details: row.details
  };
}

export async function appendActionLog(
  input: AutomationActionLogInput
): Promise<AutomationActionLogEntry> {
  const { data, error } = await supabase
    .from(table)
    .insert({
      id: randomUUID(),
      client_id: input.clientId,
      action_type: input.actionType,
      session_id: input.sessionId,
      status: input.status,
      message: input.message,
      details: input.details ?? {}
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return toEntry(data as AutomationActionLogRow);
}

export async function listActionLogs(
  clientId: string,
  limit = 80
): Promise<AutomationActionLogEntry[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AutomationActionLogRow[]).map(toEntry);
}
