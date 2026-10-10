import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import { toPaise } from '../../utils/money';
import { logger } from '../../utils/logger';

export interface GatewayOrder {
  provider: 'simulated' | 'razorpay';
  order_id: string;
  amount_paise: number;
  key_id?: string;
}

/** SimulatedGateway: no network, always succeeds unless the caller asks for a failure (prototype's "Try payment failure"). */
export async function createGatewayOrder(shiftId: string, amount: string): Promise<GatewayOrder> {
  const amount_paise = toPaise(amount);
  if (env.PAYMENT_PROVIDER === 'simulated') {
    return { provider: 'simulated', order_id: `sim_order_${randomUUID()}`, amount_paise };
  }
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amount_paise, currency: 'INR', receipt: `shift_${shiftId.slice(0, 30)}` }),
    signal: AbortSignal.timeout(10_000),
  }).catch((err) => {
    logger.error('razorpay order request failed', err);
    throw new AppError(502, 'PAYMENT_GATEWAY_UNAVAILABLE', 'The payment gateway is unavailable');
  });
  if (!res.ok) {
    logger.error(`razorpay order failed with ${res.status}`);
    throw new AppError(502, 'PAYMENT_GATEWAY_ERROR', 'The payment gateway rejected the order');
  }
  const json = (await res.json()) as { id: string };
  return { provider: 'razorpay', order_id: json.id, amount_paise, key_id: env.RAZORPAY_KEY_ID };
}

/** Razorpay: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
