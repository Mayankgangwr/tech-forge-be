import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { RegisterInput, LoginInput } from "./auth.types";
import { User } from "../user/user.model";
import { UserProfile } from "../user/userProfile.model";
import { SerializedUser } from "../user/user.types";
import { AppError } from "../../utils/appError";
import { compareHash, hashValue } from "../../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { RefreshSession } from "./auth.model";
import { REFRESH_TOKEN_MAX_AGE } from "../../config/constants";

interface SessionMetadata {
  ip?: string;
  userAgent?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const serializeUser = (user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date | null;
}): SerializedUser => {
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

const issueTokenPair = (user: { _id: mongoose.Types.ObjectId; role: "USER" | "ADMIN" }) => {
  const userId = user._id.toString();
  const refreshJti = randomUUID();

  const accessToken = signAccessToken({
    sub: userId,
    role: user.role,
    type: "access",
  });

  const refreshToken = signRefreshToken({
    sub: userId,
    role: user.role,
    type: "refresh",
    jti: refreshJti,
  });

  return {
    accessToken,
    refreshToken,
    refreshJti,
  };
};

const createRefreshSession = async (
  userId: mongoose.Types.ObjectId,
  refreshToken: string,
  jti: string,
  metadata: SessionMetadata
): Promise<void> => {
  const tokenHash = await hashValue(refreshToken);

  await RefreshSession.create({
    user: userId,
    jti,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  });
};

const getSessionMetadata = (headers: { [key: string]: unknown }, ip?: string): SessionMetadata => {
  return {
    ip,
    userAgent: typeof headers["user-agent"] === "string" ? headers["user-agent"] : undefined,
  };
};

export const register = async (
  payload: RegisterInput,
  headers: { [key: string]: unknown },
  ip?: string
): Promise<{ user: SerializedUser; tokens: TokenPair }> => {
  const existingUser = await User.exists({ email: payload.email });
  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await hashValue(payload.password);

  const dbSession = await mongoose.startSession();
  let createdUserId: mongoose.Types.ObjectId | null = null;

  try {
    await dbSession.withTransaction(async () => {
      const users = await User.create(
        [
          {
            email: payload.email,
            password: passwordHash,
            role: "USER",
          },
        ],
        { session: dbSession }
      );

      const createdUser = users[0];
      createdUserId = createdUser._id;

      await UserProfile.create(
        [
          {
            user: createdUser._id,
            firstName: payload.firstName,
            lastName: payload.lastName,
          },
        ],
        { session: dbSession }
      );
    });
  } finally {
    await dbSession.endSession();
  }

  if (!createdUserId) {
    throw new AppError("Unable to create user", 500);
  }

  const user = await User.findById(createdUserId);
  if (!user) {
    throw new AppError("User not found after registration", 500);
  }

  const { accessToken, refreshToken, refreshJti } = issueTokenPair(user);
  await createRefreshSession(user._id, refreshToken, refreshJti, getSessionMetadata(headers, ip));

  return {
    user: serializeUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const login = async (
  payload: LoginInput,
  headers: { [key: string]: unknown },
  ip?: string
): Promise<{ user: SerializedUser; tokens: TokenPair }> => {
  const user = await User.findOne({ email: payload.email }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isValidPassword = await compareHash(payload.password, user.password);
  if (!isValidPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken, refreshJti } = issueTokenPair(user);
  await createRefreshSession(user._id, refreshToken, refreshJti, getSessionMetadata(headers, ip));

  return {
    user: serializeUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const refresh = async (
  refreshToken: string,
  headers: { [key: string]: unknown },
  ip?: string
): Promise<{ user: SerializedUser; tokens: TokenPair }> => {
  const payload = verifyRefreshToken(refreshToken);

  if (payload.type !== "refresh" || !payload.jti) {
    throw new AppError("Invalid refresh token", 401);
  }

  const session = await RefreshSession.findOne({
    jti: payload.jti,
    user: new mongoose.Types.ObjectId(payload.sub),
    revokedAt: null,
  }).select("+tokenHash");

  if (!session) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    session.revokedAt = new Date();
    session.revokedReason = "expired";
    await session.save();
    throw new AppError("Refresh token expired", 401);
  }

  const isMatchingToken = await compareHash(refreshToken, session.tokenHash);
  if (!isMatchingToken) {
    session.revokedAt = new Date();
    session.revokedReason = "token_mismatch";
    await session.save();
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError("User not available", 401);
  }

  const { accessToken, refreshToken: rotatedRefreshToken, refreshJti } = issueTokenPair(user);

  session.revokedAt = new Date();
  session.revokedReason = "rotated";
  session.replacedByToken = refreshJti;
  await session.save();

  await createRefreshSession(user._id, rotatedRefreshToken, refreshJti, getSessionMetadata(headers, ip));

  return {
    user: serializeUser(user),
    tokens: {
      accessToken,
      refreshToken: rotatedRefreshToken,
    },
  };
};

export const logout = async (refreshToken?: string): Promise<void> => {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    if (payload.type !== "refresh" || !payload.jti) {
      return;
    }

    await RefreshSession.updateOne(
      {
        jti: payload.jti,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: "logout",
        },
      }
    );
  } catch {
    // Ignore invalid refresh token during logout, client cookies are still cleared.
  }
};

export const me = async (userId: string): Promise<SerializedUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  return serializeUser(user);
};
