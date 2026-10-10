import type { Request, Response } from 'express';
import { created, me, ok } from '../../utils/http';
import type { CreateReviewBody } from './schema';
import * as svc from './service';

export const create = async (req: Request, res: Response) =>
  created(res, await svc.createReview(me(req), req.valid.body as CreateReviewBody));
export const report = async (req: Request, res: Response) =>
  ok(res, await svc.reportReview(me(req), (req.valid.params as { id: string }).id));
