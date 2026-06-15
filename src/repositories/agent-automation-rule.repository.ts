import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";

export type AgentAutomationRule = {
  id: string;
  clientId: string;
  agentId: string;
  agentName: string | null;
  enabled: boolean;
  transferWindowStart: string | null;
  transferWindowEnd: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentAutomationRuleInput = {
  agentId: string;
  agentName?: string | null;
  enabled?: boolean;
  transferWindowStart?: string | null;
  transferWindowEnd?: string | null;
};

type AgentAutomationRuleRow = {
  id: string;
  client_id: string;
  agent_id: string;
  agent_name: string | null;
  enabled: boolean;
  transfer_window_start: string | null;
  transfer_window_end: string | null;
  created_at: string;
  updated_at: string;
};

const table = "agent_automation_rules";

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTime(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    throw new Error("Time must use HH:mm format");
  }

  const [hour, minute] = normalized.split(":").map(Number);

  if (
    hour === undefined ||
    minute === undefined ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("Time must use HH:mm format");
  }

  return normalized;
}

function toRule(row: AgentAutomationRuleRow): AgentAutomationRule {
  return {
    id: row.id,
    clientId: row.client_id,
    agentId: row.agent_id,
    agentName: row.agent_name,
    enabled: row.enabled,
    transferWindowStart: row.transfer_window_start,
    transferWindowEnd: row.transfer_window_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listAgentAutomationRules(
  clientId: string
): Promise<AgentAutomationRule[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("client_id", clientId)
    .order("agent_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as AgentAutomationRuleRow[]).map(toRule);
}

export async function findAgentAutomationRule(input: {
  clientId: string;
  agentId: string | null | undefined;
}): Promise<AgentAutomationRule | null> {
  if (!input.agentId) {
    return null;
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("client_id", input.clientId)
    .eq("agent_id", input.agentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toRule(data as AgentAutomationRuleRow) : null;
}

export async function upsertAgentAutomationRules(
  clientId: string,
  rules: AgentAutomationRuleInput[]
): Promise<AgentAutomationRule[]> {
  const now = new Date().toISOString();
  const payload = rules
    .filter((rule) => rule.agentId.trim())
    .map((rule) => ({
      id: randomUUID(),
      client_id: clientId,
      agent_id: rule.agentId.trim(),
      agent_name: normalizeText(rule.agentName),
      enabled: rule.enabled ?? true,
      transfer_window_start: normalizeTime(rule.transferWindowStart),
      transfer_window_end: normalizeTime(rule.transferWindowEnd),
      created_at: now,
      updated_at: now
    }));

  if (payload.length > 0) {
    const { error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: "client_id,agent_id" });

    if (error) {
      throw error;
    }
  }

  return listAgentAutomationRules(clientId);
}
