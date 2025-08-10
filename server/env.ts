// server/env.ts
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Environment variable schema for validation
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("5000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  SESSION_SECRET,
  CORS_ORIGIN,
  LOG_LEVEL,
} = env;

export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_DEVELOPMENT = NODE_ENV === "development";
