# H-Staff — Technical Requirements Document (TRD)

*Audience: coding agents and the developer. Treat this as the source of truth. If something is ambiguous, follow this document; if it is silent, choose the simplest option and record it in `/docs/decisions.md`.*

---

## 1. Product summary

H-Staff is an on-demand hourly staffing marketplace with three actors:

| Persona | Surface | Purpose |
|---|---|---|
| **Client** (business or customer) | Android app | Posts or books hourly shifts, picks a worker, verifies attendance, approves timesheet, pays, rates |
| **Worker** (gig employee / professional) | Android app | Builds a profile, gets verified, goes online, accepts shifts, clocks in/out, tracks earnings |
| **Admin** (operations) | Responsive web app | Verifies workers (KYC), manages users, shifts, payments, disputes, commission, categories, audit trail |

**Constraints:** free-tier infrastructure only, OpenStreetMap (no Google Maps), one-week build, developer is new to Android.

## 2. Unified product model

The project merges two source documents: the brief (shift-based staffing with geo/QR attendance, timesheets, 24 h approval SLA, commission) and the author's flow (customer chooses a professional, Start/End OTP).

- A **Booking is a Shift**: skill/role, start and end time, location, hourly rate, headcount fixed at 1 per shift row.
- **Two fill modes** (one table, one `mode` column):
  - `DIRECT`: client picks a worker; the worker accepts or declines. **MVP.**
  - `OPEN`: shift is visible to nearby matching online workers; first to accept wins (Redis lock). **Stretch.**
- **Attendance = geofence + OTP.** Worker can start only when within `GEOFENCE_RADIUS_M` of the shift location and with the Start OTP shown on the client's phone. QR is a later alternative.
- **Timesheet** is generated automatically from server-recorded clock-in and clock-out timestamps.
- **Payment** is Razorpay test mode or a simulated gateway. Real payouts are out of scope.

## 3. Architecture

```
[Client App]   [Worker App]            [Admin Web]
  Expo RN        Expo RN                Vite + React
      \             |                      /
       \----- HTTPS REST + Socket.IO -----/
                    |
          [Node.js + Express API]  (Docker, Render)
           |        |         |          |
      PostgreSQL  Redis   Supabase     Expo Push (FCM)
      + PostGIS  (Upstash) (KYC files)
       (Neon)
   External: Nominatim (geocode), OpenRouteService (ETA), OSM-based tiles
```

Style: modular monolith. One API deployable, feature folders, no microservices.

## 4. Technology stack and exact use

| Layer | Choice | Exact use in this project | Alternatives considered |
|---|---|---|---|
| Mobile | **Expo (React Native) + TypeScript** | Two apps: `client-app`, `worker-app` (separate Expo projects, shared types via `/packages/shared`) | Flutter, Kotlin + Compose |
| Mobile nav | `expo-router` | File-based routing, role stacks | React Navigation |
| Mobile state | `zustand` + `@tanstack/react-query` | Zustand for auth/session, React Query for server data | Redux Toolkit |
| Mobile UI | `react-native-paper` | Prebuilt Material components for speed | NativeWind, Tamagui |
| Forms | `react-hook-form` + `zod` | All forms; schemas shared with backend | Formik |
| Secure storage | `expo-secure-store` | Access and refresh tokens | AsyncStorage (not for tokens) |
| Location | `expo-location` | Foreground location for geofence and nearby search | |
| Images | `expo-image-picker` | Profile photo, KYC upload | |
| Push | `expo-notifications` (Expo Push, FCM under it) | Shift request, accepted, OTP ready, approval | Raw FCM |
| Realtime | `socket.io-client` | Live shift status and OTP delivery | Polling fallback |
| Map | `react-native-webview` + **Leaflet** | OSM map in a WebView; markers for shift and worker | MapLibre RN (needs dev build) |
| Backend | **Node 20 + Express + TypeScript** | REST API, Socket.IO, cron | NestJS, FastAPI |
| Validation | `zod` | Request body/query validation middleware | Joi |
| DB access | `pg` + `knex` (migrations) with raw SQL for PostGIS | All queries; no ORM | Drizzle, Prisma (weak PostGIS) |
| DB | **PostgreSQL 16 + PostGIS** | Primary store | MongoDB (rejected: weak for money/state, brief wants Postgres) |
| Cache/locks | **Redis** (`ioredis`) | Login OTPs, shift OTPs, accept lock, rate limits | In-memory (not safe on restart) |
| Auth | `jsonwebtoken`, `bcrypt` | Access JWT 15 min, refresh 30 days; admins use email+password | Firebase Auth |
| Realtime server | `socket.io` | Rooms per user: `user:{id}`, `shift:{id}` | ws |
| Jobs | `node-cron` | Expire stale requests, auto-approve timesheets | BullMQ (heavier) |
| Files | **Supabase Storage** (`multer` + `@supabase/supabase-js`) | KYC docs (private bucket, signed URLs), profile photos | Cloudinary, Cloudflare R2, S3 |
| Payments | Razorpay test mode (or `SimulatedGateway`) | Order creation and verify signature | Stripe test mode |
| Admin web | **Vite + React + TS + Tailwind + shadcn/ui** | Admin portal; TanStack Query, React Router, Recharts, React Hook Form | Next.js |
| Docs | `swagger-ui-express` | OpenAPI at `/docs` | Postman collection |
| Container | Docker + Compose | Local Postgres, Redis, API | |
| Hosting | Render (API), Neon (DB), Upstash (Redis), Vercel (admin), EAS/Gradle (APK) | See Setup Guide | Koyeb, Railway, Netlify |

