import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let commandClient: RedisClientType | null = null;
let subscriberClient: RedisClientType | null = null;

function createRedisClient(): RedisClientType {
  const client = createClient({
    url: env.redisUrl
  });

  client.on("error", (error) => {
    logger.error({ err: error }, "redis client error");
  });

  return client as RedisClientType;
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (!commandClient) {
    commandClient = createRedisClient();
    await commandClient.connect();
  }

  return commandClient;
}

export async function getRedisSubscriber(): Promise<RedisClientType> {
  if (!subscriberClient) {
    subscriberClient = createRedisClient();
    await subscriberClient.connect();
  }

  return subscriberClient;
}

export async function closeRedisConnections(): Promise<void> {
  await Promise.allSettled([
    commandClient?.quit(),
    subscriberClient?.quit()
  ]);

  commandClient = null;
  subscriberClient = null;
}
