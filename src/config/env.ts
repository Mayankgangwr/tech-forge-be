import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  COOKIE_DOMAIN: z.string().optional(),
  AUTH_TRANSPORT_MODE: z.enum(["cookie", "bearer"]).default("cookie"),
  AUTH_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  AUTH_MAX_ACTIVE_SESSIONS: z.coerce.number().int().min(1).max(20).default(5),
  CSRF_COOKIE_NAME: z.string().default("csrf_token"),
  CSRF_HEADER_NAME: z.string().default("x-csrf-token"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  AUTH_RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
  AUTH_LOGIN_LIMIT_POINTS: z.coerce.number().int().positive().default(10),
  AUTH_LOGIN_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
  AUTH_LOGIN_LIMIT_BLOCK_DURATION: z.coerce.number().int().nonnegative().default(300),
  AUTH_LOGIN_DELAY_AFTER_FAILURES: z.coerce.number().int().nonnegative().default(3),
  AUTH_LOGIN_DELAY_MS: z.coerce.number().int().nonnegative().default(250),
  AUTH_LOGIN_LOCK_AFTER_FAILURES: z.coerce.number().int().positive().default(7),
  AUTH_LOGIN_LOCK_FOR_SECONDS: z.coerce.number().int().positive().default(300),
  AUTH_LOGIN_ATTEMPT_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
});

const parsedEnv = envSchema.parse(process.env);

if (
  parsedEnv.AUTH_TRANSPORT_MODE === "cookie" &&
  parsedEnv.AUTH_COOKIE_SAME_SITE === "none" &&
  parsedEnv.NODE_ENV !== "production"
) {
  throw new Error(
    "Invalid auth cookie config: AUTH_COOKIE_SAME_SITE=none requires production secure cookies."
  );
}

export const env = parsedEnv;
