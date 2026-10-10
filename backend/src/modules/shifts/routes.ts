import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import * as c from './controller';
import {
  createShiftSchema,
  enRouteSchema,
  listQuery,
  quoteQuery,
  reasonSchema,
  reassignSchema,
} from './schema';

export const shiftsRouter = Router();
shiftsRouter.use(authenticate);

const client = requireRole('client');
const worker = requireRole('worker');
const either = requireRole('client', 'worker');

shiftsRouter.post('/', client, validate({ body: createShiftSchema }), wrap(c.create));
shiftsRouter.get('/', either, validate({ query: listQuery }), wrap(c.list));
shiftsRouter.get('/quote', client, validate({ query: quoteQuery }), wrap(c.quote)); // before /:id
shiftsRouter.get('/:id', either, validate({ params: idParam }), wrap(c.get));
shiftsRouter.post('/:id/cancel', either, validate({ params: idParam, body: reasonSchema }), wrap(c.cancel));
shiftsRouter.post(
  '/:id/reassign',
  client,
  validate({ params: idParam, body: reassignSchema }),
  wrap(c.reassign),
);
shiftsRouter.post('/:id/accept', worker, validate({ params: idParam }), wrap(c.accept));
shiftsRouter.post('/:id/decline', worker, validate({ params: idParam }), wrap(c.decline));
shiftsRouter.post(
  '/:id/en-route',
  worker,
  validate({ params: idParam, body: enRouteSchema }),
  wrap(c.enRoute),
);
