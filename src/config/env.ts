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
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  AUTH_RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
  AUTH_LOGIN_LIMIT_POINTS: z.coerce.number().int().positive().default(10),
  AUTH_LOGIN_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
  AUTH_LOGIN_LIMIT_BLOCK_DURATION: z.coerce.number().int().nonnegative().default(300),
});

export const env = envSchema.parse(process.env);
