import { randomInt, timingSafeEqual } from 'node:crypto';
import { redis } from '../config/redis';

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Fixed-window counter. Returns the new count; the window starts at the first hit. */
export async function hit(key: string, windowSec: number): Promise<number> {
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, windowSec);
  return n;
}

export const MAX_OTP_ATTEMPTS = 5;
export const OTP_LOCK_SEC = 900;

export async function isLocked(key: string): Promise<boolean> {
  return (await redis.exists(`${key}:lock`)) === 1;
}

export async function lockTtl(key: string): Promise<number> {
  return Math.max(0, await redis.ttl(`${key}:lock`));
}

/** Stores a fresh OTP at `key` and resets the attempt counter. Caller must check isLocked first. */
export async function issueOtp(key: string, ttlSec: number): Promise<string> {
  const code = generateOtp();
  await redis.multi().set(key, code, 'EX', ttlSec).del(`${key}:attempts`).exec();
  return code;
}

export type OtpCheck =
  | { result: 'ok' }
  | { result: 'invalid'; remaining: number }
  | { result: 'expired' }
  | { result: 'locked'; retryAfterSec: number };

/** Verifies and consumes an OTP. 5 wrong tries lock the key for 15 minutes (TRD section 9 rules 1-2). */
export async function verifyOtp(key: string, submitted: string): Promise<OtpCheck> {
  if (await isLocked(key)) return { result: 'locked', retryAfterSec: await lockTtl(key) };
  const stored = await redis.get(key);
  if (!stored) return { result: 'expired' };
  if (safeEqual(stored, submitted)) {
    await redis.del(key, `${key}:attempts`);
    return { result: 'ok' };
  }
  const attempts = await redis.incr(`${key}:attempts`);
  const ttl = await redis.ttl(key);
  if (ttl > 0) await redis.expire(`${key}:attempts`, ttl);
  if (attempts >= MAX_OTP_ATTEMPTS) {
    await redis.multi().set(`${key}:lock`, '1', 'EX', OTP_LOCK_SEC).del(key, `${key}:attempts`).exec();
    return { result: 'locked', retryAfterSec: OTP_LOCK_SEC };
  }
  return { result: 'invalid', remaining: MAX_OTP_ATTEMPTS - attempts };
}
