import { logger } from "../config/logger.js";
import { getRedisClient } from "../lib/redis.js";

const timerPrefix = "ceci:timer";

export type ExpiredTimerKey = {
  clientId: string;
  sessionId: string;
};

export function buildTimerKey(clientId: string, sessionId: string): string {
  return `${timerPrefix}:${clientId}:${sessionId}`;
}

export function parseTimerKey(key: string): ExpiredTimerKey | null {
  const parts = key.split(":");

  if (parts.length !== 4 || parts[0] !== "ceci" || parts[1] !== "timer") {
    return null;
  }

  return {
    clientId: parts[2]!,
    sessionId: parts[3]!
  };
}

export async function startSessionTimer(input: {
  clientId: string;
  sessionId: string;
  ttlSeconds: number;
}): Promise<void> {
  const redis = await getRedisClient();
  const key = buildTimerKey(input.clientId, input.sessionId);

  await redis.set(
    key,
    JSON.stringify({
      clientId: input.clientId,
      sessionId: input.sessionId,
      ttlSeconds: input.ttlSeconds,
      startedAt: new Date().toISOString()
    }),
    {
      EX: input.ttlSeconds
    }
  );

  logger.info(
    { sessionId: input.sessionId, clientId: input.clientId, ttlSeconds: input.ttlSeconds },
    "redis session timer started"
  );
}

export async function stopSessionTimer(input: {
  clientId: string;
  sessionId: string;
}): Promise<void> {
  const redis = await getRedisClient();
  const key = buildTimerKey(input.clientId, input.sessionId);

  await redis.del(key);

  logger.info(
    { sessionId: input.sessionId, clientId: input.clientId },
    "redis session timer stopped"
  );
}

export async function getSessionTimerTtlSeconds(input: {
  clientId: string;
  sessionId: string;
}): Promise<number | null> {
  const redis = await getRedisClient();
  const key = buildTimerKey(input.clientId, input.sessionId);
  const ttl = await redis.ttl(key);

  if (ttl <= 0) {
    return null;
  }

  return ttl;
}
