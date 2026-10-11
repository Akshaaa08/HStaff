# HStaff — Corrected Technical Requirements Document (TRD)

**Status:** Corrected architecture baseline  
**Purpose:** Source of truth for developers and coding agents.  
**Critical clarification:** HStaff requires **native Android applications built with Kotlin and Jetpack Compose** for customers and workers, plus a **separate web-based admin portal**. A responsive website, React Native app, Capacitor wrapper, or WebView is **not** an acceptable substitute for the native Android apps.

---

## 1. Product definition

HStaff is an hourly-services marketplace for India. Customers book workers for household and local services; workers create profiles, complete verification, accept jobs, track attendance and earnings; administrators operate and moderate the marketplace.

### Actors and required application surfaces

| Actor | Required surface | Purpose |
|---|---|---|
| Customer/client | **Native Android app** | Discover services and workers, book, track, confirm attendance, approve timesheets, pay, review |
| Worker | **Native Android app** | Create profile, submit verification documents, manage availability, accept jobs, record attendance, see earnings and job history |
| Admin/operations | **Separate web application** | Manage users, worker verification, bookings/shifts, payments, disputes, categories, configuration and audit logs |

The customer and worker experiences may be separate Android apps or role-based experiences in one Android app. **For this project, implement two separate Android app modules/packages (`client-app` and `worker-app`) unless the product owner explicitly changes this decision.** Both must be native Android apps. The admin portal is a web app.

### Target launch cities

Pune, Mumbai, Ahilyanagar, Chhatrapati Sambhajinagar, and Nashik, Maharashtra, India.

### Service categories

Support the planned 15 worker/service categories from the product requirements (for example: maid/housekeeping, cook, plumber, electrician, carpenter and other approved local service categories). Store categories in the database and manage them through the admin portal; do not hard-code the catalogue only in the UI. Confirm the final canonical list in seed data before release.

### Product constraints

- India-first experience, with prices represented in INR.
- Free-tier or low-cost infrastructure where practical.
- Use OpenStreetMap-based mapping/geocoding; **do not use Google Maps**.
- Use a shared backend API and database for Android clients and admin web.
- No real money movement in local development. Use simulated payments by default and test mode only when deliberately configured.
- Real worker payouts are out of scope for the MVP unless separately approved.
- Foreground location only in the MVP; no continuous background tracking.
- KYC/identity documents must be private and accessible only to authorized admin roles.
- Never commit secrets or production credentials.

---

## 2. Non-negotiable architecture

```text
┌────────────────────────┐       ┌────────────────────────┐
│ HStaff Customer Android│       │ HStaff Worker Android  │
│ Kotlin + Compose       │       │ Kotlin + Compose       │
└────────────┬───────────┘       └────────────┬───────────┘
             │ HTTPS REST / Socket.IO         │
             └──────────────┬─────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │ Shared API          │
                 │ Node.js + Express   │
                 │ TypeScript          │
                 └─────┬─────────┬────┘
                       │         │
              ┌────────▼───┐ ┌───▼────────┐
              │ PostgreSQL │ │ Redis      │
              │ + PostGIS  │ │ ephemeral  │
              └────────────┘ └────────────┘

┌────────────────────────┐
│ Separate Admin Web     │──── HTTPS REST / Socket.IO ──► Shared API
│ React + TypeScript     │
└────────────────────────┘
```

### Architecture rules

1. **Android clients are native Kotlin apps using Jetpack Compose.**
2. Do not implement the customer or worker app using React, React Native, Expo, Capacitor, Ionic, or a WebView.
3. The admin portal is a separate React + TypeScript web app.
4. All clients use the same backend API; business rules live on the server, not in duplicated client code.
5. PostgreSQL/PostGIS is the primary database. Redis is for ephemeral data, throttling and concurrency locks.
6. Use a modular monolith backend; do not split into microservices for the MVP.
7. API contracts are documented in `docs/openapi.yaml`. Android DTOs are Kotlin data classes generated from or kept consistent with the OpenAPI contract. Do not import TypeScript types directly into Kotlin.
8. Keep the existing `frontend/` code until it has been audited. Do not silently treat it as the admin portal or delete it. Decide whether it should become `admin-web/` only after inspecting its routes and features.

---

## 3. Technology stack

