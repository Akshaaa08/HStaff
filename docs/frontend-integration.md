# Wiring the Lovable prototype to this API

The prototype (`lovable-project-*.zip`) keeps all state in memory and uses its own vocabulary. This is how each
piece maps onto the backend. Base URL `/api/v1`, bearer token on everything except the public routes.

## Vocabulary

| Prototype | API |
|---|---|
| `customer` / `professional` persona | `client` / `worker` (aliases accepted on login) |
| `Instant` / `Scheduled` | `is_instant: true` (+ `duration_minutes`) / `start_at` + `end_at` or `duration_minutes` |
| `professionals[]` mock list | `GET /workers/nearby?lat&lng&skill&radius&minRating&maxRate&sort` |
| 15 service categories | `GET /skills` (same names, public) |
| `jobs`, `years`, `rate`, `rating` | `jobs_completed`, `experience_years`, `hourly_rate` (string), `rating_avg` |
| `distance` (km) | `distance_m` (metres) |
| `ontime`, `languages` | not stored by the backend |

## Booking status mapping

| Prototype `BookingStatus` | Backend |
|---|---|
| `DRAFT`, `OPEN` ("Ready to request") | client-side only, before `POST /shifts`. Note: backend `OPEN` means the stretch OPEN-broadcast mode |
| `REQUESTED` | `REQUESTED` |
| `ACCEPTED` then `CONFIRMED` | one status: `ACCEPTED` |
| `EN_ROUTE`, `ARRIVED`, `IN_PROGRESS` | same |
| `COMPLETED_PENDING_PAYMENT` ("Completion requested") | `IN_PROGRESS` with `pending_otp: "end"`; after the End OTP the backend status is `AWAITING_APPROVAL` |
| (no equivalent) | `AWAITING_APPROVAL`: client reviews the timesheet, `POST /shifts/:id/approve` (auto-approves after 24 h) |
| `PAYMENT_PENDING` | `APPROVED` (create order, `POST /payments/shifts/:id/order`) |
| `FAILED` (payment) | shift stays `APPROVED`; the payment row is `FAILED`; create a new order to retry |
| `PAYMENT_COMPLETED`, `CLOSED` | `PAID` |
| `DECLINED`, `EXPIRED` | same, then `POST /shifts/:id/reassign` ("Find someone else") |
| `CANCELLED`, `DISPUTED` | same |

## Screen by screen

- **Login:** `POST /auth/otp/request` then `/auth/otp/verify`. The prototype's fixed `123456` becomes the real code
  (server log in development). Customer email/password and Google sign-in are not in the TRD; the backend is phone-OTP only.
  Sign-up extras: `name` goes on verify; `age`, `upi_id`, `email`, skills, rate via `PUT /workers/me`; selfie/ID via
  `POST /workers/me/kyc`. A new worker is `PENDING` and cannot go online until a verifier approves them.
- **Find a professional:** `GET /workers/nearby`. Booking review price: `GET /shifts/quote?workerId&duration_minutes`.
- **Create booking:** `POST /shifts` (DIRECT). The server decides the price; do not send one.
- **Professional "incoming requests":** `GET /workers/me/shifts?status=incoming`, plus realtime `shift:requested`.
  Accept/decline: `POST /shifts/:id/accept|decline`. The address is hidden until accepted.
- **Tracking:** join Socket.IO with `auth: { token }`; listen for `shift:updated`, `worker:location`, `shift:otp`,
  `timesheet:ready`, `notification:new`. ETA: `GET /geo/eta?shiftId=`.
- **Start/finish codes:** the worker taps "I've arrived" (`POST .../arrive` with GPS). The client sees the code via
  `shift:otp` or `GET /shifts/:id/otp`, reads it aloud, the worker enters it (`POST .../start`). To finish, the worker
  taps "Request completion" (`POST .../end-otp`), the client reads the second code, the worker enters it (`POST .../end`).
- **Payment:** with `PAYMENT_PROVIDER=simulated`, call `POST /payments/verify` with `{provider_order_id, result: "success" | "failure"}`
  (the "Try payment failure" button maps to `failure`).
- **Rating:** `POST /reviews` after `PAID`. **Report a problem:** `POST /shifts/:id/dispute`.
- **Earnings tab:** `GET /workers/me/earnings`. **Notifications:** `GET /notifications`.

## Things the prototype shows that the TRD does not specify

- A flat 50 service fee on top of the hourly charge (`priceFor`). The backend charges the gross timesheet amount only;
  the platform earns the commission taken from the worker's side. Adding a client fee is a small change in
  `closeTimesheet` and the quote, once product confirms it.
- Saved addresses, Google sign-in, in-app masked calling/chat, "on-time %" and languages on profiles.
- Cancelling while EN_ROUTE: the TRD allows cancel only before the worker is en route.
