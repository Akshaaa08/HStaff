// Generates docs/openapi.yaml. A test (tests/integration/openapi.test.ts) fails if any Express route is missing from it.
// Run: node scripts/gen-openapi.mjs
import { writeFileSync } from 'node:fs';
import YAML from 'yaml';

const S = (o) => o;
const str = { type: 'string' };
const uuid = { type: 'string', format: 'uuid' };
const num = { type: 'number' };
const int = { type: 'integer' };
const bool = { type: 'boolean' };
const dt = { type: 'string', format: 'date-time' };
const money = { type: 'string', example: '312.50', description: 'numeric(10,2) as a string, never a float' };
const obj = (properties, required = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
});
const arr = (items) => ({ type: 'array', items });
const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const fix = {
  lat: num,
  lng: num,
  mocked: { ...bool, description: 'Android mock-location flag; true is rejected' },
  accuracy_m: { ...num, description: 'Above 200 m is rejected' },
};

const schemas = {
  Error: obj({ error: obj({ code: str, message: str, details: { type: 'object' } }) }),
  Session: obj({
    access_token: str,
    refresh_token: str,
    token_type: str,
    expires_in: int,
    user: ref('User'),
    is_new_user: bool,
  }),
  User: obj({
    id: uuid,
    role: { enum: ['client', 'worker', 'admin'] },
    admin_role: { enum: ['super_admin', 'verifier', 'finance', 'support', null], nullable: true },
    name: str,
    phone: str,
    email: str,
    photo_url: str,
    status: { enum: ['ACTIVE', 'SUSPENDED'] },
  }),
  OtpRequest: obj(
    {
      phone: { ...str, example: '+919876543210', description: 'E.164, or a 10-digit Indian mobile' },
      role: {
        enum: ['client', 'worker'],
        description: '"customer" and "professional" are accepted as aliases',
      },
    },
    ['phone', 'role'],
  ),
  OtpVerify: obj(
    {
      phone: str,
      otp: { ...str, example: '123456' },
      role: { enum: ['client', 'worker'] },
      name: { ...str, description: 'Used only when this call creates the account' },
    },
    ['phone', 'otp', 'role'],
  ),
  AdminLogin: obj({ email: str, password: str }, ['email', 'password']),
  Refresh: obj({ refresh_token: str }, ['refresh_token']),
  Logout: obj({ refresh_token: str, push_token: str }),
  PushToken: obj({ token: { ...str, example: 'ExponentPushToken[xxxx]' } }, ['token']),
  UpdateMe: obj({ name: str, email: str }),
  WorkerProfileUpdate: obj({
    name: str,
    email: str,
    bio: str,
    experience_years: int,
    hourly_rate: num,
    equipment: str,
    skill_ids: arr(int),
    upi_id: str,
    age: int,
  }),
  Online: obj({ online: bool, ...fix }, ['online']),
  Location: obj(fix, ['lat', 'lng']),
  KycUpload: obj(
    {
      doc_type: { enum: ['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENCE', 'PASSPORT', 'SELFIE', 'OTHER'] },
      file: { type: 'string', format: 'binary', description: 'JPG, PNG, WebP or PDF, max 5 MB' },
    },
    ['doc_type', 'file'],
  ),
  PhotoUpload: obj({ photo: { type: 'string', format: 'binary' } }, ['photo']),
  CreateShift: obj(
    {
      mode: { enum: ['DIRECT', 'OPEN'], default: 'DIRECT' },
      worker_id: { ...uuid, description: 'Required for DIRECT, forbidden for OPEN' },
      skill_id: int,
      title: str,
      description: str,
      materials: str,
      is_instant: bool,
      start_at: { ...dt, description: 'Scheduled shifts only; must be in the future' },
      end_at: dt,
      duration_minutes: {
        ...int,
        description: '30 to 720. Required when is_instant, otherwise an alternative to end_at',
      },
      address: str,
      lat: num,
      lng: num,
      hourly_rate: {
        ...num,
        description:
          "OPEN only: the client's offer. For DIRECT the rate always comes from the worker profile and this field is ignored.",
      },
    },
    ['skill_id', 'address', 'lat', 'lng'],
  ),
  Reason: obj({ reason: str }, ['reason']),
  Reassign: obj({ worker_id: { ...uuid, description: 'Omit to reopen an OPEN shift' } }),
  EnRoute: obj({ lat: num, lng: num }),
  Arrive: obj(fix, ['lat', 'lng']),
  OtpCheckin: obj({ otp: { ...str, example: '123456' }, ...fix }, ['otp', 'lat', 'lng']),
  Dispute: obj(
    {
      reason: str,
      evidence: {
        type: 'array',
        items: { type: 'string', format: 'binary' },
        description: 'Up to 3 files (multipart only)',
      },
    },
    ['reason'],
  ),
  VerifyPayment: obj(
    {
      provider_order_id: str,
      provider_payment_id: str,
      signature: str,
      result: { enum: ['success', 'failure'], description: 'Simulated gateway only' },
    },
    ['provider_order_id'],
  ),
  Review: obj(
    { shiftId: uuid, stars: { type: 'integer', minimum: 1, maximum: 5 }, tags: arr(str), comment: str },
    ['shiftId', 'stars'],
  ),
  Shift: obj({
    id: uuid,
    mode: str,
    status: {
      enum: [
        'OPEN',
        'REQUESTED',
        'ACCEPTED',
        'EN_ROUTE',
        'ARRIVED',
        'IN_PROGRESS',
        'AWAITING_APPROVAL',
        'APPROVED',
        'PAID',
        'DECLINED',
        'EXPIRED',
        'CANCELLED',
        'DISPUTED',
      ],
    },
    title: str,
    skill: obj({ id: int, name: str }),
    start_at: dt,
    end_at: dt,
    is_instant: bool,
    scheduled_minutes: int,
    address: { ...str, nullable: true, description: 'Hidden from a worker until they accept' },
    location: obj({ lat: num, lng: num }),
    distance_m: int,
    hourly_rate: money,
    request_expires_at: dt,
    client: obj({ id: uuid, name: str, photo_url: str }),
    worker: obj({ id: uuid, name: str, rating_avg: str }),
    pricing: obj({
      estimate: bool,
      billable_minutes: int,
      gross: money,
      commission_pct: num,
      commission: { ...money, description: 'Workers only' },
      worker_payout: { ...money, description: 'Workers only' },
    }),
    timesheet: obj({
      clock_in_at: dt,
      clock_out_at: dt,
      verified_minutes: int,
      billable_minutes: int,
      approval_deadline: dt,
      status: str,
    }),
    pending_otp: { enum: ['start', 'end', null], nullable: true },
  }),
  VerifyWorker: obj(
    {
      decision: { enum: ['APPROVED', 'REJECTED', 'NEEDS_INFO'] },
      note: { ...str, description: 'Required for REJECTED / NEEDS_INFO' },
    },
    ['decision'],
  ),
  UserStatus: obj({ status: { enum: ['ACTIVE', 'SUSPENDED'] }, reason: str }, ['status']),
  DisputePatch: obj(
    {
      status: { enum: ['IN_REVIEW', 'RESOLVED', 'ESCALATED'] },
      resolution: str,
      shift_outcome: { enum: ['APPROVE', 'CANCEL'], description: 'Required when resolving a DISPUTED shift' },
    },
    ['status'],
  ),
  ReviewPatch: obj({ hidden: bool }, ['hidden']),
  SkillBody: obj({ name: str, active: bool }),
  Config: obj({ commission_pct: num, geofence_m: num, request_ttl_min: num, approval_sla_hours: num }),
  Announcement: obj({ title: str, body: str, audience: { enum: ['all', 'clients', 'workers'] } }, [
    'title',
    'body',
  ]),
  AdminCreate: obj(
    {
      email: str,
      password: { ...str, minLength: 10 },
      name: str,
      admin_role: { enum: ['super_admin', 'verifier', 'finance', 'support'] },
    },
    ['email', 'password', 'name', 'admin_role'],
  ),
  AdminPatch: obj({ admin_role: str, status: str, password: str, name: str }),
};

