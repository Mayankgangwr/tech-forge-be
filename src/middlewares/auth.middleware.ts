import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/appError";
import { UserRole } from "../modules/user/user.types";
import { AUTH_COOKIE_NAMES } from "../config/constants";

const getBearerToken = (authorization?: string): string | null => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7);
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const tokenFromHeader = getBearerToken(req.headers.authorization);
  const tokenFromCookie = req.cookies?.[AUTH_COOKIE_NAMES.accessToken] as string | undefined;
  const token = tokenFromHeader ?? tokenFromCookie;

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  const payload = verifyAccessToken(token);

  if (payload.type !== "access") {
    throw new AppError("Invalid token type", 401);
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
  };

  next();
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  };
};
