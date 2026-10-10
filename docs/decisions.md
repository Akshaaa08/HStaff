# Decisions log

The TRD is the source of truth. This file records every place it was silent, ambiguous, or where something had to be
added to make the system work, so each can be reviewed and reversed. IDs are referenced from code comments.

## Additions to the stack and structure

- **D-01 Shared enums live in `backend/src/shared/`**, not a `/packages/shared` workspace. There is no second TypeScript
  consumer yet; the folder is written so it can be lifted into a package when the mobile app and admin web exist.
- **D-02 Local-disk storage fallback.** When `SUPABASE_SERVICE_ROLE_KEY` is empty and `NODE_ENV` is not production,
  uploads go to `backend/.local-storage` and signed links are HMAC tokens served by the API. Production validation requires
  Supabase, so this can never be active there. The private bucket is never exposed by the public file route.
- **D-03 Two env variables beyond the TRD list:** `API_PUBLIC_URL` (builds links for the local fallback) and
  `SEED_ADMIN_PASSWORD` (read only by the seed script).
- **D-04 Extra endpoints the clients need but the TRD table omits:** `GET/PUT /users/me`, `POST /users/me/photo`,
  `POST /workers/me/photo`, `GET /workers/me/kyc`, `POST /notifications/read-all`, `GET/POST/PATCH /admin/admins`
  (section 14 lists an Admins page; rule 11 needs super_admin to manage them), `GET /geo/eta?shiftId=`.
- **D-07 Rate limiting is in-memory** (`express-rate-limit` default store) because the target is a single Render
  instance. OTP request/attempt limits and the location throttle are in Redis and are multi-instance safe. Scaling out
  needs `rate-limit-redis` and a Socket.IO Redis adapter.
- **New dependencies:** `yaml` + `swagger-ui-express` (serve `docs/openapi.yaml`), `tsx` (dev runner), `socket.io-client`
  and `supertest` (tests). `zod` is pinned to 3.x to match the Lovable frontend. No SDKs for Razorpay, Expo or ORS:
  they are plain HTTPS calls.

## Data model

- **D-05 `worker_profiles.upi_id` and `age`** added (migration 2). The prototype's helper sign-up collects both and
  finance needs the UPI ID to pay out.
- **D-06 `reviews.hidden`** added so admins can moderate; hiding recomputes the worker's rating from visible reviews.
- **D-09 Extra constraints/indexes (migration 2):** CHECKs for status values and `end_at > start_at`, a unique partial
  index allowing one PAID payment per shift (makes verify idempotent under races), unique `(provider, provider_order_id)`,
  query indexes, and a trigger that makes `shift_events` append-only. Migration 1 is the TRD DDL verbatim.
- **D-08 Refresh tokens live in Redis** (sha256 of the token, 30-day TTL) because section 7 has no table for them.
  Losing Redis logs everyone out; it does not lose data.

## State machine

Implemented exactly as section 8, plus:

- **D-10 OPEN shifts can EXPIRE.** `request_expires_at` is `now + REQUEST_TTL_MIN` for instant OPEN shifts and the start
  time for scheduled ones. The same cron job handles REQUESTED and OPEN.
- **D-11 Disputes.** Either party may raise one (the endpoint says "client or worker"), so `AWAITING_APPROVAL -> DISPUTED`
  allows both. Admins resolve with an explicit outcome: `DISPUTED -> APPROVED` (then normal payment) or `-> CANCELLED`.
  Disputes raised while ARRIVED, IN_PROGRESS, APPROVED or PAID are recorded (and visible to admins) without changing the
  shift status. Reviews are allowed after PAID, or once a dispute on the shift is RESOLVED.
- Admin extras: `any non-final -> CANCELLED` and `OPEN/REQUESTED/ACCEPTED/DECLINED/EXPIRED -> REQUESTED` (reassign).
  `EXPIRED -> OPEN` lets a client reopen an expired OPEN shift.
- Cancel is allowed exactly where the TRD says (REQUESTED, OPEN, ACCEPTED). A cancel after ACCEPTED is logged with
  `flagged_for_review` and shows in `GET /admin/shifts?flagged=true`. A worker cancelling a REQUESTED shift is recorded as
  a cancel; the clean path for that is `decline`.

## Business rules the TRD left open

- **D-14 Verified minutes are floored** to whole minutes (a worker is not billed for a partial minute), then rounded up
  to 15 and capped at scheduled + 30, as specified.
- **D-15 Check-in window.** `arrive` is allowed from 60 minutes before the start time. Arriving again while ARRIVED
  re-issues the Start OTP (unless locked), so a client who lost the code is not stuck.
- **D-16 No minimum charge.** A job ended within the first minute bills 0.00. Add a minimum in `closeTimesheet` if wanted.
- **D-17 Privacy before acceptance.** A worker sees distance, pay preview and skill, but not the street address or
  coordinates, until they accept.
- **D-18 "Within range" for DIRECT booking** means: the worker is online (instant bookings only) and within 10 km of the
  job when their location is known. Scheduled bookings do not require the worker to be online or nearby right now.
  `GET /workers/nearby` defaults to `online=true`; pass `online=false` for scheduled booking screens.
- **D-19 Going online** also requires an hourly rate and at least one skill (an approved worker without a rate cannot be priced).
- **D-20 Approving a worker needs at least one KYC document** (409 `KYC_MISSING`).
- **D-21 OPEN mode price** is the client's offered `hourly_rate` (there is no worker rate to derive it from). For DIRECT the
  client-sent rate is ignored. Broadcast goes to up to 50 online, verified, skill-matching workers within 10 km.
- **D-22 Mock-location detection** relies on the flags the app sends (`mocked`, `accuracy_m` above 200 m are rejected);
  the server cannot detect spoofing on its own.
- **D-23 Time zones.** All timestamps are UTC. "Today/this week/this month" in earnings use the database's UTC boundaries.
- **D-24 Phone/role input.** 10-digit Indian mobiles are normalised to `+91...`; roles `customer` and `professional`
  (the prototype's words) are accepted as aliases of `client` and `worker`. One phone number can hold only one role.
- **D-25 End OTP** is an Attendance-layer concept with no status of its own: the shift stays IN_PROGRESS until the End OTP is
  accepted. `pending_otp: "start" | "end" | null` on the shift tells the client app which code to show.
- **D-12 OTP delivery.** Only the `console` provider is implemented. `firebase` and `msg91` are valid values in the schema,
  but selecting one makes the server refuse to start with a clear message rather than silently not sending codes. In
  production the login OTP is still printed by `console`, so a real provider must be added before launch.
- **D-13 ETA** uses OpenRouteService when `ORS_API_KEY` is set, with a straight-line (x1.3, 25 km/h) fallback so the
  tracking screen never hard-fails; the response says which `source` was used.
- **Shift OTP delivery:** the code is sent over Socket.IO and as a push body to the client only. The persisted
  notification row says "Your start code is ready" without the code, and the code is never written to Postgres.

## Known gaps (not built, by scope)

Mobile apps and admin web UI (M8, M10, M11, M13 front ends); real worker payouts (finance marks them settled by hand,
section 2); Razorpay webhooks and refunds; SMS/Firebase/MSG91 OTP delivery; masked calling/chat; QR check-in and
reminders (stretch); saved client addresses and the prototype's flat 50 service fee (see `frontend-integration.md`);
a minimum charge; multi-instance realtime.
