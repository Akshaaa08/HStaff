import type { Request, Response } from 'express';
import { created, me, ok } from '../../utils/http';
import * as svc from './service';

type Q = Record<string, unknown> & { page: number; limit: number };
const q = (req: Request) => req.valid.query as Q;
const b = <T>(req: Request) => req.valid.body as T;
const id = (req: Request) => (req.valid.params as { id: string }).id;
const list = (res: Response, r: { rows: unknown[]; total: number }, page: number, limit: number) =>
  ok(res, r.rows, { page, limit, total: r.total });

export const dashboard = async (_req: Request, res: Response) => ok(res, await svc.dashboard());
export const workers = async (req: Request, res: Response) =>
  list(res, await svc.listWorkers(q(req) as never), q(req).page, q(req).limit);
export const workerDetail = async (req: Request, res: Response) =>
  ok(res, await svc.workerDetail(me(req), id(req)));
export const verifyWorker = async (req: Request, res: Response) => {
  const body = b<{ decision: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO'; note?: string }>(req);
  ok(res, await svc.verifyWorker(me(req), id(req), body.decision, body.note));
};
export const users = async (req: Request, res: Response) =>
  list(res, await svc.listUsers(q(req) as never), q(req).page, q(req).limit);
export const userStatus = async (req: Request, res: Response) => {
  const body = b<{ status: 'ACTIVE' | 'SUSPENDED'; reason?: string }>(req);
  ok(res, await svc.setUserStatus(me(req), id(req), body.status, body.reason));
};
export const shifts = async (req: Request, res: Response) =>
  list(res, await svc.listShifts(q(req) as never), q(req).page, q(req).limit);
export const shiftDetail = async (req: Request, res: Response) => ok(res, await svc.shiftDetail(id(req)));
export const shiftReassign = async (req: Request, res: Response) => {
  await svc.adminReassign(me(req), id(req), b<{ worker_id?: string }>(req).worker_id);
  ok(res, await svc.shiftDetail(id(req)));
};
export const shiftCancel = async (req: Request, res: Response) => {
  await svc.adminCancel(me(req), id(req), b<{ reason: string }>(req).reason);
  ok(res, await svc.shiftDetail(id(req)));
};
export const payments = async (req: Request, res: Response) =>
  list(res, await svc.listPayments(q(req) as never), q(req).page, q(req).limit);
export const payouts = async (req: Request, res: Response) =>
  list(res, await svc.listPayouts(q(req) as never), q(req).page, q(req).limit);
export const settle = async (req: Request, res: Response) =>
  ok(res, await svc.settlePayout(me(req), (req.valid.params as { shiftId: string }).shiftId));
export const disputes = async (req: Request, res: Response) =>
  list(res, await svc.listDisputes(q(req) as never), q(req).page, q(req).limit);
export const disputeDetail = async (req: Request, res: Response) => ok(res, await svc.disputeDetail(id(req)));
export const disputePatch = async (req: Request, res: Response) =>
  ok(res, await svc.patchDispute(me(req), id(req), b(req)));
export const reviews = async (req: Request, res: Response) =>
  list(res, await svc.listReviews(q(req) as never), q(req).page, q(req).limit);
export const reviewPatch = async (req: Request, res: Response) =>
  ok(res, await svc.hideReview(me(req), id(req), b<{ hidden: boolean }>(req).hidden));
export const skillsList = async (_req: Request, res: Response) => ok(res, await svc.adminSkills.list());
export const skillCreate = async (req: Request, res: Response) =>
  created(res, await svc.adminSkills.create(me(req), b<{ name: string }>(req).name));
const skillId = (req: Request) => (req.valid.params as { id: number }).id;
export const skillUpdate = async (req: Request, res: Response) =>
  ok(res, await svc.adminSkills.update(me(req), skillId(req), b(req)));
export const skillDelete = async (req: Request, res: Response) =>
  ok(res, await svc.adminSkills.remove(me(req), skillId(req)));
export const configGet = async (_req: Request, res: Response) => ok(res, await svc.getConfigAll());
export const configPut = async (req: Request, res: Response) => ok(res, await svc.putConfig(me(req), b(req)));
export const auditLog = async (req: Request, res: Response) =>
  list(res, await svc.listAudit(q(req) as never), q(req).page, q(req).limit);
export const announce = async (req: Request, res: Response) =>
  created(res, await svc.announce(me(req), b(req)));
export const adminsList = async (_req: Request, res: Response) => ok(res, await svc.listAdmins());
export const adminCreate = async (req: Request, res: Response) =>
  created(res, await svc.createAdmin(me(req), b(req)));
export const adminPatch = async (req: Request, res: Response) =>
  ok(res, await svc.patchAdmin(me(req), id(req), b(req)));
