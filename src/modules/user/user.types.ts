import { UserRole } from "./roles";

export { UserRole };

export interface SafeUserDTO {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date | null;
}

export type SerializedUser = SafeUserDTO;
