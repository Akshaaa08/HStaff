import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/config/db';
import { redis } from '../../src/config/redis';
import {
  api,
  closeAll,
  get,
  ids,
  loginAll,
  loginPhone,
  post,
  put,
  PUNE,
  resetAll,
  skillId,
  tinyPng,
  type Actors,
  type Session,
} from '../helpers';

let a: Actors;
let fresh: Session;
beforeAll(async () => {
  await resetAll();
  a = await loginAll();
  fresh = await loginPhone('+919866666666', 'worker', 'Fresh Worker');
});
afterAll(closeAll);

const upload = (s: Session, docType: string, buf: Buffer, mime: string, name = 'doc.png') =>
  api()
    .post('/api/v1/workers/me/kyc')
    .set('Authorization', `Bearer ${s.token}`)
    .field('doc_type', docType)
    .attach('file', buf, { filename: name, contentType: mime });

describe('M2 worker profile and KYC', () => {
  it('profile CRUD with skills, rate and equipment', async () => {
    const cleaning = await skillId('Cleaning');
    const r = await put(fresh, '/workers/me', {
      bio: 'Careful and punctual',
      experience_years: 4,
      hourly_rate: 240,
      equipment: 'Own kit',
      skill_ids: [cleaning],
      upi_id: 'fresh@okaxis',
      age: 29,
    });
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      hourly_rate: '240.00',
      experience_years: 4,
      upi_id: 'fresh@okaxis',
      verification: 'PENDING',
      is_online: false,
    });
    expect(r.body.data.skills).toEqual([{ id: cleaning, name: 'Cleaning' }]);
  });

  it('validates profile input', async () => {
    expect((await put(fresh, '/workers/me', { age: 17 })).status).toBe(400);
    expect((await put(fresh, '/workers/me', { hourly_rate: -5 })).status).toBe(400);
    expect((await put(fresh, '/workers/me', { upi_id: 'nope' })).status).toBe(400);
    expect((await put(fresh, '/workers/me', { skill_ids: [9999] })).body.error.code).toBe('INVALID_SKILL');
    expect((await put(fresh, '/workers/me', {})).status).toBe(400);
  });

  it('unverified worker cannot go online (rule 9)', async () => {
    const r = await post(fresh, '/workers/me/online', { online: true, ...PUNE });
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('NOT_VERIFIED');
    expect(r.body.error.details.verification).toBe('PENDING');
  });

  it('KYC upload goes to private storage and rejects bad files', async () => {
    expect((await upload(fresh, 'AADHAAR', Buffer.from('hello'), 'text/plain')).status).toBe(400);
    const spoof = await upload(fresh, 'AADHAAR', Buffer.from('this is not a png'), 'image/png');
    expect(spoof.status).toBe(400);
    expect(spoof.body.error.code).toBe('INVALID_FILE');
    expect((await upload(fresh, 'NOPE', tinyPng, 'image/png')).status).toBe(400);
    const ok = await upload(fresh, 'AADHAAR', tinyPng, 'image/png');
    expect(ok.status).toBe(201);
    const list = await get(fresh, '/workers/me/kyc');
    expect(list.body.data).toHaveLength(1);
    expect(JSON.stringify(list.body)).not.toMatch(/http|storage_key|kyc\//); // never a URL or key back to the worker
    const row = await db('kyc_documents').where({ worker_id: fresh.id }).first();
    expect(row.storage_key).toMatch(/^kyc\/.+\.png$/); // the DB holds the object key only
  });

  it('only verifier and super_admin can open KYC documents, via short-lived signed URLs', async () => {
    expect((await get(a.finance, `/admin/workers/${fresh.id}`)).status).toBe(403);
    expect((await get(a.support, `/admin/workers/${fresh.id}`)).status).toBe(403);
    const detail = await get(a.verifier, `/admin/workers/${fresh.id}`);
    expect(detail.status).toBe(200);
    const doc = detail.body.data.documents[0];
    expect(doc.url_expires_in_sec).toBeLessThanOrEqual(300);
    const path = new URL(doc.url).pathname;
    const file = await api().get(path);
    expect(file.status).toBe(200);
    expect(Buffer.compare(file.body, tinyPng)).toBe(0);
    expect((await api().get(path.slice(0, -3) + 'abc')).status).toBe(403); // tampered signature
    expect((await api().get(`/api/v1/dev-files/public/kyc-documents/${doc.id}`)).status).toBe(404); // private bucket is never public
    expect((await get(a.super, `/admin/workers/${fresh.id}`)).status).toBe(200);
    expect(
      await db('admin_audit_log').where({ action: 'KYC_VIEW', target_id: fresh.id }).first(),
    ).toBeTruthy();
  });

  it('admin verify: needs a document to approve, needs a note to reject', async () => {
    const noDoc = await post(a.verifier, `/admin/workers/${ids.pending}/verify`, { decision: 'APPROVED' });
    expect(noDoc.status).toBe(409);
    expect(noDoc.body.error.code).toBe('KYC_MISSING');
    expect(
      (await post(a.verifier, `/admin/workers/${fresh.id}/verify`, { decision: 'REJECTED' })).status,
    ).toBe(400);
    expect(
      (await post(a.support, `/admin/workers/${fresh.id}/verify`, { decision: 'APPROVED' })).status,
    ).toBe(403);
  });

  it('NEEDS_INFO then re-upload puts the worker back in the queue', async () => {
    const r = await post(a.verifier, `/admin/workers/${fresh.id}/verify`, {
      decision: 'NEEDS_INFO',
      note: 'Photo is blurry',
    });
    expect(r.status).toBe(200);
    expect((await get(fresh, '/workers/me')).body.data).toMatchObject({
      verification: 'NEEDS_INFO',
      verification_note: 'Photo is blurry',
    });
    expect((await upload(fresh, 'PAN', tinyPng, 'image/png')).status).toBe(201);
    expect((await get(fresh, '/workers/me')).body.data.verification).toBe('PENDING');
    const queue = await get(a.verifier, '/admin/workers?verification=PENDING');
    expect(queue.body.data.map((w: { id: string }) => w.id)).toContain(fresh.id);
  });

  it('admin approval enables going online, and every admin mutation is audited', async () => {
    expect(
      (await post(a.verifier, `/admin/workers/${fresh.id}/verify`, { decision: 'APPROVED' })).status,
    ).toBe(200);
    const mock = await post(fresh, '/workers/me/online', { online: true, ...PUNE, mocked: true });
    expect(mock.status).toBe(400);
    expect(mock.body.error.code).toBe('MOCK_LOCATION');
    const on = await post(fresh, '/workers/me/online', { online: true, lat: 18.57, lng: 73.8 });
    expect(on.status).toBe(200);
    expect((await get(fresh, '/workers/me')).body.data).toMatchObject({
      is_online: true,
      lat: 18.57,
      lng: 73.8,
    });
    const log = await db('admin_audit_log')
      .where({ action: 'WORKER_VERIFY', target_id: fresh.id })
      .orderBy('id');
    expect(log.map((l) => l.meta.decision)).toEqual(['NEEDS_INFO', 'APPROVED']);
    expect((await post(fresh, '/workers/me/online', { online: false })).body.data.online).toBe(false);
    expect((await post(fresh, '/workers/me/online', { online: true })).status).toBe(400); // lat/lng required
  });

  it('going online needs a rate and a skill', async () => {
    const r = await post(a.rahul, '/workers/me/online', { online: true, lat: 18.5642, lng: 73.7985 });
    expect(r.status).toBe(200); // seeded Rahul has both
    await db('worker_profiles').where({ user_id: ids.rahul }).update({ hourly_rate: null });
    const bad = await post(a.rahul, '/workers/me/online', { online: true, lat: 18.5642, lng: 73.7985 });
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe('PROFILE_INCOMPLETE');
    await db('worker_profiles').where({ user_id: ids.rahul }).update({ hourly_rate: 300 });
  });

  it('suspending a worker takes them offline and out of search', async () => {
    const s = await loginPhone('+919877777777', 'worker');
    const cleaning = await skillId('Cleaning');
    await put(s, '/workers/me', { hourly_rate: 100, skill_ids: [cleaning] });
    await upload(s, 'AADHAAR', tinyPng, 'image/png');
    await post(a.verifier, `/admin/workers/${s.id}/verify`, { decision: 'APPROVED' });
    await post(s, '/workers/me/online', { online: true, ...PUNE });
    const before = await get(a.client, `/workers/nearby?lat=${PUNE.lat}&lng=${PUNE.lng}&skill=Cleaning`);
    expect(before.body.data.map((w: { id: string }) => w.id)).toContain(s.id);
    expect(
      (
        await api()
          .patch(`/api/v1/admin/users/${s.id}/status`)
          .set('Authorization', `Bearer ${a.support.token}`)
          .send({ status: 'SUSPENDED', reason: 'test' })
      ).status,
    ).toBe(200);
    const after = await get(a.client, `/workers/nearby?lat=${PUNE.lat}&lng=${PUNE.lng}&skill=Cleaning`);
    expect(after.body.data.map((w: { id: string }) => w.id)).not.toContain(s.id);
  });

  it('location pings are throttled', async () => {
    await redis.del(`throttle:loc:${ids.sunita}`);
    const first = await post(a.sunita, '/workers/me/location', {
      lat: PUNE.lat,
      lng: PUNE.lng,
      accuracy_m: 10,
    });
    const second = await post(a.sunita, '/workers/me/location', { lat: PUNE.lat, lng: PUNE.lng });
    expect(first.body.data.throttled).toBe(false);
    expect(second.body.data.throttled).toBe(true);
    expect((await post(a.sunita, '/workers/me/location', { lat: 200, lng: 0 })).status).toBe(400);
  });

  it('profile photo upload serves from the public bucket', async () => {
    const r = await api()
      .post('/api/v1/workers/me/photo')
      .set('Authorization', `Bearer ${a.sunita.token}`)
      .attach('photo', tinyPng, { filename: 'me.png', contentType: 'image/png' });
    expect(r.status).toBe(200);
    expect((await api().get(new URL(r.body.data.photo_url).pathname)).status).toBe(200);
  });

  it('earnings are empty and well-formed for a new worker', async () => {
    const r = await get(fresh, '/workers/me/earnings');
    expect(r.status).toBe(200);
    expect(r.body.data.totals).toMatchObject({ paid_total: '0', jobs_completed: 0 });
    expect(r.body.data.items).toEqual([]);
  });
});

