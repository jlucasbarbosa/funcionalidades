import { randomUUID } from "node:crypto";
import { supabase } from "../lib/supabase.js";
import type {
  ClientConfig,
  ClientConfigInput,
  ClientConfigState
} from "../types/client-config.js";

type AutomationClientRow = {
  id: string;
  name: string;
  webhook_token: string;
  ceci_company_id: string | null;
  timeout_minutes: number;
  transfer_window_start?: string | null;
  transfer_window_end?: string | null;
  transfer_department_id: string | null;
  transfer_department_name?: string | null;
  wts_transfer_session_url: string | null;
  wts_api_token: string | null;
  created_at: string;
  updated_at: string;
};

type AutomationSettingsRow = {
  id: string;
  active_client_id: string | null;
  public_base_url: string | null;
};

const clientsTable = "automation_clients";
const settingsTable = "automation_settings";
const settingsId = "default";

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTimeoutMinutes(value: number | null | undefined): number {
  if (!Number.isFinite(value) || !value) {
    return 5;
  }

  return Math.max(1, Math.min(240, Math.round(value)));
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

function toClientConfig(row: AutomationClientRow): ClientConfig {
  return {
    id: row.id,
    name: row.name,
    webhookToken: row.webhook_token,
    ceciCompanyId: row.ceci_company_id,
    timeoutMinutes: row.timeout_minutes,
    transferWindowStart: row.transfer_window_start ?? null,
    transferWindowEnd: row.transfer_window_end ?? null,
    transferDepartmentId: row.transfer_department_id,
    transferDepartmentName: row.transfer_department_name ?? null,
    wtsTransferSessionUrl: row.wts_transfer_session_url,
    wtsApiToken: row.wts_api_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function readSettings(): Promise<AutomationSettingsRow> {
  const { data, error } = await supabase
    .from(settingsTable)
    .select("*")
    .eq("id", settingsId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data as AutomationSettingsRow;
  }

  const { data: created, error: createError } = await supabase
    .from(settingsTable)
    .insert({
      id: settingsId,
      active_client_id: null,
      public_base_url: null
    })
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return created as AutomationSettingsRow;
}

async function updateSettings(
  input: Partial<Pick<AutomationSettingsRow, "active_client_id" | "public_base_url">>
): Promise<void> {
  const { error } = await supabase
    .from(settingsTable)
    .upsert(
      {
        id: settingsId,
        ...input,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

  if (error) {
    throw error;
  }
}

async function listClients(): Promise<ClientConfig[]> {
  const { data, error } = await supabase
    .from(clientsTable)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as AutomationClientRow[]).map(toClientConfig);
}

export async function listClientConfigs(): Promise<ClientConfigState> {
  const [settings, clients] = await Promise.all([readSettings(), listClients()]);

  return {
    activeClientId: settings.active_client_id,
    publicBaseUrl: settings.public_base_url,
    clients
  };
}

export async function createClientConfig(
  input: ClientConfigInput
): Promise<ClientConfigState> {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Client name is required");
  }

  const state = await listClientConfigs();
  const now = new Date().toISOString();
  const clientId = randomUUID();

  const { error } = await supabase.from(clientsTable).insert({
    id: clientId,
    name,
    webhook_token: randomUUID(),
    ceci_company_id: normalizeText(input.ceciCompanyId),
    timeout_minutes: normalizeTimeoutMinutes(input.timeoutMinutes),
    transfer_window_start: normalizeTime(input.transferWindowStart),
    transfer_window_end: normalizeTime(input.transferWindowEnd),
    transfer_department_id: normalizeText(input.transferDepartmentId),
    transfer_department_name: normalizeText(input.transferDepartmentName),
    wts_transfer_session_url: normalizeText(input.wtsTransferSessionUrl),
    wts_api_token: normalizeText(input.wtsApiToken),
    created_at: now,
    updated_at: now
  });

  if (error) {
    throw error;
  }

  if (!state.activeClientId) {
    await updateSettings({ active_client_id: clientId });
  }

  return listClientConfigs();
}

export async function updateClientConfig(
  clientId: string,
  input: Partial<ClientConfigInput>
): Promise<ClientConfigState> {
  const client = await findClientConfigById(clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  const name = input.name === undefined ? client.name : input.name.trim();

  if (!name) {
    throw new Error("Client name is required");
  }

  const { error } = await supabase
    .from(clientsTable)
    .update({
      name,
      ceci_company_id:
        input.ceciCompanyId === undefined
          ? client.ceciCompanyId
          : normalizeText(input.ceciCompanyId),
      timeout_minutes:
        input.timeoutMinutes === undefined
          ? client.timeoutMinutes
          : normalizeTimeoutMinutes(input.timeoutMinutes),
      transfer_window_start:
        input.transferWindowStart === undefined
          ? client.transferWindowStart
          : normalizeTime(input.transferWindowStart),
      transfer_window_end:
        input.transferWindowEnd === undefined
          ? client.transferWindowEnd
          : normalizeTime(input.transferWindowEnd),
      transfer_department_id:
        input.transferDepartmentId === undefined
          ? client.transferDepartmentId
          : normalizeText(input.transferDepartmentId),
      transfer_department_name:
        input.transferDepartmentName === undefined
          ? client.transferDepartmentName
          : normalizeText(input.transferDepartmentName),
      wts_transfer_session_url:
        input.wtsTransferSessionUrl === undefined
          ? client.wtsTransferSessionUrl
          : normalizeText(input.wtsTransferSessionUrl),
      wts_api_token:
        input.wtsApiToken === undefined
          ? client.wtsApiToken
          : normalizeText(input.wtsApiToken),
      updated_at: new Date().toISOString()
    })
    .eq("id", clientId);

  if (error) {
    throw error;
  }

  return listClientConfigs();
}

export async function setActiveClientConfig(
  clientId: string
): Promise<ClientConfigState> {
  const client = await findClientConfigById(clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  await updateSettings({ active_client_id: clientId });
  return listClientConfigs();
}

export async function setPublicBaseUrl(
  publicBaseUrl: string | null
): Promise<ClientConfigState> {
  const normalized = normalizeText(publicBaseUrl);
  await updateSettings({
    public_base_url: normalized?.replace(/\/+$/, "") ?? null
  });

  return listClientConfigs();
}

export async function findClientConfigByWebhookToken(
  webhookToken: string
): Promise<ClientConfig | null> {
  const { data, error } = await supabase
    .from(clientsTable)
    .select("*")
    .eq("webhook_token", webhookToken)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toClientConfig(data as AutomationClientRow) : null;
}

export async function findClientConfigById(
  clientId: string
): Promise<ClientConfig | null> {
  const { data, error } = await supabase
    .from(clientsTable)
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toClientConfig(data as AutomationClientRow) : null;
}

export async function findClientConfigByCompanyId(
  companyId: string | null
): Promise<ClientConfig | null> {
  if (!companyId) {
    return null;
  }

  const { data, error } = await supabase
    .from(clientsTable)
    .select("*")
    .eq("ceci_company_id", companyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toClientConfig(data as AutomationClientRow) : null;
}

export async function getActiveClientConfig(): Promise<ClientConfig | null> {
  const state = await listClientConfigs();

  return (
    state.clients.find((client) => client.id === state.activeClientId) ??
    state.clients[0] ??
    null
  );
}