const page = [
  { name: 'page', in: 'query', schema: int },
  { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100 } },
];
const q = (name, schema = str, required = false) => ({ name, in: 'query', required, schema });
const idp = (name = 'id', schema = uuid) => ({ name, in: 'path', required: true, schema });

// [method, path, tag, summary, opts]  opts: auth ('public' | role text), body, multipart, query[], res, status
const ops = [
  ['GET', '/health', 'System', 'Liveness and dependency check (db, redis)', { auth: 'public' }],
  [
    'POST',
    '/auth/otp/request',
    'Auth',
    'Send a login OTP (max 3 per 10 min per phone)',
    { auth: 'public', body: 'OtpRequest' },
  ],
  [
    'POST',
    '/auth/otp/verify',
    'Auth',
    'Verify OTP; creates the account on first use (201). 5 wrong tries lock the number for 15 min',
    { auth: 'public', body: 'OtpVerify', res: 'Session' },
  ],
  [
    'POST',
    '/auth/admin/login',
    'Auth',
    'Admin email + password login',
    { auth: 'public', body: 'AdminLogin', res: 'Session' },
  ],
  [
    'POST',
    '/auth/refresh',
    'Auth',
    'Rotate the refresh token. Reusing an old one revokes the whole family',
    { auth: 'public', body: 'Refresh', res: 'Session' },
  ],
  [
    'POST',
    '/auth/logout',
    'Auth',
    'Revoke the refresh token and optionally remove a push token',
    { auth: 'any', body: 'Logout' },
  ],
  [
    'POST',
    '/devices/push-token',
    'Auth',
    'Register an Expo push token (idempotent)',
    { auth: 'any', body: 'PushToken', status: 201 },
  ],
  ['GET', '/users/me', 'Users', 'Current user', { auth: 'any', res: 'User' }],
  ['PUT', '/users/me', 'Users', 'Update name / email', { auth: 'any', body: 'UpdateMe', res: 'User' }],
  [
    'POST',
    '/users/me/photo',
    'Users',
    'Upload a profile photo (public bucket)',
    { auth: 'any', body: 'PhotoUpload', multipart: true },
  ],
  ['GET', '/skills', 'Skills', 'Active skill categories', { auth: 'public' }],
  ['GET', '/workers/me', 'Workers', 'Own profile, skills, verification status', { auth: 'worker' }],
  [
    'PUT',
    '/workers/me',
    'Workers',
    'Update profile, rate, equipment, skills, UPI ID',
    { auth: 'worker', body: 'WorkerProfileUpdate' },
  ],
  [
    'POST',
    '/workers/me/photo',
    'Workers',
    'Upload a profile photo',
    { auth: 'worker', body: 'PhotoUpload', multipart: true },
  ],
  [
    'GET',
    '/workers/me/kyc',
    'Workers',
    'List uploaded KYC documents (never returns URLs)',
    { auth: 'worker' },
  ],
  [
    'POST',
    '/workers/me/kyc',
    'Workers',
    'Upload a KYC document to the private bucket',
    { auth: 'worker', body: 'KycUpload', multipart: true, status: 201 },
  ],
  [
    'POST',
    '/workers/me/online',
    'Workers',
    'Go online/offline. 403 NOT_VERIFIED unless the profile is APPROVED',
    { auth: 'worker', body: 'Online' },
  ],
  [
    'POST',
    '/workers/me/location',
    'Workers',
    'Foreground location ping (written at most every 5 s; others return throttled:true)',
    { auth: 'worker', body: 'Location' },
  ],
  [
    'GET',
    '/workers/me/earnings',
    'Workers',
    'Totals (today/week/month, pending, settled) and per-shift breakdown',
    { auth: 'worker', query: page },
  ],
  [
    'GET',
    '/workers/me/shifts',
    'Workers',
    'Own shifts. status = a shift status, a comma list, or a group: incoming, upcoming, active, completed, cancelled, history',
    { auth: 'worker', query: [q('status'), ...page], res: 'Shift[]' },
  ],
  [
    'GET',
    '/workers/nearby',
    'Workers',
    'Search verified workers with ST_DWithin, nearest first',
    {
      auth: 'client',
      query: [
        q('lat', num, true),
        q('lng', num, true),
        q('skill'),
        q('radius', num),
        q('minRating', num),
        q('maxRate', num),
        q('online', bool),
        q('sort', { enum: ['distance', 'rating', 'rate'] }),
        ...page,
      ],
    },
  ],
  [
    'GET',
    '/workers/{id}',
    'Workers',
    'Public worker profile with visible reviews',
    { auth: 'client', path: [idp()] },
  ],
  [
    'GET',
    '/geo/search',
    'Geo',
    'Address search (Nominatim proxy, cached 24 h, 1 req/s)',
    { auth: 'any', query: [q('q', str, true), q('countrycodes')] },
  ],
  [
    'GET',
    '/geo/eta',
    'Geo',
    'Driving ETA (OpenRouteService, straight-line fallback). Use shiftId or coordinates',
    {
      auth: 'any',
      query: [q('shiftId', uuid), q('fromLat', num), q('fromLng', num), q('toLat', num), q('toLng', num)],
    },
  ],
  [
    'POST',
    '/shifts',
    'Shifts',
    'Create a shift (DIRECT -> REQUESTED, OPEN -> OPEN). The price is derived server-side',
    { auth: 'client', body: 'CreateShift', res: 'Shift', status: 201 },
  ],
  [
    'GET',
    '/shifts',
    'Shifts',
    'Own shifts, filter by status or group',
    { auth: 'client', query: [q('status'), ...page], res: 'Shift[]' },
  ],
  [
    'GET',
    '/shifts/quote',
    'Shifts',
    'Price preview for a worker and duration',
    {
      auth: 'client',
      query: [
        q('workerId', uuid, true),
        q('skill', int),
        q('start', dt),
        q('end', dt),
        q('duration_minutes', int),
      ],
    },
  ],
  [
    'GET',
    '/shifts/{id}',
    'Shifts',
    'Shift detail (parties only; workers can also see matching OPEN shifts)',
    { auth: 'client or worker', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/cancel',
    'Shifts',
    'Cancel (REQUESTED, OPEN, ACCEPTED). Cancelling after ACCEPTED is flagged for admin review',
    { auth: 'client or worker', body: 'Reason', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/reassign',
    'Shifts',
    'After DECLINED/EXPIRED choose another worker (or reopen an OPEN shift)',
    { auth: 'client', body: 'Reassign', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/accept',
    'Shifts',
    'Accept (Redis lock + row lock; first accept wins, others get 409)',
    { auth: 'worker', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/decline',
    'Shifts',
    'Decline a direct request',
    { auth: 'worker', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/en-route',
    'Shifts',
    'Mark on the way; returns an ETA when coordinates are sent',
    { auth: 'worker', body: 'EnRoute', path: [idp()] },
  ],
  [
    'POST',
    '/shifts/{id}/arrive',
    'Attendance',
    'Geofenced arrival; generates the Start OTP for the client (409 TOO_EARLY more than 60 min before start)',
    { auth: 'worker', body: 'Arrive', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/start',
    'Attendance',
    'Submit the Start OTP (and be inside the geofence); starts the server-side clock',
    { auth: 'worker', body: 'OtpCheckin', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/end-otp',
    'Attendance',
    'Ask for the End OTP; pushed to the client',
    { auth: 'worker', path: [idp()] },
  ],
  [
    'POST',
    '/shifts/{id}/end',
    'Attendance',
    'Submit the End OTP; stops the clock and computes the timesheet',
    { auth: 'worker', body: 'OtpCheckin', path: [idp()], res: 'Shift' },
  ],
  [
    'GET',
    '/shifts/{id}/otp',
    'Attendance',
    'The client reads the current OTP to say it aloud',
    { auth: 'client', path: [idp()] },
  ],
  [
    'POST',
    '/shifts/{id}/approve',
    'Timesheets',
    'Approve the timesheet (auto-approved after the SLA)',
    { auth: 'client', path: [idp()], res: 'Shift' },
  ],
  [
    'POST',
    '/shifts/{id}/dispute',
    'Disputes',
    'Report an issue; JSON, or multipart with up to 3 evidence files',
    { auth: 'client or worker', body: 'Dispute', multipart: 'optional', path: [idp()], status: 201 },
  ],
  [
    'POST',
    '/payments/shifts/{id}/order',
    'Payments',
    'Create a payment order for the gross amount of an APPROVED shift',
    { auth: 'client', path: [idp()], status: 201 },
  ],
  [
    'POST',
    '/payments/verify',
    'Payments',
    'Verify payment (Razorpay HMAC, or simulated); marks the shift PAID. Idempotent',
    { auth: 'client', body: 'VerifyPayment' },
  ],
  [
    'GET',
    '/payments/history',
    'Payments',
    'Clients: payments made. Workers: payouts earned',
    { auth: 'client or worker', query: page },
  ],
  [
    'POST',
    '/reviews',
    'Reviews',
    'Rate the other party after PAID (or a resolved dispute)',
    { auth: 'client or worker', body: 'Review', status: 201 },
  ],
  [
    'POST',
    '/reviews/{id}/report',
    'Reviews',
    'Report a review about you',
    { auth: 'client or worker', path: [idp()] },
  ],
  [
    'GET',
    '/notifications',
    'Notifications',
    'Paginated notifications with unread count',
    { auth: 'any', query: page },
  ],
  ['POST', '/notifications/read-all', 'Notifications', 'Mark all as read', { auth: 'any' }],
  ['POST', '/notifications/{id}/read', 'Notifications', 'Mark one as read', { auth: 'any', path: [idp()] }],
  [
    'GET',
    '/admin/dashboard',
    'Admin',
    'KPIs, revenue, status breakdown, 14-day series',
    { auth: 'any admin' },
  ],
  [
    'GET',
    '/admin/workers',
    'Admin',
    'Verification queue',
    { auth: 'verifier', query: [q('verification'), q('q'), ...page] },
  ],
  [
    'GET',
    '/admin/workers/{id}',
    'Admin',
    'Worker detail with 5-minute signed KYC URLs (audited)',
    { auth: 'verifier', path: [idp()] },
  ],
  [
    'POST',
    '/admin/workers/{id}/verify',
    'Admin',
    'Approve / reject / ask for more info',
    { auth: 'verifier', body: 'VerifyWorker', path: [idp()] },
  ],
  [
    'GET',
    '/admin/users',
    'Admin',
    'Clients and workers',
    { auth: 'support', query: [q('role'), q('status'), q('q'), ...page] },
  ],
  [
    'PATCH',
    '/admin/users/{id}/status',
    'Admin',
    'Suspend or restore',
    { auth: 'support', body: 'UserStatus', path: [idp()] },
  ],
  [
    'GET',
    '/admin/shifts',
    'Admin',
    'All shifts; flagged=true shows cancellations after acceptance',
    {
      auth: 'any admin',
      query: [
        q('status'),
        q('client_id', uuid),
        q('worker_id', uuid),
        q('flagged', bool),
        q('from', dt),
        q('to', dt),
        ...page,
      ],
    },
  ],
  [
    'GET',
    '/admin/shifts/{id}',
    'Admin',
    'Shift with full event timeline, timesheet, payments, disputes',
    { auth: 'any admin', path: [idp()] },
  ],
  [
    'POST',
    '/admin/shifts/{id}/reassign',
    'Admin',
    'Reassign to another worker',
    { auth: 'support', body: 'Reassign', path: [idp()] },
  ],
  [
    'POST',
    '/admin/shifts/{id}/cancel',
    'Admin',
    'Cancel a shift',
    { auth: 'support', body: 'Reason', path: [idp()] },
  ],
  [
    'GET',
    '/admin/payments',
    'Admin',
    'Payments',
    { auth: 'finance', query: [q('status'), q('from', dt), q('to', dt), ...page] },
  ],
  [
    'GET',
    '/admin/payouts',
    'Admin',
    'Worker payouts (PENDING first)',
    { auth: 'finance', query: [q('payout_status'), ...page] },
  ],
  [
    'POST',
    '/admin/payouts/{shiftId}/settle',
    'Admin',
    'Mark a payout as settled (audited)',
    { auth: 'finance', path: [idp('shiftId')] },
  ],
  ['GET', '/admin/disputes', 'Admin', 'Disputes', { auth: 'support', query: [q('status'), ...page] }],
  [
    'GET',
    '/admin/disputes/{id}',
    'Admin',
    'Dispute with signed evidence links and the shift timeline',
    { auth: 'support', path: [idp()] },
  ],
  [
    'PATCH',
    '/admin/disputes/{id}',
    'Admin',
    'Review, escalate or resolve (APPROVE or CANCEL the shift)',
    { auth: 'support', body: 'DisputePatch', path: [idp()] },
  ],
  [
    'GET',
    '/admin/reviews',
    'Admin',
    'Reviews; reported=true for the moderation queue',
    { auth: 'support', query: [q('reported', bool), q('hidden', bool), ...page] },
  ],
  [
    'PATCH',
    '/admin/reviews/{id}',
    'Admin',
    'Hide or restore a review (recomputes the worker rating)',
    { auth: 'support', body: 'ReviewPatch', path: [idp()] },
  ],
  ['GET', '/admin/skills', 'Admin', 'All skills including inactive', { auth: 'super_admin' }],
  [
    'POST',
    '/admin/skills',
    'Admin',
    'Create a skill',
    { auth: 'super_admin', body: 'SkillBody', status: 201 },
  ],
  [
    'PATCH',
    '/admin/skills/{id}',
    'Admin',
    'Rename or (de)activate',
    { auth: 'super_admin', body: 'SkillBody', path: [idp('id', int)] },
  ],
  [
    'DELETE',
    '/admin/skills/{id}',
    'Admin',
    'Delete an unused skill (a used one is deactivated instead)',
    { auth: 'super_admin', path: [idp('id', int)] },
  ],
  [
    'GET',
    '/admin/config',
    'Admin',
    'Commission %, geofence radius, request TTL, approval SLA',
    { auth: 'super_admin' },
  ],
  [
    'PUT',
    '/admin/config',
    'Admin',
    'Update settings (audited with before/after)',
    { auth: 'super_admin', body: 'Config' },
  ],
  [
    'GET',
    '/admin/audit-log',
    'Admin',
    'Admin audit trail',
    { auth: 'super_admin', query: [q('admin_id', uuid), q('action'), ...page] },
  ],
  [
    'POST',
    '/admin/announcements',
    'Admin',
    'Broadcast a notification to all, clients or workers',
    { auth: 'support', body: 'Announcement', status: 201 },
  ],
  ['GET', '/admin/admins', 'Admin', 'Admin accounts', { auth: 'super_admin' }],
  [
    'POST',
    '/admin/admins',
    'Admin',
    'Create an admin account',
    { auth: 'super_admin', body: 'AdminCreate', status: 201 },
  ],
  [
    'PATCH',
    '/admin/admins/{id}',
    'Admin',
    'Change role, status, name or password',
    { auth: 'super_admin', body: 'AdminPatch', path: [idp()] },
  ],
  [
    'GET',
    '/dev-files/{token}',
    'Dev only',
    'Signed file link for the local-disk storage fallback (disabled in production)',
    { auth: 'public', path: [idp('token', str)] },
  ],
  [
    'GET',
    '/dev-files/public/{bucket}/*',
    'Dev only',
    'Public files for the local-disk storage fallback',
    { auth: 'public', path: [idp('bucket', str)] },
  ],
];

const paths = {};
for (const [method, p, tag, summary, o] of ops) {
  const full = p === '/health' ? '/health' : `/api/v1${p}`;
  const content = o.multipart === true ? 'multipart/form-data' : 'application/json';
  const op = {
    tags: [tag],
    summary,
    description:
      o.auth === 'public'
        ? 'No authentication.'
        : `Requires a bearer token. Allowed: **${o.auth}**${/admin|verifier|finance|support/.test(o.auth) ? ' (super_admin always passes)' : ''}.`,
    ...(o.auth === 'public' ? { security: [] } : {}),
    parameters: [...(o.path ?? []), ...(o.query ?? [])],
    ...(o.body
      ? {
          requestBody: {
            required: true,
            content:
              o.multipart === 'optional'
                ? {
                    'application/json': { schema: ref(o.body) },
                    'multipart/form-data': { schema: ref(o.body) },
                  }
                : { [content]: { schema: ref(o.body) } },
          },
        }
      : {}),
    responses: {
      [o.status ?? 200]: {
        description: 'OK',
        content: {
          'application/json': {
            schema: o.res
              ? obj({
                  data: o.res.endsWith('[]') ? arr(ref(o.res.slice(0, -2))) : ref(o.res),
                  meta: { type: 'object' },
                })
              : obj({ data: { type: 'object' }, meta: { type: 'object' } }),
          },
        },
      },
      ...(o.auth === 'public'
        ? {}
        : { 401: { $ref: '#/components/responses/Error' }, 403: { $ref: '#/components/responses/Error' } }),
      400: { $ref: '#/components/responses/Error' },
      ...(method === 'GET' ? {} : { 409: { $ref: '#/components/responses/Error' } }),
    },
  };
  if (!op.parameters.length) delete op.parameters;
  (paths[full] ??= {})[method.toLowerCase()] = op;
}

const doc = S({
  openapi: '3.0.3',
  info: {
    title: 'H-Staff API',
    version: '0.1.0',
    description:
      'Hourly staffing marketplace backend. Success: `{ data, meta }`. Errors: `{ error: { code, message, details } }` with 400 validation, 401 auth, 403 role/ownership, 404, 409 conflict or illegal state transition, 429 rate/lockout. Money is a string with 2 decimals. Realtime events (Socket.IO): shift:requested, shift:updated, shift:otp, worker:location, timesheet:ready, notification:new.',
  },
  servers: [{ url: 'http://localhost:4000' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    responses: { Error: { description: 'Error', content: { 'application/json': { schema: ref('Error') } } } },
    schemas,
  },
  paths,
});

writeFileSync(
  new URL('../../docs/openapi.yaml', import.meta.url),
  YAML.stringify(doc, { lineWidth: 0, aliasDuplicateObjects: false }),
);
console.log(`wrote docs/openapi.yaml with ${ops.length} operations`);
