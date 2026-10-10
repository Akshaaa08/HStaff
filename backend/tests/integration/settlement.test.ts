import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/config/db';
import { autoApproveOverdue } from '../../src/modules/timesheets/service';
import {
  api,
  auth,
  bookingBody,
  closeAll,
  get,
  ids,
  loginAll,
  loginPhone,
  patch,
  post,
  resetAll,
  runToAwaitingApproval,
  skillId,
  tinyPng,
  type Actors,
} from '../helpers';

let a: Actors;
let cleaning: number;
const inMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

beforeAll(async () => {
  await resetAll();
  a = await loginAll();
  cleaning = await skillId('Cleaning');
  await db('worker_skills').insert({ worker_id: ids.rahul, skill_id: cleaning });
});
afterAll(closeAll);

async function flow(minutes = 62): Promise<string> {
  const r = await post(a.client, '/shifts', bookingBody(ids.sunita, cleaning, { start_at: inMin(5) }));
  const id = r.body.data.id as string;
  await runToAwaitingApproval(a.client, a.sunita, id, minutes);
  return id;
}

describe('M6 approval and payment', () => {
  let shiftId: string;
  it('client approves; the shift cannot be approved by the worker or twice', async () => {
    shiftId = await flow();
    expect((await post(a.sunita, `/shifts/${shiftId}/approve`)).status).toBe(403);
    const r = await post(a.client, `/shifts/${shiftId}/approve`);
    expect(r.status).toBe(200);
    expect(r.body.data.status).toBe('APPROVED');
    expect((await db('timesheets').where({ shift_id: shiftId }).first()).status).toBe('APPROVED');
    expect((await post(a.client, `/shifts/${shiftId}/approve`)).body.error.code).toBe('ILLEGAL_TRANSITION');
    expect(
      (await db('notifications').where({ user_id: ids.sunita }).orderBy('created_at', 'desc').first()).title,
    ).toBe('Timesheet approved');
  });

  it('order is for the server-side gross, and only the shift owner can create it', async () => {
    const stranger = await loginPhone('+919899999999', 'client');
    expect((await post(stranger, `/payments/shifts/${shiftId}/order`)).status).toBe(404);
    const o = await post(a.client, `/payments/shifts/${shiftId}/order`);
    expect(o.status).toBe(201);
    expect(o.body.data).toMatchObject({
      amount: '312.50',
      amount_paise: 31250,
      currency: 'INR',
      provider: 'simulated',
      status: 'CREATED',
    });
    const again = await post(a.client, `/payments/shifts/${shiftId}/order`);
    expect(again.body.data.order_id).toBe(o.body.data.order_id); // idempotent while open
  });

  it('a failed payment leaves the shift APPROVED and can be retried', async () => {
    const o = (await post(a.client, `/payments/shifts/${shiftId}/order`)).body.data;
    const f = await post(a.client, '/payments/verify', { provider_order_id: o.order_id, result: 'failure' });
    expect(f.body.data.status).toBe('FAILED');
    expect((await get(a.client, `/shifts/${shiftId}`)).body.data.status).toBe('APPROVED');
    const retry = await post(a.client, `/payments/shifts/${shiftId}/order`);
    expect(retry.body.data.order_id).not.toBe(o.order_id);
  });

  it('verify marks PAID exactly once (idempotent) and blocks a second order', async () => {
    const o = (await post(a.client, `/payments/shifts/${shiftId}/order`)).body.data;
    const stranger = await loginPhone('+919899999998', 'client');
    expect((await post(stranger, '/payments/verify', { provider_order_id: o.order_id })).status).toBe(404);
    const [v1, v2] = await Promise.all([
      post(a.client, '/payments/verify', { provider_order_id: o.order_id }),
      post(a.client, '/payments/verify', { provider_order_id: o.order_id }),
    ]);
    expect([v1.status, v2.status]).toEqual([200, 200]);
    expect(v1.body.data.status).toBe('PAID');
    expect((await get(a.client, `/shifts/${shiftId}`)).body.data.status).toBe('PAID');
    expect(await db('payments').where({ shift_id: shiftId, status: 'PAID' })).toHaveLength(1);
    expect(await db('shift_events').where({ shift_id: shiftId, to_status: 'PAID' })).toHaveLength(1);
    expect((await post(a.client, `/payments/shifts/${shiftId}/order`)).body.error.code).toBe('ALREADY_PAID');
    expect(
      (await db('notifications').where({ user_id: ids.sunita }).orderBy('created_at', 'desc').first()).title,
    ).toBe('Payment received');
  });

  it('payment history shows gross to clients and payout to workers', async () => {
    const c = await get(a.client, '/payments/history');
    expect(c.body.data[0]).toMatchObject({ shift_id: shiftId, amount: '312.50', status: 'PAID' });
    const w = await get(a.sunita, '/payments/history');
    expect(w.body.data[0]).toMatchObject({ shift_id: shiftId, amount: '265.62', payout_status: 'PENDING' });
    expect(JSON.stringify(c.body)).not.toContain('265.62'); // clients never see the payout
  });

  it('worker earnings reflect the paid shift', async () => {
    const e = (await get(a.sunita, '/workers/me/earnings')).body.data;
    expect(e.totals).toMatchObject({
      paid_total: '265.62',
      paid_today: '265.62',
      payout_pending: '265.62',
      payout_settled: '0',
      jobs_completed: 1,
    });
    expect(e.items[0]).toMatchObject({
      shift_id: shiftId,
      gross: '312.50',
      commission: '46.88',
      worker_payout: '265.62',
      billable_minutes: 75,
    });
  });

  it('finance settles payouts once; others cannot', async () => {
    expect((await post(a.support, `/admin/payouts/${shiftId}/settle`)).status).toBe(403);
    const pending = await get(a.finance, '/admin/payouts?payout_status=PENDING');
    expect(pending.body.data[0]).toMatchObject({
      shift_id: shiftId,
      worker_payout: '265.62',
      gross: '312.50',
    });
    const s = await post(a.finance, `/admin/payouts/${shiftId}/settle`);
    expect(s.status).toBe(200);
    expect((await post(a.finance, `/admin/payouts/${shiftId}/settle`)).body.error.code).toBe(
      'ALREADY_SETTLED',
    );
    expect((await get(a.sunita, '/workers/me/earnings')).body.data.totals).toMatchObject({
      payout_settled: '265.62',
      payout_pending: '0',
    });
    expect(await db('admin_audit_log').where({ action: 'PAYOUT_SETTLE', target_id: shiftId })).toHaveLength(
      1,
    );
  });
});

