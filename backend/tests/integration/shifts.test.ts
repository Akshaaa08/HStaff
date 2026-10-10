import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/config/db';
import { redis } from '../../src/config/redis';
import { sentPushes } from '../../src/modules/notifications/push';
import { expireStaleRequests } from '../../src/modules/shifts/service';
import {
  bookingBody,
  closeAll,
  get,
  ids,
  loginAll,
  loginPhone,
  post,
  PUNE,
  resetAll,
  runToAwaitingApproval,
  skillId,
  type Actors,
} from '../helpers';

let a: Actors;
let cleaning: number;
const inMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const near = { lat: PUNE.lat + 0.0004, lng: PUNE.lng }; // ~45 m from the site
const far = { lat: PUNE.lat + 0.0027, lng: PUNE.lng }; // ~300 m from the site

beforeAll(async () => {
  await resetAll();
  a = await loginAll();
  cleaning = await skillId('Cleaning');
  await db('worker_skills').insert({ worker_id: ids.rahul, skill_id: cleaning }); // so Rahul can take cleaning jobs too
});
afterAll(closeAll);

const book = async (workerId = ids.sunita, over: Record<string, unknown> = {}, who = a.client) => {
  const r = await post(who, '/shifts', bookingBody(workerId, cleaning, over));
  if (r.status !== 201) throw new Error(`book failed ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.data as { id: string; status: string };
};

describe('M4 create, quote and price rules', () => {
  it('creates a DIRECT shift in REQUESTED with a server-derived rate and an expiry', async () => {
    const r = await post(a.client, '/shifts', {
      ...bookingBody(ids.sunita, cleaning, { start_at: inMin(3 * 24 * 60) }),
      hourly_rate: 1,
    });
    expect(r.status).toBe(201);
    const s = r.body.data;
    expect(s.status).toBe('REQUESTED');
    expect(s.hourly_rate).toBe('250.00'); // the client-sent 1 is ignored: price is never trusted from the client
    expect(s.pricing).toMatchObject({ estimate: true, gross: '250.00', commission_pct: 15 });
    expect(s.pricing.commission).toBeUndefined(); // clients never see the commission
    expect(new Date(s.request_expires_at).getTime()).toBeGreaterThan(Date.now());
    const ev = await db('shift_events').where({ shift_id: s.id });
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ event: 'STATUS:REQUESTED', from_status: null, to_status: 'REQUESTED' });
    expect(ev[0].lat).toBeCloseTo(PUNE.lat, 4);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('notifies the worker (persisted + push because no live socket)', async () => {
    sentPushes.length = 0;
    const s = await book(ids.sunita, { start_at: inMin(4 * 24 * 60) });
    const rows = await db('notifications').where({ user_id: ids.sunita });
    expect(rows.some((n) => n.data.shiftId === s.id && n.title === 'New job request')).toBe(true);
    expect(sentPushes.some((p) => p.userId === ids.sunita && p.data?.shiftId === s.id)).toBe(true);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('worker sees the earnings preview but not the exact address before accepting', async () => {
    const s = await book(ids.sunita, { start_at: inMin(5 * 24 * 60) });
    const v = (await get(a.sunita, `/shifts/${s.id}`)).body.data;
    expect(v.address).toBeNull();
    expect(v.location).toBeNull();
    expect(v.distance_m).toBeLessThan(10);
    expect(v.pricing).toMatchObject({ gross: '250.00', commission: '37.50', worker_payout: '212.50' });
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('validates the booking', async () => {
    const bad = (over: Record<string, unknown>) =>
      post(a.client, '/shifts', bookingBody(ids.sunita, cleaning, over));
    expect((await bad({ start_at: inMin(-30) })).body.error.code).toBe('START_IN_PAST');
    expect((await bad({ duration_minutes: undefined, end_at: inMin(10) })).status).toBe(400);
    expect((await bad({ worker_id: undefined })).status).toBe(400);
    expect((await bad({ lat: 120 })).status).toBe(400);
    expect((await bad({ skill_id: 9999 })).body.error.code).toBe('INVALID_SKILL');
    expect((await bad({ start_at: 'tomorrow' })).status).toBe(400);
    expect((await post(a.sunita, '/shifts', bookingBody(ids.rahul, cleaning))).status).toBe(403); // workers cannot book
  });

  it('refuses workers who are unverified, lack the skill, are offline for instant jobs, or busy', async () => {
    const code = async (over: Record<string, unknown>, w = ids.sunita, skill = cleaning) => {
      const r = await post(a.client, '/shifts', bookingBody(w, skill, over));
      return [r.status, r.body.error?.code, r.body.error?.details?.reason];
    };
    expect(await code({ start_at: inMin(6 * 24 * 60) }, ids.pending)).toEqual([
      409,
      'WORKER_NOT_AVAILABLE',
      'NOT_VERIFIED',
    ]);
    expect(await code({ start_at: inMin(6 * 24 * 60) }, ids.sunita, await skillId('Welding'))).toEqual([
      409,
      'WORKER_NOT_AVAILABLE',
      'SKILL_MISMATCH',
    ]);
    await db('worker_profiles').where({ user_id: ids.sunita }).update({ is_online: false });
    expect(await code({ is_instant: true, start_at: undefined, duration_minutes: 60 })).toEqual([
      409,
      'WORKER_NOT_AVAILABLE',
      'OFFLINE',
    ]);
    expect(
      (await post(a.client, '/shifts', bookingBody(ids.sunita, cleaning, { start_at: inMin(6 * 24 * 60) })))
        .status,
    ).toBe(201); // scheduled is fine offline
    await db('worker_profiles').where({ user_id: ids.sunita }).update({ is_online: true });
  });

  it('instant shifts start now, and are refused when the worker is out of range', async () => {
    const r = await post(
      a.client,
      '/shifts',
      bookingBody(ids.sunita, cleaning, { is_instant: true, start_at: undefined, duration_minutes: 120 }),
    );
    expect(r.status).toBe(201);
    expect(r.body.data.is_instant).toBe(true);
    expect(r.body.data.scheduled_minutes).toBe(120);
    await post(a.client, `/shifts/${r.body.data.id}/cancel`, { reason: 'cleanup' });
    const faraway = await post(
      a.client,
      '/shifts',
      bookingBody(ids.sunita, cleaning, {
        is_instant: true,
        start_at: undefined,
        duration_minutes: 60,
        lat: 19.2,
        lng: 73.0,
      }),
    );
    expect(faraway.body.error.details.reason).toBe('OUT_OF_RANGE');
  });

  it('quote previews the price server-side', async () => {
    const q = await get(a.client, `/shifts/quote?workerId=${ids.sunita}&duration_minutes=90`);
    expect(q.status).toBe(200);
    expect(q.body.data).toMatchObject({
      gross: '375.00',
      total: '375.00',
      hourly_rate: '250.00',
      scheduled_minutes: 90,
      estimate: true,
    });
    expect(q.body.data.commission).toBeUndefined();
    const range = await get(
      a.client,
      `/shifts/quote?workerId=${ids.rahul}&start=${encodeURIComponent(inMin(60))}&end=${encodeURIComponent(inMin(180))}`,
    );
    expect(range.body.data.gross).toBe('600.00');
    expect((await get(a.client, `/shifts/quote?workerId=${ids.sunita}`)).status).toBe(400);
  });
});

describe('M4 accept, decline, expire, reassign, cancel', () => {
  it('request -> accept reveals the address and logs events', async () => {
    const s = await book(ids.sunita, { start_at: inMin(7 * 24 * 60) });
    const r = await post(a.sunita, `/shifts/${s.id}/accept`);
    expect(r.status).toBe(200);
    expect(r.body.data.status).toBe('ACCEPTED');
    expect(r.body.data.address).toBe('24, Green Park, Baner, Pune');
    expect(r.body.data.worker.id).toBe(ids.sunita);
    const note = await db('notifications')
      .where({ user_id: ids.client })
      .orderBy('created_at', 'desc')
      .first();
    expect(note.title).toBe('Request accepted');
    const events = await db('shift_events').where({ shift_id: s.id }).orderBy('id');
    expect(events.map((e) => e.to_status)).toEqual(['REQUESTED', 'ACCEPTED']);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it("decline -> client reassigns to another worker at that worker's rate", async () => {
    const s = await book(ids.sunita, { start_at: inMin(8 * 24 * 60) });
    const d = await post(a.sunita, `/shifts/${s.id}/decline`);
    expect(d.body.data.status).toBe('DECLINED');
    expect(
      (await db('notifications').where({ user_id: ids.client }).orderBy('created_at', 'desc').first()).title,
    ).toBe('Request declined');
    const re = await post(a.client, `/shifts/${s.id}/reassign`, { worker_id: ids.rahul });
    expect(re.status).toBe(200);
    expect(re.body.data).toMatchObject({ status: 'REQUESTED', hourly_rate: '300.00' });
    expect(re.body.data.worker.id).toBe(ids.rahul);
    expect((await post(a.sunita, `/shifts/${s.id}/accept`)).status).toBe(404); // no longer hers
    expect((await post(a.rahul, `/shifts/${s.id}/accept`)).status).toBe(200);
    const ev = await db('shift_events').where({ shift_id: s.id, to_status: 'REQUESTED' });
    expect(ev[1].meta.previous_worker_id).toBe(ids.sunita);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('unanswered requests expire via the cron job; late accepts are refused; client can reassign', async () => {
    const s = await book(ids.sunita, { start_at: inMin(9 * 24 * 60) });
    await db('shifts')
      .where({ id: s.id })
      .update({ request_expires_at: new Date(Date.now() - 1000) });
    const late = await post(a.sunita, `/shifts/${s.id}/accept`); // cron has not run yet
    expect(late.status).toBe(409);
    expect(late.body.error.code).toBe('REQUEST_EXPIRED');
    expect(await expireStaleRequests()).toBe(1);
    expect((await get(a.client, `/shifts/${s.id}`)).body.data.status).toBe('EXPIRED');
    expect(
      (await db('notifications').where({ user_id: ids.client }).orderBy('created_at', 'desc').first()).title,
    ).toBe('No response');
    expect(await expireStaleRequests()).toBe(0); // idempotent
    const re = await post(a.client, `/shifts/${s.id}/reassign`, { worker_id: ids.rahul });
    expect(re.body.data.status).toBe('REQUESTED');
    expect(new Date(re.body.data.request_expires_at).getTime()).toBeGreaterThan(Date.now());
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('illegal transitions return 409 and wrong actors are refused', async () => {
    const s = await book(ids.sunita, { start_at: inMin(10 * 24 * 60) });
    await post(a.sunita, `/shifts/${s.id}/accept`);
    const again = await post(a.sunita, `/shifts/${s.id}/accept`);
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('SHIFT_CONFLICT');
    const skip = await post(a.sunita, `/shifts/${s.id}/start`, { otp: '123456', ...near });
    expect(skip.status).toBe(409);
    expect(skip.body.error.code).toBe('ILLEGAL_TRANSITION');
    expect((await post(a.sunita, `/shifts/${s.id}/decline`)).body.error.code).toBe('ILLEGAL_TRANSITION');
    expect((await post(a.client, `/shifts/${s.id}/approve`)).body.error.code).toBe('ILLEGAL_TRANSITION');
    expect((await post(a.sunita, `/shifts/${s.id}/end-otp`)).body.error.code).toBe('ILLEGAL_TRANSITION');
    expect((await post(a.client, `/shifts/${s.id}/accept`)).status).toBe(403);
    expect((await post(a.client, `/payments/shifts/${s.id}/order`)).status).toBe(409);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('users cannot read or touch shifts that are not theirs', async () => {
    const s = await book(ids.sunita, { start_at: inMin(11 * 24 * 60) });
    expect((await get(a.rahul, `/shifts/${s.id}`)).status).toBe(404);
    expect((await post(a.rahul, `/shifts/${s.id}/accept`)).status).toBe(404);
    expect((await post(a.rahul, `/shifts/${s.id}/decline`)).status).toBe(404);
    expect((await post(a.rahul, `/shifts/${s.id}/cancel`, { reason: 'mine now' })).status).toBe(404);
    const other = await loginPhone('+919888888888', 'client');
    expect((await get(other, `/shifts/${s.id}`)).status).toBe(404);
    expect((await post(other, `/shifts/${s.id}/cancel`, { reason: 'not mine' })).status).toBe(404);
    expect((await post(other, `/shifts/${s.id}/approve`)).status).toBe(404);
    expect((await get(other, `/shifts/${s.id}/otp`)).status).toBe(404);
    expect((await get(other, '/shifts')).body.data).toEqual([]);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('a worker cannot accept two overlapping jobs, even concurrently', async () => {
    const t = inMin(12 * 24 * 60);
    const first = await book(ids.sunita, { start_at: t });
    const second = await book(ids.sunita, {
      start_at: new Date(new Date(t).getTime() + 30 * 60_000).toISOString(),
    }); // overlaps by 30 min
    const results = await Promise.all([
      post(a.sunita, `/shifts/${first.id}/accept`),
      post(a.sunita, `/shifts/${second.id}/accept`),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const loser = results.find((r) => r.status === 409)!;
    expect(['BUSY', undefined]).toContain(loser.body.error.details?.reason); // BUSY, or SHIFT_CONFLICT from the Redis lock
    // and a new booking into a committed slot is refused up front
    const clash = await post(a.client, '/shifts', bookingBody(ids.sunita, cleaning, { start_at: t }));
    expect(clash.body.error.details.reason).toBe('BUSY');
    for (const s of [first, second]) await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('two simultaneous accepts of one shift: exactly one wins (Redis lock + row lock)', async () => {
    const s = await book(ids.sunita, { start_at: inMin(13 * 24 * 60) });
    const rs = await Promise.all([
      post(a.sunita, `/shifts/${s.id}/accept`),
      post(a.sunita, `/shifts/${s.id}/accept`),
      post(a.sunita, `/shifts/${s.id}/accept`),
    ]);
    expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
    expect(rs.filter((r) => r.status === 409)).toHaveLength(2);
    expect(await db('shift_events').where({ shift_id: s.id, to_status: 'ACCEPTED' })).toHaveLength(1);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('cancel records who and why; cancelling after acceptance is flagged for admin review', async () => {
    const s1 = await book(ids.sunita, { start_at: inMin(14 * 24 * 60) });
    expect(
      (await post(a.client, `/shifts/${s1.id}/cancel`, { reason: 'Plans changed' })).body.data.status,
    ).toBe('CANCELLED');
    const c1 = await db('shift_events').where({ shift_id: s1.id, to_status: 'CANCELLED' }).first();
    expect(c1).toMatchObject({ actor_id: ids.client });
    expect(c1.meta).toMatchObject({
      reason: 'Plans changed',
      cancelled_by: 'client',
      flagged_for_review: false,
    });

    const s2 = await book(ids.sunita, { start_at: inMin(15 * 24 * 60) });
    await post(a.sunita, `/shifts/${s2.id}/accept`);
    expect((await post(a.sunita, `/shifts/${s2.id}/cancel`, { reason: 'Family emergency' })).status).toBe(
      200,
    );
    const c2 = await db('shift_events').where({ shift_id: s2.id, to_status: 'CANCELLED' }).first();
    expect(c2.meta).toMatchObject({ cancelled_by: 'worker', flagged_for_review: true });
    const flagged = await get(a.support, '/admin/shifts?flagged=true');
    const flaggedIds = flagged.body.data.map((x: { id: string }) => x.id);
    expect(flaggedIds).toContain(s2.id);
    expect(flaggedIds).not.toContain(s1.id);
    expect((await post(a.client, `/shifts/${s2.id}/cancel`, { reason: 'again' })).body.error.code).toBe(
      'ILLEGAL_TRANSITION',
    );
    expect((await post(a.client, `/shifts/${s2.id}/cancel`, { reason: '' })).status).toBe(400);
  });

  it('lists by status group for both parties', async () => {
    const s = await book(ids.sunita, { start_at: inMin(16 * 24 * 60) });
    const upcoming = await get(a.client, '/shifts?status=upcoming');
    expect(upcoming.body.data.map((x: { id: string }) => x.id)).toContain(s.id);
    const incoming = await get(a.sunita, '/workers/me/shifts?status=incoming');
    expect(incoming.body.data.map((x: { id: string }) => x.id)).toContain(s.id);
    expect(
      (await get(a.rahul, '/workers/me/shifts?status=incoming')).body.data.map((x: { id: string }) => x.id),
    ).not.toContain(s.id);
    expect((await get(a.client, '/shifts?status=REQUESTED,CANCELLED')).body.meta.total).toBeGreaterThan(1);
    expect((await get(a.client, '/shifts?status=bogus')).status).toBe(400);
    expect(
      (await get(a.client, '/shifts?status=cancelled')).body.data.every(
        (x: { status: string }) => x.status === 'CANCELLED',
      ),
    ).toBe(true);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });
});

describe('M5 attendance: geofence + OTP, server-side time', () => {
  it('rejects arrival long before the start time', async () => {
    const s = await book(ids.sunita, { start_at: inMin(3 * 60) });
    await post(a.sunita, `/shifts/${s.id}/accept`);
    const r = await post(a.sunita, `/shifts/${s.id}/arrive`, near);
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('TOO_EARLY');
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('arrival fails outside the geofence and for mock or imprecise locations', async () => {
    const s = await book(ids.sunita, { start_at: inMin(5) });
    await post(a.sunita, `/shifts/${s.id}/accept`);
    const out = await post(a.sunita, `/shifts/${s.id}/arrive`, far);
    expect(out.status).toBe(403);
    expect(out.body.error.code).toBe('OUTSIDE_GEOFENCE');
    expect(out.body.error.details.distance_m).toBeGreaterThan(250);
    expect(out.body.error.details.radius_m).toBe(150);
    expect((await post(a.sunita, `/shifts/${s.id}/arrive`, { ...near, mocked: true })).body.error.code).toBe(
      'MOCK_LOCATION',
    );
    expect(
      (await post(a.sunita, `/shifts/${s.id}/arrive`, { ...near, accuracy_m: 900 })).body.error.code,
    ).toBe('LOW_ACCURACY');
    expect((await get(a.client, `/shifts/${s.id}`)).body.data.status).toBe('ACCEPTED');
    expect(await redis.exists(`otp:start:${s.id}`)).toBe(0);
    await post(a.client, `/shifts/${s.id}/cancel`, { reason: 'cleanup' });
  });

  it('full attendance flow: arrive -> Start OTP -> start -> End OTP -> end, with OTPs only for the client', async () => {
    sentPushes.length = 0;
    const s = await book(ids.sunita, { start_at: inMin(5) });
    await post(a.sunita, `/shifts/${s.id}/accept`);
    const en = await post(a.sunita, `/shifts/${s.id}/en-route`, { ...far });
    expect(en.status).toBe(200);
    expect(en.body.data.shift.status).toBe('EN_ROUTE');
    expect(en.body.data.eta.duration_sec).toBeGreaterThan(0);

    const arrive = await post(a.sunita, `/shifts/${s.id}/arrive`, near);
    expect(arrive.body.data.status).toBe('ARRIVED');
    expect(JSON.stringify(arrive.body)).not.toMatch(/"otp"/); // the worker's response carries no code

    const code = (await redis.get(`otp:start:${s.id}`))!;
    expect(code).toMatch(/^\d{6}$/);
    expect(await redis.ttl(`otp:start:${s.id}`)).toBeGreaterThan(7000); // 2 h TTL
    const got = await get(a.client, `/shifts/${s.id}/otp`);
    expect(got.body.data).toMatchObject({ type: 'start', otp: code });
    expect((await get(a.sunita, `/shifts/${s.id}/otp`)).status).toBe(403); // workers cannot read it
    expect((await get(a.client, `/shifts/${s.id}`)).body.data.pending_otp).toBe('start');

    // delivered to the client by push with the code, never persisted in Postgres
    expect(sentPushes.some((p) => p.userId === ids.client && p.body.includes(code))).toBe(true);
    expect(sentPushes.some((p) => p.userId === ids.sunita && p.body.includes(code))).toBe(false);
    const stored =
      JSON.stringify(await db('notifications').select()) + JSON.stringify(await db('shift_events').select());
    expect(stored).not.toContain(code);

    // start: wrong OTP, then outside the radius, then correct
    const wrong = await post(a.sunita, `/shifts/${s.id}/start`, {
      otp: code === '000000' ? '111111' : '000000',
      ...near,
    });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe('INVALID_OTP');
    expect(wrong.body.error.details.attempts_remaining).toBe(4);
    expect((await post(a.sunita, `/shifts/${s.id}/start`, { otp: code, ...far })).body.error.code).toBe(
      'OUTSIDE_GEOFENCE',
    );
    const started = await post(a.sunita, `/shifts/${s.id}/start`, {
      otp: code,
      ...near,
      clock_in_at: '2020-01-01T00:00:00Z',
    });
    expect(started.status).toBe(200);
    expect(started.body.data.status).toBe('IN_PROGRESS');
    expect(await redis.exists(`otp:start:${s.id}`)).toBe(0); // consumed
    const ts = await db('timesheets').where({ shift_id: s.id }).first();
    expect(Math.abs(ts.clock_in_at.getTime() - Date.now())).toBeLessThan(5000); // server time, the body field was ignored

    // a spent start code cannot be replayed
    expect((await post(a.sunita, `/shifts/${s.id}/start`, { otp: code, ...near })).body.error.code).toBe(
      'ILLEGAL_TRANSITION',
    );

    // end: needs the End OTP the client sees
    expect((await post(a.sunita, `/shifts/${s.id}/end`, { otp: '123456', ...near })).body.error.code).toBe(
      'OTP_NOT_ISSUED',
    );
    expect((await post(a.sunita, `/shifts/${s.id}/end-otp`)).status).toBe(200);
    const endCode = (await redis.get(`otp:end:${s.id}`))!;
    expect(endCode).not.toBe(code);
    expect((await get(a.client, `/shifts/${s.id}/otp`)).body.data).toMatchObject({
      type: 'end',
      otp: endCode,
    });
    expect(
      (
        await post(a.sunita, `/shifts/${s.id}/end`, {
          otp: endCode === '999999' ? '888888' : '999999',
          ...near,
        })
      ).status,
    ).toBe(400);
    const ended = await post(a.sunita, `/shifts/${s.id}/end`, { otp: endCode, ...near });
    expect(ended.status).toBe(200);
    expect(ended.body.data.status).toBe('AWAITING_APPROVAL');
    expect(ended.body.data.timesheet.approval_deadline).toBeTruthy();

    const events = await db('shift_events').where({ shift_id: s.id }).orderBy('id');
    expect(events.map((e) => e.event)).toEqual([
      'STATUS:REQUESTED',
      'STATUS:ACCEPTED',
      'STATUS:EN_ROUTE',
      'STATUS:ARRIVED',
      'CLOCK_IN',
      'END_OTP_REQUESTED',
      'CLOCK_OUT',
    ]);
    const geo = events.filter((e) => ['STATUS:ARRIVED', 'CLOCK_IN', 'CLOCK_OUT'].includes(e.event));
    for (const e of geo) expect(e.lat).toBeCloseTo(near.lat, 5); // coordinates are logged with attendance events
  });

  it('five wrong Start OTPs lock the worker out', async () => {
    const s = await book(ids.sunita, { start_at: inMin(5) });
    await post(a.sunita, `/shifts/${s.id}/accept`);
    await post(a.sunita, `/shifts/${s.id}/arrive`, near);
    const code = (await redis.get(`otp:start:${s.id}`))!;
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++)
      expect((await post(a.sunita, `/shifts/${s.id}/start`, { otp: wrong, ...near })).status).toBe(400);
    expect((await post(a.sunita, `/shifts/${s.id}/start`, { otp: wrong, ...near })).status).toBe(429);
    const locked = await post(a.sunita, `/shifts/${s.id}/start`, { otp: code, ...near });
    expect(locked.status).toBe(429);
    expect(locked.body.error.code).toBe('OTP_LOCKED');
    expect((await post(a.sunita, `/shifts/${s.id}/arrive`, near)).status).toBe(429); // cannot dodge the lock by re-arriving
    await db('shifts').where({ id: s.id }).update({ status: 'CANCELLED' });
  });

  it('arriving again re-issues the Start OTP (client lost it)', async () => {
    const s = await book(ids.sunita, { start_at: inMin(5) });
    await post(a.sunita, `/shifts/${s.id}/accept`);
    await post(a.sunita, `/shifts/${s.id}/arrive`, near);
    const first = (await redis.get(`otp:start:${s.id}`))!;
    const again = await post(a.sunita, `/shifts/${s.id}/arrive`, near);
    expect(again.status).toBe(200);
    expect(await redis.exists(`otp:start:${s.id}`)).toBe(1);
    void first;
    await db('shifts').where({ id: s.id }).update({ status: 'CANCELLED' });
  });

  it('timesheet math matches hand calculations (rounding up to 15, cap at scheduled + 30)', async () => {
    // 62 min worked of 60 scheduled, 250/h, 15%: billable 75 (cap 90) -> 312.50 / 46.88 / 265.62
    const s1 = await book(ids.sunita, { start_at: inMin(5) });
    const done = await runToAwaitingApproval(a.client, a.sunita, s1.id, 62);
    expect(done.timesheet).toMatchObject({ verified_minutes: 62, billable_minutes: 75 });
    expect(done.pricing).toMatchObject({
      estimate: false,
      billable_minutes: 75,
      gross: '312.50',
      commission: '46.88',
      worker_payout: '265.62',
    });
    const clientView = (await get(a.client, `/shifts/${s1.id}`)).body.data;
    expect(clientView.pricing.gross).toBe('312.50');
    expect(clientView.pricing.commission).toBeUndefined();
    const ts = await db('timesheets').where({ shift_id: s1.id }).first();
    const deadline = ts.approval_deadline.getTime() - ts.clock_out_at.getTime();
    expect(deadline).toBe(24 * 3600 * 1000); // approval SLA from clock-out

    // 200 min worked of 60 scheduled: capped at 90 min -> 375.00
    const s2 = await book(ids.sunita, { start_at: inMin(5) });
    const capped = await runToAwaitingApproval(a.client, a.sunita, s2.id, 200);
    expect(capped.timesheet).toMatchObject({ verified_minutes: 200, billable_minutes: 90 });
    expect(capped.pricing.gross).toBe('375.00');

    // 31 min worked: rounds up to 45
    const s3 = await book(ids.sunita, { start_at: inMin(5) });
    const short = await runToAwaitingApproval(a.client, a.sunita, s3.id, 31);
    expect(short.timesheet.billable_minutes).toBe(45);
    expect(short.pricing).toMatchObject({ gross: '187.50', commission: '28.13', worker_payout: '159.37' });
  });

  it('the commission comes from admin config at clock-out time', async () => {
    await db('app_config').where({ key: 'commission_pct' }).update({ value: '10' });
    const s = await book(ids.sunita, { start_at: inMin(5) });
    const done = await runToAwaitingApproval(a.client, a.sunita, s.id, 60);
    expect(done.pricing).toMatchObject({
      gross: '250.00',
      commission: '25.00',
      worker_payout: '225.00',
      commission_pct: 10,
    });
    await db('app_config').where({ key: 'commission_pct' }).update({ value: '15' });
  });
});
