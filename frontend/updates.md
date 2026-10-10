# H-Staff Mobile App — Implementation Updates & Setup Guide

*Treat this document as the living tracker and operational guide for the H-Staff on-demand hourly staffing marketplace.*

---

## 1. Executive Summary & Architecture Overview

H-Staff is an on-demand hourly staffing marketplace designed strictly as a mobile-first native experience.
The application operates with two primary end-user mobile personas:
1. **Client (Customer / Business)**: Discovers nearby verified workers, books hourly shifts, verifies attendance via Start/End OTP and 150m geofence, reviews automated timesheets with 24h approval SLA, completes payments, and provides ratings.
2. **Worker (Gig Employee / Service Professional)**: Manages verification (KYC), toggles availability (online/offline gate), accepts/declines incoming shift dispatches, navigates en-route with live GPS tracking, completes arrival geofence validation, clocks in/out with 6-digit OTPs, tracks verified vs billable minutes, and monitors net payouts (gross minus 15% platform commission).

```
                      +-----------------------------+
                      |   H-Staff Mobile Engine     |
                      |   (Client & Worker Personas)|
                      +--------------+--------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
    [Client Flow]                                       [Worker Flow]
  * Instant / Scheduled                               * KYC Verification Gate
  * OpenStreetMap Picker                              * Online / Offline Toggle
  * Nearby Search & Filters                           * Shift Dispatch & Lock
  * Quote & DIRECT Booking                            * En-Route GPS Tracking
  * Start OTP & End OTP Display                       * Geofence Check (150m)
  * Timesheet Approval & SLA                          * Start & End OTP Input
  * Simulated / Razorpay Payment                      * Auto-Timesheet & Clock-Out
  * 2-Way Reviews & Ratings                           * Earnings & Payout Breakdown
```

---

## 2. Step-by-Step Environment Setup Guides

### A. Neon Setup (Serverless PostgreSQL + PostGIS)
Neon provides cloud PostgreSQL with instant branching and PostGIS support for geolocation calculations (`ST_DWithin`, `ST_Distance`).

