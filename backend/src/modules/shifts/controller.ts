import type { Request, Response } from 'express';
import { created, me, ok } from '../../utils/http';
import type { CreateShiftBody, QuoteQuery } from './schema';
import * as svc from './service';

const id = (req: Request) => (req.valid.params as { id: string }).id;

export const create = async (req: Request, res: Response) =>
  created(res, await svc.createShift(me(req), req.valid.body as CreateShiftBody));
export const quote = async (req: Request, res: Response) =>
  ok(res, await svc.getQuote(me(req), req.valid.query as QuoteQuery));
export const get = async (req: Request, res: Response) => ok(res, await svc.getShiftDetail(me(req), id(req)));
export const list = async (req: Request, res: Response) => {
  const r = await svc.listShiftsFor(
    me(req),
    req.valid.query as { status?: string; page: number; limit: number },
  );
  ok(res, r.rows, r.meta);
};
export const cancel = async (req: Request, res: Response) =>
  ok(res, await svc.cancelShift(me(req), id(req), (req.valid.body as { reason: string }).reason));
export const reassign = async (req: Request, res: Response) =>
  ok(
    res,
    await svc.reassignForClient(me(req), id(req), (req.valid.body as { worker_id?: string }).worker_id),
  );
export const accept = async (req: Request, res: Response) => ok(res, await svc.acceptShift(me(req), id(req)));
export const decline = async (req: Request, res: Response) =>
  ok(res, await svc.declineShift(me(req), id(req)));
export const enRoute = async (req: Request, res: Response) =>
  ok(res, await svc.markEnRoute(me(req), id(req), req.valid.body as { lat?: number; lng?: number }));
