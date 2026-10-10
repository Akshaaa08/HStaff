import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const skip = () => env.NODE_ENV === 'test';
const handler = (msg: string) => (_req: unknown, res: import('express').Response) =>
  res.status(429).json({ error: { code: 'RATE_LIMITED', message: msg, details: {} } });

// In-memory store is fine for the single Render instance (docs/decisions.md D-07).
export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler: handler('Too many requests, slow down'),
});

export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler: handler('Too many authentication attempts, try again in a minute'),
});
