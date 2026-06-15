import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  name: "ceci-funcionalidades",
  level: env.logLevel,
  base: {
    service: "ceci-funcionalidades",
    env: env.nodeEnv
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "config.headers.Authorization",
      "headers.Authorization"
    ],
    remove: true
  }
});
