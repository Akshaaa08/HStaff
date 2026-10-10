import { db, type DbOrTrx, type RawBinding } from '../../config/db';
import { CONFIG_KEYS, getAllConfig, type ConfigKey } from '../../config/appConfig';
import { KYC_BUCKET, storage } from '../../config/storage';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import { hashPassword } from '../auth/service';
import { revokeAllRefreshTokens } from '../auth/tokens';
import { signedKycDocuments } from '../kyc/service';
import { notifyMany, notifyUser } from '../notifications/service';
import { recomputeWorkerRating } from '../reviews/service';
import { announceTransition } from '../shifts/announce';
import { reassignShift } from '../shifts/service';
import { lockShift, logShiftEvent, transitionShift, type ActorRef } from '../shifts/transitions';
import * as skills from '../skills/service';
import type { AuthUser } from '../../shared/enums';

export async function audit(
  conn: DbOrTrx,
  admin: AuthUser,
  action: string,
  targetType: string,
  targetId: string | number | null,
  meta: Record<string, unknown> = {},
) {
  await conn('admin_audit_log').insert({
    admin_id: admin.id,
    action,
    target_type: targetType,
    target_id: targetId === null ? null : String(targetId),
    meta,
  });
}

const like = (s: string) => `%${s.replace(/[%_\\]/g, '\\$&')}%`;
const pageOf = (page: number, limit: number) => ({ limit, offset: (page - 1) * limit });
const stripTotal = (rows: Record<string, unknown>[]) => ({
  rows: rows.map(({ total: _t, ...r }) => r),
  total: rows[0] ? Number(rows[0].total) : 0,
});

// ------------------------------------------------------------------ dashboard
export async function dashboard() {
  const one = async (sql: string) => (await db.raw(sql)).rows[0];
  const counts = await one(`SELECT
      (SELECT count(*) FROM users WHERE role='client')::int AS clients,
      (SELECT count(*) FROM users WHERE role='worker')::int AS workers,
      (SELECT count(*) FROM worker_profiles WHERE is_online)::int AS workers_online,
      (SELECT count(*) FROM shifts)::int AS shifts_total,
      (SELECT count(*) FROM shifts WHERE status IN ('ACCEPTED','EN_ROUTE','ARRIVED','IN_PROGRESS','AWAITING_APPROVAL','APPROVED'))::int AS shifts_active,
      (SELECT count(*) FROM worker_profiles WHERE verification IN ('PENDING','NEEDS_INFO'))::int AS pending_verifications,
      (SELECT count(*) FROM disputes WHERE status IN ('OPEN','IN_REVIEW','ESCALATED'))::int AS open_disputes`);
  const revenue = await one(`SELECT
      COALESCE(SUM(p.amount) FILTER (WHERE p.status='PAID'),0)::text AS gmv,
      COALESCE(SUM(t.commission) FILTER (WHERE p.status='PAID'),0)::text AS commission,
      COALESCE(SUM(t.worker_payout) FILTER (WHERE p.status='PAID' AND p.payout_status='PENDING'),0)::text AS payouts_pending,
      COALESCE(SUM(t.worker_payout) FILTER (WHERE p.status='PAID' AND p.payout_status='SETTLED'),0)::text AS payouts_settled
      FROM payments p LEFT JOIN timesheets t ON t.shift_id = p.shift_id`);
  const byStatus = (
    await db.raw(`SELECT status, count(*)::int AS count FROM shifts GROUP BY status ORDER BY status`)
  ).rows;
  const perDay = (
    await db.raw(
      `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
            (SELECT count(*)::int FROM shifts s WHERE s.created_at::date = d::date) AS bookings,
            COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.status='PAID' AND p.created_at::date = d::date),0)::text AS revenue
       FROM generate_series(current_date - 13, current_date, interval '1 day') d ORDER BY d`,
    )
  ).rows;
  return { counts, revenue, shifts_by_status: byStatus, per_day: perDay };
}

