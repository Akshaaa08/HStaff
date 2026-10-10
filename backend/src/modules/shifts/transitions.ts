import { db, type DbOrTrx, type Trx } from '../../config/db';
import { notFound } from '../../utils/errors';
import type { Actor, ShiftMode, ShiftStatus } from '../../shared/enums';
import { assertTransition } from './stateMachine';

export interface ShiftRow {
  id: string;
  client_id: string;
  worker_id: string | null;
  skill_id: number | null;
  mode: ShiftMode;
  title: string | null;
  description: string | null;
  materials: string | null;
  start_at: Date;
  end_at: Date;
  is_instant: boolean;
  address: string | null;
  hourly_rate: string;
  status: ShiftStatus;
  request_expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// location is geography: it is only ever read through ST_X/ST_Y, never selected raw.
export const SHIFT_COLUMNS = [
  'id',
  'client_id',
  'worker_id',
  'skill_id',
  'mode',
  'title',
  'description',
  'materials',
  'start_at',
  'end_at',
  'is_instant',
  'address',
  'hourly_rate',
  'status',
  'request_expires_at',
  'created_at',
  'updated_at',
];

export interface ActorRef {
  type: Actor;
  id: string | null;
}

/** SELECT ... FOR UPDATE inside the caller's transaction. */
export async function lockShift(trx: Trx, id: string): Promise<ShiftRow> {
  const row = await trx('shifts').where({ id }).forUpdate().first<ShiftRow | undefined>(SHIFT_COLUMNS);
  if (!row) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  return row;
}

export async function getShiftRow(id: string, conn: DbOrTrx = db): Promise<ShiftRow> {
  const row = await conn('shifts').where({ id }).first<ShiftRow | undefined>(SHIFT_COLUMNS);
  if (!row) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  return row;
}

export interface EventOptions {
  event?: string;
  lat?: number;
  lng?: number;
  meta?: Record<string, unknown>;
}

export async function logShiftEvent(
  trx: DbOrTrx,
  shiftId: string,
  actorId: string | null,
  event: string,
  extra: EventOptions & { from?: ShiftStatus | null; to?: ShiftStatus | null } = {},
) {
  await trx('shift_events').insert({
    shift_id: shiftId,
    actor_id: actorId,
    event,
    from_status: extra.from ?? null,
    to_status: extra.to ?? null,
    lat: extra.lat ?? null,
    lng: extra.lng ?? null,
    meta: extra.meta ?? {},
  });
}

/**
 * The only way a shift's status changes: validates against the transition table (409 if illegal),
 * updates the row and appends a shift_events row, all inside the caller's transaction (TRD section 8).
 * Emitting sockets / pushes is done by the caller after commit via announceTransition().
 */
export async function transitionShift(
  trx: Trx,
  shift: ShiftRow,
  to: ShiftStatus,
  actor: ActorRef,
  opts: EventOptions & { set?: Record<string, unknown> } = {},
): Promise<ShiftRow> {
  assertTransition(shift.status, to, actor.type);
  const [updated] = await trx('shifts')
    .where({ id: shift.id })
    .update({ status: to, updated_at: trx.fn.now(), ...(opts.set ?? {}) })
    .returning<ShiftRow[]>(SHIFT_COLUMNS);
  await logShiftEvent(trx, shift.id, actor.id, opts.event ?? `STATUS:${to}`, {
    from: shift.status,
    to,
    lat: opts.lat,
    lng: opts.lng,
    meta: { actor_type: actor.type, ...(opts.meta ?? {}) },
  });
  return updated;
}

/** True when the worker already has a committed shift overlapping [start, end). */
export async function workerHasOverlap(
  conn: DbOrTrx,
  workerId: string,
  start: Date,
  end: Date,
  excludeShiftId?: string,
): Promise<boolean> {
  const { rows } = await conn.raw(
    `SELECT 1 FROM shifts
      WHERE worker_id = ? AND status IN ('ACCEPTED','EN_ROUTE','ARRIVED','IN_PROGRESS')
        AND (?::uuid IS NULL OR id <> ?::uuid)
        AND tstzrange(start_at, end_at, '[)') && tstzrange(?::timestamptz, ?::timestamptz, '[)')
      LIMIT 1`,
    [workerId, excludeShiftId ?? null, excludeShiftId ?? null, start.toISOString(), end.toISOString()],
  );
  return rows.length > 0;
}

/** Serialises concurrent accepts/assignments for the same worker so two overlapping jobs cannot both slip through. */
export async function lockWorker(trx: Trx, workerId: string): Promise<void> {
  await trx.raw(`SELECT pg_advisory_xact_lock(hashtext(?))`, [`worker:${workerId}`]);
}