## 5. Repository layout

```
h-staff/
  backend/
    src/
      config/        env.ts (zod-validated env), db.ts, redis.ts, storage.ts
      middleware/    auth.ts, rbac.ts, validate.ts, error.ts, rateLimit.ts
      modules/
        auth/  users/  workers/  kyc/  skills/  shifts/  attendance/
        timesheets/  payments/  reviews/  disputes/  notifications/  admin/
        (each: routes.ts, controller.ts, service.ts, schema.ts, sql.ts)
      realtime/      socket.ts, events.ts
      jobs/          expireRequests.ts, autoApprove.ts
      utils/         geo.ts, otp.ts, money.ts, time.ts
      app.ts  server.ts
    migrations/  seeds/  Dockerfile  .env.example
  mobile/
    client-app/  worker-app/        (Expo projects)
  admin-web/
  packages/shared/                  (zod schemas, enums, types)
  docs/  decisions.md  openapi.yaml
  docker-compose.yml  README.md
```

## 6. Environment variables (`backend/.env.example`)

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://hstaff:hstaff@localhost:5432/hstaff
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
OTP_PROVIDER=console            # console | firebase | msg91
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_KYC_BUCKET=kyc-documents
SUPABASE_PUBLIC_BUCKET=profile-photos
ORS_API_KEY=
NOMINATIM_USER_AGENT=hstaff-dev (you@example.com)
GEOFENCE_RADIUS_M=150
COMMISSION_PCT=15
REQUEST_TTL_MIN=10
APPROVAL_SLA_HOURS=24
PAYMENT_PROVIDER=simulated      # simulated | razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CORS_ORIGINS=http://localhost:5173
```

All variables are validated at boot with zod; the server must refuse to start if a required one is missing. Never commit `.env`.

## 7. Data model (PostgreSQL + PostGIS)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('client','worker','admin');
CREATE TYPE admin_role AS ENUM ('super_admin','verifier','finance','support');
CREATE TYPE verification_status AS ENUM ('PENDING','NEEDS_INFO','APPROVED','REJECTED');
CREATE TYPE shift_status AS ENUM ('OPEN','REQUESTED','ACCEPTED','EN_ROUTE','ARRIVED','IN_PROGRESS',
  'AWAITING_APPROVAL','APPROVED','PAID','DECLINED','EXPIRED','CANCELLED','DISPUTED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  admin_role admin_role,
  phone text UNIQUE,                 -- E.164, null for admins
  email text UNIQUE, password_hash text,
  name text, photo_url text,
  status text NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | SUSPENDED
  created_at timestamptz DEFAULT now()
);

CREATE TABLE skills (
  id serial PRIMARY KEY, name text UNIQUE NOT NULL,
  active boolean DEFAULT true
);

CREATE TABLE worker_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  bio text, experience_years int, hourly_rate numeric(10,2),
  equipment text, is_online boolean DEFAULT false,
  location geography(Point,4326), location_updated_at timestamptz,
  verification verification_status DEFAULT 'PENDING',
  verification_note text,
  rating_avg numeric(3,2) DEFAULT 0, rating_count int DEFAULT 0
);
CREATE INDEX worker_loc_gix ON worker_profiles USING gist(location);

CREATE TABLE worker_skills (
  worker_id uuid REFERENCES users(id), skill_id int REFERENCES skills(id),
  PRIMARY KEY (worker_id, skill_id)
);

CREATE TABLE kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES users(id), doc_type text, storage_key text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES users(id),
  worker_id uuid REFERENCES users(id),
  skill_id int REFERENCES skills(id),
  mode text NOT NULL DEFAULT 'DIRECT',          -- DIRECT | OPEN
  title text, description text, materials text,
  start_at timestamptz NOT NULL, end_at timestamptz NOT NULL,
  is_instant boolean DEFAULT false,
  address text, location geography(Point,4326) NOT NULL,
  hourly_rate numeric(10,2) NOT NULL,
  status shift_status NOT NULL,
  request_expires_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX shifts_loc_gix ON shifts USING gist(location);
CREATE INDEX shifts_status_idx ON shifts(status);

CREATE TABLE shift_events (            -- immutable audit log
  id bigserial PRIMARY KEY, shift_id uuid REFERENCES shifts(id),
  actor_id uuid, event text NOT NULL,   -- e.g. STATUS:ACCEPTED, CLOCK_IN
  from_status shift_status, to_status shift_status,
  lat double precision, lng double precision, meta jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE timesheets (
  shift_id uuid PRIMARY KEY REFERENCES shifts(id),
  clock_in_at timestamptz, clock_out_at timestamptz,
  verified_minutes int, billable_minutes int,
  gross numeric(10,2), commission numeric(10,2), worker_payout numeric(10,2),
  approval_deadline timestamptz,
  status text DEFAULT 'PENDING'          -- PENDING | APPROVED | AUTO_APPROVED | DISPUTED
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id), amount numeric(10,2),
  provider text, provider_order_id text, provider_payment_id text,
  status text DEFAULT 'CREATED',          -- CREATED | PAID | FAILED | REFUNDED
  payout_status text DEFAULT 'PENDING',   -- PENDING | SETTLED
  created_at timestamptz DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id), reviewer_id uuid, reviewee_id uuid,
  stars int CHECK (stars BETWEEN 1 AND 5), tags text[], comment text,
  reported boolean DEFAULT false, created_at timestamptz DEFAULT now(),
  UNIQUE (shift_id, reviewer_id)
);

CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid REFERENCES shifts(id), raised_by uuid REFERENCES users(id),
  reason text, evidence_urls text[], status text DEFAULT 'OPEN',  -- OPEN|IN_REVIEW|RESOLVED|ESCALATED
  resolution text, resolved_by uuid, created_at timestamptz DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
  title text, body text, data jsonb, read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE push_tokens (user_id uuid REFERENCES users(id), token text, PRIMARY KEY (user_id, token));

CREATE TABLE app_config (key text PRIMARY KEY, value text);   -- commission_pct, geofence_m, fees
CREATE TABLE admin_audit_log (
  id bigserial PRIMARY KEY, admin_id uuid, action text, target_type text, target_id text,
  meta jsonb, created_at timestamptz DEFAULT now()
);
```

