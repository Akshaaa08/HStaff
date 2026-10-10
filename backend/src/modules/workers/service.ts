import { db, type RawBinding } from '../../config/db';
import { redis } from '../../config/redis';
import { badRequest, conflict, forbidden, notFound } from '../../utils/errors';
import { suspiciousLocationReason } from '../../utils/geo';
import { fromPaise, toPaise } from '../../utils/money';
import { EVENTS } from '../../realtime/events';
import { emitToShift } from '../../realtime/socket';
import type { LocationBody, NearbyQuery, OnlineBody, UpdateProfileBody } from './schema';

const SKILLS_JSON = `COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name) ORDER BY s.name)
  FROM worker_skills ws JOIN skills s ON s.id = ws.skill_id WHERE ws.worker_id = u.id), '[]'::json)`;

export async function getMyProfile(userId: string) {
  const { rows } = await db.raw(
    `SELECT u.id, u.name, u.phone, u.email, u.photo_url, u.status,
            wp.bio, wp.experience_years, wp.hourly_rate, wp.equipment, wp.is_online, wp.verification, wp.verification_note,
            wp.rating_avg, wp.rating_count, wp.upi_id, wp.age, wp.location_updated_at,
            ST_Y(wp.location::geometry) AS lat, ST_X(wp.location::geometry) AS lng,
            ${SKILLS_JSON} AS skills,
            (SELECT count(*)::int FROM kyc_documents k WHERE k.worker_id = u.id) AS kyc_document_count
       FROM users u JOIN worker_profiles wp ON wp.user_id = u.id WHERE u.id = ?`,
    [userId],
  );
  if (!rows[0]) throw notFound('Worker profile not found');
  return rows[0];
}

export async function updateMyProfile(userId: string, body: UpdateProfileBody) {
  await db.transaction(async (trx) => {
    const userPatch: Record<string, unknown> = {};
    if (body.name !== undefined) userPatch.name = body.name;
    if (body.email !== undefined) userPatch.email = body.email;
    if (Object.keys(userPatch).length) {
      try {
        await trx('users').where({ id: userId }).update(userPatch);
      } catch (err) {
        if ((err as { code?: string }).code === '23505')
          throw conflict('EMAIL_TAKEN', 'That email is already in use');
        throw err;
      }
    }
    const profilePatch: Record<string, unknown> = {};
    for (const k of ['bio', 'experience_years', 'equipment', 'upi_id', 'age'] as const)
      if (body[k] !== undefined) profilePatch[k] = body[k];
    if (body.hourly_rate !== undefined) profilePatch.hourly_rate = fromPaise(toPaise(body.hourly_rate));
    if (Object.keys(profilePatch).length)
      await trx('worker_profiles').where({ user_id: userId }).update(profilePatch);

    if (body.skill_ids) {
      const ids = [...new Set(body.skill_ids)];
      const valid = await trx('skills').whereIn('id', ids).where({ active: true }).pluck<number[]>('id');
      if (valid.length !== ids.length)
        throw badRequest('INVALID_SKILL', 'One or more skills do not exist or are inactive');
      await trx('worker_skills').where({ worker_id: userId }).del();
      await trx('worker_skills').insert(ids.map((skill_id) => ({ worker_id: userId, skill_id })));
    }
  });
  return getMyProfile(userId);
}

async function assertVerified(userId: string) {
  const p = await db('worker_profiles')
    .where({ user_id: userId })
    .first<{ verification: string; hourly_rate: string | null } | undefined>('verification', 'hourly_rate');
  if (!p) throw notFound('Worker profile not found');
  if (p.verification !== 'APPROVED') {
    throw forbidden('Your profile must be verified before you can go online', 'NOT_VERIFIED', {
      verification: p.verification,
    });
  }
  return p;
}

