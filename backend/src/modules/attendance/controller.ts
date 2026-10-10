import type { Request, Response } from 'express';
import { me, ok } from '../../utils/http';
import type { Fix } from './schema';
import * as svc from './service';

const id = (req: Request) => (req.valid.params as { id: string }).id;
export const arrive = async (req: Request, res: Response) =>
  ok(res, await svc.arrive(me(req), id(req), req.valid.body as Fix));
export const start = async (req: Request, res: Response) =>
  ok(res, await svc.start(me(req), id(req), req.valid.body as Fix & { otp: string }));
export const endOtp = async (req: Request, res: Response) =>
  ok(res, await svc.requestEndOtp(me(req), id(req)));
export const end = async (req: Request, res: Response) =>
  ok(res, await svc.end(me(req), id(req), req.valid.body as Fix & { otp: string }));
export const otp = async (req: Request, res: Response) => ok(res, await svc.getCurrentOtp(me(req), id(req)));
