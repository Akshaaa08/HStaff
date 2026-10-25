import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { SmsService } from '../src/sms/sms.service';
 
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
 
// Unique phones per run so reruns never collide.
const stamp = String(Date.now()).slice(-8);
const PHONES = {
  admin: '70' + stamp,
  user: '71' + stamp,
  worker: '72' + stamp,
  intruder: '73' + stamp,
};
 
describe('H-Staff full lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const tok: Record<string, string> = {};
  const smsMock = { send: jest.fn().mockResolvedValue(undefined) };
  const auth = (k: string) => ({ Authorization: 'Bearer ' + tok[k] });
 
  let workerProfileId: string;
  let requestId: string;
  let offerId: string;
  let assignmentId: string;
  let timesheetId: string;
  let complaintId: string;
  let paymentId: string;
 
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SmsService)
      .useValue(smsMock)
      .compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
 
    // Create the four test accounts and sign tokens for them.
    // (Login OTPs are random and hashed, so the test signs tokens directly.)
    const roles: Record<string, 'ADMIN' | 'USER' | 'WORKER'> = {
      admin: 'ADMIN', user: 'USER', worker: 'WORKER', intruder: 'USER',
    };
    for (const k of Object.keys(PHONES)) {
      const u = await prisma.user.create({
        data: { phone: PHONES[k as keyof typeof PHONES], role: roles[k], phoneVerifiedAt: new Date() },
      });
      tok[k] = jwt.sign({ sub: u.id, role: u.role });
    }
  });
 
    afterAll(async () => {
    // Take this run's test worker out of future searches,
    // so test workers don't pile up and crowd out the top 20.
    if (workerProfileId) {
      await prisma.workerProfile.update({
        where: { id: workerProfileId },
        data: { latitude: null, longitude: null },
      });
    }
    await app.close();
  });
 
  it('rejects a bad phone number (validation)', async () => {
    await request(app.getHttpServer())
      .post('/auth/request-otp').send({ phone: '123' }).expect(400);
  });
 
  it('blocks a worker from admin routes (403)', async () => {
    await request(app.getHttpServer())
      .get('/admin/verifications').set(auth('worker')).expect(403);
  });
 
  it('worker creates a profile and submits it', async () => {
    const put = await request(app.getHttpServer())
      .put('/workers/me').set(auth('worker'))
      .send({ experienceYears: 5, baseHourlyRate: 300, serviceRadiusKm: 10,
              latitude: 18.53, longitude: 73.85, categoryIds: [1] })
      .expect(200);
    workerProfileId = put.body.id;
    const sub = await request(app.getHttpServer())
      .post('/workers/me/submit').set(auth('worker')).expect(201);
    expect(sub.body.verificationStatus).toBe('UNDER_REVIEW');
  });
 
  it('admin verifies the worker', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/workers/${workerProfileId}/verification`).set(auth('admin'))
      .send({ status: 'VERIFIED' }).expect(200);
    expect(res.body.verificationStatus).toBe('VERIFIED');
  });
 
  it('user creates a request and discovers the worker (PostGIS)', async () => {
    const r = await request(app.getHttpServer())
      .post('/service-requests').set(auth('user'))
      .send({ categoryId: 1, bookingMode: 'INSTANT', durationHours: 2,
              latitude: 18.53, longitude: 73.85, address: 'e2e test' })
      .expect(201);
    requestId = r.body.id;
    const list = await request(app.getHttpServer())
      .get(`/service-requests/${requestId}/workers`).set(auth('user')).expect(200);
    expect(list.body.some((w: any) => w.id === workerProfileId)).toBe(true);
  });
 
  it('user sends an offer, worker accepts, double accept is blocked', async () => {
    const o = await request(app.getHttpServer())
      .post('/offers').set(auth('user'))
      .send({ serviceRequestId: requestId, workerId: workerProfileId }).expect(201);
    offerId = o.body.id;
    const acc = await request(app.getHttpServer())
      .post(`/offers/${offerId}/respond`).set(auth('worker'))
      .send({ accept: true }).expect(201);
    assignmentId = acc.body.id;
    expect(acc.body.status).toBe('CONFIRMED');
    await request(app.getHttpServer())
      .post(`/offers/${offerId}/respond`).set(auth('worker'))
      .send({ accept: true }).expect(400);
  });
 
  it('another user cannot read the assignment (403)', async () => {
    await request(app.getHttpServer())
      .get(`/assignments/${assignmentId}`).set(auth('intruder')).expect(403);
  });
 
  it('worker goes en route and arrives', async () => {
    const a = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/en-route`).set(auth('worker')).expect(201);
    expect(a.body.status).toBe('EN_ROUTE');
    const b = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/arrived`).set(auth('worker')).expect(201);
    expect(b.body.status).toBe('ARRIVED');
  });
 
  it('start needs the right OTP and the right place', async () => {
    smsMock.send.mockClear();
    const otp = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/start-otp`).set(auth('user')).expect(201);
    expect(otp.body).not.toHaveProperty('otp');
    const code = smsMock.send.mock.calls[0][1].match(/\b\d{6}\b/)?.[0];
    expect(code).toBeDefined();
    // too far away
    await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/start`).set(auth('worker'))
      .send({ otp: code, latitude: 19.0, longitude: 74.0 }).expect(400);
    // wrong OTP
    await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/start`).set(auth('worker'))
      .send({ otp: code === '000000' ? '111111' : '000000', latitude: 18.5301, longitude: 73.8501 })
      .expect(400);
    // correct
    const ok = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/start`).set(auth('worker'))
      .send({ otp: code, latitude: 18.5301, longitude: 73.8501 }).expect(201);
    expect(ok.body.status).toBe('IN_PROGRESS');
    // the same OTP cannot be used again
    await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/start`).set(auth('worker'))
      .send({ otp: code, latitude: 18.5301, longitude: 73.8501 }).expect(400);
  });
 
  it('end OTP generates the timesheet (300 + 50 = 350)', async () => {
    smsMock.send.mockClear();
    const otp = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/end-otp`).set(auth('user')).expect(201);
    expect(otp.body).not.toHaveProperty('otp');
    const code = smsMock.send.mock.calls[0][1].match(/\b\d{6}\b/)?.[0];
    const ts = await request(app.getHttpServer())
      .post(`/assignments/${assignmentId}/end`).set(auth('worker'))
      .send({ otp: code, latitude: 18.5301, longitude: 73.8501 }).expect(201);
    timesheetId = ts.body.id;
    expect(ts.body.grossWorkerAmount).toBe(300);
    expect(ts.body.platformFee).toBe(50);
    expect(ts.body.customerTotal).toBe(350);
  });
 
  it('payment is refused until the timesheet is approved', async () => {
    await request(app.getHttpServer())
      .post('/payments').set(auth('user')).send({ timesheetId }).expect(400);
  });
 
  it('user approves, a failed payment is retried, then succeeds once', async () => {
    const ap = await request(app.getHttpServer())
      .post(`/timesheets/${timesheetId}/approve`).set(auth('user')).expect(201);
    expect(ap.body.status).toBe('APPROVED');
    const fail = await request(app.getHttpServer())
      .post('/payments').set(auth('user')).send({ timesheetId, simulateFail: true }).expect(201);
    expect(fail.body.status).toBe('FAILED');
    const ok = await request(app.getHttpServer())
      .post('/payments').set(auth('user')).send({ timesheetId }).expect(201);
    expect(ok.body.status).toBe('SUCCEEDED');
    expect(ok.body.amount).toBe(350);
    paymentId = ok.body.id;
    await request(app.getHttpServer())
      .post('/payments').set(auth('user')).send({ timesheetId }).expect(400);
  });
 
  // ---------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------
 
  it('refund needs a reason (400)', async () => {
    await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('admin'))
      .send({ amount: 50 }).expect(400);
  });
 
  it('only an admin can refund (403)', async () => {
    await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('user'))
      .send({ amount: 50, reason: 'e2e test' }).expect(403);
    await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('worker'))
      .send({ amount: 50, reason: 'e2e test' }).expect(403);
  });
 
  it('refund bigger than the payment is refused (400)', async () => {
    await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('admin'))
      .send({ amount: 351, reason: 'e2e test' }).expect(400);
  });
 
  it('admin refunds part of the payment, then the rest', async () => {
    const part = await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('admin'))
      .send({ amount: 50, reason: 'e2e partial refund' });
    expect([200, 201]).toContain(part.status);
 
    const rest = await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('admin'))
      .send({ amount: 300, reason: 'e2e refund the rest' });
    expect([200, 201]).toContain(rest.status);
 
    const pay = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(pay?.status).not.toBe('SUCCEEDED');
  });
 
  it('a fully refunded payment cannot be refunded again (400)', async () => {
    await request(app.getHttpServer())
      .post(`/payments/${paymentId}/refund`).set(auth('admin'))
      .send({ amount: 1, reason: 'e2e double refund' }).expect(400);
  });
 
  it('refunds were written to the audit log', async () => {
    const logs = await request(app.getHttpServer())
      .get('/admin/audit-logs').set(auth('admin')).expect(200);
    const actions = logs.body.map((l: any) => String(l.action));
    expect(actions.some((a: string) => a.includes('REFUND'))).toBe(true);
  });
 
  // ---------------------------------------------------------------
 
  it('two-way ratings, duplicates blocked', async () => {
    await request(app.getHttpServer())
      .post('/ratings').set(auth('user')).send({ assignmentId, rating: 5, tags: ['punctual'] }).expect(201);
    await request(app.getHttpServer())
      .post('/ratings').set(auth('worker')).send({ assignmentId, rating: 4 }).expect(201);
    await request(app.getHttpServer())
      .post('/ratings').set(auth('user')).send({ assignmentId, rating: 3 }).expect(400);
  });
 
  it('complaint is raised and resolved by admin', async () => {
    const c = await request(app.getHttpServer())
      .post('/complaints').set(auth('worker'))
      .send({ assignmentId, category: 'UNPROFESSIONAL', description: 'e2e test' }).expect(201);
    complaintId = c.body.id;
    const r = await request(app.getHttpServer())
      .patch(`/admin/complaints/${complaintId}`).set(auth('admin'))
      .send({ status: 'RESOLVED', resolution: 'Warning issued' }).expect(200);
    expect(r.body.status).toBe('RESOLVED');
  });
 
  it('admin actions were written to the audit log', async () => {
    const logs = await request(app.getHttpServer())
      .get('/admin/audit-logs').set(auth('admin')).expect(200);
    const actions = logs.body.map((l: any) => l.action);
    expect(actions).toContain('WORKER_VERIFIED');
    expect(actions).toContain('COMPLAINT_RESOLVED');
  });
});
 