describe('approval deadline and auto-approve (rule 7)', () => {
  it('auto-approves after the SLA, logs it, and skips disputed or fresh timesheets', async () => {
    const overdue = await flow(60);
    const fresh = await flow(60);
    const disputed = await flow(60);
    await db('timesheets')
      .where({ shift_id: overdue })
      .update({ approval_deadline: new Date(Date.now() - 1000) });
    await db('timesheets')
      .where({ shift_id: disputed })
      .update({ approval_deadline: new Date(Date.now() - 1000) });
    expect(
      (await post(a.client, `/shifts/${disputed}/dispute`, { reason: 'Hours look wrong to me' })).status,
    ).toBe(201);

    expect(await autoApproveOverdue()).toBe(1);
    expect((await get(a.client, `/shifts/${overdue}`)).body.data.status).toBe('APPROVED');
    expect((await db('timesheets').where({ shift_id: overdue }).first()).status).toBe('AUTO_APPROVED');
    const ev = await db('shift_events').where({ shift_id: overdue, to_status: 'APPROVED' }).first();
    expect(ev).toMatchObject({ actor_id: null });
    expect(ev.meta).toMatchObject({ actor_type: 'system', auto_approved: true });
    expect((await get(a.client, `/shifts/${fresh}`)).body.data.status).toBe('AWAITING_APPROVAL');
    expect((await get(a.client, `/shifts/${disputed}`)).body.data.status).toBe('DISPUTED');
    expect(await autoApproveOverdue()).toBe(0);
  });
});

