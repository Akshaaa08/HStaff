import type { Request, Response } from 'express';
import { created, me, ok } from '../../utils/http';
import * as svc from './service';
import type { AdminLoginBody, OtpRequestBody, OtpVerifyBody } from './schema';

export const requestOtp = async (req: Request, res: Response) => {
  const b = req.valid.body as OtpRequestBody;
  ok(res, await svc.requestLoginOtp(b.phone, b.role));
};
export const verifyOtp = async (req: Request, res: Response) => {
  const b = req.valid.body as OtpVerifyBody;
  const result = await svc.verifyLoginOtp(b);
  (result.is_new_user ? created : ok)(res, result);
};
export const adminLogin = async (req: Request, res: Response) => {
  const b = req.valid.body as AdminLoginBody;
  ok(res, await svc.adminLogin(b.email, b.password));
};
export const refresh = async (req: Request, res: Response) => {
  ok(res, await svc.refreshSession((req.valid.body as { refresh_token: string }).refresh_token));
};
export const logout = async (req: Request, res: Response) => {
  ok(res, await svc.logout(me(req).id, req.valid.body as { refresh_token?: string; push_token?: string }));
};
export const registerPushToken = async (req: Request, res: Response) => {
  created(res, await svc.registerPushToken(me(req).id, (req.valid.body as { token: string }).token));
};