Rules: money is `numeric`, never float; all times are `timestamptz` in UTC; coordinates are `geography(Point,4326)` with order **(lng, lat)**.

## 8. Shift state machine

| From | To | Actor | Guard / side effect |
|---|---|---|---|
| (none) | REQUESTED | client | `DIRECT`: worker must be APPROVED, within range, not busy; set `request_expires_at = now + REQUEST_TTL_MIN` |
| (none) | OPEN | client | `OPEN` mode; broadcast to nearby online workers with matching skill |
| REQUESTED / OPEN | ACCEPTED | worker | Redis lock `lock:shift:{id}` (SET NX EX 10) then re-check status in a transaction; reject if worker has an overlapping shift |
| REQUESTED | DECLINED / EXPIRED | worker / cron | Notify client; client can pick another worker (creates a new REQUESTED or reopens) |
| ACCEPTED | EN_ROUTE | worker | Optional ETA via ORS |
| ACCEPTED / EN_ROUTE | ARRIVED | worker | **Geofence check** server-side; generate Start OTP, store in Redis, push to client |
| ARRIVED | IN_PROGRESS | worker | Worker submits Start OTP; create timesheet with `clock_in_at = now()` |
| IN_PROGRESS | AWAITING_APPROVAL | worker | Worker requests End OTP, client sees it, worker submits; `clock_out_at = now()`; compute timesheet; `approval_deadline = now + 24 h` |
| AWAITING_APPROVAL | APPROVED | client / cron | Client taps approve, or cron auto-approves after the deadline |
| AWAITING_APPROVAL | DISPUTED | client | Requires reason; admin notified |
| APPROVED | PAID | client / gateway | Payment verified; set payout_status PENDING |
| REQUESTED/OPEN/ACCEPTED | CANCELLED | client or worker | Record who and why; cancel after ACCEPTED is flagged for admin review |