describe('M6 reviews', () => {
  it('only after PAID, one per party, with an incremental rating aggregate', async () => {
    const s1 = await flow(60);
    const early = await post(a.client, '/reviews', { shiftId: s1, stars: 5 });
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('REVIEW_NOT_ALLOWED');
    await post(a.client, `/shifts/${s1}/approve`);
    const o = (await post(a.client, `/payments/shifts/${s1}/order`)).body.data;
    await post(a.client, '/payments/verify', { provider_order_id: o.order_id });

    const r1 = await post(a.client, '/reviews', {
      shiftId: s1,
      stars: 5,
      tags: ['Punctual'],
      comment: 'Great',
    });
    expect(r1.status).toBe(201);
    expect((await post(a.client, '/reviews', { shiftId: s1, stars: 4 })).body.error.code).toBe(
      'REVIEW_EXISTS',
    );
    expect((await post(a.client, '/reviews', { shiftId: s1, stars: 6 })).status).toBe(400);
    expect(await db('worker_profiles').where({ user_id: ids.sunita }).first()).toMatchObject({
      rating_avg: '5.00',
      rating_count: 1,
    });

    const s2 = await flow(60);
    await post(a.client, `/shifts/${s2}/approve`);
    const o2 = (await post(a.client, `/payments/shifts/${s2}/order`)).body.data;
    await post(a.client, '/payments/verify', { provider_order_id: o2.order_id });
    await post(a.client, '/reviews', { shiftId: s2, stars: 4 });
    expect(await db('worker_profiles').where({ user_id: ids.sunita }).first()).toMatchObject({
      rating_avg: '4.50',
      rating_count: 2,
    });

    // the worker rates the client; that does not touch the worker aggregate
    expect((await post(a.sunita, '/reviews', { shiftId: s1, stars: 5 })).status).toBe(201);
    expect((await db('worker_profiles').where({ user_id: ids.sunita }).first()).rating_count).toBe(2);
    const stranger = await loginPhone('+919899999997', 'client');
    expect((await post(stranger, '/reviews', { shiftId: s1, stars: 1 })).status).toBe(404);
    expect((await post(a.rahul, '/reviews', { shiftId: s1, stars: 1 })).status).toBe(404);

    // public profile shows visible reviews with first names only
    const pub = (await get(a.client, `/workers/${ids.sunita}`)).body.data;
    expect(pub.reviews).toHaveLength(2);
    expect(pub.rating_avg).toBe('4.50');

    // report + admin hide recomputes the aggregate
    const reviewId = r1.body.data.id;
    expect((await post(a.client, `/reviews/${reviewId}/report`)).status).toBe(404); // only the reviewee may report
    expect((await post(a.sunita, `/reviews/${reviewId}/report`)).status).toBe(200);
    const reported = await get(a.support, '/admin/reviews?reported=true');
    expect(reported.body.data.map((r: { id: string }) => r.id)).toEqual([reviewId]);
    expect((await patch(a.support, `/admin/reviews/${reviewId}`, { hidden: true })).status).toBe(200);
    expect(await db('worker_profiles').where({ user_id: ids.sunita }).first()).toMatchObject({
      rating_avg: '4.00',
      rating_count: 1,
    });
    expect((await get(a.client, `/workers/${ids.sunita}`)).body.data.reviews).toHaveLength(1);
    await patch(a.support, `/admin/reviews/${reviewId}`, { hidden: false });
    expect((await db('worker_profiles').where({ user_id: ids.sunita }).first()).rating_avg).toBe('4.50');
  });
});