| Layer | Required technology | Responsibilities |
|---|---|---|
| Customer Android app | Kotlin, Jetpack Compose, Material 3 | Native customer experience |
| Worker Android app | Kotlin, Jetpack Compose, Material 3 | Native worker experience |
| Android architecture | MVVM, ViewModel, StateFlow/Flow, repositories | UI state and separation of concerns |
| Android navigation | Navigation Compose | Native screen navigation |
| Android networking | Retrofit + OkHttp (or one documented equivalent) | HTTPS API access |
| Android JSON | Kotlin serialization | Request/response DTOs |
| Android async | Kotlin Coroutines + Flow | Asynchronous work and streams |
| Android secure tokens | Android Keystore-backed secure storage library | Store refresh/access credentials safely; never plain preferences |
| Android local persistence | Room only for data that genuinely needs local/offline caching | No duplicate source of truth for marketplace transactions |
| Android images | Android photo picker / system document picker | Profile image and KYC selection |
| Android location | Android location APIs with runtime permission and clear purpose | Foreground location for search and attendance |
| Android push | Firebase Cloud Messaging (FCM) | Push notifications |
| Android maps | OpenStreetMap-based map solution compatible with native Android; select and document the library before implementation | Map markers and location selection; no Google Maps SDK |
| Admin web | React, TypeScript, Vite, Tailwind CSS, shadcn/ui (existing implementation to be audited) | Admin portal |
| Backend | Node.js, Express, TypeScript | REST API, Socket.IO, jobs |
| Validation | Zod in backend | Request validation |
| Database access | `pg` + Knex migrations; parameterized SQL and PostGIS queries | Persistence |
| Database | PostgreSQL 16 + PostGIS | Relational and geospatial data |
| Cache/locks | Redis with `ioredis` | OTPs, rate limits, request locks |
| Authentication | Phone OTP for clients/workers; email/password for admins; JWT access/refresh tokens | Authentication and authorization |
| Realtime | Socket.IO | Shift updates, OTP delivery events and notifications |
| Jobs | `node-cron` initially | Expire requests and auto-approve timesheets |
| File storage | Private Supabase Storage for KYC; local storage fallback for development | Documents and profile photos |
| Payments | Simulated gateway by default; Razorpay test mode only when explicitly configured | Testable payment lifecycle |
| API docs | `swagger-ui-express` and OpenAPI | API contract and testing |
| Local infrastructure | Docker Compose | PostgreSQL/PostGIS, Redis, backend and existing web frontend as configured |

### Android engineering requirements

- Use a currently supported stable Android Studio release and a compatible JDK/Android Gradle Plugin/Kotlin version selected together at project creation. Record exact versions in the Android project; do not copy stale version numbers from old setup guides.
- Build installable debug APKs and verify on an emulator and a physical Android device.
- The Android app must work as an installed native app, without loading the web UI in a WebView.
- The Android API base URL must be configurable by build variant. An emulator typically reaches the host computer through `10.0.2.2`; a physical phone needs the development computer's LAN IP or a deployed HTTPS API.
- Never put server secrets (Supabase service-role key, JWT signing secret, payment secret) in the Android app.
- Use least-privilege runtime permissions. Ask for location only when the user invokes a location-dependent feature; explain why.
- Do not request background location in the MVP.
- Provide loading, empty, success, offline and error states for every major screen.
- Include accessibility semantics, scalable text, sufficient contrast, and touch targets appropriate for Android.

---

## 4. Repository layout target

```text
HStaff/
├── android/
│   ├── client-app/                 # Native Android customer app (Kotlin/Compose)
│   ├── worker-app/                 # Native Android worker app (Kotlin/Compose)
│   └── shared/                     # Optional shared Kotlin module; only if it reduces duplication safely
├── admin-web/                      # Separate React + TypeScript admin portal
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── realtime/
│   │   ├── jobs/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── migrations/
│   ├── seeds/
│   ├── Dockerfile
│   └── .env.example
├── docs/
│   ├── decisions.md
│   └── openapi.yaml
├── docker-compose.yml
├── README.md
└── .gitignore
```

This is the **target layout**, not a claim that all these directories currently exist. The current repository contains a `frontend/` directory; inspect it before deciding whether it becomes `admin-web/`, remains a separate web client, or is retired. Do not delete or move files as part of an automated change without reviewing their contents and Git status.

