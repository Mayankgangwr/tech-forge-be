import mongoose, { Types } from "mongoose";
import { env } from "../../config/env";
import logger from "../../config/logger";
import { AppError } from "../../utils/appError";
import { compareHash, hashValue } from "../../utils/hash";
import { RefreshSession } from "./auth.model";
import { SessionContext } from "./auth.types";

interface CreateSessionInput {
  userId: Types.ObjectId;
  refreshToken: string;
  jti: string;
  expiresAt: Date;
  context?: SessionContext;
}

interface ValidateSessionInput {
  userId: string;
  jti: string;
}

interface RotateSessionInput {
  sessionId: Types.ObjectId;
  replacedByToken: string;
}

interface RevokeSessionInput {
  jti: string;
  reason: string;
}

interface DetectRefreshReuseInput {
  session: {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    tokenHash: string;
    revokedAt?: Date | null;
    revokedReason?: string;
  };
  refreshToken: string;
  context?: SessionContext;
}

const toObjectId = (value: string): Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError("Invalid refresh token", 401);
  }

  return new mongoose.Types.ObjectId(value);
};

const trimActiveSessions = async (userId: Types.ObjectId): Promise<void> => {
  const maxActiveSessions = env.AUTH_MAX_ACTIVE_SESSIONS;

  if (maxActiveSessions < 1) {
    return;
  }

  const activeSessions = await RefreshSession.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();

  const staleSessionIds = activeSessions.slice(maxActiveSessions).map((session) => session._id);

  if (!staleSessionIds.length) {
    return;
  }

  await RefreshSession.updateMany(
    {
      _id: { $in: staleSessionIds },
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: "max_active_sessions",
      },
    }
  );
};

export const createSession = async ({
  userId,
  refreshToken,
  jti,
  expiresAt,
  context,
}: CreateSessionInput): Promise<void> => {
  const tokenHash = await hashValue(refreshToken);

  await RefreshSession.create({
    user: userId,
    jti,
    tokenHash,
    expiresAt,
    ip: context?.ip,
    userAgent: context?.userAgent,
  });

  await trimActiveSessions(userId);
};

export const validateSession = async ({ userId, jti }: ValidateSessionInput) => {
  return RefreshSession.findOne({
    jti,
    user: toObjectId(userId),
  }).select("+tokenHash");
};

export const rotateSession = async ({ sessionId, replacedByToken }: RotateSessionInput): Promise<void> => {
  await RefreshSession.updateOne(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: "rotated",
        replacedByToken,
      },
    }
  );
};

export const revokeSession = async ({ jti, reason }: RevokeSessionInput): Promise<void> => {
  await RefreshSession.updateOne(
    {
      jti,
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );
};

export const revokeAllUserSessions = async (userId: string, reason: string, context?: SessionContext): Promise<void> => {
  await RefreshSession.updateMany(
    {
      user: toObjectId(userId),
      revokedAt: null,
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    }
  );

  logger.warn("auth_refresh_reuse_revoke_all", {
    requestId: context?.requestId,
    userId,
    reason,
  });
};

export const detectRefreshReuse = async ({
  session,
  refreshToken,
  context,
}: DetectRefreshReuseInput): Promise<boolean> => {
  if (session.revokedAt) {
    await revokeAllUserSessions(session.user.toString(), "refresh_reuse_revoked_session", context);
    return true;
  }

  const isMatchingToken = await compareHash(refreshToken, session.tokenHash);

  if (!isMatchingToken) {
    await revokeAllUserSessions(session.user.toString(), "refresh_reuse_token_mismatch", context);
    return true;
  }

  return false;
};