describe('M6 disputes', () => {
  it('moves the shift to DISPUTED, takes evidence, and an admin resolves it', async () => {
    const id = await flow(60);
    const bad = await post(a.client, `/shifts/${id}/dispute`, { reason: 'x' });
    expect(bad.status).toBe(400);
    const r = await api()
      .post(`/api/v1/shifts/${id}/dispute`)
      .set(auth(a.client))
      .field('reason', 'The job was not completed properly')
      .attach('evidence', tinyPng, { filename: 'photo.png', contentType: 'image/png' });
    expect(r.status).toBe(201);
    expect(r.body.data.dispute).toMatchObject({ status: 'OPEN', evidence_count: 1 });
    expect(r.body.data.shift.status).toBe('DISPUTED');
    expect((await db('timesheets').where({ shift_id: id }).first()).status).toBe('DISPUTED');
    expect(
      (await post(a.client, `/shifts/${id}/dispute`, { reason: 'Second report same shift' })).body.error.code,
    ).toBe('DISPUTE_EXISTS');
    expect((await post(a.client, `/shifts/${id}/approve`)).body.error.code).toBe('ILLEGAL_TRANSITION');
    expect(
      (await db('notifications').where({ user_id: ids.sunita }).orderBy('created_at', 'desc').first()).title,
    ).toBe('Issue reported');
    expect(
      await db('notifications')
        .where({ user_id: ids.support, title: 'New dispute' })
        .whereRaw("data->>'shiftId' = ?", [id]),
    ).toHaveLength(1);

    // support sees it, with a signed evidence link; finance cannot
    expect((await get(a.finance, '/admin/disputes')).status).toBe(403);
    const list = await get(a.support, '/admin/disputes?status=OPEN');
    const d = list.body.data.find((x: { shift_id: string }) => x.shift_id === id);
    expect(d.evidence_count).toBe(1);
    const detail = (await get(a.support, `/admin/disputes/${d.id}`)).body.data;
    expect(detail.evidence[0].url).toMatch(/dev-files/);
    expect((await api().get(new URL(detail.evidence[0].url).pathname)).status).toBe(200);
    expect(detail.shift.timeline.length).toBeGreaterThan(5);

    expect((await patch(a.support, `/admin/disputes/${d.id}`, { status: 'RESOLVED' })).status).toBe(400); // needs a resolution
    const noOutcome = await patch(a.support, `/admin/disputes/${d.id}`, {
      status: 'RESOLVED',
      resolution: 'Hours confirmed',
    });
    expect(noOutcome.body.error.code).toBe('OUTCOME_REQUIRED');
    expect(
      (await patch(a.support, `/admin/disputes/${d.id}`, { status: 'IN_REVIEW' })).body.data.status,
    ).toBe('IN_REVIEW');
    const res = await patch(a.support, `/admin/disputes/${d.id}`, {
      status: 'RESOLVED',
      resolution: 'Hours confirmed by photos',
      shift_outcome: 'APPROVE',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'RESOLVED', resolved_by: ids.support });
    expect((await get(a.client, `/shifts/${id}`)).body.data.status).toBe('APPROVED');
    expect((await patch(a.support, `/admin/disputes/${d.id}`, { status: 'IN_REVIEW' })).body.error.code).toBe(
      'ALREADY_RESOLVED',
    );

    // rating is allowed once resolved
    const o = (await post(a.client, `/payments/shifts/${id}/order`)).body.data;
    await post(a.client, '/payments/verify', { provider_order_id: o.order_id });
    expect((await post(a.client, '/reviews', { shiftId: id, stars: 3 })).status).toBe(201);
  });

  it('CANCEL outcome ends the shift without payment; either party can raise; non-parties cannot', async () => {
    const id = await flow(60);
    expect(
      (await post(a.sunita, `/shifts/${id}/dispute`, { reason: 'Client refuses to approve the hours' }))
        .status,
    ).toBe(201);
    expect((await get(a.sunita, `/shifts/${id}`)).body.data.status).toBe('DISPUTED');
    expect((await post(a.rahul, `/shifts/${id}/dispute`, { reason: 'Not my shift at all' })).status).toBe(
      404,
    );
    const d = await db('disputes').where({ shift_id: id }).first();
    await patch(a.support, `/admin/disputes/${d.id}`, {
      status: 'RESOLVED',
      resolution: 'No-show confirmed',
      shift_outcome: 'CANCEL',
    });
    expect((await get(a.client, `/shifts/${id}`)).body.data.status).toBe('CANCELLED');
    expect((await post(a.client, `/payments/shifts/${id}/order`)).status).toBe(409);
  });

  it('a dispute before the job starts is refused', async () => {
    const r = await post(
      a.client,
      '/shifts',
      bookingBody(ids.sunita, cleaning, { start_at: inMin(20 * 24 * 60) }),
    );
    expect(
      (await post(a.client, `/shifts/${r.body.data.id}/dispute`, { reason: 'Too early to complain' })).body
        .error.code,
    ).toBe('DISPUTE_NOT_ALLOWED');
    await post(a.client, `/shifts/${r.body.data.id}/cancel`, { reason: 'cleanup' });
  });
});

