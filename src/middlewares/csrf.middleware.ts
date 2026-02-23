import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE_SAME_SITE, AUTH_TRANSPORT_MODE, IS_PRODUCTION } from "../config/constants";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

const isCookieTransport = AUTH_TRANSPORT_MODE === "cookie";

const csrfCookieOptions = {
  httpOnly: false,
  secure: IS_PRODUCTION,
  sameSite: AUTH_COOKIE_SAME_SITE,
  domain: env.COOKIE_DOMAIN,
  path: "/",
} as const;

export const issueCsrfToken = (res: Response): string => {
  if (!isCookieTransport) {
    return "";
  }

  const csrfToken = randomUUID();
  res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);
  return csrfToken;
};

export const clearCsrfToken = (res: Response): void => {
  if (!isCookieTransport) {
    return;
  }

  res.clearCookie(env.CSRF_COOKIE_NAME, csrfCookieOptions);
};

export const csrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (!isCookieTransport) {
    return next();
  }

  const csrfFromCookie = req.cookies?.[env.CSRF_COOKIE_NAME] as string | undefined;
  const csrfFromHeader = req.header(env.CSRF_HEADER_NAME);

  if (!csrfFromCookie || !csrfFromHeader || csrfFromCookie !== csrfFromHeader) {
    throw new AppError("Invalid CSRF token", 403);
  }

  next();
};
