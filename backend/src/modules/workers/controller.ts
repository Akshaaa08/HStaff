import type { Request, Response } from 'express';
import { created, me, ok } from '../../utils/http';
import { uploadProfilePhoto } from '../users/service';
import { uploadKycDocument, listKycDocuments } from '../kyc/service';
import type { KycUploadBody } from '../kyc/schema';
import { listShiftsFor } from '../shifts/service';
import type { LocationBody, NearbyQuery, OnlineBody, UpdateProfileBody } from './schema';
import * as svc from './service';

export const getMe = async (req: Request, res: Response) => ok(res, await svc.getMyProfile(me(req).id));
export const updateMe = async (req: Request, res: Response) =>
  ok(res, await svc.updateMyProfile(me(req).id, req.valid.body as UpdateProfileBody));
export const uploadPhoto = async (req: Request, res: Response) =>
  ok(res, await uploadProfilePhoto(me(req).id, req.file));
export const uploadKyc = async (req: Request, res: Response) =>
  created(res, await uploadKycDocument(me(req).id, (req.valid.body as KycUploadBody).doc_type, req.file));
export const listKyc = async (req: Request, res: Response) => ok(res, await listKycDocuments(me(req).id));
export const online = async (req: Request, res: Response) =>
  ok(res, await svc.setOnline(me(req).id, req.valid.body as OnlineBody));
export const location = async (req: Request, res: Response) =>
  ok(res, await svc.updateLocation(me(req).id, req.valid.body as LocationBody));
export const earnings = async (req: Request, res: Response) => {
  const q = req.valid.query as { page: number; limit: number };
  const r = await svc.earnings(me(req).id, q.page, q.limit);
  ok(res, { totals: r.totals, items: r.items }, { page: q.page, limit: q.limit });
};
export const myShifts = async (req: Request, res: Response) => {
  const q = req.valid.query as { status?: string; page: number; limit: number };
  const r = await listShiftsFor(me(req), q);
  ok(res, r.rows, r.meta);
};
export const nearby = async (req: Request, res: Response) => {
  const q = req.valid.query as NearbyQuery;
  const r = await svc.nearby(q);
  ok(res, r.rows, { page: q.page, limit: q.limit, total: r.total });
};
export const publicProfile = async (req: Request, res: Response) =>
  ok(res, await svc.publicProfile((req.valid.params as { id: string }).id));
