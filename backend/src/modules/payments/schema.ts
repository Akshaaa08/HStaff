import { z } from 'zod';
import { paginationQuery } from '../../utils/http';

export const verifyPaymentSchema = z.object({
  provider_order_id: z.string().min(3).max(100),
  provider_payment_id: z.string().max(100).optional(), // razorpay_payment_id
  signature: z.string().max(200).optional(), // razorpay_signature
  result: z.enum(['success', 'failure']).default('success'), // simulated gateway only
});
export type VerifyPaymentBody = z.infer<typeof verifyPaymentSchema>;
export const historyQuery = z.object(paginationQuery);
