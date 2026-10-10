import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { requireAdminRole, requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { idParam, wrap } from '../../utils/http';
import * as c from './controller';
import * as s from './schema';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('admin'));

// Sub-role matrix (TRD section 9 rule 11); super_admin passes every gate.
const verifier = requireAdminRole('verifier');
const finance = requireAdminRole('finance');
const support = requireAdminRole('support');
const superOnly = requireAdminRole();
const anyAdmin = requireAdminRole('verifier', 'finance', 'support');
const shiftIdParam = z.object({ shiftId: z.string().uuid() });

adminRouter.get('/dashboard', anyAdmin, wrap(c.dashboard));

adminRouter.get('/workers', verifier, validate({ query: s.workersQuery }), wrap(c.workers));
adminRouter.get('/workers/:id', verifier, validate({ params: idParam }), wrap(c.workerDetail));
adminRouter.post(
  '/workers/:id/verify',
  verifier,
  validate({ params: idParam, body: s.verifyWorkerSchema }),
  wrap(c.verifyWorker),
);

adminRouter.get('/users', support, validate({ query: s.usersQuery }), wrap(c.users));
adminRouter.patch(
  '/users/:id/status',
  support,
  validate({ params: idParam, body: s.userStatusSchema }),
  wrap(c.userStatus),
);

adminRouter.get('/shifts', anyAdmin, validate({ query: s.shiftsQuery }), wrap(c.shifts));
adminRouter.get('/shifts/:id', anyAdmin, validate({ params: idParam }), wrap(c.shiftDetail));
adminRouter.post(
  '/shifts/:id/reassign',
  support,
  validate({ params: idParam, body: s.adminReassignSchema }),
  wrap(c.shiftReassign),
);
adminRouter.post(
  '/shifts/:id/cancel',
  support,
  validate({ params: idParam, body: s.adminCancelSchema }),
  wrap(c.shiftCancel),
);

adminRouter.get('/payments', finance, validate({ query: s.paymentsQuery }), wrap(c.payments));
adminRouter.get('/payouts', finance, validate({ query: s.payoutsQuery }), wrap(c.payouts));
adminRouter.post('/payouts/:shiftId/settle', finance, validate({ params: shiftIdParam }), wrap(c.settle));

adminRouter.get('/disputes', support, validate({ query: s.disputesQuery }), wrap(c.disputes));
adminRouter.get('/disputes/:id', support, validate({ params: idParam }), wrap(c.disputeDetail));
adminRouter.patch(
  '/disputes/:id',
  support,
  validate({ params: idParam, body: s.disputePatchSchema }),
  wrap(c.disputePatch),
);

adminRouter.get('/reviews', support, validate({ query: s.reviewsQuery }), wrap(c.reviews));
adminRouter.patch(
  '/reviews/:id',
  support,
  validate({ params: idParam, body: s.reviewPatchSchema }),
  wrap(c.reviewPatch),
);

adminRouter.get('/skills', superOnly, wrap(c.skillsList));
adminRouter.post('/skills', superOnly, validate({ body: s.skillCreateSchema }), wrap(c.skillCreate));
adminRouter.patch(
  '/skills/:id',
  superOnly,
  validate({ params: s.skillIdParam, body: s.skillPatchSchema }),
  wrap(c.skillUpdate),
);
adminRouter.delete('/skills/:id', superOnly, validate({ params: s.skillIdParam }), wrap(c.skillDelete));

adminRouter.get('/config', superOnly, wrap(c.configGet));
adminRouter.put('/config', superOnly, validate({ body: s.configSchema }), wrap(c.configPut));
adminRouter.get('/audit-log', superOnly, validate({ query: s.auditQuery }), wrap(c.auditLog));
adminRouter.post('/announcements', support, validate({ body: s.announcementSchema }), wrap(c.announce));

adminRouter.get('/admins', superOnly, wrap(c.adminsList));
adminRouter.post('/admins', superOnly, validate({ body: s.adminCreateSchema }), wrap(c.adminCreate));
adminRouter.patch(
  '/admins/:id',
  superOnly,
  validate({ params: idParam, body: s.adminPatchSchema }),
  wrap(c.adminPatch),
);
