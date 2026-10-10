import { z } from 'zod';

const fix = {
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  mocked: z.boolean().optional(),
  accuracy_m: z.number().nonnegative().optional(),
};
const otp = z.string().regex(/^\d{6}$/, 'OTP must be 6 digits');

export const arriveSchema = z.object(fix);
export const startSchema = z.object({ otp, ...fix });
export const endSchema = z.object({ otp, ...fix });
export type Fix = z.infer<typeof arriveSchema>;
export type StartBody = z.infer<typeof startSchema>;
