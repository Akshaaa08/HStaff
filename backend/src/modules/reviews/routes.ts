import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import * as c from './controller';
import { createReviewSchema } from './schema';

export const reviewsRouter = Router();
reviewsRouter.use(authenticate, requireRole('client', 'worker'));
reviewsRouter.post('/', validate({ body: createReviewSchema }), wrap(c.create));
reviewsRouter.post('/:id/report', validate({ params: idParam }), wrap(c.report));
