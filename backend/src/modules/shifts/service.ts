import { db, type RawBinding, type Trx } from '../../config/db';
import { getConfig } from '../../config/appConfig';
import { acquireLock, releaseLock } from '../../config/redis';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import { computeBilling } from '../../utils/money';
import { addMinutes, scheduledMinutes } from '../../utils/time';
import type { AuthUser, ShiftStatus } from '../../shared/enums';
import { SHIFT_STATUSES } from '../../shared/enums';
import { getEta } from '../geo/service';
import { announceTransition, sendRequestToWorker } from './announce';
import { SHIFT_DETAIL_FROM, SHIFT_DETAIL_SELECT, toShiftDto } from './dto';
import type { CreateShiftBody, QuoteQuery } from './schema';
import { initialStatus, STATUS_GROUPS } from './stateMachine';
import {
  getShiftRow,
  lockShift,
  lockWorker,
  logShiftEvent,
  transitionShift,
  workerHasOverlap,
  type ActorRef,
  type ShiftRow,
} from './transitions';

const DIRECT_RANGE_M = 10_000; // rule 10 default search radius, reused as the "within range" check for instant bookings
const MIN_MINUTES = 30;
const MAX_MINUTES = 720;

interface BookableWorker {
  hourly_rate: string;
  is_online: boolean;
  lat: number | null;
  lng: number | null;
}

/** Validates that a worker can be booked for [start,end) (TRD section 8: APPROVED, within range, not busy). */
async function assertWorkerBookable(
  conn: Trx | typeof db,
  workerId: string,
  skillId: number,
  window: { start: Date; end: Date; instant: boolean; lat: number; lng: number },
  excludeShiftId?: string,
): Promise<BookableWorker> {
  const { rows } = await conn.raw(
    `SELECT u.status, wp.verification, wp.hourly_rate, wp.is_online,
            ST_Y(wp.location::geometry) AS lat, ST_X(wp.location::geometry) AS lng,
            EXISTS (SELECT 1 FROM worker_skills ws WHERE ws.worker_id = u.id AND ws.skill_id = ?) AS has_skill,
            CASE WHEN wp.location IS NULL THEN NULL
                 ELSE ST_Distance(wp.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) END AS distance_m
       FROM users u JOIN worker_profiles wp ON wp.user_id = u.id
      WHERE u.id = ? AND u.role = 'worker'`,
    [skillId, window.lng, window.lat, workerId],
  );
  const w = rows[0];
  if (!w) throw notFound('Worker not found', 'WORKER_NOT_FOUND');
  const unavailable = (reason: string) =>
    conflict('WORKER_NOT_AVAILABLE', 'This professional cannot take the job', { reason });
  if (w.status !== 'ACTIVE' || w.verification !== 'APPROVED') throw unavailable('NOT_VERIFIED');
  if (!w.has_skill) throw unavailable('SKILL_MISMATCH');
  if (!w.hourly_rate) throw unavailable('NO_RATE');
  if (window.instant) {
    if (!w.is_online) throw unavailable('OFFLINE');
    if (w.distance_m !== null && Number(w.distance_m) > DIRECT_RANGE_M) throw unavailable('OUT_OF_RANGE');
  }
  if (await workerHasOverlap(conn, workerId, window.start, window.end, excludeShiftId))
    throw unavailable('BUSY');
  return { hourly_rate: w.hourly_rate, is_online: w.is_online, lat: w.lat, lng: w.lng };
}

function resolveWindow(
  b: { is_instant: boolean; start_at?: Date; end_at?: Date; duration_minutes?: number },
  now = new Date(),
) {
  let start: Date;
  let end: Date;
  if (b.is_instant) {
    start = now;
    end = addMinutes(now, b.duration_minutes!);
  } else {
    start = b.start_at!;
    end = b.end_at ?? addMinutes(start, b.duration_minutes!);
    if (start <= now) throw badRequest('START_IN_PAST', 'start_at must be in the future');
  }
  const mins = scheduledMinutes(start, end);
  if (mins < MIN_MINUTES || mins > MAX_MINUTES) {
    throw badRequest(
      'INVALID_DURATION',
      `A shift must last between ${MIN_MINUTES} minutes and ${MAX_MINUTES / 60} hours`,
    );
  }
  return { start, end, minutes: mins };
}

