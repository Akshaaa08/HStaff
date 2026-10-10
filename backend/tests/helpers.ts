import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/config/db';
import { redis } from '../src/config/redis';
import { sentPushes } from '../src/modules/notifications/push';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const seedCore = require('../seeds/01_core.js') as {
  seed: (k: typeof db) => Promise<void>;
  ids: Record<string, string>;
};

export const app = createApp();
export const api = () => request(app);
export const ids = seedCore.ids;

export const PUNE = { lat: 18.559, lng: 73.7868 }; // Baner: Sunita's seeded position
export const PHONES = {
  client: '+919000000001',
  sunita: '+919000000002',
  rahul: '+919000000003',
  pending: '+919000000004',
};

const TABLES = [
  'admin_audit_log',
  'app_config',
  'push_tokens',
  'notifications',
  'disputes',
  'reviews',
  'payments',
  'timesheets',
  'shift_events',
  'shifts',
  'kyc_documents',
  'worker_skills',
  'worker_profiles',
  'skills',
  'users',
];

export async function resetAll() {
  await db.raw('ALTER TABLE shift_events DISABLE TRIGGER shift_events_no_update');
  await db.raw(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  await db.raw('ALTER TABLE shift_events ENABLE TRIGGER shift_events_no_update');
  await redis.flushdb();
  sentPushes.length = 0;
  await seedCore.seed(db);
}

export interface Session {
  token: string;
  refresh: string;
  id: string;
}

/** Full phone-OTP login. The OTP is read straight from Redis (the console provider only logs it). */
export async function loginPhone(phone: string, role: 'client' | 'worker', name?: string): Promise<Session> {
  await redis.del(`otp:login:req:${phone}`, `otp:login:${phone}:lock`); // tests log in often; the real limit has its own test
  const r1 = await api().post('/api/v1/auth/otp/request').send({ phone, role });
  if (r1.status !== 200) throw new Error(`otp request failed: ${r1.status} ${JSON.stringify(r1.body)}`);
  const otp = (await redis.get(`otp:login:${phone}`))!;
  const r2 = await api().post('/api/v1/auth/otp/verify').send({ phone, otp, role, name });
  if (r2.status > 201) throw new Error(`otp verify failed: ${r2.status} ${JSON.stringify(r2.body)}`);
  return { token: r2.body.data.access_token, refresh: r2.body.data.refresh_token, id: r2.body.data.user.id };
}

export async function loginAdmin(email: string, password = 'Admin@12345'): Promise<Session> {
  const r = await api().post('/api/v1/auth/admin/login').send({ email, password });
  if (r.status !== 200) throw new Error(`admin login failed: ${r.status} ${JSON.stringify(r.body)}`);
  return { token: r.body.data.access_token, refresh: r.body.data.refresh_token, id: r.body.data.user.id };
}

export const auth = (s: Session) => ({ Authorization: `Bearer ${s.token}` });
export const get = (s: Session, url: string) => api().get(`/api/v1${url}`).set(auth(s));
export const post = (s: Session, url: string, body: object = {}) =>
  api().post(`/api/v1${url}`).set(auth(s)).send(body);
export const put = (s: Session, url: string, body: object = {}) =>
  api().put(`/api/v1${url}`).set(auth(s)).send(body);
export const patch = (s: Session, url: string, body: object = {}) =>
  api().patch(`/api/v1${url}`).set(auth(s)).send(body);

export async function skillId(name: string): Promise<number> {
  return (await db('skills').where({ name }).first('id')).id;
}

export interface Actors {
  client: Session;
  sunita: Session;
  rahul: Session;
  super: Session;
  verifier: Session;
  finance: Session;
  support: Session;
}

export async function loginAll(): Promise<Actors> {
  const [client, sunita, rahul, sup, verifier, finance, support] = await Promise.all([
    loginPhone(PHONES.client, 'client'),
    loginPhone(PHONES.sunita, 'worker'),
    loginPhone(PHONES.rahul, 'worker'),
    loginAdmin('super@hstaff.dev'),
    loginAdmin('verifier@hstaff.dev'),
    loginAdmin('finance@hstaff.dev'),
    loginAdmin('support@hstaff.dev'),
  ]);
  return { client, sunita, rahul, super: sup, verifier, finance, support };
}

/** Scheduled DIRECT booking starting in 2 minutes (inside the 60-minute early check-in window). */
export function bookingBody(workerId: string, skill: number, over: Record<string, unknown> = {}) {
  const start = new Date(Date.now() + 2 * 60_000);
  return {
    mode: 'DIRECT',
    worker_id: workerId,
    skill_id: skill,
    title: 'Regular cleaning',
    start_at: start.toISOString(),
    duration_minutes: 60,
    address: '24, Green Park, Baner, Pune',
    lat: PUNE.lat,
    lng: PUNE.lng,
    ...over,
  };
}

export const tinyPng = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000001e221bc330000000049454e44ae426082',
  'hex',
);

/** Drives a shift to AWAITING_APPROVAL with a realistic 62 minute clock (clock-in is back-dated in the DB). */
export async function runToAwaitingApproval(
  client: Session,
  worker: Session,
  shiftId: string,
  minutesWorked = 62,
) {
  const near = { lat: PUNE.lat + 0.0004, lng: PUNE.lng }; // ~45 m from the job site
  let r = await post(worker, `/shifts/${shiftId}/accept`);
  if (r.status !== 200) throw new Error(`accept: ${JSON.stringify(r.body)}`);
  r = await post(worker, `/shifts/${shiftId}/arrive`, near);
  if (r.status !== 200) throw new Error(`arrive: ${JSON.stringify(r.body)}`);
  const start = await get(client, `/shifts/${shiftId}/otp`);
  r = await post(worker, `/shifts/${shiftId}/start`, { otp: start.body.data.otp, ...near });
  if (r.status !== 200) throw new Error(`start: ${JSON.stringify(r.body)}`);
  await db.raw(`UPDATE timesheets SET clock_in_at = now() - (? || ' minutes')::interval WHERE shift_id = ?`, [
    String(minutesWorked),
    shiftId,
  ]);
  r = await post(worker, `/shifts/${shiftId}/end-otp`);
  if (r.status !== 200) throw new Error(`end-otp: ${JSON.stringify(r.body)}`);
  const end = await get(client, `/shifts/${shiftId}/otp`);
  r = await post(worker, `/shifts/${shiftId}/end`, { otp: end.body.data.otp, ...near });
  if (r.status !== 200) throw new Error(`end: ${JSON.stringify(r.body)}`);
  return r.body.data;
}

export async function closeAll() {
  await db.destroy();
  await redis.quit();
}
