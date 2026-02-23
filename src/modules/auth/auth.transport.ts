import { Response } from "express";
import {
  ACCESS_TOKEN_MAX_AGE,
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_SAME_SITE,
  AUTH_TRANSPORT_MODE,
  IS_PRODUCTION,
  REFRESH_TOKEN_MAX_AGE,
} from "../../config/constants";
import { env } from "../../config/env";
import { AuthResult } from "./auth.types";

type AuthCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  maxAge?: number;
  domain?: string;
  path: string;
};

const baseCookieOptions: Omit<AuthCookieOptions, "maxAge"> = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: AUTH_COOKIE_SAME_SITE,
  domain: env.COOKIE_DOMAIN,
  path: "/",
};

const cookieOptions = (maxAge: number): AuthCookieOptions => ({
  ...baseCookieOptions,
  maxAge,
});

export const isCookieTransport = (): boolean => AUTH_TRANSPORT_MODE === "cookie";

export const setAuthTransport = (res: Response, tokens: AuthResult["tokens"]): void => {
  if (!isCookieTransport()) {
    return;
  }

  res.cookie(AUTH_COOKIE_NAMES.accessToken, tokens.accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
};

export const clearAuthTransport = (res: Response): void => {
  if (!isCookieTransport()) {
    return;
  }

  res.clearCookie(AUTH_COOKIE_NAMES.accessToken, baseCookieOptions);
  res.clearCookie(AUTH_COOKIE_NAMES.refreshToken, baseCookieOptions);
};

export const authPayloadForResponse = (result: AuthResult) => {
  if (isCookieTransport()) {
    return {
      user: result.user,
    };
  }

  return {
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  };
};

