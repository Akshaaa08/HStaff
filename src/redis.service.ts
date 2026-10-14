import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';

// Deletes the key only if it still holds our token.
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;

@Injectable()
export class RedisService implements OnModuleDestroy {
  client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

  // Tokens for locks this process currently holds, keyed by lock key.
  private readonly lockTokens = new Map<string, string>();

  // Returns true if we got the lock, false if someone else holds it.
  async acquireLock(key: string, ttlSeconds = 10): Promise<boolean> {
    const token = randomUUID();
    const res = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');
    if (res === 'OK') {
      this.lockTokens.set(key, token);
      return true;
    }
    return false;
  }

  // Only releases the lock if we still own it (it may have expired
  // and been taken by someone else).
  async releaseLock(key: string): Promise<void> {
    const token = this.lockTokens.get(key);
    if (!token) return;
    this.lockTokens.delete(key);
    await this.client.eval(RELEASE_SCRIPT, 1, key, token);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}