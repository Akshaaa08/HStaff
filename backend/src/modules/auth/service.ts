import bcrypt from 'bcrypt';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { conflict, forbidden, tooMany, unauthorized, AppError } from '../../utils/errors';
import { hit, isLocked, issueOtp, lockTtl, verifyOtp } from '../../utils/otp';
import type { AdminRole, UserRole } from '../../shared/enums';
import { getOtpProvider } from './otpProvider';
import {
  ACCESS_TTL_SEC,
  consumeRefreshToken,
  issueRefreshToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  signAccessToken,
} from './tokens';

export const BCRYPT_COST = env.NODE_ENV === 'test' ? 4 : 12;
// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST);

const LOGIN_OTP_TTL_SEC = 300;
const LOGIN_OTP_REQ_LIMIT = 3;
const LOGIN_OTP_REQ_WINDOW_SEC = 600;

interface UserRow {
  id: string;
  role: UserRole;
  admin_role: AdminRole | null;
  phone: string | null;
  email: string | null;
  name: string | null;
  photo_url: string | null;
  status: string;
  password_hash?: string | null;
  created_at: Date;
}

export const publicUser = (u: UserRow) => ({
  id: u.id,
  role: u.role,
  admin_role: u.admin_role,
  name: u.name,
  phone: u.phone,
  email: u.email,
  photo_url: u.photo_url,
  status: u.status,
  created_at: u.created_at,
});

async function issueSession(user: UserRow) {
  return {
    access_token: signAccessToken(user),
    refresh_token: await issueRefreshToken(user.id),
    token_type: 'Bearer' as const,
    expires_in: ACCESS_TTL_SEC,
    user: publicUser(user),
  };
}

export async function requestLoginOtp(phone: string, role: 'client' | 'worker') {
  const existing = await db('users').where({ phone }).first<UserRow | undefined>('id', 'role', 'status');
  if (existing && existing.role !== role) {
    throw conflict('ROLE_CONFLICT', `This number is already registered as a ${existing.role}`);
  }
  if (existing && existing.status !== 'ACTIVE')
    throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');

  const key = `otp:login:${phone}`;
  if (await isLocked(key)) {
    throw tooMany('OTP_LOCKED', 'Too many wrong codes. Try again later.', {
      retry_after_sec: await lockTtl(key),
    });
  }
  const count = await hit(`otp:login:req:${phone}`, LOGIN_OTP_REQ_WINDOW_SEC);
  if (count > LOGIN_OTP_REQ_LIMIT) {
    const ttl = await redis.ttl(`otp:login:req:${phone}`);
    throw tooMany('OTP_RATE_LIMITED', 'Too many code requests. Try again later.', {
      retry_after_sec: Math.max(ttl, 0),
    });
  }
  const otp = await issueOtp(key, LOGIN_OTP_TTL_SEC);
  await getOtpProvider().send(phone, otp);
  return { sent: true, expires_in_sec: LOGIN_OTP_TTL_SEC };
}

export async function verifyLoginOtp(input: {
  phone: string;
  otp: string;
  role: 'client' | 'worker';
  name?: string;
}) {
  const check = await verifyOtp(`otp:login:${input.phone}`, input.otp);
  if (check.result === 'locked') {
    throw tooMany('OTP_LOCKED', 'Too many wrong codes. Try again later.', {
      retry_after_sec: check.retryAfterSec,
    });
  }
  if (check.result === 'expired')
    throw new AppError(400, 'OTP_EXPIRED', 'Code expired or not requested. Request a new one.');
  if (check.result === 'invalid') {
    throw new AppError(400, 'INVALID_OTP', 'That code does not match', {
      attempts_remaining: check.remaining,
    });
  }

  let user = await db('users').where({ phone: input.phone }).first<UserRow | undefined>();
  let isNew = false;
  if (user && user.role !== input.role)
    throw conflict('ROLE_CONFLICT', `This number is already registered as a ${user.role}`);
  if (!user) {
    try {
      user = await db.transaction(async (trx) => {
        const [row] = await trx('users')
          .insert({ role: input.role, phone: input.phone, name: input.name ?? null })
          .returning<UserRow[]>('*');
        if (input.role === 'worker') await trx('worker_profiles').insert({ user_id: row.id });
        return row;
      });
      isNew = true;
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
      user = await db('users').where({ phone: input.phone }).first<UserRow>(); // lost a creation race
    }
  } else if (!user.name && input.name) {
    await db('users').where({ id: user.id }).update({ name: input.name });
    user.name = input.name;
  }
  if (!user) throw unauthorized();
  if (user.status !== 'ACTIVE') throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
  return { ...(await issueSession(user)), is_new_user: isNew };
}

export async function adminLogin(email: string, password: string) {
  const user = await db('users').where({ email, role: 'admin' }).first<UserRow | undefined>();
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  if (user.status !== 'ACTIVE') throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
  return issueSession(user);
}

export async function refreshSession(refreshToken: string) {
  const userId = await consumeRefreshToken(refreshToken);
  const user = await db('users').where({ id: userId }).first<UserRow | undefined>();
  if (!user) throw unauthorized('Account no longer exists');
  if (user.status !== 'ACTIVE') {
    await revokeAllRefreshTokens(user.id);
    throw forbidden('This account is suspended', 'ACCOUNT_SUSPENDED');
  }
  return issueSession(user);
}

export async function logout(userId: string, input: { refresh_token?: string; push_token?: string }) {
  if (input.refresh_token) await revokeRefreshToken(input.refresh_token);
  if (input.push_token) await db('push_tokens').where({ user_id: userId, token: input.push_token }).del();
  return { logged_out: true };
}

export async function registerPushToken(userId: string, token: string) {
  await db('push_tokens').insert({ user_id: userId, token }).onConflict(['user_id', 'token']).ignore();
  return { registered: true };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}
