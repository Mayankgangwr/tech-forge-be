import { Model, Schema, Types, model } from "mongoose";

export interface IUserProfile {
  user: Types.ObjectId;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserProfileModel = Model<IUserProfile>;

const userProfileSchema = new Schema<IUserProfile, UserProfileModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      trim: true,
      default: "UTC",
    },
    locale: {
      type: String,
      trim: true,
      default: "en-US",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
export const UserProfile = model<IUserProfile, UserProfileModel>("UserProfile", userProfileSchema);