Every transition: wrap in a DB transaction, write a `shift_events` row, emit a Socket.IO event, and send a push if the other party is offline. Illegal transitions return **409**.

## 9. Business rules

1. **Login OTP:** 6 digits, Redis `otp:login:{phone}` TTL 300 s, max 5 attempts, request limited to 3 per 10 minutes. With `OTP_PROVIDER=console` the OTP is logged to the server console.
2. **Shift OTPs:** 6 digits, Redis `otp:start:{shiftId}` and `otp:end:{shiftId}` TTL 2 h, max 5 attempts, never persisted in Postgres, delivered only to the client by socket and push.
3. **Geofence:** `ST_DWithin(shift.location, point, GEOFENCE_RADIUS_M)` using the coordinates sent with the request. Reject mock-looking locations where detectable.
4. **Time is server-side only.** The app never sends durations or timestamps for attendance.
5. **Hours:** `verified_minutes = clock_out - clock_in`. `billable_minutes = min(round_up_to_15(verified), scheduled_minutes + 30)`.
6. **Money:** `gross = billable_minutes / 60 × hourly_rate`; `commission = gross × commission_pct`; `worker_payout = gross − commission`. Round half-up to 2 decimals.
7. **Approval SLA:** if the client takes no action by `approval_deadline`, the cron job auto-approves (`AUTO_APPROVED`) and logs it.
8. **Ratings:** only after PAID or DISPUTED-resolved; one review per party per shift; update `rating_avg` incrementally.
9. **Verification gate:** workers cannot go online or accept shifts unless `verification = APPROVED`.
10. **Nearby search:** `ST_DWithin` plus `ST_Distance`, sorted by distance, filters on skill, rate, rating, online, default radius 10 km, limit 20.
11. **RBAC:** admin sub-roles. `verifier`: KYC and worker status. `finance`: payments and payouts. `support`: complaints and users. `super_admin`: all, config, other admins. KYC document URLs are signed and short-lived.
12. **Audit:** every admin mutation writes `admin_audit_log`.

## 10. API conventions

- Base path `/api/v1`. JSON only. Auth header `Authorization: Bearer <access>`.
- Success `{ "data": ..., "meta": {...} }`. Error `{ "error": { "code": "SHIFT_CONFLICT", "message": "...", "details": {} } }`.
- Status codes: 200/201, 400 validation, 401, 403, 404, 409 state conflict, 429, 500.
- Pagination: `?page=1&limit=20`. Dates ISO 8601 UTC.
- Every route has a zod schema and role guard. Update `docs/openapi.yaml` with each module.

## 11. API endpoints

### Auth
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | /auth/otp/request | public | `{phone, role}` |
| POST | /auth/otp/verify | public | `{phone, otp, role}` → tokens, creates user if new |
| POST | /auth/admin/login | public | `{email, password}` |
| POST | /auth/refresh | public | rotate refresh token |
| POST | /auth/logout | any | revoke refresh token, remove push token |
| POST | /devices/push-token | any | register Expo push token |

