export type ClientConfig = {
  id: string;
  name: string;
  webhookToken: string;
  ceciCompanyId: string | null;
  timeoutMinutes: number;
  transferWindowStart: string | null;
  transferWindowEnd: string | null;
  transferDepartmentId: string | null;
  transferDepartmentName: string | null;
  wtsTransferSessionUrl: string | null;
  wtsApiToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientConfigInput = {
  name: string;
  ceciCompanyId?: string | null;
  timeoutMinutes?: number | null;
  transferWindowStart?: string | null;
  transferWindowEnd?: string | null;
  transferDepartmentId?: string | null;
  transferDepartmentName?: string | null;
  wtsTransferSessionUrl?: string | null;
  wtsApiToken?: string | null;
};

export type ClientConfigState = {
  activeClientId: string | null;
  publicBaseUrl: string | null;
  clients: ClientConfig[];
};
