import { db, type Trx } from '../../config/db';
import { getConfig } from '../../config/appConfig';
import { notFound } from '../../utils/errors';
import { computeBilling } from '../../utils/money';
import { addHours, billableMinutes, diffMinutesFloor, scheduledMinutes } from '../../utils/time';
import { announceTransition } from '../shifts/announce';
import { getShiftDetail } from '../shifts/service';
import { lockShift, transitionShift, type ActorRef, type ShiftRow } from '../shifts/transitions';
import type { AuthUser } from '../../shared/enums';

export async function openTimesheet(trx: Trx, shiftId: string, clockIn: Date) {
  await trx('timesheets').insert({ shift_id: shiftId, clock_in_at: clockIn, status: 'PENDING' });
}

/** Rules 4-6 of TRD section 9: times come from the server, hours are rounded up to 15 and capped, money is exact. */
export async function closeTimesheet(trx: Trx, shift: ShiftRow, clockOut: Date) {
  const ts = await trx('timesheets')
    .where({ shift_id: shift.id })
    .forUpdate()
    .first<{ clock_in_at: Date } | undefined>();
  if (!ts) throw notFound('Timesheet not found');
  const verified = diffMinutesFloor(ts.clock_in_at, clockOut);
  const billable = billableMinutes(verified, scheduledMinutes(shift.start_at, shift.end_at));
  const pct = await getConfig('commission_pct');
  const sla = await getConfig('approval_sla_hours');
  const money = computeBilling(billable, shift.hourly_rate, pct);
  const deadline = addHours(clockOut, sla);
  await trx('timesheets').where({ shift_id: shift.id }).update({
    clock_out_at: clockOut,
    verified_minutes: verified,
    billable_minutes: billable,
    gross: money.gross,
    commission: money.commission,
    worker_payout: money.worker_payout,
    approval_deadline: deadline,
    status: 'PENDING',
  });
  return { verified, billable, ...money, approval_deadline: deadline };
}

export async function approveShift(client: AuthUser, shiftId: string) {
  const actor: ActorRef = { type: 'client', id: client.id };
  const updated = await db.transaction(async (trx) => {
    const shift = await lockShift(trx, shiftId);
    if (shift.client_id !== client.id) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    const row = await transitionShift(trx, shift, 'APPROVED', actor);
    await trx('timesheets').where({ shift_id: shiftId }).update({ status: 'APPROVED' });
    return row;
  });
  await announceTransition(updated, actor);
  return getShiftDetail(client, shiftId);
}

/** Cron: AWAITING_APPROVAL past approval_deadline becomes APPROVED / AUTO_APPROVED, and it is logged (rule 7). */
export async function autoApproveOverdue(): Promise<number> {
  const ids = await db('timesheets as t')
    .join('shifts as s', 's.id', 't.shift_id')
    .where('s.status', 'AWAITING_APPROVAL')
    .where('t.status', 'PENDING')
    .where('t.approval_deadline', '<', db.fn.now())
    .limit(200)
    .pluck<string[]>('s.id');
  let n = 0;
  for (const id of ids) {
    const actor: ActorRef = { type: 'system', id: null };
    const updated = await db.transaction(async (trx) => {
      const shift = await lockShift(trx, id);
      const ts = await trx('timesheets')
        .where({ shift_id: id })
        .forUpdate()
        .first<{ status: string; approval_deadline: Date }>();
      if (
        shift.status !== 'AWAITING_APPROVAL' ||
        ts.status !== 'PENDING' ||
        ts.approval_deadline >= new Date()
      )
        return null;
      const row = await transitionShift(trx, shift, 'APPROVED', actor, {
        meta: { auto_approved: true, reason: 'approval_sla_elapsed' },
      });
      await trx('timesheets').where({ shift_id: id }).update({ status: 'AUTO_APPROVED' });
      return row;
    });
    if (updated) {
      n++;
      await announceTransition(updated, actor, { auto_approved: true });
    }
  }
  return n;
}