async function requestSummary(shift: ShiftRow, workerId: string, distance?: number | null) {
  const skill = shift.skill_id
    ? await db('skills').where({ id: shift.skill_id }).first<{ name: string }>('name')
    : null;
  return {
    shiftId: shift.id,
    mode: shift.mode,
    skill: skill?.name ?? null,
    start_at: shift.start_at,
    end_at: shift.end_at,
    hours: scheduledMinutes(shift.start_at, shift.end_at) / 60,
    hourly_rate: shift.hourly_rate,
    distance_m: distance ?? null,
    workerId,
  };
}

export async function createShift(client: AuthUser, body: CreateShiftBody) {
  const skill = await db('skills').where({ id: body.skill_id, active: true }).first('id');
  if (!skill) throw badRequest('INVALID_SKILL', 'Unknown or inactive skill');
  const { start, end } = resolveWindow(body);
  const ttl = await getConfig('request_ttl_min');
  const now = new Date();

  const shift = await db.transaction(async (trx) => {
    let rate: string;
    if (body.mode === 'DIRECT') {
      if (body.worker_id === client.id) throw badRequest('INVALID_WORKER', 'You cannot book yourself');
      rate = (
        await assertWorkerBookable(trx, body.worker_id!, body.skill_id, {
          start,
          end,
          instant: body.is_instant,
          lat: body.lat,
          lng: body.lng,
        })
      ).hourly_rate;
    } else {
      rate = body.hourly_rate!.toFixed(2); // the client's own offer; there is no worker rate to derive it from
    }
    const status = initialStatus(body.mode);
    const expires = body.mode === 'DIRECT' || body.is_instant ? addMinutes(now, ttl) : start;
    const { rows } = await trx.raw(
      `INSERT INTO shifts (client_id, worker_id, skill_id, mode, title, description, materials, start_at, end_at, is_instant,
                           address, location, hourly_rate, status, request_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?, ?, ?)
       RETURNING id`,
      [
        client.id,
        (body.mode === 'DIRECT' ? body.worker_id : null) as string | null,
        body.skill_id,
        body.mode,
        body.title ?? null,
        body.description ?? null,
        body.materials ?? null,
        start.toISOString(),
        end.toISOString(),
        body.is_instant,
        body.address,
        body.lng,
        body.lat,
        rate,
        status,
        expires.toISOString(),
      ],
    );
    await logShiftEvent(trx, rows[0].id, client.id, `STATUS:${status}`, {
      from: null,
      to: status as ShiftStatus,
      lat: body.lat,
      lng: body.lng,
      meta: { actor_type: 'client', mode: body.mode },
    });
    return getShiftRow(rows[0].id, trx);
  });

  if (shift.mode === 'DIRECT') {
    await sendRequestToWorker(shift.worker_id!, await requestSummary(shift, shift.worker_id!));
  } else {
    await broadcastOpenShift(shift, body.lat, body.lng);
  }
  return getShiftDetail(client, shift.id);
}

/** OPEN mode (stretch): tell nearby, online, verified workers with the right skill. First to accept wins. */
async function broadcastOpenShift(shift: ShiftRow, lat: number, lng: number) {
  const { rows } = await db.raw(
    `SELECT wp.user_id, ST_Distance(wp.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) AS distance_m
       FROM worker_profiles wp JOIN users u ON u.id = wp.user_id
      WHERE wp.verification = 'APPROVED' AND wp.is_online AND u.status = 'ACTIVE' AND wp.location IS NOT NULL
        AND ST_DWithin(wp.location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)
        AND EXISTS (SELECT 1 FROM worker_skills ws WHERE ws.worker_id = wp.user_id AND ws.skill_id = ?)
      ORDER BY distance_m LIMIT 50`,
    [lng, lat, lng, lat, DIRECT_RANGE_M, shift.skill_id],
  );
  for (const r of rows)
    await sendRequestToWorker(
      r.user_id,
      await requestSummary(shift, r.user_id, Math.round(Number(r.distance_m))),
    );
}