// ------------------------------------------------------------------ workers / KYC
export async function listWorkers(f: { verification?: string; q?: string; page: number; limit: number }) {
  const where = ["u.role = 'worker'"];
  const params: RawBinding[] = [];
  if (f.verification) {
    where.push('wp.verification = ?');
    params.push(f.verification);
  }
  if (f.q) {
    where.push('(u.name ILIKE ? OR u.phone ILIKE ?)');
    params.push(like(f.q), like(f.q));
  }
  const { rows } = await db.raw(
    `SELECT u.id, u.name, u.phone, u.status, u.created_at, wp.verification, wp.is_online, wp.hourly_rate, wp.rating_avg, wp.rating_count,
            (SELECT count(*)::int FROM kyc_documents k WHERE k.worker_id = u.id) AS kyc_documents, count(*) OVER() AS total
       FROM users u JOIN worker_profiles wp ON wp.user_id = u.id WHERE ${where.join(' AND ')}
      ORDER BY (wp.verification = 'PENDING') DESC, u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function workerDetail(admin: AuthUser, id: string) {
  const { rows } = await db.raw(
    `SELECT u.id, u.name, u.phone, u.email, u.photo_url, u.status, u.created_at, wp.bio, wp.experience_years, wp.hourly_rate, wp.equipment,
            wp.is_online, wp.verification, wp.verification_note, wp.rating_avg, wp.rating_count, wp.upi_id, wp.age,
            COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name)) FROM worker_skills ws JOIN skills s ON s.id = ws.skill_id WHERE ws.worker_id = u.id), '[]'::json) AS skills
       FROM users u JOIN worker_profiles wp ON wp.user_id = u.id WHERE u.id = ? AND u.role = 'worker'`,
    [id],
  );
  if (!rows[0]) throw notFound('Worker not found');
  const documents = await signedKycDocuments(id); // short-lived signed URLs, verifier/super_admin only (enforced at the route)
  if (documents.length) await audit(db, admin, 'KYC_VIEW', 'worker', id, { documents: documents.length });
  return { ...rows[0], documents };
}

export async function verifyWorker(
  admin: AuthUser,
  id: string,
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO',
  note?: string,
) {
  const row = await db.transaction(async (trx) => {
    const w = await trx('worker_profiles')
      .where({ user_id: id })
      .forUpdate()
      .first<{ verification: string } | undefined>('verification');
    if (!w) throw notFound('Worker not found');
    if (decision === 'APPROVED') {
      const [{ n }] = await trx('kyc_documents').where({ worker_id: id }).count<{ n: string }[]>('* as n');
      if (Number(n) === 0) throw conflict('KYC_MISSING', 'The worker has not uploaded any document yet');
    }
    const patch: Record<string, unknown> = { verification: decision, verification_note: note ?? null };
    if (decision !== 'APPROVED') patch.is_online = false; // rule 9: no longer eligible, so take them offline
    await trx('worker_profiles').where({ user_id: id }).update(patch);
    await audit(trx, admin, 'WORKER_VERIFY', 'worker', id, {
      from: w.verification,
      decision,
      note: note ?? null,
    });
    return { id, verification: decision, verification_note: note ?? null };
  });
  const text = {
    APPROVED: 'Your profile is verified. You can go online now.',
    REJECTED: `Your verification was not approved. ${note ?? ''}`,
    NEEDS_INFO: `We need more information. ${note ?? ''}`,
  }[decision];
  await notifyUser(id, { title: 'Verification update', body: text.trim(), data: { verification: decision } });
  return row;
}

// ------------------------------------------------------------------ users
export async function listUsers(f: {
  role?: string;
  status?: string;
  q?: string;
  page: number;
  limit: number;
}) {
  const where = ["u.role IN ('client','worker')"];
  const params: RawBinding[] = [];
  if (f.role) {
    where.push('u.role = ?');
    params.push(f.role);
  }
  if (f.status) {
    where.push('u.status = ?');
    params.push(f.status);
  }
  if (f.q) {
    where.push('(u.name ILIKE ? OR u.phone ILIKE ? OR u.email ILIKE ?)');
    params.push(like(f.q), like(f.q), like(f.q));
  }
  const { rows } = await db.raw(
    `SELECT u.id, u.role, u.name, u.phone, u.email, u.status, u.created_at, count(*) OVER() AS total
       FROM users u WHERE ${where.join(' AND ')} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    [...params, f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function setUserStatus(
  admin: AuthUser,
  id: string,
  status: 'ACTIVE' | 'SUSPENDED',
  reason?: string,
) {
  const user = await db('users')
    .where({ id })
    .whereIn('role', ['client', 'worker'])
    .first<{ id: string; role: string; status: string } | undefined>('id', 'role', 'status');
  if (!user) throw notFound('User not found');
  await db.transaction(async (trx) => {
    await trx('users').where({ id }).update({ status });
    if (status === 'SUSPENDED' && user.role === 'worker')
      await trx('worker_profiles').where({ user_id: id }).update({ is_online: false });
    await audit(trx, admin, status === 'SUSPENDED' ? 'USER_SUSPEND' : 'USER_RESTORE', 'user', id, {
      from: user.status,
      reason: reason ?? null,
    });
  });
  if (status === 'SUSPENDED') await revokeAllRefreshTokens(id); // the access token dies within 15 min and the auth middleware blocks it now
  return { id, status };
}

// ------------------------------------------------------------------ shifts
export async function listShifts(f: {
  status?: string;
  client_id?: string;
  worker_id?: string;
  flagged?: boolean;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  const where: string[] = ['true'];
  const params: RawBinding[] = [];
  if (f.status) {
    where.push('s.status = ?');
    params.push(f.status);
  }
  if (f.client_id) {
    where.push('s.client_id = ?');
    params.push(f.client_id);
  }
  if (f.worker_id) {
    where.push('s.worker_id = ?');
    params.push(f.worker_id);
  }
  if (f.from) {
    where.push('s.start_at >= ?');
    params.push(f.from);
  }
  if (f.to) {
    where.push('s.start_at < ?');
    params.push(f.to);
  }
  if (f.flagged)
    where.push(
      `EXISTS (SELECT 1 FROM shift_events e WHERE e.shift_id = s.id AND e.meta->>'flagged_for_review' = 'true')`,
    );
  const { rows } = await db.raw(
    `SELECT s.id, s.status, s.mode, s.title, s.start_at, s.end_at, s.hourly_rate, s.created_at, sk.name AS skill,
            c.name AS client_name, w.name AS worker_name, t.gross, count(*) OVER() AS total
       FROM shifts s LEFT JOIN skills sk ON sk.id = s.skill_id LEFT JOIN users c ON c.id = s.client_id
       LEFT JOIN users w ON w.id = s.worker_id LEFT JOIN timesheets t ON t.shift_id = s.id
      WHERE ${where.join(' AND ')} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`,
    [...params, f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function shiftDetail(id: string) {
  const { rows } = await db.raw(
    `SELECT s.id, s.client_id, s.worker_id, s.skill_id, s.mode, s.title, s.description, s.materials, s.start_at, s.end_at, s.is_instant,
            s.address, ST_Y(s.location::geometry) AS lat, ST_X(s.location::geometry) AS lng, s.hourly_rate, s.status,
            s.request_expires_at, s.created_at, s.updated_at, sk.name AS skill, c.name AS client_name, w.name AS worker_name
       FROM shifts s LEFT JOIN skills sk ON sk.id = s.skill_id LEFT JOIN users c ON c.id = s.client_id LEFT JOIN users w ON w.id = s.worker_id
      WHERE s.id = ?`,
    [id],
  );
  if (!rows[0]) throw notFound('Shift not found', 'SHIFT_NOT_FOUND');
  const [events, timesheet, payments, disputes] = await Promise.all([
    db('shift_events').where({ shift_id: id }).orderBy('id').select(),
    db('timesheets').where({ shift_id: id }).first(),
    db('payments').where({ shift_id: id }).orderBy('created_at').select(),
    db('disputes')
      .where({ shift_id: id })
      .orderBy('created_at')
      .select('id', 'status', 'reason', 'raised_by', 'created_at'),
  ]);
  return { ...rows[0], timeline: events, timesheet: timesheet ?? null, payments, disputes };
}

export async function adminReassign(admin: AuthUser, id: string, workerId?: string) {
  const actor: ActorRef = { type: 'admin', id: admin.id };
  const row = await reassignShift(actor, id, workerId);
  await audit(db, admin, 'SHIFT_REASSIGN', 'shift', id, { worker_id: workerId ?? null });
  return row;
}

export async function adminCancel(admin: AuthUser, id: string, reason: string) {
  const actor: ActorRef = { type: 'admin', id: admin.id };
  const row = await db.transaction(async (trx) => {
    const shift = await lockShift(trx, id);
    const updated = await transitionShift(trx, shift, 'CANCELLED', actor, {
      meta: { reason, cancelled_by: 'admin' },
    });
    await audit(trx, admin, 'SHIFT_CANCEL', 'shift', id, { reason, from: shift.status });
    return updated;
  });
  await announceTransition(row, actor);
  return row;
}

// ------------------------------------------------------------------ payments / payouts
export async function listPayments(f: {
  status?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  const where = ['true'];
  const params: RawBinding[] = [];
  if (f.status) {
    where.push('p.status = ?');
    params.push(f.status);
  }
  if (f.from) {
    where.push('p.created_at >= ?');
    params.push(f.from);
  }
  if (f.to) {
    where.push('p.created_at < ?');
    params.push(f.to);
  }
  const { rows } = await db.raw(
    `SELECT p.id, p.shift_id, p.amount, p.provider, p.provider_order_id, p.provider_payment_id, p.status, p.payout_status, p.created_at,
            c.name AS client_name, w.name AS worker_name, count(*) OVER() AS total
       FROM payments p JOIN shifts s ON s.id = p.shift_id LEFT JOIN users c ON c.id = s.client_id LEFT JOIN users w ON w.id = s.worker_id
      WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function listPayouts(f: { payout_status?: string; page: number; limit: number }) {
  const { rows } = await db.raw(
    `SELECT p.shift_id, p.amount AS gross, t.commission, t.worker_payout, p.payout_status, p.created_at AS paid_at,
            w.id AS worker_id, w.name AS worker_name, wp.upi_id, count(*) OVER() AS total
       FROM payments p JOIN shifts s ON s.id = p.shift_id JOIN timesheets t ON t.shift_id = s.id
       JOIN users w ON w.id = s.worker_id JOIN worker_profiles wp ON wp.user_id = w.id
      WHERE p.status = 'PAID' ${f.payout_status ? 'AND p.payout_status = ?' : ''}
      ORDER BY (p.payout_status = 'PENDING') DESC, p.created_at DESC LIMIT ? OFFSET ?`,
    [...(f.payout_status ? [f.payout_status] : []), f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

/** Real payouts are out of scope (TRD section 2): "settle" records that finance paid the worker out of band. */
export async function settlePayout(admin: AuthUser, shiftId: string) {
  const out = await db.transaction(async (trx) => {
    const p = await trx('payments')
      .where({ shift_id: shiftId, status: 'PAID' })
      .forUpdate()
      .first<{ id: string; payout_status: string } | undefined>('id', 'payout_status');
    if (!p) throw notFound('No paid payment for this shift', 'PAYMENT_NOT_FOUND');
    if (p.payout_status === 'SETTLED') throw conflict('ALREADY_SETTLED', 'This payout is already settled');
    await trx('payments').where({ id: p.id }).update({ payout_status: 'SETTLED' });
    await audit(trx, admin, 'PAYOUT_SETTLE', 'shift', shiftId, { payment_id: p.id });
    const s = await trx('shifts').where({ id: shiftId }).first<{ worker_id: string }>('worker_id');
    const t = await trx('timesheets')
      .where({ shift_id: shiftId })
      .first<{ worker_payout: string }>('worker_payout');
    return { worker_id: s.worker_id, amount: t.worker_payout };
  });
  await notifyUser(out.worker_id, {
    title: 'Payout sent',
    body: `₹${out.amount} has been sent to your UPI ID.`,
    data: { shiftId },
  });
  return { shift_id: shiftId, payout_status: 'SETTLED', amount: out.amount };
}

// ------------------------------------------------------------------ disputes
export async function listDisputes(f: { status?: string; page: number; limit: number }) {
  const { rows } = await db.raw(
    `SELECT d.id, d.shift_id, d.status, d.reason, d.created_at, u.name AS raised_by_name, u.role AS raised_by_role,
            cardinality(COALESCE(d.evidence_urls, '{}')) AS evidence_count, count(*) OVER() AS total
       FROM disputes d JOIN users u ON u.id = d.raised_by ${f.status ? 'WHERE d.status = ?' : ''}
      ORDER BY (d.status = 'RESOLVED'), d.created_at DESC LIMIT ? OFFSET ?`,
    [...(f.status ? [f.status] : []), f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function disputeDetail(id: string) {
  const d = await db('disputes').where({ id }).first();
  if (!d) throw notFound('Dispute not found');
  const evidence = await Promise.all(
    ((d.evidence_urls as string[] | null) ?? []).map(async (key) => ({
      key,
      url: await storage.signedUrl(KYC_BUCKET, key, 300),
    })),
  );
  const { evidence_urls: _e, ...rest } = d;
  return { ...rest, evidence, shift: await shiftDetail(d.shift_id) };
}

export async function patchDispute(
  admin: AuthUser,
  id: string,
  b: {
    status: 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED';
    resolution?: string;
    shift_outcome?: 'APPROVE' | 'CANCEL';
  },
) {
  const actor: ActorRef = { type: 'admin', id: admin.id };
  const result = await db.transaction(async (trx) => {
    const d = await trx('disputes')
      .where({ id })
      .forUpdate()
      .first<{ id: string; shift_id: string; status: string; raised_by: string } | undefined>();
    if (!d) throw notFound('Dispute not found');
    if (d.status === 'RESOLVED') throw conflict('ALREADY_RESOLVED', 'This dispute is already resolved');
    let shiftRow = null;
    if (b.status === 'RESOLVED') {
      const shift = await lockShift(trx, d.shift_id);
      if (shift.status === 'DISPUTED') {
        if (!b.shift_outcome)
          throw badRequest(
            'OUTCOME_REQUIRED',
            'shift_outcome (APPROVE or CANCEL) is required to resolve a disputed shift',
          );
        shiftRow = await transitionShift(
          trx,
          shift,
          b.shift_outcome === 'APPROVE' ? 'APPROVED' : 'CANCELLED',
          actor,
          { meta: { dispute_id: id, resolution: b.resolution } },
        );
        if (b.shift_outcome === 'APPROVE')
          await trx('timesheets').where({ shift_id: d.shift_id }).update({ status: 'APPROVED' });
      } else
        await logShiftEvent(trx, d.shift_id, admin.id, 'DISPUTE_RESOLVED', {
          meta: { dispute_id: id, resolution: b.resolution },
        });
    }
    const [row] = await trx('disputes')
      .where({ id })
      .update({
        status: b.status,
        resolution: b.resolution ?? null,
        resolved_by: b.status === 'RESOLVED' ? admin.id : null,
      })
      .returning('*');
    await audit(trx, admin, 'DISPUTE_' + b.status, 'dispute', id, {
      shift_id: d.shift_id,
      outcome: b.shift_outcome ?? null,
    });
    return { row, shiftRow };
  });
  if (result.shiftRow) await announceTransition(result.shiftRow, actor);
  const parties = await db('shifts')
    .where({ id: result.row.shift_id })
    .first<{ client_id: string; worker_id: string | null }>('client_id', 'worker_id');
  if (b.status === 'RESOLVED') {
    for (const uid of [parties.client_id, parties.worker_id].filter((x): x is string => !!x)) {
      await notifyUser(uid, {
        title: 'Issue resolved',
        body: b.resolution ?? 'Support resolved the issue.',
        data: { shiftId: result.row.shift_id },
      });
    }
  }
  return result.row;
}

// ------------------------------------------------------------------ reviews
export async function listReviews(f: { reported?: boolean; hidden?: boolean; page: number; limit: number }) {
  const where = ['true'];
  const params: RawBinding[] = [];
  if (f.reported !== undefined) {
    where.push('r.reported = ?');
    params.push(f.reported);
  }
  if (f.hidden !== undefined) {
    where.push('r.hidden = ?');
    params.push(f.hidden);
  }
  const { rows } = await db.raw(
    `SELECT r.id, r.shift_id, r.stars, r.tags, r.comment, r.reported, r.hidden, r.created_at,
            a.name AS reviewer_name, b.name AS reviewee_name, count(*) OVER() AS total
       FROM reviews r LEFT JOIN users a ON a.id = r.reviewer_id LEFT JOIN users b ON b.id = r.reviewee_id
      WHERE ${where.join(' AND ')} ORDER BY r.reported DESC, r.created_at DESC LIMIT ? OFFSET ?`,
    [...params, f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function hideReview(admin: AuthUser, id: string, hidden: boolean) {
  return db.transaction(async (trx) => {
    const [r] = await trx('reviews')
      .where({ id })
      .update({ hidden })
      .returning<{ id: string; reviewee_id: string; hidden: boolean }[]>('*');
    if (!r) throw notFound('Review not found');
    await recomputeWorkerRating(r.reviewee_id, trx);
    await audit(trx, admin, hidden ? 'REVIEW_HIDE' : 'REVIEW_RESTORE', 'review', id);
    return r;
  });
}

// ------------------------------------------------------------------ skills, config, audit, announcements, admins
export const adminSkills = {
  list: skills.listAllSkills,
  create: async (admin: AuthUser, name: string) => {
    const s = await skills.createSkill(name);
    await audit(db, admin, 'SKILL_CREATE', 'skill', s.id, { name });
    return s;
  },
  update: async (admin: AuthUser, id: number, patch: { name?: string; active?: boolean }) => {
    const s = await skills.updateSkill(id, patch);
    await audit(db, admin, 'SKILL_UPDATE', 'skill', id, patch);
    return s;
  },
  remove: async (admin: AuthUser, id: number) => {
    const r = await skills.deleteSkill(id);
    await audit(db, admin, 'SKILL_DELETE', 'skill', id, r);
    return r;
  },
};

export const getConfigAll = getAllConfig;
export async function putConfig(admin: AuthUser, patch: Partial<Record<ConfigKey, number>>) {
  const before = await getAllConfig();
  await db.transaction(async (trx) => {
    for (const [key, value] of Object.entries(patch)) {
      if (!(key in CONFIG_KEYS) || value === undefined) continue;
      await trx('app_config')
        .insert({ key, value: String(value) })
        .onConflict('key')
        .merge();
    }
    await audit(trx, admin, 'CONFIG_UPDATE', 'config', null, { patch, before });
  });
  return getAllConfig();
}

export async function listAudit(f: { admin_id?: string; action?: string; page: number; limit: number }) {
  const where = ['true'];
  const params: RawBinding[] = [];
  if (f.admin_id) {
    where.push('l.admin_id = ?');
    params.push(f.admin_id);
  }
  if (f.action) {
    where.push('l.action ILIKE ?');
    params.push(like(f.action));
  }
  const { rows } = await db.raw(
    `SELECT l.id, l.admin_id, u.name AS admin_name, l.action, l.target_type, l.target_id, l.meta, l.created_at, count(*) OVER() AS total
       FROM admin_audit_log l LEFT JOIN users u ON u.id = l.admin_id WHERE ${where.join(' AND ')} ORDER BY l.id DESC LIMIT ? OFFSET ?`,
    [...params, f.limit, pageOf(f.page, f.limit).offset],
  );
  return stripTotal(rows);
}

export async function announce(
  admin: AuthUser,
  b: { title: string; body: string; audience: 'all' | 'clients' | 'workers' },
) {
  const roles =
    b.audience === 'all' ? ['client', 'worker'] : [b.audience === 'clients' ? 'client' : 'worker'];
  const ids = await db('users').whereIn('role', roles).where({ status: 'ACTIVE' }).pluck<string[]>('id');
  const sent = await notifyMany(ids, { title: b.title, body: b.body, data: { announcement: true } });
  await audit(db, admin, 'ANNOUNCEMENT', 'broadcast', null, {
    audience: b.audience,
    recipients: sent,
    title: b.title,
  });
  return { recipients: sent };
}

export async function listAdmins() {
  return db('users')
    .where({ role: 'admin' })
    .orderBy('created_at')
    .select('id', 'name', 'email', 'admin_role', 'status', 'created_at');
}

export async function createAdmin(
  admin: AuthUser,
  b: { email: string; password: string; name: string; admin_role: string },
) {
  try {
    const [row] = await db('users')
      .insert({
        role: 'admin',
        admin_role: b.admin_role,
        email: b.email,
        name: b.name,
        password_hash: await hashPassword(b.password),
      })
      .returning(['id', 'name', 'email', 'admin_role', 'status', 'created_at']);
    await audit(db, admin, 'ADMIN_CREATE', 'admin', row.id, { email: b.email, admin_role: b.admin_role });
    return row;
  } catch (err) {
    if ((err as { code?: string }).code === '23505')
      throw conflict('EMAIL_TAKEN', 'An account with this email already exists');
    throw err;
  }
}

export async function patchAdmin(
  admin: AuthUser,
  id: string,
  b: { admin_role?: string; status?: string; password?: string; name?: string },
) {
  const target = await db('users').where({ id, role: 'admin' }).first<{ id: string }>('id');
  if (!target) throw notFound('Admin not found');
  if (id === admin.id && (b.status === 'SUSPENDED' || (b.admin_role && b.admin_role !== 'super_admin'))) {
    throw forbidden('You cannot demote or suspend your own account', 'SELF_LOCKOUT');
  }
  const patch: Record<string, unknown> = {};
  if (b.admin_role) patch.admin_role = b.admin_role;
  if (b.status) patch.status = b.status;
  if (b.name) patch.name = b.name;
  if (b.password) patch.password_hash = await hashPassword(b.password);
  const [row] = await db('users')
    .where({ id })
    .update(patch)
    .returning(['id', 'name', 'email', 'admin_role', 'status', 'created_at']);
  if (b.password || b.status === 'SUSPENDED') await revokeAllRefreshTokens(id);
  await audit(db, admin, 'ADMIN_UPDATE', 'admin', id, {
    ...b,
    password: b.password ? '[changed]' : undefined,
  });
  return row;
}
