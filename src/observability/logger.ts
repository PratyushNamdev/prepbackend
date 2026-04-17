import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: ["req.headers.authorization", "*.password", "*.token", "*.apiKey", "GROQ_API_KEY"],
    censor: "[redacted]"
  },
  base: {
    service: "prepos-api"
  }
});