export async function getQuote(client: AuthUser, q: QuoteQuery) {
  const w = await db('worker_profiles')
    .where({ user_id: q.workerId })
    .first<{ hourly_rate: string | null } | undefined>('hourly_rate');
  if (!w || !w.hourly_rate) throw notFound('Worker not found', 'WORKER_NOT_FOUND');
  let minutes: number;
  if (q.start && q.end) minutes = scheduledMinutes(new Date(q.start), new Date(q.end));
  else if (q.duration_minutes) minutes = q.duration_minutes;
  else throw badRequest('MISSING_DURATION', 'Provide start and end, or duration_minutes');
  if (minutes < MIN_MINUTES || minutes > MAX_MINUTES)
    throw badRequest('INVALID_DURATION', 'Duration out of range');
  const pct = await getConfig('commission_pct');
  const b = computeBilling(minutes, w.hourly_rate, pct);
  return {
    estimate: true,
    currency: 'INR',
    hourly_rate: w.hourly_rate,
    scheduled_minutes: minutes,
    billable_minutes: minutes,
    gross: b.gross,
    total: b.gross,
  };
}

export async function getShiftDetail(viewer: AuthUser, id: string) {
  const { rows } = await db.raw(`SELECT ${SHIFT_DETAIL_SELECT} ${SHIFT_DETAIL_FROM()} WHERE s.id = ?`, [
    viewer.id,
    id,
  ]);
  const row = rows[0];
  if (!row) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  const mine = row.client_id === viewer.id || row.worker_id === viewer.id;
  let visible = mine;
  if (!mine && viewer.role === 'worker' && row.status === 'OPEN') {
    const ok = await db.raw(
      `SELECT 1 FROM worker_profiles wp JOIN worker_skills ws ON ws.worker_id = wp.user_id AND ws.skill_id = ?
        WHERE wp.user_id = ? AND wp.verification = 'APPROVED'`,
      [row.skill_id, viewer.id],
    );
    visible = ok.rows.length > 0;
  }
  if (!visible) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  return toShiftDto(row, viewer, await getConfig('commission_pct'));
}

function parseStatusFilter(raw?: string): ShiftStatus[] | null {
  if (!raw) return null;
  const out = new Set<ShiftStatus>();
  for (const tok of raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) {
    if (STATUS_GROUPS[tok.toLowerCase()]) STATUS_GROUPS[tok.toLowerCase()].forEach((s) => out.add(s));
    else if ((SHIFT_STATUSES as readonly string[]).includes(tok.toUpperCase()))
      out.add(tok.toUpperCase() as ShiftStatus);
    else throw badRequest('INVALID_STATUS', `Unknown status or group: ${tok}`);
  }
  return [...out];
}

/** Lists for either party. Workers asking for "incoming"/"upcoming" also see matching OPEN shifts nearby (stretch mode). */
export async function listShiftsFor(viewer: AuthUser, q: { status?: string; page: number; limit: number }) {
  const statuses = parseStatusFilter(q.status);
  const isWorker = viewer.role === 'worker';
  const where: string[] = [];
  const own = isWorker ? 's.worker_id = ?' : 's.client_id = ?';
  const wantsOpen = isWorker && (!statuses || statuses.includes('OPEN'));
  const openClause = `(s.status = 'OPEN' AND s.mode = 'OPEN' AND wp_me.verification = 'APPROVED' AND wp_me.is_online
      AND wp_me.location IS NOT NULL AND ST_DWithin(s.location, wp_me.location, ${DIRECT_RANGE_M})
      AND EXISTS (SELECT 1 FROM worker_skills ws WHERE ws.worker_id = ? AND ws.skill_id = s.skill_id))`;

  const ownParams: RawBinding[] = [viewer.id];
  let scope = `${own}`;
  if (wantsOpen) {
    scope = `(${own} OR ${openClause})`;
    ownParams.push(viewer.id);
  }
  where.push(scope);
  if (statuses) {
    where.push(`s.status IN (${statuses.map(() => '?').join(',')})`);
    ownParams.push(...statuses);
  }
  const ascending = !!statuses && statuses.every((s) => ['OPEN', 'REQUESTED', 'ACCEPTED'].includes(s));
  const base = `${SHIFT_DETAIL_FROM()} LEFT JOIN worker_profiles wp_me ON wp_me.user_id = ?::uuid WHERE ${where.join(' AND ')}`;
  // param order follows placeholder order in the SQL: viewer (vwp), viewer (wp_me), scope params...
  const sqlParams = [viewer.id, viewer.id, ...ownParams];
  const { rows } = await db.raw(
    `SELECT ${SHIFT_DETAIL_SELECT}, count(*) OVER() AS total ${base}
      ORDER BY ${ascending ? 's.start_at ASC' : 's.created_at DESC'} LIMIT ? OFFSET ?`,
    [...sqlParams, q.limit, (q.page - 1) * q.limit],
  );
  const pct = await getConfig('commission_pct');
  const data = await Promise.all(rows.map((r: Record<string, unknown>) => toShiftDto(r, viewer, pct)));
  return { rows: data, meta: { page: q.page, limit: q.limit, total: rows[0] ? Number(rows[0].total) : 0 } };
}

