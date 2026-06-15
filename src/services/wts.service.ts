import axios from "axios";
import { env } from "../config/env.js";

type TransferSessionOptions = {
  transferSessionUrl?: string | null | undefined;
  apiToken?: string | null | undefined;
  timeoutMs?: number;
  departmentId?: string | null | undefined;
};

export async function transferSession(
  sessionId: string,
  options: TransferSessionOptions = {}
): Promise<void> {
  const transferSessionUrl =
    options.transferSessionUrl ?? env.wtsTransferSessionUrl;
  const apiToken = options.apiToken ?? env.wtsApiToken;
  const timeoutMs = options.timeoutMs ?? env.wtsTimeoutMs;
  const encodedSessionId = encodeURIComponent(sessionId);
  const urlHasSessionId =
    transferSessionUrl.includes("{sessionId}") ||
    transferSessionUrl.includes("{id}");
  const url = transferSessionUrl.includes("{sessionId}")
    ? transferSessionUrl.replace("{sessionId}", encodedSessionId)
    : transferSessionUrl.includes("{id}")
    ? transferSessionUrl.replace("{id}", encodedSessionId)
    : transferSessionUrl;
  const body = {
    ...(urlHasSessionId ? {} : { sessionId }),
    type: "DEPARTMENT",
    newDepartmentId: options.departmentId ?? null,
    newUserId: null,
    options: {}
  };

  await axios.put(
    url,
    body,
    {
      timeout: timeoutMs,
      headers: {
        ...(apiToken
          ? { Authorization: `Bearer ${apiToken}` }
          : {}),
        "Content-Type": "application/json"
      }
    }
  );
}
