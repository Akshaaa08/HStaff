# H-Staff

On-demand hourly staffing marketplace: clients book verified workers by the hour, attendance is proven with
geofence + OTP, hours are billed from a server-side timesheet, and payment is split into worker payout and
platform commission.

This repository contains the complete full-stack project:
- **`backend/`**: Express + TypeScript API, Socket.IO realtime layer, Knex migrations, seeds, test suites
- **`frontend/`**: Vite + TanStack Start + React 19 mobile-first client application
- **`docs/openapi.yaml`**: API reference (served at `/docs`)
- **`SETUP_GUIDE.md`**: Complete step-by-step setup guide for Docker, Redis, Neon, Supabase, Razorpay & Android Studio
- **`updates.md`**: Living project tracker documenting completed milestones and architectural progress
- **`docker-compose.yml`**: Full-stack multi-container orchestration (PostgreSQL+PostGIS, Redis, API, and Frontend)

```
backend/             Express + TypeScript API, Socket.IO, cron jobs, migrations, seeds, tests
frontend/            Vite + React 19 mobile-first application & typed API client
SETUP_GUIDE.md       Step-by-step guide: Docker, Redis, Neon, Supabase, Android Studio
updates.md           Project progress, milestone tracker, and changelog
docker-compose.yml   Postgres+PostGIS, Redis, API, and Frontend web app
```

## Run it

### Option 1: Docker (One command for all 4 services)

```bash
docker compose up --build
# Backend API:    http://localhost:4000
# OpenAPI Docs:   http://localhost:4000/docs
# Health Check:   curl http://localhost:4000/health
# Frontend App:   http://localhost:5173
```

### Option 2: Local Development (Windows / Node)

Run both Backend and Frontend concurrently:
```powershell
.\run-dev.ps1
```

Or from the repository root:
```bash
npm run dev:backend    # Starts API on :4000
npm run dev:frontend   # Starts Frontend on :5173
```

Needs Node >= 20.12, PostgreSQL 16 with PostGIS, Redis.

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, REDIS_URL, secrets, NOMINATIM_USER_AGENT
npm install
npm run migrate && npm run seed
npm run dev                 # http://localhost:4000
```

## Seed data (development only)

| Who                                                                 | Login                                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Client "Akshaa"                                                     | phone `+919000000001`, role `client`                                                                       |
| Worker Sunita Patil (Cleaning, 250/h, verified, online, Pune Baner) | phone `+919000000002`, role `worker`                                                                       |
| Worker Rahul Shinde (Electrical, 300/h, verified, online)           | phone `+919000000003`, role `worker`                                                                       |
| Worker awaiting verification                                        | phone `+919000000004`, role `worker`                                                                       |
| Admins                                                              | `super@`, `verifier@`, `finance@`, `support@hstaff.dev`, password `Admin@12345` (or `SEED_ADMIN_PASSWORD`) |

With `OTP_PROVIDER=console` the login code is printed in the server log:
`[OTP:console] login code for +91******0001 is 587953`.

### A 60-second tour with curl

```bash
API=localhost:4000/api/v1
curl -s -XPOST $API/auth/otp/request -H 'content-type: application/json' -d '{"phone":"9000000001","role":"client"}'
# read the code from the server log, then:
curl -s -XPOST $API/auth/otp/verify -H 'content-type: application/json' -d '{"phone":"9000000001","otp":"<code>","role":"client"}'
# use data.access_token as: -H "Authorization: Bearer <token>"
curl -s "$API/workers/nearby?lat=18.559&lng=73.7868&skill=Cleaning" -H "Authorization: Bearer <token>"
```

The full booking lifecycle (create, accept, arrive, start OTP, end OTP, approve, pay, review) is exercised end to
end in `backend/tests/integration/shifts.test.ts` and `settlement.test.ts`; read them as executable documentation.

## Configuration

See `backend/.env.example`. The server refuses to start if a required variable is missing, and in production also
rejects example secrets and requires Supabase credentials. Commission %, geofence radius, request TTL and approval
SLA are env defaults that super admins can override at runtime (`PUT /api/v1/admin/config`).

| Switch             | Values                            | Notes                                                                                             |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `PAYMENT_PROVIDER` | `simulated` (default), `razorpay` | Razorpay creates real orders and verifies the HMAC signature                                      |
| `OTP_PROVIDER`     | `console`                         | `firebase` / `msg91` are accepted by the schema but not implemented (D-12); the server fails fast |
| Supabase keys      | optional in development           | Without them uploads go to `backend/.local-storage`                                               |
| `ORS_API_KEY`      | optional                          | Without it ETAs are straight-line estimates                                                       |

## Quality gates

```bash
cd backend
npm run typecheck && npm run lint
npm test            # 143 tests: unit + integration against real Postgres/PostGIS and Redis
npm run build
```

Integration tests need Postgres and Redis (`docker compose up postgres redis`) and rebuild `hstaff_test` from the
real migrations on every run (override with `TEST_DATABASE_URL`, `TEST_REDIS_URL`). A test also fails if any
Express route is missing from `docs/openapi.yaml`.

## Deploy (Render + Neon + Upstash + Supabase)

1. Neon: create a database, enable PostGIS (`CREATE EXTENSION postgis;`), use the pooled URL with `?sslmode=require`.
2. Upstash: create a Redis database and use its `rediss://` URL.
3. Supabase: create two buckets, `kyc-documents` (private) and `profile-photos` (public); use the service-role key.
4. Render: new Web Service from this repo, Docker runtime, Dockerfile `backend/Dockerfile`, build context = repo root.
   Set the env vars from `.env.example` with `NODE_ENV=production` and real secrets. Health check path: `/health`.
   Migrations run on every boot. Seed once with `SEED_ADMIN_PASSWORD=<strong> npm run seed` (production seeds skills,
   config and the four admins only, never demo users).
5. Run a single instance: rate limiting and Socket.IO rooms are in-process (D-07).

## Security notes

Phone numbers and tokens are redacted in logs; OTPs live only in Redis and never in Postgres; KYC documents sit in
a private bucket and are only reachable through 5-minute signed URLs that verifiers must request (each view is
audited); refresh tokens are stored hashed with rotation and reuse detection; money never passes through a float.
