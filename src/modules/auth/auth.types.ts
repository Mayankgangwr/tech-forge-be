import { UserRole } from "../user/user.types";
import { SafeUserDTO } from "../user/user.types";

export type AuthTokenType = "access" | "refresh";

export interface TokenPayload {
  sub: string;
  role: UserRole;
  type: AuthTokenType;
  jti?: string;
}

export interface SessionContext {
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuthResult {
  user: SafeUserDTO;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

// Backward-compatible alias for existing imports.
export type AuthTokenPayload = TokenPayload;
