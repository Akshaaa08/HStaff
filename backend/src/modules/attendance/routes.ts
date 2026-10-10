import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import * as c from './controller';
import { arriveSchema, endSchema, startSchema } from './schema';

// Mounted at /shifts alongside the shifts router.
export const attendanceRouter = Router();
attendanceRouter.use(authenticate);
const worker = requireRole('worker');
attendanceRouter.post(
  '/:id/arrive',
  worker,
  validate({ params: idParam, body: arriveSchema }),
  wrap(c.arrive),
);
attendanceRouter.post('/:id/start', worker, validate({ params: idParam, body: startSchema }), wrap(c.start));
attendanceRouter.post('/:id/end-otp', worker, validate({ params: idParam }), wrap(c.endOtp));
attendanceRouter.post('/:id/end', worker, validate({ params: idParam, body: endSchema }), wrap(c.end));
attendanceRouter.get('/:id/otp', requireRole('client'), validate({ params: idParam }), wrap(c.otp));
