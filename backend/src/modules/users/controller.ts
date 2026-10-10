import type { Request, Response } from 'express';
import { me, ok } from '../../utils/http';
import type { UpdateMeBody } from './schema';
import * as svc from './service';

export const getMe = async (req: Request, res: Response) => ok(res, await svc.getMe(me(req).id));
export const updateMe = async (req: Request, res: Response) =>
  ok(res, await svc.updateMe(me(req).id, req.valid.body as UpdateMeBody));
export const uploadPhoto = async (req: Request, res: Response) =>
  ok(res, await svc.uploadProfilePhoto(me(req).id, req.file));