### Worker
| Method | Path | Notes |
|---|---|---|
| GET/PUT | /workers/me | profile, rate, equipment, skills |
| POST | /workers/me/kyc | multipart, `doc_type`, file |
| POST | /workers/me/online | `{online, lat, lng}` (blocked unless APPROVED) |
| POST | /workers/me/location | periodic location update, throttled |
| GET | /workers/me/earnings | totals plus per-shift breakdown |
| GET | /workers/me/shifts?status= | incoming, upcoming, history |

### Client
| Method | Path | Notes |
|---|---|---|
| GET | /skills | categories |
| GET | /workers/nearby | `lat,lng,skill,radius,minRating,maxRate` |
| GET | /workers/:id | public profile plus reviews |
| POST | /shifts | create shift (DIRECT with `worker_id`, or OPEN) |
| GET | /shifts/:id and /shifts?status= | detail and lists, for either party |
| POST | /shifts/:id/cancel | `{reason}` |
| POST | /shifts/:id/reassign | pick another worker after decline or expiry |
| GET | /shifts/quote | price preview: `skill, start, end, workerId` |

### Shift lifecycle (worker unless noted)
| Method | Path | Notes |
|---|---|---|
| POST | /shifts/:id/accept | uses Redis lock |
| POST | /shifts/:id/decline | |
| POST | /shifts/:id/en-route | |
| POST | /shifts/:id/arrive | `{lat,lng}` geofence, triggers Start OTP |
| POST | /shifts/:id/start | `{otp, lat, lng}` |
| POST | /shifts/:id/end-otp | worker requests End OTP, client is notified |
| POST | /shifts/:id/end | `{otp, lat, lng}` creates timesheet |
| GET | /shifts/:id/otp | **client**: returns the current start or end OTP |
| POST | /shifts/:id/approve | **client** |
| POST | /shifts/:id/dispute | **client or worker**: `{reason}` plus evidence |

### Payments and reviews
| Method | Path | Notes |
|---|---|---|
| POST | /payments/shifts/:id/order | **client**: creates order for the gross amount |
| POST | /payments/verify | verify signature or simulated confirm, set PAID |
| GET | /payments/history | either role |
| POST | /reviews | `{shiftId, stars, tags, comment}` |
| POST | /reviews/:id/report | |

### Notifications and tracking
`GET /notifications`, `POST /notifications/:id/read`, `GET /geo/search?q=` (Nominatim proxy, cached, 1 req/s), `GET /geo/eta` (ORS proxy).

### Admin (all require `role=admin`; sub-role in brackets)
| Method | Path |
|---|---|
| GET | /admin/dashboard (stats, charts) |
| GET | /admin/workers?verification= **[verifier]** |
| GET | /admin/workers/:id (includes signed KYC URLs) **[verifier]** |
| POST | /admin/workers/:id/verify `{decision: APPROVED|REJECTED|NEEDS_INFO, note}` **[verifier]** |
| GET/PATCH | /admin/users, /admin/users/:id/status (suspend/restore) **[support]** |
| GET | /admin/shifts, /admin/shifts/:id (full event timeline) |
| POST | /admin/shifts/:id/reassign, /admin/shifts/:id/cancel |
| GET | /admin/payments, /admin/payouts **[finance]** |
| POST | /admin/payouts/:shiftId/settle **[finance]** |
| GET/PATCH | /admin/disputes, /admin/disputes/:id (resolve with note) **[support]** |
| GET | /admin/reviews?reported=true, PATCH to hide |
| CRUD | /admin/skills, GET/PUT /admin/config **[super_admin]** |
| GET | /admin/audit-log **[super_admin]** |
| POST | /admin/announcements broadcast notification |

## 12. Real-time events (Socket.IO)

Handshake auth with the access token; the server joins the socket to `user:{id}`. Events:

| Event | To | Payload |
|---|---|---|
| `shift:requested` | worker | shift summary |
| `shift:updated` | both parties | `{shiftId, status}` |
| `shift:otp` | client | `{shiftId, type: start|end, otp}` |
| `worker:location` | client (in `shift:{id}` room) | `{lat,lng,ts}` while EN_ROUTE |
| `timesheet:ready` | client | `{shiftId, gross, deadline}` |
| `notification:new` | user | notification row |

