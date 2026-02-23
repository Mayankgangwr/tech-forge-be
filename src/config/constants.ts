import { env } from "./env";

const durationUnitToMs: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const durationPattern = /^(\d+)(ms|s|m|h|d)$/;

const parseDurationToMs = (duration: string, fallback: number): number => {
  const trimmed = duration.trim();
  const match = durationPattern.exec(trimmed);

  if (!match) {
    return fallback;
  }

  const value = Number(match[1]);
  const unit = match[2];

  return value * durationUnitToMs[unit];
};

export const AUTH_COOKIE_NAMES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
} as const;

export const ACCESS_TOKEN_MAX_AGE = parseDurationToMs(env.ACCESS_TOKEN_TTL, 15 * 60 * 1000);
export const REFRESH_TOKEN_MAX_AGE = parseDurationToMs(env.REFRESH_TOKEN_TTL, 7 * 24 * 60 * 60 * 1000);

export const IS_PRODUCTION = env.NODE_ENV === "production";
export const AUTH_TRANSPORT_MODE = env.AUTH_TRANSPORT_MODE;
export const AUTH_COOKIE_SAME_SITE = env.AUTH_COOKIE_SAME_SITE;
