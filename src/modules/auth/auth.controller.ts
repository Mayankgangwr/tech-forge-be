import { Request, Response } from "express";
import { AUTH_COOKIE_NAMES } from "../../config/constants";
import { clearCsrfToken, issueCsrfToken } from "../../middlewares/csrf.middleware";
import { AppError } from "../../utils/appError";
import { sendSuccess } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { SessionContext } from "./auth.types";
import * as authService from "./auth.service";
import {
  authPayloadForResponse,
  clearAuthTransport,
  isCookieTransport,
  setAuthTransport,
} from "./auth.transport";

const sessionContextFromRequest = (req: Request): SessionContext => {
  return {
    ip: req.ip,
    userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
    requestId: req.requestId,
  };
};

const getBearerToken = (authorization?: string): string | undefined => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice(7);
};

const resolveRefreshToken = (req: Request): string | undefined => {
  if (isCookieTransport()) {
    return req.cookies?.[AUTH_COOKIE_NAMES.refreshToken] as string | undefined;
  }

  const refreshTokenFromBody = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
  const refreshTokenFromHeader = getBearerToken(req.headers.authorization);
  return refreshTokenFromBody ?? refreshTokenFromHeader;
};

export const csrfToken = asyncHandler(async (_req: Request, res: Response) => {
  if (!isCookieTransport()) {
    return sendSuccess(res, 200, "CSRF protection not required in bearer mode", { csrfToken: null });
  }

  const token = issueCsrfToken(res);
  return sendSuccess(res, 200, "CSRF token issued", { csrfToken: token });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, sessionContextFromRequest(req));

  setAuthTransport(res, result.tokens);
  issueCsrfToken(res);

  return sendSuccess(res, 201, "Registration successful", authPayloadForResponse(result));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, sessionContextFromRequest(req));

  setAuthTransport(res, result.tokens);
  issueCsrfToken(res);

  return sendSuccess(res, 200, "Login successful", authPayloadForResponse(result));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = resolveRefreshToken(req);

  if (!refreshToken) {
    clearAuthTransport(res);
    throw new AppError(
      "Refresh token is required. Provide it via cookie (cookie mode) or body/Authorization header (bearer mode).",
      400
    );
  }

  const result = await authService.refresh(refreshToken, sessionContextFromRequest(req));

  setAuthTransport(res, result.tokens);
  issueCsrfToken(res);

  return sendSuccess(res, 200, "Token refreshed", authPayloadForResponse(result));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = resolveRefreshToken(req);

  await authService.logout(refreshToken, sessionContextFromRequest(req));
  clearAuthTransport(res);
  clearCsrfToken(res);

  return sendSuccess(res, 200, "Logged out", { loggedOut: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id);
  return sendSuccess(res, 200, "Current user fetched", { user });
});
