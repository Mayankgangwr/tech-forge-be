import { UserRole } from "../user/user.types";

export type AuthTokenType = "access" | "refresh";

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
  type: AuthTokenType;
  jti?: string;
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