// ---------------------------------------------------------------- worker actions

/** Accept: Redis lock (SET NX EX 10), then re-check status inside a transaction (TRD section 8). */
export async function acceptShift(worker: AuthUser, shiftId: string) {
  const lockKey = `lock:shift:${shiftId}`;
  const token = await acquireLock(lockKey, 10);
  if (!token)
    throw conflict('SHIFT_CONFLICT', 'Another response to this shift is being processed. Try again.');
  const actor: ActorRef = { type: 'worker', id: worker.id };
  let updated: ShiftRow;
  try {
    updated = await db.transaction(async (trx) => {
      await lockWorker(trx, worker.id);
      const shift = await lockShift(trx, shiftId);
      if (shift.mode === 'DIRECT' && shift.worker_id !== worker.id)
        throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
      if (!['REQUESTED', 'OPEN'].includes(shift.status)) {
        throw conflict('SHIFT_CONFLICT', 'This shift is no longer available', { status: shift.status });
      }
      if (shift.request_expires_at && shift.request_expires_at < new Date()) {
        throw conflict('REQUEST_EXPIRED', 'This request has expired');
      }
      const p = await trx('worker_profiles')
        .where({ user_id: worker.id })
        .first<{ verification: string }>('verification');
      if (p?.verification !== 'APPROVED')
        throw forbidden('Your profile must be verified before you can accept jobs', 'NOT_VERIFIED', {
          verification: p?.verification,
        });
      if (shift.mode === 'OPEN') {
        const skillOk = await trx('worker_skills')
          .where({ worker_id: worker.id, skill_id: shift.skill_id })
          .first('worker_id');
        if (!skillOk)
          throw conflict('WORKER_NOT_AVAILABLE', 'This job needs a skill you do not have', {
            reason: 'SKILL_MISMATCH',
          });
      }
      if (await workerHasOverlap(trx, worker.id, shift.start_at, shift.end_at, shift.id)) {
        throw conflict('WORKER_NOT_AVAILABLE', 'You already have a job in this time slot', {
          reason: 'BUSY',
        });
      }
      return transitionShift(trx, shift, 'ACCEPTED', actor, {
        set: { worker_id: worker.id, request_expires_at: null },
        meta: { mode: shift.mode },
      });
    });
  } finally {
    await releaseLock(lockKey, token);
  }
  await announceTransition(updated, actor);
  return getShiftDetail(worker, shiftId);
}

export async function declineShift(worker: AuthUser, shiftId: string) {
  const actor: ActorRef = { type: 'worker', id: worker.id };
  const updated = await db.transaction(async (trx) => {
    const shift = await lockShift(trx, shiftId);
    if (shift.worker_id !== worker.id) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    return transitionShift(trx, shift, 'DECLINED', actor);
  });
  await announceTransition(updated, actor);
  return getShiftDetail(worker, shiftId);
}

export async function markEnRoute(worker: AuthUser, shiftId: string, pos?: { lat?: number; lng?: number }) {
  const actor: ActorRef = { type: 'worker', id: worker.id };
  const updated = await db.transaction(async (trx) => {
    const shift = await lockShift(trx, shiftId);
    if (shift.worker_id !== worker.id) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    return transitionShift(trx, shift, 'EN_ROUTE', actor, { lat: pos?.lat, lng: pos?.lng });
  });
  let eta: unknown = null;
  if (pos?.lat !== undefined && pos.lng !== undefined) {
    const { rows } = await db.raw(
      `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM shifts WHERE id = ?`,
      [shiftId],
    );
    eta = await getEta({ lat: pos.lat, lng: pos.lng }, { lat: rows[0].lat, lng: rows[0].lng }).catch(
      () => null,
    );
  }
  await announceTransition(updated, actor, eta ? { eta } : {});
  return { shift: await getShiftDetail(worker, shiftId), eta };
}

// ---------------------------------------------------------------- cancel / reassign

