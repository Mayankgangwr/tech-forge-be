import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { env } from "../config/env";
import { sendError } from "../utils/apiResponse";

interface RateLimiterOptions {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
}

export const createRateLimiter = ({
  keyPrefix,
  points,
  duration,
  blockDuration,
}: RateLimiterOptions) => {
  const limiter = new RateLimiterMemory({
    keyPrefix,
    points,
    duration,
    blockDuration,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await limiter.consume(req.ip || "unknown");
      next();
    } catch {
      return sendError(res, 429, "Too many requests");
    }
  };
};

export const authRateLimiter = createRateLimiter({
  keyPrefix: "auth_general",
  points: env.AUTH_RATE_LIMIT_POINTS,
  duration: env.AUTH_RATE_LIMIT_DURATION,
});

export const authLoginRateLimiter = createRateLimiter({
  keyPrefix: "auth_login",
  points: env.AUTH_LOGIN_LIMIT_POINTS,
  duration: env.AUTH_LOGIN_LIMIT_DURATION,
  blockDuration: env.AUTH_LOGIN_LIMIT_BLOCK_DURATION,
});
