import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { uploadOne } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import { kycUploadSchema } from '../kyc/schema';
import * as c from './controller';
import {
  earningsQuery,
  locationSchema,
  myShiftsQuery,
  nearbyQuery,
  onlineSchema,
  updateProfileSchema,
} from './schema';

export const workersRouter = Router();
workersRouter.use(authenticate);

// Worker self-service (declared before /:id so "me" is never parsed as an id)
const worker = requireRole('worker');
workersRouter.get('/me', worker, wrap(c.getMe));
workersRouter.put('/me', worker, validate({ body: updateProfileSchema }), wrap(c.updateMe));
workersRouter.post('/me/photo', worker, uploadOne('photo'), wrap(c.uploadPhoto));
workersRouter.get('/me/kyc', worker, wrap(c.listKyc));
workersRouter.post(
  '/me/kyc',
  worker,
  uploadOne('file'),
  validate({ body: kycUploadSchema }),
  wrap(c.uploadKyc),
);
workersRouter.post('/me/online', worker, validate({ body: onlineSchema }), wrap(c.online));
workersRouter.post('/me/location', worker, validate({ body: locationSchema }), wrap(c.location));
workersRouter.get('/me/earnings', worker, validate({ query: earningsQuery }), wrap(c.earnings));
workersRouter.get('/me/shifts', worker, validate({ query: myShiftsQuery }), wrap(c.myShifts));

// Client-facing discovery
workersRouter.get('/nearby', requireRole('client'), validate({ query: nearbyQuery }), wrap(c.nearby));
workersRouter.get(
  '/:id',
  requireRole('client', 'admin'),
  validate({ params: idParam }),
  wrap(c.publicProfile),
);
