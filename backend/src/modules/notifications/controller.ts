import type { Request, Response } from 'express';
import { me, ok } from '../../utils/http';
import * as svc from './service';

export const list = async (req: Request, res: Response) => {
  const q = req.valid.query as { page: number; limit: number };
  const { rows, meta } = await svc.listNotifications(me(req).id, q.page, q.limit);
  ok(res, rows, meta);
};
export const read = async (req: Request, res: Response) =>
  ok(res, await svc.markRead(me(req).id, (req.valid.params as { id: string }).id));
export const readAll = async (req: Request, res: Response) => ok(res, await svc.markAllRead(me(req).id));
