import cron from 'node-cron';
import { acquireLock } from '../config/redis';
import { logger } from '../utils/logger';
import { runAutoApprove } from './autoApprove';
import { runExpireRequests } from './expireRequests';

// A short Redis lock keeps two API instances from running the same job at once.
function schedule(name: string, expr: string, fn: () => Promise<number>) {
  return cron.schedule(expr, async () => {
    try {
      if (!(await acquireLock(`lock:job:${name}`, 50))) return;
      const n = await fn();
      if (n > 0) logger.info(`job ${name}: processed ${n}`);
    } catch (err) {
      logger.error(`job ${name} failed`, err);
    }
  });
}

export function startJobs() {
  const tasks = [
    schedule('expireRequests', '* * * * *', runExpireRequests),
    schedule('autoApprove', '*/5 * * * *', runAutoApprove),
  ];
  return () => tasks.forEach((t) => t.stop());
}
