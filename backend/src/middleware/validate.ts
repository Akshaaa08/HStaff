import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

declare module 'express-serve-static-core' {
  interface Request {
    user?: import('../shared/enums').AuthUser;
    valid: { body: unknown; query: unknown; params: unknown };
  }
}

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Parses with zod and exposes the typed result on req.valid (req.query itself is left untouched). */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    try {
      req.valid = {
        body: schemas.body ? schemas.body.parse(req.body ?? {}) : req.body,
        query: schemas.query ? schemas.query.parse(req.query) : req.query,
        params: schemas.params ? schemas.params.parse(req.params) : req.params,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
