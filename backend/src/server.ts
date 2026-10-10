import http from 'node:http';
import { createApp } from './app';
import { db } from './config/db';
import { env } from './config/env';
import { redis } from './config/redis';
import { startJobs } from './jobs';
import { getOtpProvider } from './modules/auth/otpProvider';
import { closeSocket, initSocket } from './realtime/socket';
import { logger } from './utils/logger';

async function main() {
  getOtpProvider(); // fail fast on an unimplemented OTP_PROVIDER
  await db.raw('select 1'); // fail fast if the database is unreachable or not migrated
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  const stopJobs = startJobs();

  server.listen(env.PORT, () => logger.info(`H-Staff API listening on :${env.PORT} (${env.NODE_ENV})`));

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    stopJobs();
    await closeSocket();
    server.close();
    await Promise.allSettled([db.destroy(), redis.quit()]);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('fatal: could not start', err);
  process.exit(1);
});
