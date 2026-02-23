import { Request, Response } from "express";
import {
  ACCESS_TOKEN_MAX_AGE,
  AUTH_COOKIE_NAMES,
  IS_PRODUCTION,
  REFRESH_TOKEN_MAX_AGE,
} from "../../config/constants";
import { env } from "../../config/env";
import { AppError } from "../../utils/appError";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authService from "./auth.service";

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? ("none" as const) : ("lax" as const),
  maxAge,
  domain: env.COOKIE_DOMAIN,
  path: "/",
});

const clearCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? ("none" as const) : ("lax" as const),
  domain: env.COOKIE_DOMAIN,
  path: "/",
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie(AUTH_COOKIE_NAMES.accessToken, accessToken, cookieOptions(ACCESS_TOKEN_MAX_AGE));
  res.cookie(AUTH_COOKIE_NAMES.refreshToken, refreshToken, cookieOptions(REFRESH_TOKEN_MAX_AGE));
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAMES.accessToken, clearCookieOptions);
  res.clearCookie(AUTH_COOKIE_NAMES.refreshToken, clearCookieOptions);
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, req.headers as Record<string, unknown>, req.ip);

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  return sendSuccess(res, 201, "Registration successful", {
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, req.headers as Record<string, unknown>, req.ip);

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  return sendSuccess(res, 200, "Login successful", {
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[AUTH_COOKIE_NAMES.refreshToken] as string | undefined;

  if (!refreshToken) {
    clearAuthCookies(res);
    throw new AppError("Refresh token is required", 401);
  }

  const result = await authService.refresh(refreshToken, req.headers as Record<string, unknown>, req.ip);

  setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

  return sendSuccess(res, 200, "Token refreshed", {
    user: result.user,
    accessToken: result.tokens.accessToken,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[AUTH_COOKIE_NAMES.refreshToken] as string | undefined;

  await authService.logout(refreshToken);
  clearAuthCookies(res);

  return sendSuccess(res, 200, "Logged out", { loggedOut: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id);
  return sendSuccess(res, 200, "Current user fetched", { user });
});
