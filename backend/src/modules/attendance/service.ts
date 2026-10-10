import { db, type Trx } from '../../config/db';
import { getConfig } from '../../config/appConfig';
import { AppError, badRequest, conflict, forbidden, notFound, tooMany } from '../../utils/errors';
import { suspiciousLocationReason } from '../../utils/geo';
import { isLocked, issueOtp, lockTtl, verifyOtp } from '../../utils/otp';
import { redis } from '../../config/redis';
import { EVENTS } from '../../realtime/events';
import { emitToUser } from '../../realtime/socket';
import { notifyUser } from '../notifications/service';
import { announceTransition } from '../shifts/announce';
import { getShiftDetail } from '../shifts/service';
import { assertTransition } from '../shifts/stateMachine';
import {
  lockShift,
  logShiftEvent,
  transitionShift,
  type ActorRef,
  type ShiftRow,
} from '../shifts/transitions';
import { closeTimesheet, openTimesheet } from '../timesheets/service';
import type { AuthUser } from '../../shared/enums';
import type { Fix } from './schema';

const OTP_TTL_SEC = 2 * 60 * 60;
const EARLY_ARRIVAL_MIN = 60;
const startKey = (id: string) => `otp:start:${id}`;
const endKey = (id: string) => `otp:end:${id}`;

async function ownShift(trx: Trx, worker: AuthUser, id: string): Promise<ShiftRow> {
  const shift = await lockShift(trx, id);
  if (shift.worker_id !== worker.id) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  return shift;
}

function assertFixPlausible(fix: Fix) {
  const reason = suspiciousLocationReason(fix);
  if (reason)
    throw badRequest(reason, 'This location looks unreliable. Turn off mock locations and try again.');
}

/** Rule 3: ST_DWithin(shift.location, point, GEOFENCE_RADIUS_M) using the coordinates sent with the request. */
async function assertWithinGeofence(trx: Trx, shiftId: string, fix: Fix) {
  const radius = await getConfig('geofence_m');
  const { rows } = await trx.raw(
    `SELECT ST_Distance(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS d FROM shifts WHERE id = ?`,
    [fix.lng, fix.lat, shiftId],
  );
  const d = Number(rows[0].d);
  if (d > radius)
    throw forbidden('You are too far from the job location', 'OUTSIDE_GEOFENCE', {
      distance_m: Math.round(d),
      radius_m: radius,
    });
  return d;
}

function assertOtpResult(r: Awaited<ReturnType<typeof verifyOtp>>) {
  if (r.result === 'ok') return;
  if (r.result === 'locked')
    throw tooMany('OTP_LOCKED', 'Too many wrong codes. Try again later.', {
      retry_after_sec: r.retryAfterSec,
    });
  if (r.result === 'expired')
    throw badRequest('OTP_NOT_ISSUED', 'There is no active code. Ask for a new one.');
  throw new AppError(400, 'INVALID_OTP', 'That code does not match', { attempts_remaining: r.remaining });
}

/** OTPs live only in Redis and are pushed to the client (never to the worker, never stored in Postgres). */
async function deliverOtp(shift: ShiftRow, type: 'start' | 'end', code: string) {
  emitToUser(shift.client_id, EVENTS.shiftOtp, { shiftId: shift.id, type, otp: code });
  const label = type === 'start' ? 'start' : 'completion';
  await notifyUser(
    shift.client_id,
    {
      title: `Your ${label} code is ready`,
      body: 'Open H-Staff to see it. Only share it in person.',
      data: { shiftId: shift.id, type },
    },
    {
      title: `Your ${label} code`,
      body: `Your ${label} code is ${code}. Share it only in person.`,
      data: { shiftId: shift.id, type },
    },
  );
}

export async function arrive(worker: AuthUser, shiftId: string, fix: Fix) {
  assertFixPlausible(fix);
  const actor: ActorRef = { type: 'worker', id: worker.id };
  const result = await db.transaction(async (trx) => {
    const shift = await ownShift(trx, worker, shiftId);
    const reissue = shift.status === 'ARRIVED'; // idempotent: arriving again re-issues the code (e.g. client lost it)
    if (!reissue) assertTransition(shift.status, 'ARRIVED', 'worker');
    if (Date.now() < shift.start_at.getTime() - EARLY_ARRIVAL_MIN * 60_000) {
      throw conflict(
        'TOO_EARLY',
        `You can check in up to ${EARLY_ARRIVAL_MIN} minutes before the start time`,
      );
    }
    await assertWithinGeofence(trx, shiftId, fix);
    if (await isLocked(startKey(shiftId))) {
      throw tooMany('OTP_LOCKED', 'Too many wrong codes. Try again later.', {
        retry_after_sec: await lockTtl(startKey(shiftId)),
      });
    }
    const code = await issueOtp(startKey(shiftId), OTP_TTL_SEC);
    if (reissue) {
      await logShiftEvent(trx, shiftId, worker.id, 'START_OTP_REISSUED', { lat: fix.lat, lng: fix.lng });
      return { shift, code, changed: false };
    }
    const updated = await transitionShift(trx, shift, 'ARRIVED', actor, { lat: fix.lat, lng: fix.lng });
    return { shift: updated, code, changed: true };
  });
  await deliverOtp(result.shift, 'start', result.code);
  if (result.changed) await announceTransition(result.shift, actor);
  return getShiftDetail(worker, shiftId);
}

