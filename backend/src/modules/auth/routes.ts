import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import { wrap } from '../../utils/http';
import * as c from './controller';
import {
  adminLoginSchema,
  logoutSchema,
  otpRequestSchema,
  otpVerifySchema,
  pushTokenSchema,
  refreshSchema,
} from './schema';

export const authRouter = Router();
authRouter.post('/otp/request', authLimiter, validate({ body: otpRequestSchema }), wrap(c.requestOtp));
authRouter.post('/otp/verify', authLimiter, validate({ body: otpVerifySchema }), wrap(c.verifyOtp));
authRouter.post('/admin/login', authLimiter, validate({ body: adminLoginSchema }), wrap(c.adminLogin));
authRouter.post('/refresh', authLimiter, validate({ body: refreshSchema }), wrap(c.refresh));
authRouter.post('/logout', authenticate, validate({ body: logoutSchema }), wrap(c.logout));

export const devicesRouter = Router();
devicesRouter.post(
  '/push-token',
  authenticate,
  validate({ body: pushTokenSchema }),
  wrap(c.registerPushToken),
);
