import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found`, details: {} },
  });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) },
      },
    });
  }
  if (err instanceof multer.MulterError) {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
    return res.status(400).json({ error: { code, message: err.message, details: {} } });
  }
  const e = err as { type?: string; code?: string; status?: number };
  if (e.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: { code: 'INVALID_JSON', message: 'Malformed JSON body', details: {} } });
  }
  if (e.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Body too large', details: {} } });
  }
  if (e.code === '23505') {
    return res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'Resource already exists', details: {} } });
  }
  logger.error(`unhandled error on ${req.method} ${req.path}`, err instanceof Error ? err : String(err));
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : String((err as Error)?.message ?? err);
  res.status(500).json({ error: { code: 'INTERNAL', message, details: {} } });
};
