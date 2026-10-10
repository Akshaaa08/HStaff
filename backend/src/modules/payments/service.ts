import { randomUUID } from 'node:crypto';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { badRequest, conflict, notFound } from '../../utils/errors';
import { announceTransition } from '../shifts/announce';
import { getShiftDetail } from '../shifts/service';
import { lockShift, transitionShift, type ActorRef } from '../shifts/transitions';
import type { AuthUser } from '../../shared/enums';
import { createGatewayOrder, verifyRazorpaySignature } from './gateway';
import type { VerifyPaymentBody } from './schema';

const present = (
  p: {
    id: string;
    shift_id: string;
    amount: string;
    provider: string;
    provider_order_id: string;
    status: string;
  },
  extra: Record<string, unknown> = {},
) => ({
  payment_id: p.id,
  shift_id: p.shift_id,
  amount: p.amount,
  currency: 'INR',
  provider: p.provider,
  order_id: p.provider_order_id,
  status: p.status,
  ...extra,
});

/** Order for the gross amount of an APPROVED shift (TRD section 11). The amount comes from the server-side timesheet only. */
export async function createOrder(client: AuthUser, shiftId: string) {
  const shift = await db('shifts')
    .where({ id: shiftId, client_id: client.id })
    .first<{ status: string } | undefined>('status');
  if (!shift) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  if (shift.status === 'PAID') throw conflict('ALREADY_PAID', 'This shift is already paid');
  if (shift.status !== 'APPROVED')
    throw conflict('ILLEGAL_TRANSITION', 'Approve the timesheet before paying', { status: shift.status });

  const open = await db('payments')
    .where({ shift_id: shiftId, status: 'CREATED', provider: env.PAYMENT_PROVIDER })
    .orderBy('created_at', 'desc')
    .first();
  if (open) return present(open, env.PAYMENT_PROVIDER === 'razorpay' ? { key_id: env.RAZORPAY_KEY_ID } : {});

  const ts = await db('timesheets').where({ shift_id: shiftId }).first<{ gross: string }>('gross');
  const order = await createGatewayOrder(shiftId, ts.gross);
  const [row] = await db('payments')
    .insert({
      shift_id: shiftId,
      amount: ts.gross,
      provider: order.provider,
      provider_order_id: order.order_id,
      status: 'CREATED',
    })
    .returning('*');
  return present(row, {
    amount_paise: order.amount_paise,
    ...(order.key_id ? { key_id: order.key_id } : {}),
  });
}

export async function verifyPayment(client: AuthUser, body: VerifyPaymentBody) {
  const payment = await db('payments as p')
    .join('shifts as s', 's.id', 'p.shift_id')
    .where({
      'p.provider': env.PAYMENT_PROVIDER,
      'p.provider_order_id': body.provider_order_id,
      's.client_id': client.id,
    })
    .first<{
      id: string;
      shift_id: string;
      status: string;
      amount: string;
      provider: string;
      provider_order_id: string;
    }>('p.*');
  if (!payment) throw notFound('Order not found', 'ORDER_NOT_FOUND');
  if (payment.status === 'PAID') return present(payment); // idempotent

  let paymentId: string;
  if (payment.provider === 'razorpay') {
    if (!body.provider_payment_id || !body.signature)
      throw badRequest('SIGNATURE_REQUIRED', 'provider_payment_id and signature are required');
    if (!verifyRazorpaySignature(body.provider_order_id, body.provider_payment_id, body.signature)) {
      await db('payments').where({ id: payment.id }).update({ status: 'FAILED' });
      throw badRequest('INVALID_SIGNATURE', 'Payment signature verification failed');
    }
    paymentId = body.provider_payment_id;
  } else {
    if (body.result === 'failure') {
      const [failed] = await db('payments')
        .where({ id: payment.id })
        .update({ status: 'FAILED' })
        .returning('*');
      return present(failed);
    }
    paymentId = `sim_pay_${randomUUID()}`;
  }

  const actor: ActorRef = { type: 'client', id: client.id };
  let paidShift;
  try {
    paidShift = await db.transaction(async (trx) => {
      // Serialise concurrent verifies of the same order: the loser sees PAID and returns the existing result.
      const current = await trx('payments')
        .where({ id: payment.id })
        .forUpdate()
        .first<{ status: string }>('status');
      if (current.status === 'PAID') return null;
      const shift = await lockShift(trx, payment.shift_id);
      const row = await transitionShift(trx, shift, 'PAID', actor, {
        meta: { payment_id: payment.id, amount: payment.amount },
      });
      await trx('payments')
        .where({ id: payment.id })
        .update({ status: 'PAID', provider_payment_id: paymentId, payout_status: 'PENDING' });
      return row;
    });
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      const again = await db('payments').where({ id: payment.id }).first();
      return present(again);
    }
    throw err;
  }
  if (!paidShift) return present(await db('payments').where({ id: payment.id }).first());
  await announceTransition(paidShift, actor);
  const updated = await db('payments').where({ id: payment.id }).first();
  return present(updated, { shift: await getShiftDetail(client, payment.shift_id) });
}

export async function paymentHistory(user: AuthUser, page: number, limit: number) {
  const isWorker = user.role === 'worker';
  const { rows } = await db.raw(
    `SELECT p.id AS payment_id, p.shift_id, p.amount, p.status, p.provider, p.payout_status, p.created_at,
            sk.name AS skill, t.worker_payout, t.commission, count(*) OVER() AS total
       FROM payments p
       JOIN shifts s ON s.id = p.shift_id
       LEFT JOIN skills sk ON sk.id = s.skill_id
       LEFT JOIN timesheets t ON t.shift_id = s.id
      WHERE ${isWorker ? "s.worker_id = ? AND p.status = 'PAID'" : 's.client_id = ?'}
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [user.id, limit, (page - 1) * limit],
  );
  const total = rows[0] ? Number(rows[0].total) : 0;
  const data = rows.map(
    ({ total: _t, worker_payout, commission: _c, payout_status, ...r }: Record<string, unknown>) =>
      isWorker ? { ...r, amount: worker_payout, payout_status } : r,
  );
  return { rows: data, meta: { page, limit, total } };
}