---

## 5. Product model and core business rules

### Booking/shift model

A booking is a shift containing one worker slot, a service category, start/end time, location, hourly rate and status.

- `DIRECT` mode: client selects a worker; worker accepts or declines. This is MVP.
- `OPEN` mode: broadcast to nearby matching workers; first valid acceptance wins using a Redis lock. Stretch goal only after DIRECT flow passes acceptance tests.
- Worker cannot accept overlapping shifts.
- Only approved workers may appear as bookable/online.
- Server calculates price, billable time, commission and payout amounts. Never trust client-supplied totals.

### Attendance

- Worker arrives and the server checks the submitted location against the shift geofence using PostGIS.
- Client receives a start OTP; worker enters it to start the shift.
- Worker requests an end OTP; client receives it; worker enters it to end the shift.
- Server timestamps clock-in and clock-out. Client-supplied timestamps/durations are never authoritative.
- QR attendance is a later alternative, not MVP.
- MVP uses foreground location only. Location collection must be disclosed and limited to the active shift/search feature.

### Timesheet, approval and money

- Server generates the timesheet from recorded clock-in/out.
- `verified_minutes = clock_out_at - clock_in_at`.
- `billable_minutes = min(round_up_to_15(verified_minutes), scheduled_minutes + 30)`.
- `gross = billable_minutes / 60 × hourly_rate`.
- `commission = gross × commission_pct`.
- `worker_payout = gross − commission`.
- Use decimal/numeric arithmetic and half-up rounding to two decimal places; never use binary floating point for money.
- Client approves or disputes the timesheet. If no action is taken within 24 hours, a server job auto-approves and logs the action.
- MVP can simulate payment success/failure. Real payouts are not part of the MVP.
- Razorpay test mode is optional for later testing; never enable live payment keys by default.

---

## 6. Authentication, roles and authorization

### Roles

- `client`
- `worker`
- `admin`, with sub-roles `super_admin`, `verifier`, `finance`, `support`

### Authentication

- Client and worker: phone number + six-digit OTP.
- Development OTP provider logs the OTP to the API console only.
- OTP lifetime: 300 seconds; maximum five verification attempts; rate limit requests to three per ten minutes per phone/appropriate key.
- Access token: 15 minutes; refresh token: 30 days, rotated and stored hashed server-side.
- Admin: email/password, password hashed using bcrypt.
- Suspended accounts cannot authenticate or use protected endpoints.

### Authorization

- Enforce ownership and role checks on the backend for every protected endpoint.
- Hiding a button or route in a client is not security.
- Verifiers and super admins can access private KYC documents through short-lived signed URLs.
- Finance manages payment/payout records; support manages complaints/disputes/users; super admins manage configuration and admin accounts.
- Every admin mutation writes to an audit log.

---

## 7. Data model (logical entities)

Implement migrations, not manual production schema edits. The schema includes at least:

- `users`
- `skills`
- `worker_profiles`
- `worker_skills`
- `kyc_documents`
- `shifts`
- `shift_events`
- `timesheets`
- `payments`
- `reviews`
- `disputes`
- `notifications`
- `push_tokens`
- `app_config`
- `admin_audit_log`

Use UUID primary keys where appropriate, foreign keys, indexes, constraints, and PostGIS geography points. Store timestamps as UTC `timestamptz`. Coordinate construction must use longitude then latitude. Money fields must use `numeric`, not floating-point types.

Required PostgreSQL extensions include `postgis` and, if used by the migrations, `pgcrypto`.

---

## 8. Shift state machine

| From | To | Actor | Required guard/side effect |
|---|---|---|---|
| none | REQUESTED | client | DIRECT request; approved worker; no overlap; expiry set |
| none | OPEN | client | OPEN mode only; stretch |
| REQUESTED/OPEN | ACCEPTED | worker | Redis lock, transactional re-check, no overlap |
| REQUESTED | DECLINED/EXPIRED | worker/job | Notify client; allow reassignment |
| ACCEPTED | EN_ROUTE | worker | Optional route ETA |
| ACCEPTED/EN_ROUTE | ARRIVED | worker | Server-side geofence; generate start OTP |
| ARRIVED | IN_PROGRESS | worker | Valid start OTP; server clock-in |
| IN_PROGRESS | AWAITING_APPROVAL | worker | Valid end OTP; server clock-out; calculate timesheet |
| AWAITING_APPROVAL | APPROVED | client/job | Manual approval or 24-hour auto-approval |
| AWAITING_APPROVAL | DISPUTED | client/worker | Reason/evidence; notify admin |
| APPROVED | PAID | client/gateway | Payment verified; payout remains pending |
| REQUESTED/OPEN/ACCEPTED | CANCELLED | client/worker | Record actor and reason; accepted cancellation flagged for review |

