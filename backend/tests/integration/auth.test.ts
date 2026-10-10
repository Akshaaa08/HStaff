import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/config/db';
import { redis } from '../../src/config/redis';
import { api, auth, closeAll, get, loginAdmin, loginPhone, PHONES, post, resetAll } from '../helpers';

beforeAll(resetAll);
afterAll(closeAll);

describe('M1 auth', () => {
  it('health is up and reports dependencies', async () => {
    const r = await api().get('/health');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ status: 'ok', db: true, redis: true });
  });

  it('all three roles can log in', async () => {
    const client = await loginPhone(PHONES.client, 'client');
    const worker = await loginPhone(PHONES.sunita, 'worker');
    const admin = await loginAdmin('super@hstaff.dev');
    expect((await get(client, '/users/me')).body.data.role).toBe('client');
    expect((await get(worker, '/workers/me')).body.data.name).toBe('Sunita Patil');
    expect((await get(admin, '/admin/dashboard')).status).toBe(200);
  });

  it('creates a new account on first verify, with a worker profile for workers', async () => {
    await api().post('/api/v1/auth/otp/request').send({ phone: '9811111111', role: 'professional' }); // prototype wording + 10-digit
    const otp = (await redis.get('otp:login:+919811111111'))!;
    const r = await api()
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '9811111111', otp, role: 'professional', name: 'New Helper' });
    expect(r.status).toBe(201);
    expect(r.body.data.is_new_user).toBe(true);
    expect(r.body.data.user).toMatchObject({ role: 'worker', name: 'New Helper', phone: '+919811111111' });
    const profile = await db('worker_profiles').where({ user_id: r.body.data.user.id }).first();
    expect(profile.verification).toBe('PENDING');
  });

  it('five wrong OTPs lock the number out, even for the right code', async () => {
    const phone = '+919822222222';
    await api().post('/api/v1/auth/otp/request').send({ phone, role: 'client' });
    const real = (await redis.get(`otp:login:${phone}`))!;
    const wrong = real === '000000' ? '111111' : '000000';
    for (let i = 1; i <= 4; i++) {
      const r = await api().post('/api/v1/auth/otp/verify').send({ phone, otp: wrong, role: 'client' });
      expect(r.status).toBe(400);
      expect(r.body.error.code).toBe('INVALID_OTP');
      expect(r.body.error.details.attempts_remaining).toBe(5 - i);
    }
    const fifth = await api().post('/api/v1/auth/otp/verify').send({ phone, otp: wrong, role: 'client' });
    expect(fifth.status).toBe(429);
    const correct = await api().post('/api/v1/auth/otp/verify').send({ phone, otp: real, role: 'client' });
    expect(correct.status).toBe(429);
    expect(correct.body.error.code).toBe('OTP_LOCKED');
    const again = await api().post('/api/v1/auth/otp/request').send({ phone, role: 'client' });
    expect(again.status).toBe(429); // cannot bypass the lock by requesting a new code
  });

  it('limits OTP requests to 3 per 10 minutes', async () => {
    const phone = '+919833333333';
    for (let i = 0; i < 3; i++)
      expect((await api().post('/api/v1/auth/otp/request').send({ phone, role: 'client' })).status).toBe(200);
    const r = await api().post('/api/v1/auth/otp/request').send({ phone, role: 'client' });
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe('OTP_RATE_LIMITED');
  });

  it('OTP is single use and expires', async () => {
    const phone = '+919844444444';
    await api().post('/api/v1/auth/otp/request').send({ phone, role: 'client' });
    const otp = (await redis.get(`otp:login:${phone}`))!;
    expect((await api().post('/api/v1/auth/otp/verify').send({ phone, otp, role: 'client' })).status).toBe(
      201,
    );
    const replay = await api().post('/api/v1/auth/otp/verify').send({ phone, otp, role: 'client' });
    expect(replay.status).toBe(400);
    expect(replay.body.error.code).toBe('OTP_EXPIRED');
  });

  it('a number registered as a worker cannot log in as a client', async () => {
    const r = await api().post('/api/v1/auth/otp/request').send({ phone: PHONES.sunita, role: 'client' });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('ROLE_CONFLICT');
  });

  it('rejects malformed input with 400 VALIDATION_ERROR', async () => {
    const r = await api().post('/api/v1/auth/otp/request').send({ phone: '123', role: 'client' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('admin login: wrong password and unknown email look the same', async () => {
    const a = await api()
      .post('/api/v1/auth/admin/login')
      .send({ email: 'super@hstaff.dev', password: 'nope-nope' });
    const b = await api()
      .post('/api/v1/auth/admin/login')
      .send({ email: 'ghost@hstaff.dev', password: 'nope-nope' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error.code).toBe(b.body.error.code);
  });

  it('requires a valid bearer token', async () => {
    expect((await api().get('/api/v1/users/me')).status).toBe(401);
    expect((await api().get('/api/v1/users/me').set('Authorization', 'Bearer garbage')).status).toBe(401);
  });

  it('rotates refresh tokens and treats reuse as theft', async () => {
    const s = await loginPhone(PHONES.client, 'client');
    const r1 = await api().post('/api/v1/auth/refresh').send({ refresh_token: s.refresh });
    expect(r1.status).toBe(200);
    const newRefresh = r1.body.data.refresh_token;
    expect(newRefresh).not.toBe(s.refresh);
    const reuse = await api().post('/api/v1/auth/refresh').send({ refresh_token: s.refresh });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('REFRESH_REUSED');
    const family = await api().post('/api/v1/auth/refresh').send({ refresh_token: newRefresh });
    expect(family.status).toBe(401); // whole family revoked
  });

  it('refresh tokens are stored hashed, never raw', async () => {
    const s = await loginPhone(PHONES.client, 'client');
    const keys = await redis.keys(`rt:${s.id}:*`);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) expect(await redis.get(k)).not.toBe(s.refresh);
  });

  it('logout revokes the refresh token and removes the push token', async () => {
    const s = await loginPhone(PHONES.client, 'client');
    const token = 'ExponentPushToken[abc123]';
    expect((await post(s, '/devices/push-token', { token })).status).toBe(201);
    expect((await post(s, '/devices/push-token', { token })).status).toBe(201); // idempotent
    expect(await db('push_tokens').where({ user_id: s.id, token }).first()).toBeTruthy();
    expect((await post(s, '/auth/logout', { refresh_token: s.refresh, push_token: token })).status).toBe(200);
    expect(await db('push_tokens').where({ user_id: s.id, token }).first()).toBeUndefined();
    expect((await api().post('/api/v1/auth/refresh').send({ refresh_token: s.refresh })).status).toBe(401);
  });

  it('rejects non-Expo push tokens', async () => {
    const s = await loginPhone(PHONES.client, 'client');
    expect((await post(s, '/devices/push-token', { token: 'not-a-token' })).status).toBe(400);
  });

  it('suspended users are rejected at the auth middleware immediately', async () => {
    const s = await loginPhone('+919855555555', 'client');
    expect((await get(s, '/users/me')).status).toBe(200);
    await db('users').where({ id: s.id }).update({ status: 'SUSPENDED' });
    const r = await api().get('/api/v1/users/me').set(auth(s));
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('ACCOUNT_SUSPENDED');
    await api().post('/api/v1/auth/otp/request').send({ phone: '+919855555555', role: 'client' }).expect(403);
  });
});