export async function setOnline(userId: string, body: OnlineBody) {
  if (!body.online) {
    await db('worker_profiles').where({ user_id: userId }).update({ is_online: false });
    return { online: false };
  }
  await assertVerified(userId); // rule 9: the verification gate comes first
  const reason = suspiciousLocationReason(body);
  if (reason)
    throw badRequest(reason, 'This location looks unreliable. Turn off mock locations and try again.');

  const [{ n: skills }] = await db('worker_skills')
    .where({ worker_id: userId })
    .count<{ n: string }[]>('* as n');
  const profile = await db('worker_profiles')
    .where({ user_id: userId })
    .first<{ hourly_rate: string | null }>('hourly_rate');
  if (!profile.hourly_rate || Number(skills) === 0) {
    throw conflict('PROFILE_INCOMPLETE', 'Set your hourly rate and at least one skill before going online');
  }
  await db.raw(
    `UPDATE worker_profiles SET is_online = true, location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, location_updated_at = now() WHERE user_id = ?`,
    [body.lng!, body.lat!, userId],
  );
  return { online: true };
}

/** Periodic foreground location ping. Writes at most once per 5 s per worker; fans out to the client while EN_ROUTE. */
export async function updateLocation(userId: string, body: LocationBody) {
  const reason = suspiciousLocationReason(body);
  if (reason)
    throw badRequest(reason, 'This location looks unreliable. Turn off mock locations and try again.');
  const gate = await redis.set(`throttle:loc:${userId}`, '1', 'EX', 5, 'NX');
  if (gate !== 'OK') return { throttled: true };

  const { rowCount } = await db.raw(
    `UPDATE worker_profiles SET location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, location_updated_at = now() WHERE user_id = ?`,
    [body.lng, body.lat, userId],
  );
  if (!rowCount) throw notFound('Worker profile not found');
  const enRoute = await db('shifts')
    .where({ worker_id: userId, status: 'EN_ROUTE' })
    .select<{ id: string }[]>('id');
  const ts = new Date().toISOString();
  for (const s of enRoute)
    emitToShift(s.id, EVENTS.workerLocation, { shiftId: s.id, lat: body.lat, lng: body.lng, ts });
  return { throttled: false, ts };
}