Every transition must run in a database transaction, create an immutable `shift_events` record, emit a Socket.IO event, and persist/send a notification. Illegal transitions return HTTP 409.

---

## 9. Native Android app requirements

### 9.1 Customer app flow

Splash/session check → phone login → OTP verification → home (service categories, search, instant/scheduled toggle) → service details (duration, schedule, materials/notes) → location selection (OpenStreetMap-based map, search, saved addresses) → nearby workers and filters → worker profile/reviews → booking summary and price breakdown → wait for worker response → live status/tracking/ETA → start/end OTP display → active shift → timesheet review (approve/dispute) → payment → rating → booking history → profile, addresses, notifications, payment history and help.

### 9.2 Worker app flow

Splash/session check → phone login → OTP verification → profile setup (name, photo, skills, experience, hourly rate, equipment, service area) → KYC document submission → pending-verification state → dashboard (availability, requests, earnings) → request details (accept/decline, earnings preview) → active shift (en route, arrived, enter start OTP, work timer, request end OTP, enter end OTP) → timesheet/job completion → earnings/payout status → job history → rate client → profile, notifications and complaints.

### 9.3 Native Android implementation rules

- Kotlin + Jetpack Compose + Material 3; no React Native, Expo, Capacitor, Ionic or WebView.
- MVVM with ViewModel and StateFlow; repository layer for data access.
- Retrofit/OkHttp for API calls, Kotlin serialization for JSON, coroutines for asynchronous operations.
- Secure token storage backed by Android Keystore; do not store secrets or refresh tokens in plain-text preferences.
- Keep server state from the API; cache only where justified.
- Use OpenStreetMap-compatible native mapping. Select a maintained Android library and document the choice in `docs/decisions.md` before implementing maps. Do not use Google Maps SDK.
- Request location, camera/media, and notification permissions only as required, with runtime prompts and denial handling.
- Push notifications through FCM; Socket.IO is used while connected. On reconnect, refetch authoritative server state and tolerate duplicate events.
- Test with GPS disabled, permission denied, network loss, token expiry, app process death during an active shift, and push notification while app is closed.
- Build and test debug APKs on emulator and physical device.

---

## 10. Admin web requirements

Separate React + TypeScript web app, not an Android screen and not the customer/worker mobile UI.

Pages: admin login; dashboard; worker list and KYC review; customer list; shifts/bookings and event timeline; payments and payout status; disputes and evidence; review moderation; service categories and supported cities; configuration (commission, geofence, approval SLA); audit log; admin management.

Role-aware navigation must mirror backend authorization. KYC files must never be publicly exposed.

---

## 11. UI/UX requirements

- Native Android UI must feel like a real Android application and use Material 3 patterns adapted to the HStaff visual identity.
- Existing design direction: modern, friendly, trustworthy marketplace; pink-to-peach gradient accents for selected/active navigation icons; glassmorphism may be used sparingly for decorative surfaces, but not at the expense of readability, accessibility, or performance.
- Use a consistent design token system for spacing, typography, shape, elevation and colors.
- Support light and dark themes if feasible within the MVP.
- Ensure readable contrast, scalable text, accessible labels, clear validation, and visible focus/pressed/disabled/loading states.
- Admin web should be optimized for desktop operations while remaining usable on smaller screens; this does not replace native Android apps.
- Confirm the final in-app language/localization requirement from the existing product brief before adding a new language assumption.

---

## 12. Maps and location

