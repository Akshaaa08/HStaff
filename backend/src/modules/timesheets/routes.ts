import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { idParam, me, ok, wrap } from '../../utils/http';
import { approveShift } from './service';

export const timesheetsRouter = Router();
timesheetsRouter.post(
  '/:id/approve',
  authenticate,
  requireRole('client'),
  validate({ params: idParam }),
  wrap(async (req: Request, res: Response) =>
    ok(res, await approveShift(me(req), (req.valid.params as { id: string }).id)),
  ),
);
