import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
const prisma = new PrismaClient();

function signJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

async function api(path, options = {}) {
  const { method = 'GET', body, token, expect = [200, 201] } = options;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  const expectedList = Array.isArray(expect) ? expect : [expect];
  if (!expectedList.includes(res.status)) {
    throw new Error(
      `Route [${method} ${path}] failed with status ${res.status}. Response: ${JSON.stringify(json)}`
    );
  }

  return { status: res.status, data: json };
}

const results = [];
function record(name, route, method, status, details = '') {
  results.push({ name, route, method, status, details });
  console.log(`  ✓ [${status}] ${method} ${route} - ${name}`);
}

async function run() {
  console.log('====================================================');
  console.log('   H-STAFF FULL API ROUTE COMPREHENSIVE TEST SUITE   ');
  console.log('====================================================\n');

  const stamp = String(Date.now()).slice(-7);
  const adminPhone = `900${stamp}`;
  const workerPhone = `911${stamp}`;
  const userPhone = `922${stamp}`;
  const authTestPhone = `933${stamp}`;

  // 1. Create base users via Prisma for reproducible lifecycle testing
  const adminUser = await prisma.user.create({
    data: { phone: adminPhone, name: 'Admin Test', role: 'ADMIN', phoneVerifiedAt: new Date() },
  });
  const workerUser = await prisma.user.create({
    data: { phone: workerPhone, name: 'Worker Test', role: 'WORKER', phoneVerifiedAt: new Date() },
  });
  const customerUser = await prisma.user.create({
    data: { phone: userPhone, name: 'Customer Test', role: 'USER', phoneVerifiedAt: new Date() },
  });

  const adminToken = signJwt({ sub: adminUser.id, role: 'ADMIN' });
  const workerToken = signJwt({ sub: workerUser.id, role: 'WORKER' });
  const customerToken = signJwt({ sub: customerUser.id, role: 'USER' });

  console.log('--- 1. CORE & HEALTH ROUTES ---');
  // 1. GET /health
  const health = await api('/health');
  record('Health Check with PostGIS', '/health', 'GET', health.status);

  // 2. GET /categories
  const categories = await api('/categories');
  record('List Categories & Skills', '/categories', 'GET', categories.status);

  // 3. GET /me (User)
  const me = await api('/me', { token: customerToken });
  record('Current User Info', '/me', 'GET', me.status);

  // 4. GET /admin-only (Admin)
  const adminOnly = await api('/admin-only', { token: adminToken });
  record('Admin-Only Route Guard', '/admin-only', 'GET', adminOnly.status);

  // Negative test: Worker blocked from admin route
  await api('/admin-only', { token: workerToken, expect: [403] });
  record('Admin-Only Route Forbidden for Worker', '/admin-only', 'GET', 403);

  console.log('\n--- 2. AUTHENTICATION ROUTES ---');
  // 5. POST /auth/request-otp
  const reqOtp = await api('/auth/request-otp', {
    method: 'POST',
    body: { phone: authTestPhone },
  });
  record('Request OTP', '/auth/request-otp', 'POST', reqOtp.status);

  // To verify OTP, insert a known hash or read code from db
  const testCode = '654321';
  const bcrypt = await import('bcrypt');
  const codeHash = await bcrypt.hash(testCode, 10);
  await prisma.otpCode.create({
    data: {
      phone: authTestPhone,
      codeHash,
      expiresAt: new Date(Date.now() + 600000),
    },
  });

  // 6. POST /auth/verify-otp
  const verifyOtp = await api('/auth/verify-otp', {
    method: 'POST',
    body: { phone: authTestPhone, code: testCode, role: 'USER' },
  });
  record('Verify OTP & JWT Issuance', '/auth/verify-otp', 'POST', verifyOtp.status);

  console.log('\n--- 3. WORKER ONBOARDING & AVAILABILITY ROUTES ---');
  // 7. PUT /workers/me (Create profile)
  const cleaningCategory = categories.data.find((c) => c.name === 'Cleaning') || categories.data[0];
  const catId = cleaningCategory.id;
  const sampleSkillIds = cleaningCategory.skills.slice(0, 2).map((s) => s.id);

  const workerProfile = await api('/workers/me', {
    method: 'PUT',
    token: workerToken,
    body: {
      experienceYears: 4,
      baseHourlyRate: 250,
      serviceRadiusKm: 15,
      latitude: 18.5204,
      longitude: 73.8567,
      categoryIds: [catId],
      skillIds: sampleSkillIds,
    },
  });
  record('Upsert Worker Profile', '/workers/me', 'PUT', workerProfile.status);
  const workerProfileId = workerProfile.data.id;

  // 8. GET /workers/me
  const getWorker = await api('/workers/me', { token: workerToken });
  record('Get Own Worker Profile', '/workers/me', 'GET', getWorker.status);

  // 9. PUT /workers/availability
  const setAvail = await api('/workers/availability', {
    method: 'PUT',
    token: workerToken,
    body: {
      slots: [
        { dayOfWeek: new Date().getDay(), startTime: '06:00', endTime: '22:00' },
      ],
    },
  });
  record('Set Worker Availability Slots', '/workers/availability', 'PUT', setAvail.status);

  // 10. GET /workers/availability
  const getAvail = await api('/workers/availability', { token: workerToken });
  record('Get Worker Availability Slots', '/workers/availability', 'GET', getAvail.status);

  // 11. POST /workers/me/submit
  const submitWorker = await api('/workers/me/submit', {
    method: 'POST',
    token: workerToken,
  });
  record('Submit Worker Profile for Review', '/workers/me/submit', 'POST', submitWorker.status);

  console.log('\n--- 4. ADMIN VERIFICATION ROUTES ---');
  // 12. GET /admin/verifications
  const pendingWorkers = await api('/admin/verifications', { token: adminToken });
  record('Admin List Pending Verifications', '/admin/verifications', 'GET', pendingWorkers.status);

  // 13. PATCH /admin/workers/:id/verification
  const verifyWorker = await api(`/admin/workers/${workerProfileId}/verification`, {
    method: 'PATCH',
    token: adminToken,
    body: { status: 'VERIFIED' },
  });
  record('Admin Verify Worker', `/admin/workers/:id/verification`, 'PATCH', verifyWorker.status);

  console.log('\n--- 5. SERVICE REQUESTS (CUSTOMER BOOKING) ROUTES ---');
  // 14. POST /service-requests
  const startAt = new Date(Date.now() + 3600000).toISOString();
  const createSr = await api('/service-requests', {
    method: 'POST',
    token: customerToken,
    body: {
      categoryId: catId,
      bookingMode: 'INSTANT',
      startAt,
      durationHours: 2,
      latitude: 18.5204,
      longitude: 73.8567,
      address: '24, Baner Road, Pune',
      notes: 'Deep clean living room',
      skillIds: sampleSkillIds.slice(0, 1),
    },
  });
  record('Create Service Request Booking', '/service-requests', 'POST', createSr.status);
  const serviceRequestId = createSr.data.id;

  // 15. GET /service-requests
  const listSr = await api('/service-requests', { token: customerToken });
  record('Customer List Service Requests', '/service-requests', 'GET', listSr.status);

  // 16. GET /service-requests/:id
  const getSr = await api(`/service-requests/${serviceRequestId}`, { token: customerToken });
  record('Get Service Request Details', `/service-requests/:id`, 'GET', getSr.status);

  // 17. GET /service-requests/:id/workers (Matching nearby workers)
  const nearbyWorkers = await api(`/service-requests/${serviceRequestId}/workers`, { token: customerToken });
  record('Discover Matching Nearby Workers', `/service-requests/:id/workers`, 'GET', nearbyWorkers.status);

  console.log('\n--- 6. OFFERS & DISPATCH ROUTES ---');
  // 18. POST /offers
  const offer = await api('/offers', {
    method: 'POST',
    token: customerToken,
    body: {
      serviceRequestId,
      workerId: workerProfileId,
    },
  });
  record('Dispatch Job Offer to Worker', '/offers', 'POST', offer.status);
  const offerId = offer.data.id;

  // 19. GET /offers/mine
  const workerOffers = await api('/offers/mine', { token: workerToken });
  record('Worker List Incoming Offers', '/offers/mine', 'GET', workerOffers.status);

  // 20. POST /offers/:id/respond (Accept)
  const acceptOffer = await api(`/offers/${offerId}/respond`, {
    method: 'POST',
    token: workerToken,
    body: { accept: true },
  });
  record('Worker Respond (Accept) Offer', `/offers/:id/respond`, 'POST', acceptOffer.status);

  console.log('\n--- 7. ASSIGNMENT & ATTENDANCE LIFECYCLE ROUTES ---');
  // 21. GET /assignments/mine
  const myAssignments = await api('/assignments/mine', { token: customerToken });
  record('List Current User Assignments', '/assignments/mine', 'GET', myAssignments.status);
  const assignmentId = myAssignments.data[0].id;

  // 22. GET /assignments/:id
  const getAssignment = await api(`/assignments/${assignmentId}`, { token: customerToken });
  record('Get Assignment Details', `/assignments/:id`, 'GET', getAssignment.status);

  // 23. POST /assignments/:id/en-route
  const enRoute = await api(`/assignments/${assignmentId}/en-route`, {
    method: 'POST',
    token: workerToken,
  });
  record('Worker Status: En Route', `/assignments/:id/en-route`, 'POST', enRoute.status);

  // 24. POST /assignments/:id/arrived
  const arrived = await api(`/assignments/${assignmentId}/arrived`, {
    method: 'POST',
    token: workerToken,
  });
  record('Worker Status: Arrived', `/assignments/:id/arrived`, 'POST', arrived.status);

  // 25. POST /assignments/:id/start-otp (Customer issues start code)
  const startOtpRes = await api(`/assignments/${assignmentId}/start-otp`, {
    method: 'POST',
    token: customerToken,
  });
  record('Customer Issue Start OTP', `/assignments/:id/start-otp`, 'POST', startOtpRes.status);
  const startOtp = startOtpRes.data.otp;

  // 26. POST /assignments/:id/start (Worker verifies start code with GPS)
  const startService = await api(`/assignments/${assignmentId}/start`, {
    method: 'POST',
    token: workerToken,
    body: {
      otp: startOtp,
      latitude: 18.5204,
      longitude: 73.8567,
    },
  });
  record('Worker Verify Start OTP with GPS', `/assignments/:id/start`, 'POST', startService.status);

  // 27. POST /assignments/:id/end-otp (Customer issues completion code)
  const endOtpRes = await api(`/assignments/${assignmentId}/end-otp`, {
    method: 'POST',
    token: customerToken,
  });
  record('Customer Issue End OTP', `/assignments/:id/end-otp`, 'POST', endOtpRes.status);
  const endOtp = endOtpRes.data.otp;

  // 28. POST /assignments/:id/end (Worker verifies completion code -> generates timesheet)
  const endService = await api(`/assignments/${assignmentId}/end`, {
    method: 'POST',
    token: workerToken,
    body: {
      otp: endOtp,
      latitude: 18.5204,
      longitude: 73.8567,
    },
  });
  record('Worker Verify End OTP & Generate Timesheet', `/assignments/:id/end`, 'POST', endService.status);

  // 29. GET /assignments/:id/timesheet
  const timesheet = await api(`/assignments/${assignmentId}/timesheet`, { token: customerToken });
  record('Get Timesheet for Assignment', `/assignments/:id/timesheet`, 'GET', timesheet.status);
  const timesheetId = timesheet.data.id;

  // 30. POST /timesheets/:id/approve
  const approveTimesheet = await api(`/timesheets/${timesheetId}/approve`, {
    method: 'POST',
    token: customerToken,
  });
  record('Customer Approve Timesheet', `/timesheets/:id/approve`, 'POST', approveTimesheet.status);

  console.log('\n--- 8. PAYMENTS, PAYOUTS & REFUNDS ROUTES ---');
  // 31. POST /payments (Customer settles payment)
  const pay = await api('/payments', {
    method: 'POST',
    token: customerToken,
    body: { timesheetId },
  });
  record('Customer Pay Timesheet via Gateway', '/payments', 'POST', pay.status);
  const paymentId = pay.data.id;

  // 32. GET /payments/:timesheetId
  const getPayment = await api(`/payments/${timesheetId}`, { token: customerToken });
  record('Get Payment Status & Breakdown', `/payments/:timesheetId`, 'GET', getPayment.status);

  // 33. POST /payments/:id/refund (Admin issues partial refund)
  const refund = await api(`/payments/${paymentId}/refund`, {
    method: 'POST',
    token: adminToken,
    body: {
      amount: 50,
      reason: 'Quality discount courtesy of support',
    },
  });
  record('Admin Refund Payment', `/payments/:id/refund`, 'POST', refund.status);

  console.log('\n--- 9. RATINGS & DISPUTE COMPLAINTS ROUTES ---');
  // 34. POST /ratings (Customer rates worker)
  const rate = await api('/ratings', {
    method: 'POST',
    token: customerToken,
    body: {
      assignmentId,
      score: 5,
      tags: ['Punctual', 'Polite', 'Thorough cleaning'],
      comment: 'Excellent service!',
    },
  });
  record('Submit Customer Rating & Tags', '/ratings', 'POST', rate.status);

  // 35. POST /complaints (Customer files dispute)
  const complaint = await api('/complaints', {
    method: 'POST',
    token: customerToken,
    body: {
      assignmentId,
      category: 'UNPROFESSIONAL',
      description: 'Test dispute investigation request',
    },
  });
  record('File Complaint Dispute', '/complaints', 'POST', complaint.status);
  const complaintId = complaint.data.id;

  // 36. GET /admin/complaints
  const listComplaints = await api('/admin/complaints', { token: adminToken });
  record('Admin List Complaints', '/admin/complaints', 'GET', listComplaints.status);

  // 37. PATCH /admin/complaints/:id
  const resolveComplaint = await api(`/admin/complaints/${complaintId}`, {
    method: 'PATCH',
    token: adminToken,
    body: {
      status: 'RESOLVED',
      resolution: 'Resolved with customer agreement and coupon compensation.',
    },
  });
  record('Admin Resolve Complaint', `/admin/complaints/:id`, 'PATCH', resolveComplaint.status);

  console.log('\n--- 10. NOTIFICATIONS & AUDIT LOGS ROUTES ---');
  // 38. GET /notifications
  const notifs = await api('/notifications', { token: customerToken });
  record('Get In-App Notifications', '/notifications', 'GET', notifs.status);
  const notificationId = notifs.data[0]?.id;

  // 39. POST /notifications/:id/read
  if (notificationId) {
    const markRead = await api(`/notifications/${notificationId}/read`, {
      method: 'POST',
      token: customerToken,
    });
    record('Mark Notification Read', `/notifications/:id/read`, 'POST', markRead.status);
  }

  // 40. GET /admin/audit-logs
  const auditLogs = await api('/admin/audit-logs', { token: adminToken });
  record('Admin Audit Logs Stream', '/admin/audit-logs', 'GET', auditLogs.status);

  console.log('\n====================================================');
  console.log(` ALL ${results.length} ROUTES TESTED SUCCESSFULLY WITH 0 FAILURES! `);
  console.log('====================================================');
}

run()
  .catch((err) => {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