- Use OpenStreetMap-based mapping and geocoding; no Google Maps products.
- Use Nominatim responsibly, with a valid identifiable User-Agent and caching/rate limits. Do not treat the public Nominatim service as an unlimited production API.
- OpenRouteService may be used for road distance/ETA; if unavailable, clearly label straight-line distance estimates as estimates.
- Nearby worker search: PostGIS `ST_DWithin`/`ST_Distance`, filter by skill, availability, verification, rate and rating; default radius 10 km, limit 20.
- Attendance geofence default: 150 m, configurable server-side. Server validates coordinates and logs relevant events.
- Do not track worker location continuously in the background in the MVP.

---

## 13. API conventions and required endpoints

- Base path: `/api/v1`.
- JSON request/response; bearer access token for protected endpoints.
- Success: `{ "data": ..., "meta": {...} }`.
- Error: `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- Use 200/201, 400, 401, 403, 404, 409, 429 and 500 appropriately.
- Pagination uses `?page=1&limit=20`; dates are ISO 8601 UTC.
- Every endpoint validates inputs and enforces role/ownership. Update `docs/openapi.yaml` with each endpoint.

Required endpoint groups:
- Auth: OTP request/verify, admin login, refresh, logout, push-token registration.
- Worker: profile CRUD, KYC upload, online toggle, location update, earnings, shift lists.
- Client: skills, nearby workers, worker details, shift creation/list/detail, cancellation, reassignment, price quote.
- Shift lifecycle: accept, decline, en-route, arrive, start, end-OTP, end, client OTP retrieval, approve, dispute.
- Payments/reviews: order creation, payment verification, history, create/report review.
- Notifications/geolocation: list/read notifications, address search, ETA.
- Admin: dashboard, worker/KYC review, users, shifts, payments/payouts, disputes, reviews, skills, cities/config, audit log, announcements.

Do not claim an endpoint is implemented until code and tests verify it.

---

## 14. Security and privacy

- Hash admin passwords with bcrypt; use environment secrets for JWT signing; rotate refresh tokens and store them hashed.
- Use Helmet, explicit CORS allowlist, strict auth rate limits and Zod validation.
- Parameterized SQL only.
- KYC storage private by default; signed URLs short-lived; service-role key backend-only.
- Redact OTPs, passwords, tokens, and sensitive personal data from logs.
- Validate shift ownership on every operation.
- Use server-calculated timestamps and prices.
- Protect against duplicate booking acceptance with database transactions and Redis locks.
- Keep secrets out of Git and client binaries.
- Collect only necessary location and identity data; document purpose and retention.
- Provide safe error messages without leaking internals.

---

## 15. Environment configuration

For Docker, use the environment variables in `docker-compose.yml` as the container-to-container configuration. Inside Docker, the API should reach PostgreSQL using the Compose service hostname (for example `postgres`) and Redis using its service hostname (for example `redis`), not `localhost`.

For direct Windows development, use `backend/.env` copied from `backend/.env.example` and use `localhost` for locally published database/Redis ports. Never commit `.env`.

Important variables include:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://hstaff:hstaff@localhost:5432/hstaff
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=replace-with-local-development-secret
JWT_REFRESH_SECRET=replace-with-a-different-local-development-secret
OTP_PROVIDER=console
PAYMENT_PROVIDER=simulated
GEOFENCE_RADIUS_M=150
COMMISSION_PCT=15
REQUEST_TTL_MIN=10
APPROVAL_SLA_HOURS=24
CORS_ORIGINS=http://localhost:5173
```

This is an illustrative local-development template. Use the exact variables required by the actual backend configuration; do not paste this block over an existing environment file without checking required fields. Docker may supply its own values through Compose. Do not put server-side secrets into Android or web client configuration.

---

## 16. Build sequence and acceptance criteria

Work in small modules. Do not mark a phase complete until its acceptance test passes.

### M0 — Repository and local infrastructure
- Audit existing code and Git status; document current components before moving files.
- Keep Docker Compose working for PostGIS, Redis, API, and the existing frontend if it is still needed.
- Health endpoint returns 200 with database and Redis health.
- Migrations and idempotent seed run successfully.

### M1 — Auth and authorization
- OTP request/verify, Redis TTLs/rate limits, access/refresh tokens, admin login, RBAC.
- Test valid/invalid OTP, rate limits and role boundaries.

### M2 — Worker profile and KYC
- Profile, skills, rates, equipment, private document upload and admin review.
- Unverified workers cannot go online or accept work.

