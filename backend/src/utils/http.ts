import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

export const wrap =
  (fn: (req: Request, res: Response) => unknown): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

export const ok = (res: Response, data: unknown, meta: Record<string, unknown> = {}, status = 200) =>
  res.status(status).json({ data, meta });
export const created = (res: Response, data: unknown, meta: Record<string, unknown> = {}) =>
  ok(res, data, meta, 201);

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
export const paginationSchema = z.object(paginationQuery);

export function pageParams(page: number, limit: number) {
  return { limit, offset: (page - 1) * limit };
}

export const idParam = z.object({ id: z.string().uuid() });
export const uuid = z.string().uuid();

/** Always-typed request user (routes behind `authenticate`). */
export function me(req: Request) {
  if (!req.user) throw new Error('authenticate middleware missing');
  return req.user;
}
