export type WebhookEventType =
  | "SESSION_UPDATE"
  | "MESSAGE_RECEIVED"
  | "MESSAGE_SENT"
  | "SESSION_COMPLETE";

export type WebhookPayload = Record<string, unknown>;

export type NormalizedWebhookEvent = {
  eventType: WebhookEventType | string;
  sessionId: string | null;
  companyId: string | null;
  departmentId: string | null;
  userId: string | null;
  property: string | null;
  oldValue: string | null;
  newValue: string | null;
  origin: string | null;
  raw: WebhookPayload;
};
