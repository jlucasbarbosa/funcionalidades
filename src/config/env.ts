import dotenv from "dotenv";

dotenv.config();

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "WTS_TRANSFER_SESSION_URL"
] as const;

export const missingRequiredEnv = required.filter((key) => !process.env[key]);
export const hasRequiredEnv = missingRequiredEnv.length === 0;

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: intEnv("PORT", 3000),
  host: process.env.HOST ?? "0.0.0.0",
  logLevel: process.env.LOG_LEVEL ?? "info",
  supabaseUrl: process.env.SUPABASE_URL ?? "https://missing.supabase.co",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "missing-service-role-key",
  wtsTransferSessionUrl:
    process.env.WTS_TRANSFER_SESSION_URL ??
    "https://api.wts.chat/chat/v1/session/{id}/transfer",
  wtsApiToken: process.env.WTS_API_TOKEN,
  wtsTimeoutMs: intEnv("WTS_TIMEOUT_MS", 10_000),
  sessionTimeoutMinutes: intEnv("SESSION_TIMEOUT_MINUTES", 15),
  workerCron: process.env.WORKER_CRON ?? "*/60 * * * * *",
  redisEnabled: process.env.REDIS_ENABLED === "true",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.5"
} as const;
