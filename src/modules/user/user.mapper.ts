import mongoose from "mongoose";
import { SafeUserDTO, UserRole } from "./user.types";

interface UserLike {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date | null;
}

export const toSafeUserDTO = (user: UserLike): SafeUserDTO => {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
};

