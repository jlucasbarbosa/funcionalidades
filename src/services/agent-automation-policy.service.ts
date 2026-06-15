import { findAgentAutomationRule } from "../repositories/agent-automation-rule.repository.js";
import type { ClientConfig } from "../types/client-config.js";
import type { SessionTimeoutRow } from "../types/session-timeout.js";
import type { TransferWindowConfig } from "./transfer-window.service.js";

export type AgentAutomationPolicy = {
  enabled: boolean;
  reason: string | null;
  window: TransferWindowConfig;
  source: "agent" | "client";
  agentRuleId: string | null;
};

export async function resolveAgentAutomationPolicy(input: {
  client: ClientConfig;
  session: SessionTimeoutRow;
}): Promise<AgentAutomationPolicy> {
  const rule = await findAgentAutomationRule({
    clientId: input.client.id,
    agentId: input.session.user_id
  });

  if (!rule) {
    return {
      enabled: true,
      reason: null,
      window: input.client,
      source: "client",
      agentRuleId: null
    };
  }

  return {
    enabled: rule.enabled,
    reason: rule.enabled ? null : "Automacao desativada para este atendente.",
    window:
      rule.transferWindowStart && rule.transferWindowEnd
        ? rule
        : input.client,
    source: "agent",
    agentRuleId: rule.id
  };
}
