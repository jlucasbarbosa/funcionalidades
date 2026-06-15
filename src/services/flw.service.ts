import axios from "axios";

export type FlwDepartment = {
  id: string;
  name: string;
};

export type FlwAgent = {
  id: string;
  agentId: string | null;
  name: string;
  email: string | null;
};

export type FlwSessionMessage = {
  id: string;
  createdAt: string;
  type: string | null;
  userId: string | null;
  direction: string | null;
  origin: string | null;
  text: string | null;
};

type UnknownRecord = Record<string, unknown>;

const departmentsUrl = "https://api.wts.chat/core/v2/department";
const agentsUrl = "https://api.wts.chat/core/v1/agent";
const agentsCache = new Map<string, {
  expiresAt: number;
  agents: FlwAgent[];
}>();

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(record: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(record: UnknownRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      return value.toLowerCase() === "true";
    }
  }

  return null;
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of ["items", "data", "result", "results", "departments", "agents"]) {
    const nested = value[key];

    if (Array.isArray(nested)) {
      return nested;
    }

    if (isRecord(nested)) {
      const nestedArray = extractArray(nested);

      if (nestedArray.length > 0) {
        return nestedArray;
      }
    }
  }

  return [];
}

async function getWithRawAuthorization(
  url: string,
  apiToken: string,
  params?: Record<string, string | number>
): Promise<unknown> {
  try {
    const response = await axios.get(url, {
      timeout: 15_000,
      params,
      headers: {
        Authorization: apiToken,
        Accept: "application/json"
      }
    });

    return response.data;
  } catch (error) {
    const maybeAxiosError = error as { response?: { status?: number } };

    if (
      maybeAxiosError.response?.status !== 401 &&
      maybeAxiosError.response?.status !== 403
    ) {
      throw error;
    }

    const response = await axios.get(url, {
      timeout: 15_000,
      params,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json"
      }
    });

    return response.data;
  }
}

async function postWithRawAuthorization(
  url: string,
  apiToken: string,
  body: unknown
): Promise<unknown> {
  try {
    const response = await axios.post(url, body, {
      timeout: 60_000,
      headers: {
        Authorization: apiToken,
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return response.data;
  } catch (error) {
    const maybeAxiosError = error as { response?: { status?: number } };

    if (
      maybeAxiosError.response?.status !== 401 &&
      maybeAxiosError.response?.status !== 403
    ) {
      throw error;
    }

    const response = await axios.post(url, body, {
      timeout: 60_000,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    return response.data;
  }
}

export async function listFlwDepartments(
  apiToken: string
): Promise<FlwDepartment[]> {
  const response = await axios.get(departmentsUrl, {
    timeout: 15_000,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json"
    }
  });
  const entries = extractArray(response.data);

  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const id = readString(entry, ["id", "departmentId", "uuid"]);
    const name = readString(entry, ["name", "title", "description"]) ?? id;

    if (!id || !name) {
      return [];
    }

    return [{ id, name }];
  });
}

export async function listFlwAgents(apiToken: string): Promise<FlwAgent[]> {
  const cached = agentsCache.get(apiToken);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.agents;
  }

  const data = await getWithRawAuthorization(agentsUrl, apiToken);
  const entries = extractArray(data);
  const agents = entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const agentId = readString(entry, ["id", "agentId", "uuid"]);
    const id = readString(entry, ["userId", "user_id"]) ?? agentId;
    const name =
      readString(entry, [
        "name",
        "fullName",
        "displayName",
        "userName",
        "email"
      ]) ?? id;
    const email = readString(entry, ["email", "mail"]);

    if (!id || !name) {
      return [];
    }

    return [{ id, agentId, name, email }];
  });

  agentsCache.set(apiToken, {
    expiresAt: now + 60_000,
    agents
  });

  return agents;
}

export async function listFlwSessionMessages(input: {
  apiToken: string;
  sessionId: string;
  pageSize?: number;
  pageNumber?: number;
}): Promise<FlwSessionMessage[]> {
  const url = `https://api.wts.chat/chat/v1/session/${encodeURIComponent(
    input.sessionId
  )}/message`;
  const data = await getWithRawAuthorization(url, input.apiToken, {
    PageNumber: input.pageNumber ?? 1,
    PageSize: input.pageSize ?? 30,
    OrderBy: "createdAt",
    OrderDirection: "DESCENDING"
  });
  const entries = extractArray(data);

  return entries.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const id = readString(entry, ["id", "messageId", "uuid"]);
    const createdAt =
      readString(entry, ["createdAt", "timestamp", "sentAt"]) ?? null;

    if (!id || !createdAt) {
      return [];
    }

    return [{
      id,
      createdAt,
      type: readString(entry, ["type"]),
      userId: readString(entry, ["userId", "user_id"]),
      direction: readString(entry, ["direction"]),
      origin: readString(entry, ["origin"]),
      text:
        readString(entry, ["text", "body", "message", "content"]) ??
        (readNumber(entry, ["fileId"]) ? "[arquivo]" : null)
    }];
  });
}

export async function listAllFlwSessionMessages(input: {
  apiToken: string;
  sessionId: string;
  maxPages?: number;
}): Promise<FlwSessionMessage[]> {
  const allMessages: FlwSessionMessage[] = [];
  const pageSize = 100;
  const maxPages = input.maxPages ?? 10;

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const url = `https://api.wts.chat/chat/v1/session/${encodeURIComponent(
      input.sessionId
    )}/message`;
    const data = await getWithRawAuthorization(url, input.apiToken, {
      PageNumber: pageNumber,
      PageSize: pageSize,
      OrderBy: "createdAt",
      OrderDirection: "DESCENDING"
    });
    const messages = extractArray(data).flatMap((entry) => {
      if (!isRecord(entry)) {
        return [];
      }

      const id = readString(entry, ["id", "messageId", "uuid"]);
      const createdAt =
        readString(entry, ["createdAt", "timestamp", "sentAt"]) ?? null;

      if (!id || !createdAt) {
        return [];
      }

      return [{
        id,
        createdAt,
        type: readString(entry, ["type"]),
        userId: readString(entry, ["userId", "user_id"]),
        direction: readString(entry, ["direction"]),
        origin: readString(entry, ["origin"]),
        text:
          readString(entry, ["text", "body", "message", "content"]) ??
          (readNumber(entry, ["fileId"]) ? "[arquivo]" : null)
      }];
    });

    allMessages.push(...messages);

    const hasMorePages = isRecord(data)
      ? readBoolean(data, ["hasMorePages", "has_more_pages"])
      : false;

    if (!hasMorePages || messages.length === 0) {
      break;
    }
  }

  return allMessages.sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export async function saveFlwInternalNote(input: {
  apiToken: string;
  sessionId: string;
  text: string;
}): Promise<void> {
  const url = `https://api.wts.chat/chat/v1/session/${encodeURIComponent(
    input.sessionId
  )}/note`;

  await postWithRawAuthorization(url, input.apiToken, {
    text: input.text,
    filesUrls: null,
    filesIds: null
  });
}
