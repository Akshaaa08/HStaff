import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
redis.on('error', (err) => logger.error('redis error', err));

const RELEASE_LUA = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;

/** SET key token NX EX ttl. Returns the token if acquired, otherwise null. */
export async function acquireLock(key: string, ttlSec: number): Promise<string | null> {
  const token = randomUUID();
  const res = await redis.set(key, token, 'EX', ttlSec, 'NX');
  return res === 'OK' ? token : null;
}

export async function releaseLock(key: string, token: string): Promise<void> {
  await redis.eval(RELEASE_LUA, 1, key, token);
}