1. **Create Account and Project**:
   - Navigate to [Neon](https://neon.tech) and sign up / log in.
   - Click **New Project**, name it `h-staff-db`, choose Postgres version **16**, and select your nearest region (e.g. `ap-southeast-1` or `eu-central-1`).
2. **Enable Required Extensions**:
   - In the Neon Console SQL Editor, execute:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     CREATE EXTENSION IF NOT EXISTS pgcrypto;
     ```
3. **Retrieve Database Connection String**:
   - Go to **Dashboard** -> **Connection Details**.
   - Copy the Pooled or Direct Connection String:
     ```env
     DATABASE_URL=postgres://<username>:<password>@<neon-hostname>/hstaff?sslmode=require
     ```
4. **Run Migrations**:
   - Apply the schema defined in `H-Staff-TRD.md` §7 containing `users`, `worker_profiles`, `skills`, `kyc_documents`, `shifts`, `shift_events`, `timesheets`, `payments`, `reviews`, `disputes`, `notifications`.

---

### B. Docker & Docker Compose Setup
For local offline development with PostgreSQL + PostGIS and Redis without cloud dependencies:

1. **Prerequisites**:
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows/macOS/Linux.
   - Ensure WSL 2 backend is enabled on Windows.
2. **`docker-compose.yml` Configuration**:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgis/postgis:16-3.4
       container_name: hstaff_postgis
       environment:
         POSTGRES_USER: hstaff
         POSTGRES_PASSWORD: hstaff_secret
         POSTGRES_DB: hstaff
       ports:
         - "5432:5432"
       volumes:
         - hstaff_pgdata:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U hstaff"]
         interval: 5s
         timeout: 5s
         retries: 5

     redis:
       image: redis:7-alpine
       container_name: hstaff_redis
       ports:
         - "6379:6379"
       volumes:
         - hstaff_redisdata:/data

   volumes:
     hstaff_pgdata:
     hstaff_redisdata:
   ```
3. **Start Containers**:
   ```bash
   docker compose up -d
   ```
4. **Verify Running State**:
   ```bash
   docker compose ps
   # Connect to PostgreSQL:
   docker exec -it hstaff_postgis psql -U hstaff -d hstaff -c "SELECT PostGIS_Version();"
   # Connect to Redis:
   docker exec -it hstaff_redis redis-cli ping  # Returns PONG
   ```

---

### C. Supabase Setup (KYC Storage & File Buckets)
Supabase Storage is utilized strictly for private KYC documents and public worker photos.

1. **Create Supabase Project**:
   - Go to [Supabase](https://supabase.com) and create project `h-staff`.
2. **Create Storage Buckets**:
   - In Supabase Dashboard, click **Storage** -> **New Bucket**:
     - `kyc-documents`: Set to **Private** (Restricted). Access only allowed via short-lived signed URLs generated on the server using service-role key.
     - `profile-photos`: Set to **Public** (Read-only public access).
3. **Retrieve Credentials**:
   - Go to **Project Settings** -> **API**.
   - Copy `Project URL` -> `SUPABASE_URL`.
   - Copy `service_role` secret (server-side only, never leak to client) -> `SUPABASE_SERVICE_ROLE_KEY`.
4. **Configure Environment**:
   ```env
   SUPABASE_URL=https://<project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   SUPABASE_KYC_BUCKET=kyc-documents
   SUPABASE_PUBLIC_BUCKET=profile-photos
   ```

---

### D. Android Studio & Android Mobile Setup
To run, emulate, and package H-Staff as a native Android application:

1. **Install Android Studio**:
   - Download [Android Studio Hedgehog / Iguana / Ladybug](https://developer.android.com/studio).
   - In the SDK Manager, install:
     - Android SDK Platform 34 / 35 (Android 14 / 15)
     - Android SDK Build-Tools
     - Android Emulator & Intel/AMD Hardware Acceleration Execution Manager (HAXM / AEHD)
2. **Configure Environment Variables (Windows PowerShell / System)**:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   [System.Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
   ```
3. **Create Android Virtual Device (AVD)**:
   - In Android Studio, open **Device Manager** -> **Create Virtual Device**.
   - Select **Pixel 7** or **Pixel 8**, System Image **API 34 (Google Play x86_64)**.
   - Click Finish and Start the emulator (`emulator -avd Pixel_8_API_34`).
4. **Expo / React Native Workflow**:
   - For Expo native testing:
     ```bash
     npx expo start --android
     ```
   - For standalone Android APK build (EAS Build):
     ```bash
     npm install -g eas-cli
     eas login
     eas build -p android --profile preview
     ```

---

### E. How to Run and Test This Project Locally

1. **Development Server**:
   ```bash
   npm run dev
   # Opens local mobile view at http://localhost:5173
   ```
2. **Running Automated Tests**:
   ```bash
   npm run test
   ```
3. **Linting & Code Quality**:
   ```bash
   npm run lint
   ```

---

## 3. Implemented Modules & Status

| Module | Scope | Status | Notes |
|---|---|---|---|
| **M0: Foundation** | Shared architecture, token styles, mobile shell | Completed | Fluid mobile shell simulating Android blueprint |
| **M1: Auth & Users** | Phone OTP flow, role check, session recovery | Completed | 6-digit OTP verification, local session sync |
| **M2: Worker KYC & Profile** | Multi-step setup, document upload, KYC status gate | Completed | Verification gate blocks going online if pending |
| **M3: Skills & Geo** | 15 skill categories, OpenStreetMap picker, filters | Completed | Distance sorting, geofence radius visualizer |
| **M4: Shift Engine** | DIRECT booking, state machine, reassign, cancel | Completed | Instant vs scheduled, quotes, Redis-lock simulator |
| **M5: Attendance & Geofence** | 150m geofence check, Start OTP, End OTP, timer | Completed | Strict arrival validation, live time tracking |
| **M6: Timesheet & Payments** | Automated 15-min rounding, 15% commission, SLA | Completed | Gross/commission/payout, simulated gateway |
| **M7: 2-Way Reviews** | Client rates worker, Worker rates client, tags | Completed | Star ratings, feedback tags, audit status |

---

*Last Updated: 2026-10-09*
