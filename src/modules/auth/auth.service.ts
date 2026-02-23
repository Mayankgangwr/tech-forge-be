import mongoose from "mongoose";
import { randomUUID } from "crypto";
import logger from "../../config/logger";
import { REFRESH_TOKEN_MAX_AGE } from "../../config/constants";
import { AppError } from "../../utils/appError";
import { compareHash, hashValue } from "../../utils/hash";
import { User } from "../user/user.model";
import { UserProfile } from "../user/userProfile.model";
import { toSafeUserDTO } from "../user/user.mapper";
import { UserRole } from "../user/user.types";
import { AuthResult, LoginInput, RegisterInput, SessionContext } from "./auth.types";
import * as sessionService from "./session.service";
import * as tokenService from "./token.service";

const refreshExpiresAt = (): Date => new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);

const issueTokenPair = (user: { _id: mongoose.Types.ObjectId; role: UserRole }) => {
  const userId = user._id.toString();
  const refreshJti = randomUUID();

  const accessToken = tokenService.signAccessToken({
    sub: userId,
    role: user.role,
  });

  const refreshToken = tokenService.signRefreshToken({
    sub: userId,
    role: user.role,
    jti: refreshJti,
  });

  return { accessToken, refreshToken, refreshJti };
};

export const register = async (payload: RegisterInput, context?: SessionContext): Promise<AuthResult> => {
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
            role: UserRole.USER,
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

  await sessionService.createSession({
    userId: user._id,
    refreshToken,
    jti: refreshJti,
    expiresAt: refreshExpiresAt(),
    context,
  });

  return {
    user: toSafeUserDTO(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const login = async (payload: LoginInput, context?: SessionContext): Promise<AuthResult> => {
  const user = await User.findOne({ email: payload.email }).select("+password");

  if (!user) {
    logger.warn("auth_login_failure", {
      requestId: context?.requestId,
      email: payload.email,
      reason: "user_not_found",
      ip: context?.ip,
    });
    throw new AppError("Invalid credentials", 401);
  }

  const isValidPassword = await compareHash(payload.password, user.password);
  if (!isValidPassword) {
    logger.warn("auth_login_failure", {
      requestId: context?.requestId,
      userId: user._id.toString(),
      reason: "invalid_password",
      ip: context?.ip,
    });
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.isActive) {
    logger.warn("auth_login_failure", {
      requestId: context?.requestId,
      userId: user._id.toString(),
      reason: "inactive_account",
      ip: context?.ip,
    });
    throw new AppError("Account is inactive", 403);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken, refreshJti } = issueTokenPair(user);

  await sessionService.createSession({
    userId: user._id,
    refreshToken,
    jti: refreshJti,
    expiresAt: refreshExpiresAt(),
    context,
  });

  logger.info("auth_login_success", {
    requestId: context?.requestId,
    userId: user._id.toString(),
    ip: context?.ip,
  });

  return {
    user: toSafeUserDTO(user),
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const refresh = async (refreshToken: string, context?: SessionContext): Promise<AuthResult> => {
  const payload = tokenService.verifyRefreshToken(refreshToken);

  if (!payload.jti) {
    throw new AppError("Invalid refresh token", 401);
  }

  const session = await sessionService.validateSession({
    userId: payload.sub,
    jti: payload.jti,
  });

  if (!session) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await sessionService.revokeSession({
      jti: payload.jti,
      reason: "expired",
    });
    throw new AppError("Refresh token expired", 401);
  }

  const isReuseDetected = await sessionService.detectRefreshReuse({
    session,
    refreshToken,
    context,
  });

  if (isReuseDetected) {
    logger.warn("auth_refresh_reuse_detected", {
      requestId: context?.requestId,
      userId: payload.sub,
      jti: payload.jti,
      ip: context?.ip,
    });
    throw new AppError("Refresh token reuse detected", 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError("User not available", 401);
  }

  const { accessToken, refreshToken: rotatedRefreshToken, refreshJti } = issueTokenPair(user);
  await sessionService.rotateSession({ sessionId: session._id, replacedByToken: refreshJti });
  await sessionService.createSession({
    userId: user._id,
    refreshToken: rotatedRefreshToken,
    jti: refreshJti,
    expiresAt: refreshExpiresAt(),
    context,
  });

  logger.info("auth_refresh_success", {
    requestId: context?.requestId,
    userId: user._id.toString(),
    ip: context?.ip,
  });

  return {
    user: toSafeUserDTO(user),
    tokens: {
      accessToken,
      refreshToken: rotatedRefreshToken,
    },
  };
};

export const logout = async (refreshToken?: string, context?: SessionContext): Promise<void> => {
  if (!refreshToken) {
    return;
  }

  try {
    const payload = tokenService.verifyRefreshToken(refreshToken);

    if (!payload.jti) {
      return;
    }

    await sessionService.revokeSession({ jti: payload.jti, reason: "logout" });

    logger.info("auth_logout", {
      requestId: context?.requestId,
      userId: payload.sub,
      ip: context?.ip,
    });
  } catch {
    // Ignore invalid refresh token during logout, client cookies are still cleared.
  }
};

export const me = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }

  return toSafeUserDTO(user);
};