export async function earnings(userId: string, page: number, limit: number) {
  const { rows: totals } = await db.raw(
    `SELECT
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status = 'PAID'), 0)::text AS paid_total,
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status = 'PAID' AND s.updated_at >= date_trunc('day', now())), 0)::text AS paid_today,
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status = 'PAID' AND s.updated_at >= date_trunc('week', now())), 0)::text AS paid_this_week,
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status = 'PAID' AND s.updated_at >= date_trunc('month', now())), 0)::text AS paid_this_month,
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status IN ('AWAITING_APPROVAL','APPROVED')), 0)::text AS awaiting_payment,
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status = 'PAID' AND p.payout_status = 'SETTLED'), 0)::text AS payout_settled,
       COALESCE(SUM(t.worker_payout) FILTER (WHERE s.status = 'PAID' AND p.payout_status = 'PENDING'), 0)::text AS payout_pending,
       count(*) FILTER (WHERE s.status = 'PAID')::int AS jobs_completed,
       COALESCE(SUM(t.billable_minutes) FILTER (WHERE s.status = 'PAID'), 0)::int AS billable_minutes
     FROM timesheets t
     JOIN shifts s ON s.id = t.shift_id
     LEFT JOIN payments p ON p.shift_id = s.id AND p.status = 'PAID'
     WHERE s.worker_id = ?`,
    [userId],
  );
  const { rows: items } = await db.raw(
    `SELECT s.id AS shift_id, s.title, sk.name AS skill, s.status, s.start_at, t.clock_in_at, t.clock_out_at,
            t.billable_minutes, t.gross, t.commission, t.worker_payout, t.status AS timesheet_status,
            p.payout_status
       FROM timesheets t
       JOIN shifts s ON s.id = t.shift_id
       LEFT JOIN skills sk ON sk.id = s.skill_id
       LEFT JOIN payments p ON p.shift_id = s.id AND p.status = 'PAID'
      WHERE s.worker_id = ? AND t.clock_out_at IS NOT NULL
      ORDER BY t.clock_out_at DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, (page - 1) * limit],
  );
  const profile = await db('worker_profiles')
    .where({ user_id: userId })
    .first<{ rating_avg: string; rating_count: number }>('rating_avg', 'rating_count');
  return {
    totals: {
      ...totals[0],
      rating_avg: profile?.rating_avg ?? '0.00',
      rating_count: profile?.rating_count ?? 0,
    },
    items,
  };
}

/** Client-facing search (TRD section 9 rule 10): ST_DWithin + ST_Distance, nearest first, default 10 km, 20 results. */
export async function nearby(q: NearbyQuery) {
  const where: string[] = [
    `wp.verification = 'APPROVED'`,
    `u.status = 'ACTIVE'`,
    `wp.location IS NOT NULL`,
    `wp.hourly_rate IS NOT NULL`,
    `ST_DWithin(wp.location, ref.pt, ?)`,
  ];
  const params: RawBinding[] = [q.lng, q.lat, q.radius * 1000];
  if (q.online) where.push('wp.is_online = true');
  if (q.minRating !== undefined) {
    where.push('wp.rating_avg >= ?');
    params.push(q.minRating);
  }
  if (q.maxRate !== undefined) {
    where.push('wp.hourly_rate <= ?');
    params.push(q.maxRate);
  }
  if (q.skill) {
    const skillId = await resolveSkillId(q.skill);
    if (skillId === null) return { rows: [], total: 0 };
    where.push('EXISTS (SELECT 1 FROM worker_skills ws WHERE ws.worker_id = u.id AND ws.skill_id = ?)');
    params.push(skillId);
  }
  const order = {
    distance: 'distance_m ASC',
    rating: 'wp.rating_avg DESC, distance_m ASC',
    rate: 'wp.hourly_rate ASC, distance_m ASC',
  }[q.sort];
  params.push(q.limit, (q.page - 1) * q.limit);

  const { rows } = await db.raw(
    `SELECT u.id, u.name, u.photo_url, wp.bio, wp.experience_years, wp.hourly_rate, wp.equipment, wp.is_online,
            wp.rating_avg, wp.rating_count,
            ST_Distance(wp.location, ref.pt) AS distance_m,
            (SELECT count(*)::int FROM shifts s WHERE s.worker_id = u.id AND s.status = 'PAID') AS jobs_completed,
            ${SKILLS_JSON} AS skills,
            count(*) OVER() AS total
       FROM worker_profiles wp
       JOIN users u ON u.id = wp.user_id
       CROSS JOIN (SELECT ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography AS pt) ref
      WHERE ${where.join(' AND ')}
      ORDER BY ${order}
      LIMIT ? OFFSET ?`,
    params,
  );
  const total = rows[0] ? Number(rows[0].total) : 0;
  return {
    rows: rows.map(({ total: _t, ...r }: Record<string, unknown>) => ({
      ...r,
      distance_m: Math.round(Number(r.distance_m)),
    })),
    total,
  };
}

async function resolveSkillId(skill: string): Promise<number | null> {
  const row = /^\d+$/.test(skill)
    ? await db('skills')
        .where({ id: Number(skill) })
        .first<{ id: number } | undefined>('id')
    : await db('skills').whereRaw('lower(name) = lower(?)', [skill]).first<{ id: number } | undefined>('id');
  return row?.id ?? null;
}

export async function publicProfile(workerId: string) {
  const { rows } = await db.raw(
    `SELECT u.id, u.name, u.photo_url, wp.bio, wp.experience_years, wp.hourly_rate, wp.equipment, wp.is_online,
            wp.rating_avg, wp.rating_count,
            (SELECT count(*)::int FROM shifts s WHERE s.worker_id = u.id AND s.status = 'PAID') AS jobs_completed,
            ${SKILLS_JSON} AS skills
       FROM users u JOIN worker_profiles wp ON wp.user_id = u.id
      WHERE u.id = ? AND u.role = 'worker' AND u.status = 'ACTIVE' AND wp.verification = 'APPROVED'`,
    [workerId],
  );
  if (!rows[0]) throw notFound('Worker not found');
  const { rows: reviews } = await db.raw(
    `SELECT r.id, r.stars, r.tags, r.comment, r.created_at, split_part(COALESCE(ru.name, 'Customer'), ' ', 1) AS reviewer_first_name
       FROM reviews r LEFT JOIN users ru ON ru.id = r.reviewer_id
      WHERE r.reviewee_id = ? AND r.hidden = false
      ORDER BY r.created_at DESC LIMIT 20`,
    [workerId],
  );
  return { ...rows[0], reviews };
}