export async function cancelShift(user: AuthUser, shiftId: string, reason: string) {
  const type = user.role === 'worker' ? 'worker' : 'client';
  const actor: ActorRef = { type, id: user.id };
  const updated = await db.transaction(async (trx) => {
    const shift = await lockShift(trx, shiftId);
    const owns = type === 'client' ? shift.client_id === user.id : shift.worker_id === user.id;
    if (!owns) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    // Cancelling after acceptance is allowed but flagged for admin review (TRD section 8).
    const flagged = shift.status === 'ACCEPTED';
    return transitionShift(trx, shift, 'CANCELLED', actor, {
      meta: { reason, cancelled_by: type, flagged_for_review: flagged },
    });
  });
  await announceTransition(updated, actor);
  return getShiftDetail(user, shiftId);
}

/** Client (after DECLINED/EXPIRED) or admin picks another worker; OPEN shifts are simply reopened. */
export async function reassignShift(actor: ActorRef, shiftId: string, workerId?: string) {
  const updated = await db.transaction(async (trx) => {
    const shift = await lockShift(trx, shiftId);
    if (actor.type === 'client' && shift.client_id !== actor.id)
      throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
    const loc = (
      await trx.raw(
        `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng FROM shifts WHERE id = ?`,
        [shift.id],
      )
    ).rows[0];
    const ttl = await getConfig('request_ttl_min');
    const now = new Date();

    if (shift.mode === 'OPEN') {
      if (workerId) throw badRequest('INVALID_WORKER', 'OPEN shifts are reopened without choosing a worker');
      const expires = shift.is_instant ? addMinutes(now, ttl) : shift.start_at;
      return {
        row: await transitionShift(trx, shift, 'OPEN', actor, {
          set: { worker_id: null, request_expires_at: expires },
          meta: { reopened: true },
        }),
        loc,
      };
    }
    if (!workerId) throw badRequest('WORKER_REQUIRED', 'worker_id is required to reassign a DIRECT shift');
    if (workerId === shift.client_id) throw badRequest('INVALID_WORKER', 'You cannot book yourself');
    let start = shift.start_at;
    let end = shift.end_at;
    if (shift.is_instant) {
      const dur = scheduledMinutes(shift.start_at, shift.end_at);
      start = now;
      end = addMinutes(now, dur);
    } else if (start <= now) {
      throw badRequest('START_IN_PAST', 'This shift has already started; create a new booking');
    }
    const w = await assertWorkerBookable(
      trx,
      workerId,
      shift.skill_id!,
      { start, end, instant: shift.is_instant, lat: loc.lat, lng: loc.lng },
      shift.id,
    );
    return {
      row: await transitionShift(trx, shift, 'REQUESTED', actor, {
        set: {
          worker_id: workerId,
          hourly_rate: w.hourly_rate,
          start_at: start,
          end_at: end,
          request_expires_at: addMinutes(now, ttl),
        },
        meta: { previous_worker_id: shift.worker_id },
      }),
      loc,
    };
  });
  const { row } = updated;
  if (row.status === 'REQUESTED')
    await sendRequestToWorker(row.worker_id!, await requestSummary(row, row.worker_id!));
  else await broadcastOpenShift(row, updated.loc.lat, updated.loc.lng);
  await announceTransition(row, actor);
  return row;
}

export async function reassignForClient(client: AuthUser, shiftId: string, workerId?: string) {
  await reassignShift({ type: 'client', id: client.id }, shiftId, workerId);
  return getShiftDetail(client, shiftId);
}

// ---------------------------------------------------------------- system job

/** Cron: REQUESTED/OPEN shifts past request_expires_at become EXPIRED (TRD section 8). Returns how many. */
export async function expireStaleRequests(): Promise<number> {
  const ids = await db('shifts')
    .whereIn('status', ['REQUESTED', 'OPEN'])
    .where('request_expires_at', '<', db.fn.now())
    .limit(200)
    .pluck<string[]>('id');
  let n = 0;
  for (const id of ids) {
    const actor: ActorRef = { type: 'system', id: null };
    const updated = await db.transaction(async (trx) => {
      const shift = await lockShift(trx, id);
      if (
        !['REQUESTED', 'OPEN'].includes(shift.status) ||
        !shift.request_expires_at ||
        shift.request_expires_at >= new Date()
      )
        return null;
      return transitionShift(trx, shift, 'EXPIRED', actor, { meta: { reason: 'no_response' } });
    });
    if (updated) {
      n++;
      await announceTransition(updated, actor);
    }
  }
  return n;
}