describe('M3 skills, geo and search', () => {
  it('lists the 15 seeded categories publicly', async () => {
    const r = await api().get('/api/v1/skills');
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(15);
  });

  it('nearby returns verified online workers in distance order', async () => {
    const r = await get(a.client, `/workers/nearby?lat=${PUNE.lat}&lng=${PUNE.lng}&radius=10`);
    expect(r.status).toBe(200);
    const names = r.body.data.map((w: { name: string }) => w.name);
    expect(names.slice(0, 2)).toEqual(['Sunita Patil', 'Rahul Shinde']);
    expect(names).not.toContain('Pending Worker'); // unverified and offline
    const d = r.body.data.map((w: { distance_m: number }) => w.distance_m);
    expect([...d].sort((x, y) => x - y)).toEqual(d);
    expect(d[0]).toBeLessThan(5);
    expect(d[1]).toBeGreaterThan(900);
    expect(d[1]).toBeLessThan(1600);
    expect(r.body.meta.total).toBe(r.body.data.length);
  });

  it('filters by skill (name or id), rate, rating, radius, and sorts', async () => {
    const base = `/workers/nearby?lat=${PUNE.lat}&lng=${PUNE.lng}`;
    expect(
      (await get(a.client, `${base}&skill=Electrical`)).body.data.map((w: { name: string }) => w.name),
    ).toEqual(['Rahul Shinde']);
    expect((await get(a.client, `${base}&skill=${await skillId('Electrical')}`)).body.data).toHaveLength(1);
    expect((await get(a.client, `${base}&skill=Welding`)).body.data).toEqual([]);
    expect((await get(a.client, `${base}&skill=NoSuchSkill`)).body.data).toEqual([]);
    expect(
      (await get(a.client, `${base}&maxRate=260&skill=Cleaning`)).body.data.map(
        (w: { name: string }) => w.name,
      ),
    ).toEqual(['Sunita Patil']);
    expect(
      (await get(a.client, `${base}&radius=0.5`)).body.data.map((w: { name: string }) => w.name),
    ).toEqual(['Sunita Patil']);
    await db('worker_profiles').where({ user_id: ids.rahul }).update({ rating_avg: 4.9, rating_count: 10 });
    expect(
      (await get(a.client, `${base}&minRating=4.5`)).body.data.map((w: { name: string }) => w.name),
    ).toEqual(['Rahul Shinde']);
    expect((await get(a.client, `${base}&sort=rating`)).body.data[0].name).toBe('Rahul Shinde');
    expect((await get(a.client, `${base}&sort=rate`)).body.data[0].name).toBe('Sunita Patil');
    await db('worker_profiles').where({ user_id: ids.rahul }).update({ rating_avg: 0, rating_count: 0 });
  });

  it('online=false includes offline workers (for scheduled bookings)', async () => {
    await db('worker_profiles').where({ user_id: ids.rahul }).update({ is_online: false });
    const base = `/workers/nearby?lat=${PUNE.lat}&lng=${PUNE.lng}`;
    expect((await get(a.client, base)).body.data.map((w: { name: string }) => w.name)).not.toContain(
      'Rahul Shinde',
    );
    expect(
      (await get(a.client, `${base}&online=false`)).body.data.map((w: { name: string }) => w.name),
    ).toContain('Rahul Shinde');
    await db('worker_profiles').where({ user_id: ids.rahul }).update({ is_online: true });
  });

  it('nearby is a client endpoint and validates coordinates', async () => {
    expect((await get(a.sunita, `/workers/nearby?lat=${PUNE.lat}&lng=${PUNE.lng}`)).status).toBe(403);
    expect((await get(a.client, '/workers/nearby?lat=999&lng=0')).status).toBe(400);
  });

  it('public worker profile hides unverified workers and shows reviews', async () => {
    const ok = await get(a.client, `/workers/${ids.sunita}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ name: 'Sunita Patil', hourly_rate: '250.00' });
    expect(ok.body.data.reviews).toEqual([]);
    expect((await get(a.client, `/workers/${ids.pending}`)).status).toBe(404);
    expect((await get(a.client, '/workers/not-a-uuid')).status).toBe(400);
  });

  it('geo ETA falls back to a straight-line estimate without an ORS key', async () => {
    const r = await get(a.client, `/geo/eta?fromLat=18.559&fromLng=73.7868&toLat=18.5642&toLng=73.7985`);
    expect(r.status).toBe(200);
    expect(r.body.data.source).toBe('estimate');
    expect(r.body.data.duration_sec).toBeGreaterThan(60);
    expect((await get(a.client, '/geo/eta')).status).toBe(400);
  });

  it('geo search serves cached results without calling Nominatim', async () => {
    await redis.set(
      'geo:search:in:baner pune',
      JSON.stringify([{ display_name: 'Baner, Pune', lat: 18.559, lng: 73.7868 }]),
      'EX',
      60,
    );
    const r = await get(a.client, '/geo/search?q=Baner Pune');
    expect(r.status).toBe(200);
    expect(r.body.meta.cached).toBe(true);
    expect(r.body.data[0].display_name).toBe('Baner, Pune');
    expect((await get(a.client, '/geo/search?q=ab')).status).toBe(400);
  });
});
