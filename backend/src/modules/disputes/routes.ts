import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { uploadMany } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { created, idParam, me, wrap } from '../../utils/http';
import { raiseDisputeSchema } from './schema';
import { raiseDispute } from './service';

// Mounted at /shifts. Accepts JSON, or multipart with up to 3 "evidence" files.
export const disputesRouter = Router();
disputesRouter.post(
  '/:id/dispute',
  authenticate,
  requireRole('client', 'worker'),
  uploadMany('evidence', 3),
  validate({ params: idParam, body: raiseDisputeSchema }),
  wrap(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    created(
      res,
      await raiseDispute(
        me(req),
        (req.valid.params as { id: string }).id,
        (req.valid.body as { reason: string }).reason,
        files,
      ),
    );
  }),
);
