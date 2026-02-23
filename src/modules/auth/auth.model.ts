import { Model, Schema, Types, model } from "mongoose";

export interface IRefreshSession {
  user: Types.ObjectId;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  revokedReason?: string;
  replacedByToken?: string;
  userAgent?: string;
  ip?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type RefreshSessionModel = Model<IRefreshSession>;

const refreshSessionSchema = new Schema<IRefreshSession, RefreshSessionModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    revokedReason: {
      type: String,
      trim: true,
    },
    replacedByToken: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ip: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

refreshSessionSchema.index({ user: 1, revokedAt: 1 });
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession = model<IRefreshSession, RefreshSessionModel>("RefreshSession", refreshSessionSchema);
