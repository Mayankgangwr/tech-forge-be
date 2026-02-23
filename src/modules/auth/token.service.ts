import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/appError";
import { TokenPayload } from "./auth.types";

const signToken = (payload: TokenPayload, secret: string, expiresIn: string): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, options);
};

const isTokenPayload = (value: unknown): value is TokenPayload & JwtPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<TokenPayload & JwtPayload>;

  if (typeof candidate.sub !== "string" || typeof candidate.role !== "string" || typeof candidate.type !== "string") {
    return false;
  }

  if (candidate.type !== "access" && candidate.type !== "refresh") {
    return false;
  }

  if (candidate.type === "refresh" && typeof candidate.jti !== "string") {
    return false;
  }

  return true;
};

const verifyToken = (token: string, secret: string): TokenPayload & JwtPayload => {
  try {
    const decoded = jwt.verify(token, secret);

    if (!isTokenPayload(decoded)) {
      throw new AppError("Invalid token payload", 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired token", 401);
  }
};

export const signAccessToken = (payload: Omit<TokenPayload, "type" | "jti">): string => {
  return signToken({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, env.ACCESS_TOKEN_TTL);
};

export const signRefreshToken = (payload: Omit<TokenPayload, "type"> & { jti: string }): string => {
  return signToken({ ...payload, type: "refresh" }, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_TTL);
};

export const verifyAccessToken = (token: string): TokenPayload & JwtPayload => {
  const payload = verifyToken(token, env.JWT_ACCESS_SECRET);

  if (payload.type !== "access") {
    throw new AppError("Invalid token type", 401);
  }

  return payload;
};

export const verifyRefreshToken = (token: string): TokenPayload & JwtPayload => {
  const payload = verifyToken(token, env.JWT_REFRESH_SECRET);

  if (payload.type !== "refresh") {
    throw new AppError("Invalid token type", 401);
  }

  return payload;
};

