import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import * as c from './controller';
import { historyQuery, verifyPaymentSchema } from './schema';

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);
paymentsRouter.post('/shifts/:id/order', requireRole('client'), validate({ params: idParam }), wrap(c.order));
paymentsRouter.post(
  '/verify',
  requireRole('client'),
  validate({ body: verifyPaymentSchema }),
  wrap(c.verify),
);
paymentsRouter.get(
  '/history',
  requireRole('client', 'worker'),
  validate({ query: historyQuery }),
  wrap(c.history),
);
