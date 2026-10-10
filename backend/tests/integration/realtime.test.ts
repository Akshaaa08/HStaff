import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { db } from '../../src/config/db';
import { redis } from '../../src/config/redis';
import { sentPushes } from '../../src/modules/notifications/push';
import { expireStaleRequests } from '../../src/modules/shifts/service';
import { closeSocket, initSocket } from '../../src/realtime/socket';
import {
  bookingBody,
  closeAll,
  ids,
  loginAll,
  loginPhone,
  PUNE,
  resetAll,
  skillId,
  type Actors,
  type Session,
} from '../helpers';

let a: Actors;
let server: http.Server;
let base: string;
let cleaning: number;
const inMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const near = { lat: PUNE.lat + 0.0004, lng: PUNE.lng };

const http_ = (s: Session) => ({
  get: (u: string) => request(base).get(`/api/v1${u}`).set('Authorization', `Bearer ${s.token}`),
  post: (u: string, b: object = {}) =>
    request(base).post(`/api/v1${u}`).set('Authorization', `Bearer ${s.token}`).send(b),
});

function listen(s: Session): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const sock = connect(base, { auth: { token: s.token }, transports: ['websocket'], reconnection: false });
    sock.on('connect', () => resolve(sock));
    sock.on('connect_error', reject);
  });
}
const once = <T>(sock: Socket, event: string) => new Promise<T>((res) => sock.once(event, res));

beforeAll(async () => {
  await resetAll();
  a = await loginAll();
  cleaning = await skillId('Cleaning');
  await db('worker_skills').insert({ worker_id: ids.rahul, skill_id: cleaning });
  server = http.createServer(createApp());
  initSocket(server);
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  await closeSocket();
  server.close();
  await closeAll();
});

describe('M9 realtime (Socket.IO)', () => {
  it('rejects unauthenticated sockets', async () => {
    await expect(
      new Promise((res, rej) => {
        const s = connect(base, { auth: { token: 'bad' }, transports: ['websocket'], reconnection: false });
        s.on('connect', () => res(s));
        s.on('connect_error', rej);
      }),
    ).rejects.toThrow(/UNAUTHORIZED/);
  });

  it('delivers requests, status updates, OTPs and live location to the right people only', async () => {
    const [client, worker, other] = await Promise.all([listen(a.client), listen(a.sunita), listen(a.rahul)]);
    const seen: { rahul: [string, unknown][] } = { rahul: [] };
    other.onAny((e: string, p: unknown) => seen.rahul.push([e, p]));

    const requested = once<{ shiftId: string; skill: string }>(worker, 'shift:requested');
    const create = await http_(a.client).post(
      '/shifts',
      bookingBody(ids.sunita, cleaning, { start_at: inMin(5) }),
    );
    const shiftId = create.body.data.id as string;
    expect((await requested).shiftId).toBe(shiftId);

    const accepted = once<{ shiftId: string; status: string }>(client, 'shift:updated');
    await http_(a.sunita).post(`/shifts/${shiftId}/accept`);
    expect(await accepted).toMatchObject({ shiftId, status: 'ACCEPTED' });

    // the client is in the shift room: live location only flows while EN_ROUTE
    await http_(a.sunita).post(`/shifts/${shiftId}/en-route`, {});
    await redis.del(`throttle:loc:${ids.sunita}`);
    const loc = once<{ shiftId: string; lat: number; lng: number }>(client, 'worker:location');
    await http_(a.sunita).post('/workers/me/location', { lat: 18.5575, lng: 73.7868 });
    expect(await loc).toMatchObject({ shiftId, lat: 18.5575, lng: 73.7868 });

    // OTP goes to the client's socket (and only there)
    sentPushes.length = 0;
    const otpEvent = once<{ shiftId: string; type: string; otp: string }>(client, 'shift:otp');
    const workerEvents: string[] = [];
    worker.onAny((e) => workerEvents.push(e));
    await http_(a.sunita).post(`/shifts/${shiftId}/arrive`, near);
    const ev = await otpEvent;
    expect(ev).toMatchObject({ shiftId, type: 'start' });
    expect(ev.otp).toBe(await redis.get(`otp:start:${shiftId}`));
    expect(workerEvents).not.toContain('shift:otp');
    expect(sentPushes).toHaveLength(0); // the client is connected, so no push is sent

    // end of shift: timesheet:ready carries the amount
    const started = await http_(a.sunita).post(`/shifts/${shiftId}/start`, { otp: ev.otp, ...near });
    expect(started.status).toBe(200);
    await db.raw(`UPDATE timesheets SET clock_in_at = now() - interval '60 minutes' WHERE shift_id = ?`, [
      shiftId,
    ]);
    await http_(a.sunita).post(`/shifts/${shiftId}/end-otp`);
    const endCode = (await redis.get(`otp:end:${shiftId}`))!;
    const ready = once<{ shiftId: string; gross: string }>(client, 'timesheet:ready');
    await http_(a.sunita).post(`/shifts/${shiftId}/end`, { otp: endCode, ...near });
    expect(await ready).toMatchObject({ shiftId, gross: '250.00' });

    // a user who is not a party never hears about this shift
    expect(
      seen.rahul.filter(([e]) =>
        ['shift:updated', 'shift:otp', 'worker:location', 'timesheet:ready'].includes(e),
      ),
    ).toEqual([]);

    // notification:new reaches connected users instead of a push
    const note = once<{ title: string }>(worker, 'notification:new');
    await http_(a.client).post(`/shifts/${shiftId}/approve`);
    expect((await note).title).toBe('Timesheet approved');
    [client, worker, other].forEach((s) => s.close());
  });

  it('shift:join is ownership-checked', async () => {
    const [client, other] = await Promise.all([listen(a.client), listen(a.rahul)]);
    const shiftId = (await db('shifts').first('id')).id;
    const ack = (s: Socket) => new Promise<{ ok: boolean }>((res) => s.emit('shift:join', shiftId, res));
    expect((await ack(client)).ok).toBe(true);
    expect((await ack(other)).ok).toBe(false);
    client.close();
    other.close();
  });
});

