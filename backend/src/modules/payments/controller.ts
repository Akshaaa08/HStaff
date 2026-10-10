import type { Request, Response } from 'express';
import { created, me, ok } from '../../utils/http';
import type { VerifyPaymentBody } from './schema';
import * as svc from './service';

export const order = async (req: Request, res: Response) =>
  created(res, await svc.createOrder(me(req), (req.valid.params as { id: string }).id));
export const verify = async (req: Request, res: Response) =>
  ok(res, await svc.verifyPayment(me(req), req.valid.body as VerifyPaymentBody));
export const history = async (req: Request, res: Response) => {
  const q = req.valid.query as { page: number; limit: number };
  const r = await svc.paymentHistory(me(req), q.page, q.limit);
  ok(res, r.rows, r.meta);
};