describe('M7 admin API and RBAC', () => {
  it('enforces the sub-role matrix', async () => {
    const matrix: Array<[string, keyof Actors, number]> = [
      ['/admin/dashboard', 'verifier', 200],
      ['/admin/dashboard', 'finance', 200],
      ['/admin/dashboard', 'support', 200],
      ['/admin/workers', 'verifier', 200],
      ['/admin/workers', 'finance', 403],
      ['/admin/workers', 'support', 403],
      ['/admin/users', 'support', 200],
      ['/admin/users', 'verifier', 403],
      ['/admin/users', 'finance', 403],
      ['/admin/payments', 'finance', 200],
      ['/admin/payments', 'support', 403],
      ['/admin/payments', 'verifier', 403],
      ['/admin/payouts', 'finance', 200],
      ['/admin/payouts', 'verifier', 403],
      ['/admin/disputes', 'support', 200],
      ['/admin/disputes', 'finance', 403],
      ['/admin/reviews', 'support', 200],
      ['/admin/reviews', 'verifier', 403],
      ['/admin/config', 'super', 200],
      ['/admin/config', 'support', 403],
      ['/admin/config', 'finance', 403],
      ['/admin/audit-log', 'super', 200],
      ['/admin/audit-log', 'verifier', 403],
      ['/admin/skills', 'super', 200],
      ['/admin/skills', 'support', 403],
      ['/admin/admins', 'super', 200],
      ['/admin/admins', 'support', 403],
      ['/admin/shifts', 'finance', 200],
      ['/admin/workers', 'super', 200],
      ['/admin/payments', 'super', 200],
      ['/admin/disputes', 'super', 200],
    ];
    for (const [path, who, status] of matrix)
      expect([path, who, (await get(a[who], path)).status]).toEqual([path, who, status]);
  });

  it('non-admins and anonymous callers are refused', async () => {
    for (const s of [a.client, a.sunita]) expect((await get(s, '/admin/dashboard')).status).toBe(403);
    expect((await api().get('/api/v1/admin/dashboard')).status).toBe(401);
    expect((await api().get('/api/v1/admin/audit-log')).status).toBe(401);
  });

  it('dashboard reports revenue and counts', async () => {
    const d = (await get(a.finance, '/admin/dashboard')).body.data;
    expect(d.counts.workers).toBeGreaterThanOrEqual(3);
    expect(Number(d.revenue.gmv)).toBeGreaterThan(0);
    expect(Number(d.revenue.commission)).toBeGreaterThan(0);
    expect(d.per_day).toHaveLength(14);
    expect(d.shifts_by_status.some((s: { status: string }) => s.status === 'PAID')).toBe(true);
  });

  it('super admin edits config, skills and admins; each mutation is audited', async () => {
    const cfg = await api()
      .put('/api/v1/admin/config')
      .set(auth(a.super))
      .send({ commission_pct: 12.5, geofence_m: 200 });
    expect(cfg.body.data).toMatchObject({ commission_pct: 12.5, geofence_m: 200 });
    expect(
      (await api().put('/api/v1/admin/config').set(auth(a.super)).send({ commission_pct: 500 })).status,
    ).toBe(400);
    expect((await api().put('/api/v1/admin/config').set(auth(a.super)).send({ bogus: 1 })).status).toBe(400);
    await api().put('/api/v1/admin/config').set(auth(a.super)).send({ commission_pct: 15, geofence_m: 150 });

    const sk = await post(a.super, '/admin/skills', { name: 'Gardening' });
    expect(sk.status).toBe(201);
    expect((await post(a.super, '/admin/skills', { name: 'Gardening' })).body.error.code).toBe(
      'SKILL_EXISTS',
    );
    expect(
      (await patch(a.super, `/admin/skills/${sk.body.data.id}`, { active: false })).body.data.active,
    ).toBe(false);
    expect((await api().get('/api/v1/skills')).body.data.map((s: { name: string }) => s.name)).not.toContain(
      'Gardening',
    );
    expect(
      (await api().delete(`/api/v1/admin/skills/${sk.body.data.id}`).set(auth(a.super))).body.data.deleted,
    ).toBe(true);
    expect(
      (await api().delete(`/api/v1/admin/skills/${cleaning}`).set(auth(a.super))).body.data,
    ).toMatchObject({ deleted: false, deactivated: true });
    await db('skills').where({ id: cleaning }).update({ active: true });

    const na = await post(a.super, '/admin/admins', {
      email: 'new.support@hstaff.dev',
      password: 'Str0ng-pass-123',
      name: 'New Support',
      admin_role: 'support',
    });
    expect(na.status).toBe(201);
    expect(JSON.stringify(na.body)).not.toMatch(/password/);
    expect(
      (
        await post(a.super, '/admin/admins', {
          email: 'new.support@hstaff.dev',
          password: 'Str0ng-pass-123',
          name: 'Dup',
          admin_role: 'support',
        })
      ).status,
    ).toBe(409);
    expect(
      (
        await post(a.super, '/admin/admins', {
          email: 'weak@hstaff.dev',
          password: 'short',
          name: 'Weak',
          admin_role: 'support',
        })
      ).status,
    ).toBe(400);
    expect(
      (await patch(a.super, `/admin/admins/${a.super.id}`, { status: 'SUSPENDED' })).body.error.code,
    ).toBe('SELF_LOCKOUT');
    expect(
      (
        await api()
          .post('/api/v1/auth/admin/login')
          .send({ email: 'new.support@hstaff.dev', password: 'Str0ng-pass-123' })
      ).status,
    ).toBe(200);

    const log = await get(a.super, '/admin/audit-log?limit=100');
    const actions = log.body.data.map((l: { action: string }) => l.action);
    for (const x of [
      'CONFIG_UPDATE',
      'SKILL_CREATE',
      'SKILL_UPDATE',
      'SKILL_DELETE',
      'ADMIN_CREATE',
      'DISPUTE_RESOLVED',
      'PAYOUT_SETTLE',
      'REVIEW_HIDE',
    ])
      expect(actions).toContain(x);
    const cfgLog = log.body.data.find((l: { action: string }) => l.action === 'CONFIG_UPDATE');
    expect(cfgLog.admin_id).toBe(a.super.id);
    expect(cfgLog.meta.before).toBeTruthy();
  });

  it('suspending a user locks them out immediately and revokes refresh tokens', async () => {
    const u = await loginPhone('+919877000001', 'client');
    expect(
      (await patch(a.support, `/admin/users/${u.id}/status`, { status: 'SUSPENDED', reason: 'fraud' }))
        .status,
    ).toBe(200);
    expect((await get(u, '/users/me')).body.error.code).toBe('ACCOUNT_SUSPENDED');
    expect((await api().post('/api/v1/auth/refresh').send({ refresh_token: u.refresh })).status).toBe(401);
    expect((await patch(a.support, `/admin/users/${u.id}/status`, { status: 'ACTIVE' })).status).toBe(200);
    expect((await get(u, '/users/me')).status).toBe(200);
    expect(
      (await patch(a.support, `/admin/users/${a.super.id}/status`, { status: 'SUSPENDED' })).status,
    ).toBe(404); // admins are not managed here
  });

  it('admin can cancel or reassign a shift; announcements reach users', async () => {
    const r = await post(
      a.client,
      '/shifts',
      bookingBody(ids.sunita, cleaning, { start_at: inMin(21 * 24 * 60) }),
    );
    const id = r.body.data.id;
    expect((await post(a.finance, `/admin/shifts/${id}/cancel`, { reason: 'x y z' })).status).toBe(403);
    const re = await post(a.support, `/admin/shifts/${id}/reassign`, { worker_id: ids.rahul });
    expect(re.status).toBe(200);
    expect(re.body.data.worker_name).toBe('Rahul Shinde');
    expect((await get(a.support, `/admin/shifts/${id}`)).body.data.worker_id).toBe(ids.rahul);
    expect(
      (await post(a.support, `/admin/shifts/${id}/cancel`, { reason: 'Customer called support' })).body.data
        .status,
    ).toBe('CANCELLED');
    const ann = await post(a.support, '/admin/announcements', {
      title: 'Festival offer',
      body: 'Book now',
      audience: 'workers',
    });
    expect(ann.status).toBe(201);
    expect(ann.body.data.recipients).toBeGreaterThanOrEqual(3);
    expect(await db('notifications').where({ user_id: ids.rahul, title: 'Festival offer' })).toHaveLength(1);
    expect(await db('notifications').where({ user_id: ids.client, title: 'Festival offer' })).toHaveLength(0);
  });

  it('notifications API: list, unread count, mark read (own only)', async () => {
    const list = await get(a.sunita, '/notifications');
    expect(list.body.meta.unread).toBeGreaterThan(0);
    const first = list.body.data[0];
    expect((await post(a.sunita, `/notifications/${first.id}/read`)).body.data.read).toBe(true);
    expect((await post(a.client, `/notifications/${first.id}/read`)).status).toBe(404);
    expect((await post(a.sunita, '/notifications/read-all')).status).toBe(200);
    expect((await get(a.sunita, '/notifications')).body.meta.unread).toBe(0);
  });

  it('shift_events is append-only at the database level', async () => {
    await expect(db('shift_events').update({ event: 'tampered' })).rejects.toThrow(/append-only/);
    await expect(db('shift_events').del()).rejects.toThrow(/append-only/);
  });
});