describe('M12 OPEN mode (stretch): broadcast, first-accept-wins', () => {
  const open = (over: Record<string, unknown> = {}) =>
    http_(a.client).post('/shifts', {
      mode: 'OPEN',
      skill_id: cleaning,
      hourly_rate: 220,
      title: 'Need help today',
      start_at: inMin(30),
      duration_minutes: 120,
      address: '24, Green Park, Baner, Pune',
      ...PUNE,
      ...over,
    });

  it('broadcasts to nearby eligible workers and exactly one concurrent accept wins', async () => {
    const [w1, w2] = await Promise.all([listen(a.sunita), listen(a.rahul)]);
    const got = [once(w1, 'shift:requested'), once(w2, 'shift:requested')];
    const r = await open();
    expect(r.status).toBe(201);
    expect(r.body.data).toMatchObject({ mode: 'OPEN', status: 'OPEN', worker: null, hourly_rate: '220.00' });
    await Promise.all(got);

    const list = await http_(a.sunita).get('/workers/me/shifts?status=incoming');
    expect(list.body.data.map((s: { id: string }) => s.id)).toContain(r.body.data.id);
    expect((await http_(a.sunita).get(`/shifts/${r.body.data.id}`)).body.data.address).toBeNull(); // hidden until accepted

    const id = r.body.data.id;
    const results = await Promise.all([
      http_(a.sunita).post(`/shifts/${id}/accept`),
      http_(a.rahul).post(`/shifts/${id}/accept`),
    ]);
    expect(results.map((x) => x.status).sort()).toEqual([200, 409]);
    const winner = results.find((x) => x.status === 200)!.body.data;
    expect(['Sunita Patil', 'Rahul Shinde']).toContain(winner.worker.name);
    expect(winner.address).toBe('24, Green Park, Baner, Pune');
    expect(await db('shift_events').where({ shift_id: id, to_status: 'ACCEPTED' })).toHaveLength(1);
    w1.close();
    w2.close();
    await http_(a.client).post(`/shifts/${id}/cancel`, { reason: 'cleanup' });
  });

  it('is validated: needs an offered rate and no worker; ineligible workers cannot accept', async () => {
    expect((await open({ hourly_rate: undefined })).status).toBe(400);
    expect((await open({ worker_id: ids.sunita })).status).toBe(400);
    const r = await open({ skill_id: await skillId('Welding') });
    expect((await http_(a.sunita).post(`/shifts/${r.body.data.id}/accept`)).body.error.details.reason).toBe(
      'SKILL_MISMATCH',
    );
    expect((await http_(a.sunita).get(`/shifts/${r.body.data.id}`)).status).toBe(404); // not visible to workers without the skill
    await http_(a.client).post(`/shifts/${r.body.data.id}/cancel`, { reason: 'cleanup' });
  });

  it('unaccepted OPEN shifts expire and can be reopened by the client', async () => {
    const r = await open();
    await db('shifts')
      .where({ id: r.body.data.id })
      .update({ request_expires_at: new Date(Date.now() - 1000) });
    expect(await expireStaleRequests()).toBeGreaterThanOrEqual(1);
    expect((await http_(a.client).get(`/shifts/${r.body.data.id}`)).body.data.status).toBe('EXPIRED');
    const re = await http_(a.client).post(`/shifts/${r.body.data.id}/reassign`, {});
    expect(re.body.data.status).toBe('OPEN');
    await http_(a.client).post(`/shifts/${r.body.data.id}/cancel`, { reason: 'cleanup' });
  });
});

describe('graceful behaviour', () => {
  it('unknown routes and malformed bodies get the standard error envelope', async () => {
    const nf = await request(base).get('/api/v1/nope');
    expect(nf.status).toBe(404);
    expect(nf.body.error.code).toBe('NOT_FOUND');
    const bad = await request(base)
      .post('/api/v1/auth/otp/request')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_JSON');
    void loginPhone;
  });
});