export async function start(worker: AuthUser, shiftId: string, body: Fix & { otp: string }) {
  assertFixPlausible(body);
  const actor: ActorRef = { type: 'worker', id: worker.id };
  const updated = await db.transaction(async (trx) => {
    const shift = await ownShift(trx, worker, shiftId);
    assertTransition(shift.status, 'IN_PROGRESS', 'worker');
    await assertWithinGeofence(trx, shiftId, body);
    assertOtpResult(await verifyOtp(startKey(shiftId), body.otp));
    const clockIn = new Date(); // server time only (rule 4)
    await openTimesheet(trx, shiftId, clockIn);
    return transitionShift(trx, shift, 'IN_PROGRESS', actor, {
      event: 'CLOCK_IN',
      lat: body.lat,
      lng: body.lng,
      meta: { clock_in_at: clockIn.toISOString() },
    });
  });
  await announceTransition(updated, actor);
  return getShiftDetail(worker, shiftId);
}

export async function requestEndOtp(worker: AuthUser, shiftId: string) {
  const shift = await db.transaction(async (trx) => {
    const s = await ownShift(trx, worker, shiftId);
    if (s.status !== 'IN_PROGRESS')
      throw conflict('ILLEGAL_TRANSITION', 'The job must be in progress to request the completion code', {
        status: s.status,
      });
    if (await isLocked(endKey(shiftId))) {
      throw tooMany('OTP_LOCKED', 'Too many wrong codes. Try again later.', {
        retry_after_sec: await lockTtl(endKey(shiftId)),
      });
    }
    await logShiftEvent(trx, shiftId, worker.id, 'END_OTP_REQUESTED');
    return s;
  });
  const code = await issueOtp(endKey(shiftId), OTP_TTL_SEC);
  await deliverOtp(shift, 'end', code);
  return { requested: true };
}

export async function end(worker: AuthUser, shiftId: string, body: Fix & { otp: string }) {
  assertFixPlausible(body);
  const actor: ActorRef = { type: 'worker', id: worker.id };
  const { updated, billing } = await db.transaction(async (trx) => {
    const shift = await ownShift(trx, worker, shiftId);
    assertTransition(shift.status, 'AWAITING_APPROVAL', 'worker');
    assertOtpResult(await verifyOtp(endKey(shiftId), body.otp));
    const clockOut = new Date();
    const billing = await closeTimesheet(trx, shift, clockOut);
    const row = await transitionShift(trx, shift, 'AWAITING_APPROVAL', actor, {
      event: 'CLOCK_OUT',
      lat: body.lat,
      lng: body.lng,
      meta: {
        clock_out_at: clockOut.toISOString(),
        verified_minutes: billing.verified,
        billable_minutes: billing.billable,
      },
    });
    return { updated: row, billing };
  });
  emitToUser(updated.client_id, EVENTS.timesheetReady, {
    shiftId,
    gross: billing.gross,
    deadline: billing.approval_deadline,
  });
  await announceTransition(updated, actor);
  return getShiftDetail(worker, shiftId);
}

/** Client reads the code to read out to the worker in person. */
export async function getCurrentOtp(client: AuthUser, shiftId: string) {
  const shift = await db('shifts')
    .where({ id: shiftId, client_id: client.id })
    .first<{ status: string } | undefined>('status');
  if (!shift) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  const type = shift.status === 'ARRIVED' ? 'start' : shift.status === 'IN_PROGRESS' ? 'end' : null;
  const key = type === 'start' ? startKey(shiftId) : type === 'end' ? endKey(shiftId) : null;
  const otp = key ? await redis.get(key) : null;
  if (!type || !key || !otp) throw notFound('There is no active code right now', 'NO_OTP');
  return { type, otp, expires_in_sec: Math.max(0, await redis.ttl(key)) };
}
