import { readFileSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { db } from './config/db';
import { env } from './config/env';
import { redis } from './config/redis';
import { localDriver, storage } from './config/storage';
import { errorHandler, notFoundHandler } from './middleware/error';
import { globalLimiter } from './middleware/rateLimit';
import { adminRouter } from './modules/admin/routes';
import { attendanceRouter } from './modules/attendance/routes';
import { authRouter, devicesRouter } from './modules/auth/routes';
import { disputesRouter } from './modules/disputes/routes';
import { geoRouter } from './modules/geo/routes';
import { notificationsRouter } from './modules/notifications/routes';
import { paymentsRouter } from './modules/payments/routes';
import { reviewsRouter } from './modules/reviews/routes';
import { shiftsRouter } from './modules/shifts/routes';
import { skillsRouter } from './modules/skills/routes';
import { timesheetsRouter } from './modules/timesheets/routes';
import { usersRouter } from './modules/users/routes';
import { workersRouter } from './modules/workers/routes';
import { logger } from './utils/logger';

export const API_BASE = '/api/v1';

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1); // Render terminates TLS in front of us
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.use((req, res, next) => {
    const t0 = Date.now();
    res.on('finish', () => logger.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - t0}ms`)); // path only: no query strings
    next();
  });

  app.get('/health', async (_req, res) => {
    const checks = { db: false, redis: false };
    try {
      await db.raw('select 1');
      checks.db = true;
    } catch {
      /* reported below */
    }
    try {
      checks.redis = (await redis.ping()) === 'PONG';
    } catch {
      /* reported below */
    }
    const healthy = checks.db && checks.redis;
    res
      .status(healthy ? 200 : 503)
      .json({ status: healthy ? 'ok' : 'degraded', ...checks, uptime_sec: Math.round(process.uptime()) });
  });

  // OpenAPI at /docs (docs/openapi.yaml is the source of truth, kept in sync by a test)
  const specPath = path.resolve(__dirname, '../../docs/openapi.yaml');
  try {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(YAML.parse(readFileSync(specPath, 'utf8'))));
  } catch {
    logger.warn(`OpenAPI spec not found at ${specPath}; /docs disabled`);
  }

  app.use(API_BASE, globalLimiter);

  // Local-disk storage fallback (development only): serves signed KYC links and public photos.
  if (storage.name === 'local' && env.NODE_ENV !== 'production') {
    app.get(`${API_BASE}/dev-files/public/:bucket/*`, (req, res) => {
      const p = localDriver.resolvePublic(req.params.bucket, (req.params as Record<string, string>)[0]);
      if (!p) return res.status(404).end();
      res.sendFile(p, (err) => err && !res.headersSent && res.status(404).end());
    });
    app.get(`${API_BASE}/dev-files/:token`, async (req, res) => {
      const p = await localDriver.resolveToken(req.params.token);
      if (!p)
        return res
          .status(403)
          .json({ error: { code: 'INVALID_LINK', message: 'Link is invalid or expired', details: {} } });
      res.sendFile(p, (err) => err && !res.headersSent && res.status(404).end());
    });
  }

  app.use(`${API_BASE}/auth`, authRouter);
  app.use(`${API_BASE}/devices`, devicesRouter);
  app.use(`${API_BASE}/users`, usersRouter);
  app.use(`${API_BASE}/skills`, skillsRouter);
  app.use(`${API_BASE}/workers`, workersRouter);
  app.use(`${API_BASE}/shifts`, shiftsRouter);
  app.use(`${API_BASE}/shifts`, attendanceRouter);
  app.use(`${API_BASE}/shifts`, timesheetsRouter);
  app.use(`${API_BASE}/shifts`, disputesRouter);
  app.use(`${API_BASE}/payments`, paymentsRouter);
  app.use(`${API_BASE}/reviews`, reviewsRouter);
  app.use(`${API_BASE}/notifications`, notificationsRouter);
  app.use(`${API_BASE}/geo`, geoRouter);
  app.use(`${API_BASE}/admin`, adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
