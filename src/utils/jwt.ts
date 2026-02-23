import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./appError";
import { AuthTokenPayload } from "../modules/auth/auth.types";

const signToken = (payload: AuthTokenPayload, secret: string, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: string): AuthTokenPayload & JwtPayload => {
  try {
    return jwt.verify(token, secret) as AuthTokenPayload & JwtPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};

export const signAccessToken = (payload: AuthTokenPayload): string => {
  return signToken(payload, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL);
};

export const signRefreshToken = (payload: AuthTokenPayload): string => {
  return signToken(payload, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_TTL);
};

export const verifyAccessToken = (token: string): AuthTokenPayload & JwtPayload => {
  return verifyToken(token, env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string): AuthTokenPayload & JwtPayload => {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
};
