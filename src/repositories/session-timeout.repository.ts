import { supabase } from "../lib/supabase.js";
import type {
  SessionTimeoutRow,
  SessionTimeoutUpsert
} from "../types/session-timeout.js";

const table = "session_timeout";

export async function findSession(
  sessionId: string
): Promise<SessionTimeoutRow | null> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as SessionTimeoutRow | null;
}

export async function saveSessionState(
  input: SessionTimeoutUpsert
): Promise<SessionTimeoutRow> {
  const now = new Date().toISOString();
  const existing = await findSession(input.session_id);

  if (existing) {
    const updatePayload = {
      company_id: input.company_id ?? existing.company_id,
      department_id: input.department_id ?? existing.department_id,
      user_id: input.user_id ?? existing.user_id,
      status: input.status,
      expires_at:
        Object.prototype.hasOwnProperty.call(input, "expires_at")
          ? input.expires_at
          : existing.expires_at,
      updated_at: now
    };

    const { data, error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq("session_id", input.session_id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as SessionTimeoutRow;
  }

  const insertPayload = {
    session_id: input.session_id,
    company_id: input.company_id ?? null,
    department_id: input.department_id ?? null,
    user_id: input.user_id ?? null,
    status: input.status,
    expires_at:
      Object.prototype.hasOwnProperty.call(input, "expires_at")
        ? input.expires_at
        : null,
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from(table)
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as SessionTimeoutRow;
}

export async function listExpiredWaitingSellerSessions(
  nowIso: string
): Promise<SessionTimeoutRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("status", "WAITING_SELLER")
    .lte("expires_at", nowIso)
    .order("expires_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SessionTimeoutRow[];
}

export async function listRecentSessions(input: {
  companyId?: string | null;
  limit?: number;
} = {}): Promise<SessionTimeoutRow[]> {
  let query = supabase
    .from(table)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 80);

  if (input.companyId) {
    query = query.eq("company_id", input.companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as SessionTimeoutRow[];
}
