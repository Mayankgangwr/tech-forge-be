import { Model, Schema, model } from "mongoose";
import { UserRole } from "./user.types";
import { USER_ROLES } from "./roles";

export interface IUser {
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserModel = Model<IUser>;

const userSchema = new Schema<IUser, UserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: UserRole.USER,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
export const User = model<IUser, UserModel>("User", userSchema);