### M3 — Categories, location and search
- Seed approved categories and supported cities.
- Online status, PostGIS nearby search, Nominatim/ORS proxy and caching.
- Search returns workers sorted by distance and filters correctly.

### M4 — Direct shift lifecycle
- Quote, create, accept/decline, expiry, reassignment, cancellation and overlap checks.
- Concurrent acceptance tests ensure only one worker can win.

### M5 — Attendance and timesheets
- Geofence, start/end OTPs, server timestamps, timesheet calculation and audit events.
- Test wrong OTP, outside-geofence rejection, rounding and maximum billable time.

### M6 — Approval, simulated payments, reviews and disputes
- Approve/dispute, 24-hour auto-approval, simulated payment, history and reviews.
- End-to-end shift reaches paid state in simulated mode.

### M7 — Admin API
- Dashboard, users, shifts, KYC, payments, disputes, reviews, settings, announcements and audit log.
- Test every admin sub-role.

### M8 — Admin web
- Separate React admin app, auth, route guards and operations pages.
- Admin can approve a worker, inspect a shift timeline and review payment/dispute status.

### M9 — Native Android foundation
- Create Android Studio Gradle project(s) for client and worker using Kotlin + Jetpack Compose.
- Add theme, navigation, MVVM, API client, serialization, secure token storage, environment-based API URL and error handling.
- Build and launch each app on an emulator. This milestone is not complete if it only launches the web frontend in a WebView.

### M10 — Native worker app
- Auth, profile wizard, KYC, pending verification, dashboard, request acceptance, active shift OTP flow, earnings and history.
- Acceptance: approved worker completes a full shift on a physical Android device against the API.

### M11 — Native client app
- Auth, categories, booking, map/location, nearby workers, profile, tracking, OTP, timesheet approval, simulated payment, rating and history.
- Acceptance: customer completes the full booking lifecycle on a physical Android device.

### M12 — Push and polish
- FCM, in-app notifications, loading/empty/error/offline states, accessibility, app icon and splash screen.
- Verify push behavior while app is foregrounded, backgrounded and closed.

### M13 — Quality and deployment
- Unit tests for money/time/geography/state transitions; integration tests for API and RBAC.
- Deploy API, database, Redis and admin web only after local tests pass.
- Build signed release APK/AABs using secure signing configuration; test clean installation.
- README includes setup, architecture, demo data and API docs; record end-to-end demo.

### Stretch features only after the above MVP works
- OPEN mode broadcast and Redis lock.
- QR attendance.
- Scheduled reminders, additional analytics and saved-address improvements.

---

## 17. Testing and definition of done

- Unit tests for money, time, geo calculations and state transitions.
- Integration tests using a test database in Docker and Supertest.
- API tests for authentication, authorization, ownership, concurrency and error handling.
- Android UI/instrumentation tests for login, booking, shift workflow, permissions and network failures.
- Manual device checks: denied GPS permission, disabled location, lost network, expired token, app killed mid-shift, duplicate push/event, and notification while app is closed.
- Happy path works end-to-end with customer Android app, worker Android app and admin web.
- All endpoints are validated, authorized and documented.
- `docker compose up --build` works from a clean clone for the services included in Compose.
- No secrets committed.
- Release artifacts are genuine Android APK/AAB builds, not web bundles wrapped in a WebView.

---

## 18. Coding-agent rules

1. Treat this document as the source of truth.
2. Never replace native Android requirements with React Native, Expo, Capacitor or WebView.
3. Audit existing files before moving, deleting or overwriting them.
4. Build one module at a time and pass its acceptance criteria before proceeding.
5. Do not add major dependencies without recording the reason in `docs/decisions.md`.
6. Never trust client-provided time, price, role or user ID.
7. Keep business logic in backend services, independent of Express request/response objects.
8. Use database migrations, not manual schema changes.
9. After each module, run lint/tests and update `docs/openapi.yaml`.
10. If the current repository disagrees with this TRD, document the discrepancy and implement the required architecture; do not silently change the requirement to match the existing code.
11. Explicitly label every feature as `implemented`, `partial`, `planned` or `not implemented`; do not imply a planned Android app already exists.
12. If any requirement is ambiguous, record the decision in `docs/decisions.md` before making a consequential architectural choice.
