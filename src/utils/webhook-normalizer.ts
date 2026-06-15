import type {
  NormalizedWebhookEvent,
  WebhookPayload
} from "../types/webhook.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(records: UnknownRecord[], keys: string[]): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }

      if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
      }
    }
  }

  return null;
}

function firstChange(changeMetadata: unknown): UnknownRecord {
  if (!isRecord(changeMetadata) || !Array.isArray(changeMetadata.changes)) {
    return {};
  }

  const [change] = changeMetadata.changes;
  return isRecord(change) ? change : {};
}

export function normalizeWebhookPayload(
  payload: WebhookPayload
): NormalizedWebhookEvent {
  const envelopeBody = isRecord(payload.body) ? payload.body : null;
  const root = envelopeBody ?? payload;
  const data = isRecord(root.data) ? root.data : {};
  const payloadNode = isRecord(root.payload) ? root.payload : {};
  const content = isRecord(root.content) ? root.content : {};
  const change = firstChange(root.changeMetadata);
  const records = [content, change, data, payloadNode, root, payload];
  const rawEventType =
    readString([root, payload], ["event", "eventType", "type"])?.toUpperCase() ??
    "UNKNOWN";
  const userId = readString(records, ["user_id", "userId", "UserId"]);
  const eventType =
    rawEventType === "MESSAGE_UPDATED"
      ? userId
        ? "MESSAGE_SENT"
        : "MESSAGE_RECEIVED"
      : rawEventType;
  const origin =
    readString(records, ["origin", "Origin"])?.toUpperCase() ??
    (rawEventType === "MESSAGE_UPDATED" && userId ? "DEFAULT" : null);

  return {
    eventType,
    sessionId: readString(records, ["session_id", "sessionId", "SessionId", "id"]),
    companyId: readString(records, ["company_id", "companyId", "CompanyId"]),
    departmentId: readString(records, [
      "department_id",
      "departmentId",
      "DepartmentId"
    ]),
    userId,
    property: readString(records, ["property", "Property"]),
    oldValue:
      readString(records, ["old_value", "oldValue", "previousValue", "from"])
        ?.toUpperCase() ?? null,
    newValue:
      readString(records, ["new_value", "newValue", "currentValue", "value", "to"])
        ?.toUpperCase() ?? null,
    origin,
    raw: payload
  };
}