Every event is also persisted as a notification and pushed if the user has no live socket. Clients must tolerate duplicates and refetch on reconnect.

## 13. Mobile app specification

### Client app screens
Splash and role check → Phone login → OTP → Home (popular skills, search, Instant / Scheduled toggle) → Skill details form (duration, schedule, materials, notes) → Location picker (Leaflet map, Nominatim search, saved addresses) → Nearby workers list (filters, sort) → Worker profile (reviews) → Booking summary with price breakdown → Waiting for response (live status, reassign option) → Tracking (map plus ETA) → OTP card (Start/End codes) → In progress → Timesheet review (approve or dispute) → Payment → Rating → Bookings tabs (Upcoming, Active, Completed, Cancelled) → Profile, addresses, notifications, payment history, help.

### Worker app screens
Phone login → OTP → Profile wizard (details, photo, skills, rate, equipment, service area) → KYC upload → Pending verification screen → Dashboard (online toggle, incoming requests, earnings summary) → Request detail (accept or decline, earnings preview) → Active job (En route, Arrived, enter Start OTP, timer, Request End OTP, enter End OTP) → Earnings and payout status → Job history → Rate client → Profile, notifications, complaints.

### Mobile rules
- API client: axios instance with token refresh interceptor; all types from `packages/shared`.
- Foreground location only (no background tracking in MVP); send location every 15 s while EN_ROUTE.
- Every screen handles loading, empty and error states.
- Server data lives in React Query; Zustand holds only session and UI flags.
- Env via `app.config.ts` with `EXPO_PUBLIC_API_URL`.

## 14. Admin web specification

Pages: Login · Dashboard (counts, revenue, bookings per day, pending verifications, open disputes) · Workers (table, filters) · Worker detail (profile, KYC viewer, approve/reject/request info) · Customers · Shifts (table, detail with event timeline) · Payments and payouts · Disputes (thread, evidence, resolution form) · Reviews moderation · Skills and cities · Settings (commission, geofence, SLA) · Audit log · Admins. Route guards hide pages based on `admin_role`; the API enforces the same rules.

## 15. Security checklist

- Hash passwords with bcrypt; JWT secrets from env; refresh tokens stored hashed and rotated.
- `helmet`, `cors` allowlist, `express-rate-limit` (stricter on auth), zod on every input.
- Parameterised SQL only.
- KYC files are never public; fetch via short-lived signed URLs; only `verifier` and `super_admin` may view. Uploads go through the API using the Supabase service-role key (server-side only, never in the apps); the database stores only the object key, never a URL.
- Redact phone numbers and tokens in logs.
- Users cannot read or modify shifts that are not theirs (check ownership in every service function).
- Suspended users are rejected at the auth middleware.

## 16. Module checklist (build in this order)

Each module is done only when all its boxes and its acceptance test pass. Commit per module.

### M0 — Foundation
- [ ] Monorepo, TypeScript configs, ESLint, Prettier, `.editorconfig`
- [ ] `docker-compose.yml` (postgis, redis, api) and `.env.example`
- [ ] Express app, zod env loader, error middleware, `/health`
- [ ] Knex migrations for all tables in §7, seed: skills, one admin per sub-role, demo client and workers
- **Accept:** `docker compose up` then `GET /health` returns 200 and the DB has the seed data.

### M1 — Auth and users
- [ ] OTP request/verify with Redis, console provider, rate limits
- [ ] JWT access/refresh, `auth` and `rbac` middleware, admin email login
- [ ] Push token registration
- **Accept:** all 3 roles can log in via Postman; wrong OTP five times locks out.

### M2 — Worker profile and KYC
- [ ] Profile CRUD, skills, rate, equipment
- [ ] KYC upload to Supabase Storage (private bucket), documents listed
- [ ] Admin verify endpoints with audit log
- **Accept:** unverified worker cannot go online; admin approval enables it.

### M3 — Skills, geo and search
- [ ] Skills CRUD (admin), `/skills`
- [ ] Online toggle and location update
- [ ] `/workers/nearby` with PostGIS and filters; Nominatim and ORS proxies with caching
- **Accept:** seeded workers are returned in correct distance order.

