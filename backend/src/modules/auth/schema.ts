import { z } from 'zod';
import { normalizePhone } from '../../utils/phone';

export const phoneField = z.string().transform((s, ctx) => {
  const p = normalizePhone(s);
  if (!p)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid mobile number (E.164, or 10-digit Indian mobile)',
    });
  return p ?? '';
});

// The prototype UI says "customer" / "professional"; the TRD says client / worker. Accept both, store the TRD names.
export const loginRole = z
  .enum(['client', 'worker', 'customer', 'professional'])
  .transform((r) => (r === 'customer' ? 'client' : r === 'professional' ? 'worker' : r));

export const otpRequestSchema = z.object({ phone: phoneField, role: loginRole });
export const otpVerifySchema = z.object({
  phone: phoneField,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  role: loginRole,
  name: z.string().trim().min(2).max(80).optional(), // only used when this verify creates the account
});
export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});
export const refreshSchema = z.object({ refresh_token: z.string().min(10) });
export const logoutSchema = z.object({
  refresh_token: z.string().min(10).optional(),
  push_token: z.string().optional(),
});
export const pushTokenSchema = z.object({
  token: z.string().regex(/^(Expo|Exponent)PushToken\[[^\]]+\]$/, 'Must be an Expo push token'),
});

export type OtpRequestBody = z.infer<typeof otpRequestSchema>;
export type OtpVerifyBody = z.infer<typeof otpVerifySchema>;
export type AdminLoginBody = z.infer<typeof adminLoginSchema>;
