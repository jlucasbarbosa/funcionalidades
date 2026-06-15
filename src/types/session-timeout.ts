export const SESSION_STATUSES = {
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_SELLER: "WAITING_SELLER",
  SELLER_RESPONDED: "SELLER_RESPONDED",
  CLOSED: "CLOSED",
  RETURNED_TO_QUEUE: "RETURNED_TO_QUEUE"
} as const;

export type SessionStatus =
  (typeof SESSION_STATUSES)[keyof typeof SESSION_STATUSES];

export type SessionTimeoutRow = {
  session_id: string;
  company_id: string | null;
  department_id: string | null;
  user_id: string | null;
  status: SessionStatus | string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SessionTimeoutUpsert = {
  session_id: string;
  company_id?: string | null;
  department_id?: string | null;
  user_id?: string | null;
  status: SessionStatus;
  expires_at?: string | null;
};