### M4 — Shift engine
- [ ] Create shift (DIRECT), price quote, state-machine service with transition table
- [ ] Accept/decline/expire, reassign, cancel, overlap check
- [ ] Socket.IO server, rooms, `shift:*` events, push helper
- [ ] Cron: expire stale requests
- **Accept:** request → accept → decline/expire paths all work; illegal transition gives 409.

### M5 — Attendance
- [ ] Arrive with geofence, Start OTP, Start, End OTP, End
- [ ] Timesheet calculation per §9 with unit tests
- [ ] `shift_events` log with coordinates
- **Accept:** attendance fails outside the radius and with a wrong OTP; hours and payout match hand-calculated cases.

### M6 — Approval, payments, reviews, disputes
- [ ] Approve, dispute, cron auto-approve at 24 h
- [ ] Payment order and verify (simulated first, Razorpay test later), history
- [ ] Two-way reviews and rating aggregates
- [ ] Disputes with evidence and admin resolution
- **Accept:** a shift can go from request to PAID and both parties rate each other.

### M7 — Admin API completion
- [ ] Dashboard aggregates, users, shifts, payments/payouts, reviews moderation, config, announcements, audit log
- **Accept:** every admin endpoint enforces its sub-role.

### M8 — Admin web
- [ ] Vite app, auth, layout, route guards
- [ ] Dashboard, workers and KYC viewer, shifts, payments, disputes, settings
- **Accept:** admin can approve a worker, view a shift timeline, and settle a payout from the UI.

### M9 — Worker app
- [ ] Expo project, auth, profile wizard, KYC upload, pending screen
- [ ] Dashboard with online toggle, request detail, active job flow with OTP entry, earnings, history
- **Accept:** a verified worker completes the full job flow on a physical phone.

### M10 — Client app
- [ ] Expo project, auth, home, booking form, map picker, nearby list, profile view, summary
- [ ] Waiting, tracking, OTP card, timesheet approval, payment, rating, bookings tabs
- **Accept:** a client books, tracks, approves, pays and rates against the deployed API.

### M11 — Push and polish
- [ ] Expo push on a development build; fallback to sockets plus in-app notifications
- [ ] Loading/empty/error states, form validation messages, app icon and splash

### M12 — Stretch (only if M0–M11 are finished)
- [ ] `OPEN` mode broadcast with Redis lock
- [ ] QR attendance alternative
- [ ] Scheduled shift reminders, revenue charts, saved addresses

### M13 — Quality and deployment
- [ ] Unit tests: money, time, geo, state machine. Integration tests for the happy path with Supertest
- [ ] Deploy API (Render), DB (Neon), Redis (Upstash), admin (Vercel)
- [ ] Build release APKs for both apps; test on a clean device
- [ ] README with setup, architecture diagram, demo credentials; OpenAPI published at `/docs`
- [ ] Demo script and a screen recording of the full flow

## 17. Testing strategy

- **Unit (Vitest or Jest):** `money.ts`, `time.ts` (rounding, cap), `geo.ts`, state machine transitions.
- **Integration (Supertest, test DB in Docker):** auth, nearby search, full shift lifecycle, RBAC denials, concurrent accept (two requests, one winner).
- **Manual device checklist:** GPS permission denied, airplane mode mid-shift, token expiry, app killed during IN_PROGRESS, push when the app is closed.

## 18. Definition of done

- Happy path works end to end on deployed infrastructure with two real phones and the admin web.
- Every endpoint is validated, authorised, and documented.
- No secrets in git. `docker compose up` works from a clean clone.
- README lists demo accounts and how to reproduce the demo.

## 19. Agent instructions

1. Work one module at a time in §16 order; do not start a module until the previous acceptance test passes.
2. Do not add dependencies beyond §4 without writing the reason in `docs/decisions.md`.
3. Never trust client-provided time, price, role, or user id; derive them on the server.
4. Keep services free of Express types so they can be unit-tested.
5. Write migrations, never edit the DB by hand.
6. After each module: run lint, tests, update `openapi.yaml`, and tick the checklist.
7. When a requirement is unclear, choose the simplest option that keeps the state machine and security rules intact, and record it.
