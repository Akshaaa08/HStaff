import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { unauthorized } from '../../utils/errors';
import type { AdminRole, UserRole } from '../../shared/enums';

export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;

export interface AccessPayload {
  sub: string;
  role: UserRole;
  admin_role?: AdminRole | null;
}

export function signAccessToken(user: { id: string; role: UserRole; admin_role: AdminRole | null }): string {
  return jwt.sign({ role: user.role, admin_role: user.admin_role ?? undefined }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: ACCESS_TTL_SEC,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessPayload;
  } catch {
    throw unauthorized('Invalid or expired access token', 'INVALID_TOKEN');
  }
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const rtKey = (userId: string, jti: string) => `rt:${userId}:${jti}`;

/** Refresh tokens are JWTs whose sha256 is stored in Redis; the raw token is never stored (TRD section 15). */
export async function issueRefreshToken(userId: string): Promise<string> {
  const jti = randomUUID();
  const token = jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: userId,
    jwtid: jti,
    expiresIn: REFRESH_TTL_SEC,
  });
  await redis.set(rtKey(userId, jti), sha256(token), 'EX', REFRESH_TTL_SEC);
  return token;
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `rt:${userId}:*`, 'COUNT', 100);
    cursor = next;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== '0');
}

/** Validates and consumes a refresh token (rotation). A valid-looking but unknown token means reuse: revoke the family. */
export async function consumeRefreshToken(token: string): Promise<string> {
  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw unauthorized('Invalid or expired refresh token', 'INVALID_TOKEN');
  }
  const userId = decoded.sub;
  const jti = decoded.jti;
  if (!userId || !jti) throw unauthorized('Invalid refresh token', 'INVALID_TOKEN');
  const stored = await redis.getdel(rtKey(userId, jti));
  if (!stored || stored !== sha256(token)) {
    await revokeAllRefreshTokens(userId);
    throw unauthorized('Refresh token was already used or revoked; please log in again', 'REFRESH_REUSED');
  }
  return userId;
}

/** Best-effort revoke of a single refresh token (logout). */
export async function revokeRefreshToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
    if (decoded.sub && decoded.jti) {
      await redis.del(rtKey(decoded.sub, decoded.jti));
      return decoded.sub;
    }
  } catch {
    /* already invalid */
  }
  return null;
}
