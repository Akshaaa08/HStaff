# H-Staff — Comprehensive API, Storage & Android Setup Guide

This guide provides step-by-step instructions for configuring all external APIs, data stores, containerization tools, and mobile developer environments required to run, develop, and deploy **H-Staff**.

---

## Table of Contents
1. [Architecture & Services Overview](#1-architecture--services-overview)
2. [Docker & Containerized Stack Setup](#2-docker--containerized-stack-setup)
3. [Redis (Local & Upstash)](#3-redis-local--upstash)
4. [Neon (PostgreSQL + PostGIS)](#4-neon-postgresql--postgis)
5. [Supabase Storage (KYC & Profile Photos)](#5-supabase-storage-kyc--profile-photos)
6. [Payment Gateways (Razorpay & Simulated)](#6-payment-gateways-razorpay--simulated)
7. [Geocoding & Routing (Nominatim & OpenRouteService)](#7-geocoding--routing-nominatim--openrouteservice)
8. [Android Mobile Developer Setup (Studio, Emulator & Packaging)](#8-android-mobile-developer-setup)
9. [Running Frontend & Backend Together](#9-running-frontend--backend-together)

---

## 1. Architecture & Services Overview

H-Staff consists of:
- **Frontend**: Vite + TanStack Start + React 19 + Tailwind CSS mobile-first web app (ports `5173`).
- **Backend API**: Express + TypeScript + Socket.IO realtime server (port `4000`, routes at `/api/v1`).
- **Database**: PostgreSQL 16 with **PostGIS** geospatial extensions.
- **Cache / Ephemeral Store**: **Redis** for OTPs, rate-limiting, and geo-locks.
- **Object Storage**: Supabase Storage (or local-disk fallback in development).
- **Mobile Target**: Native Android APK/AAB or Android WebView/Capacitor shell.

---

## 2. Docker & Containerized Stack Setup

Docker allows launching PostgreSQL with PostGIS, Redis, the backend API, and the frontend web app with a single command.

### 2.1 Prerequisites
1. Install **Docker Desktop for Windows** from [docker.com](https://www.docker.com/products/docker-desktop/).
2. In Windows Settings:
   - Ensure **WSL 2 (Windows Subsystem for Linux)** is enabled (`wsl --install` in PowerShell).
   - In Docker Desktop Settings: Check **Use the WSL 2 based engine**.
3. Launch Docker Desktop and wait until the whale icon in the taskbar turns solid green.

### 2.2 Orchestration via `docker-compose.yml`
The root `docker-compose.yml` defines 4 interconnected services:
- `postgres`: `postgis/postgis:16-3.4` with health check on `5432`.
- `redis`: `redis:7-alpine` with health check on `6379`.
- `api`: Express API with automatic migration & idempotent seed execution on `4000`.
- `frontend`: Vite application container on `5173`.

### 2.3 Running the Entire Stack
```bash
# Build images and start all services in foreground
docker compose up --build

# Or start in detached background mode
docker compose up -d --build

# Inspect container status
docker compose ps

# View real-time logs
docker compose logs -f api
docker compose logs -f frontend
```

### 2.4 Verifying the Running Containers
```bash
# Check Backend Health (must return status: ok, db: true, redis: true)
curl http://localhost:4000/health

# Access Swagger OpenAPI UI
start http://localhost:4000/docs

# Access the Frontend App
start http://localhost:5173
```

### 2.5 Stopping Containers
```bash
docker compose down
# To also delete PostgreSQL data volume and start fresh:
docker compose down -v
```

---

## 3. Redis (Local & Upstash)

H-Staff requires Redis for:
1. **Ephemeral OTP Storage**: 6-digit verification codes for login, shift start, and shift end with tight TTLs (e.g. 5–10 minutes) that auto-expire.
2. **Rate Limiting**: Sliding window rate limits via `express-rate-limit`.
3. **Worker Geospatial Locks**: Preventing duplicate shift acceptance and race conditions during instant dispatch.

### 3.1 Option A: Local Redis (via Docker)
If running local Docker:
```bash
docker run -d --name hstaff_redis -p 6379:6379 redis:7-alpine
```
Set in `backend/.env`:
```env
REDIS_URL=redis://localhost:6379
```
Verify the connection:
```bash
docker exec -it hstaff_redis redis-cli ping
# Expected output: PONG
```

### 3.2 Option B: Upstash Redis (Cloud / Serverless)
For remote or cloud-hosted deployments:
1. Sign up at [upstash.com](https://upstash.com).
2. Click **Create Database**:
   - Name: `hstaff-redis`
   - Region: Select nearest region (e.g. `ap-southeast-1` or `eu-central-1`).
   - Eviction: Enable `noeviction` or `volatile-lru`.
3. Copy the **Redis URL** under the **Connect** tab (starts with `rediss://default:...`).
4. Update `backend/.env`:
   ```env
   REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379
   ```

---

## 4. Neon (PostgreSQL + PostGIS)

[Neon](https://neon.tech) is a serverless PostgreSQL platform offering instant autoscaling, branching, and native PostGIS support.

### 4.1 Creating the Neon Database
1. Go to [neon.tech](https://neon.tech) and log in.
2. Click **New Project**:
   - Name: `hstaff-production` (or `hstaff-dev`)
   - PostgreSQL Version: **16**
   - Cloud & Region: AWS, closest to your users (e.g., Singapore `ap-southeast-1` for India/Maharashtra).
3. Click **Create Project**.

### 4.2 Enabling PostGIS Extension
PostGIS provides spatial functions (`ST_DWithin`, `ST_Distance`, `ST_MakePoint`) for worker discovery within a 150m geofence radius.
1. Open the **SQL Editor** tab in Neon console.
2. Run the following queries:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   
   -- Verify PostGIS installation:
   SELECT PostGIS_Full_Version();
   ```

### 4.3 Configuring Database Connection
1. In Neon Dashboard, navigate to **Dashboard** -> **Connection Details**.
2. Select **Pooled connection** (recommended for Node.js / serverless connection management).
3. Copy the URI and set in `backend/.env`:
   ```env
   DATABASE_URL=postgres://<user>:<password>@<neon-host>-pooler.<region>.aws.neon.tech/neondb?sslmode=require
   ```

### 4.4 Running Migrations & Seeding
From the `backend/` directory:
```bash
cd backend
npm run migrate   # Applies all 8 tables, PostGIS indexes, and triggers
npm run seed      # Seeds skills, default configurations, and demo users
```

---

## 5. Supabase Storage (KYC & Profile Photos)

H-Staff requires object storage for worker verification documents (Aadhaar, PAN, Voter ID) and public worker profile photos.

### 5.1 Local-Disk Fallback (Zero Setup in Development)
When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not configured in `NODE_ENV=development`, the backend automatically falls back to local storage inside `backend/.local-storage`. No Supabase account is required to test!

### 5.2 Production Supabase Setup
1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase Dashboard, go to **Storage** -> **Create New Bucket**:
   - **`kyc-documents`**:
     - Visibility: **Private** (Restricted).
     - Reason: Identity documents must never be public. The backend generates audited, short-lived 5-minute signed URLs for verified administrators only.
   - **`profile-photos`**:
     - Visibility: **Public** (Read-only public access).
3. Retrieve credentials from **Project Settings** -> **API**:
   - `Project URL` -> `SUPABASE_URL`
   - `service_role` secret (never reveal to client apps) -> `SUPABASE_SERVICE_ROLE_KEY`
4. Set in `backend/.env`:
   ```env
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   SUPABASE_KYC_BUCKET=kyc-documents
   SUPABASE_PUBLIC_BUCKET=profile-photos
   ```

---

## 6. Payment Gateways (Razorpay & Simulated)

### 6.1 Simulated Mode (Default)
In development, `PAYMENT_PROVIDER=simulated` allows simulating instant successful and failed payments without incurring real charges.
```env
PAYMENT_PROVIDER=simulated
```

### 6.2 Razorpay Setup (Real INR Payments)
1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Generate API Keys in **Settings** -> **API Keys** (Test Mode).
3. Copy **Key Id** and **Key Secret**.
4. Configure in `backend/.env`:
   ```env
   PAYMENT_PROVIDER=razorpay
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYYYYYYYYYY
   ```
5. Flow:
   - Client calls `POST /api/v1/payments/shifts/:id/order` to create Razorpay Order.
   - Razorpay Checkout modal handles payment on client.
   - Client calls `POST /api/v1/payments/verify` with `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`.
   - Backend verifies signature using HMAC SHA256 and updates shift to `PAID`.

---

## 7. Geocoding & Routing (Nominatim & OpenRouteService)

### 7.1 OpenStreetMap / Nominatim (Geocoding)
Used for reverse-geocoding coordinates to street addresses.
- According to Nominatim's Usage Policy, an identifiable User Agent must be supplied:
  ```env
  NOMINATIM_USER_AGENT=hstaff-dev (support@hstaff.com)
  ```

### 7.2 OpenRouteService (ORS) (Real Road Distance & ETA)
Used for calculating road transit distance and en-route ETA when a worker is traveling to a shift.
1. Sign up at [openrouteservice.org](https://openrouteservice.org/dev/#/signup).
2. Request a free token in **Dashboard** -> **Tokens**.
3. Set in `backend/.env`:
   ```env
   ORS_API_KEY=5b3ce3597851110001cf6248...
   ```
*(Note: If omitted, the backend falls back to great-circle Haversine straight-line estimates).*

---

## 8. Android Mobile Developer Setup

H-Staff is designed as a mobile-first native experience. You can run and test H-Staff as a native Android application using Android Studio and Capacitor.

### 8.1 Installing Android Studio
1. Download **Android Studio** (Hedgehog, Iguana, or Ladybug) from [developer.android.com/studio](https://developer.android.com/studio).
2. Run installer and choose **Standard Setup**.
3. Open **SDK Manager** (**Tools** -> **SDK Manager**):
   - Under **SDK Platforms**: Check **Android 14.0 (API 34)** or **Android 15.0 (API 35)**.
   - Under **SDK Tools**: Check:
     - Android SDK Build-Tools 34.0.0
     - Android SDK Command-line Tools (latest)
     - Android Emulator
     - Intel x86 Emulator Accelerator (HAXM) or Android Emulator Hypervisor Driver

### 8.2 Environment Variables Setup (Windows)
Open PowerShell as Administrator and run:
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
[System.Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
```
Close and reopen your terminal. Verify with:
```bash
adb --version
```

### 8.3 Creating an Android Virtual Device (AVD)
1. In Android Studio, open **Device Manager** -> **Create Device**.
2. Select Hardware: **Pixel 7** or **Pixel 8**.
3. Select System Image: **UpsideDownCake (API 34, Google Play, x86_64)**.
4. Name the emulator `Pixel_8_API_34` and click **Finish**.
5. Launch the emulator by clicking the green **Play** button or via command line:
   ```bash
   emulator -avd Pixel_8_API_34
   ```

### 8.4 Packaging H-Staff for Android with Capacitor
To wrap the frontend in a native Android shell:

1. In the `frontend` folder, install Capacitor:
   ```bash
   cd frontend
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

2. Initialize Capacitor:
   ```bash
   npx cap init "H-Staff" "dev.hstaff.app" --web-dir .output/public
   ```

3. Build the frontend and add the Android platform:
   ```bash
   npm run build
   npx cap add android
   ```

4. **Network Configuration for Android Emulator**:
   - The Android Emulator sees the host computer's `localhost` as `10.0.2.2`.
   - In `frontend/capacitor.config.json` (or `capacitor.config.ts`), set:
     ```json
     {
       "appId": "dev.hstaff.app",
       "appName": "H-Staff",
       "webDir": ".output/public",
       "server": {
         "cleartext": true,
         "url": "http://10.0.2.2:5173"
       }
     }
     ```

5. **Android Permissions**:
   In `frontend/android/app/src/main/AndroidManifest.xml`, ensure the following permissions are present inside `<manifest>`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
   ```

6. Open in Android Studio and Run:
   ```bash
   npx cap open android
   ```
   In Android Studio, click **Run 'app'** (green play icon) to deploy and run directly on your connected device or emulator!

---

## 9. Running Frontend & Backend Together

### 9.1 Local Native Development (Recommended)

1. **Install Dependencies**:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Launch with PowerShell One-Liner (Windows)**:
   ```powershell
   .\run-dev.ps1
   ```
   This automatically checks environment files and starts both:
   - Backend on `http://localhost:4000`
   - Frontend on `http://localhost:5173`

3. **Or launch manually in separate terminals**:
   - Terminal 1: `cd backend && npm run dev`
   - Terminal 2: `cd frontend && npm run dev`

### 9.2 Complete Docker One-Command Launch
```bash
docker compose up --build
```
Everything (PostgreSQL, Redis, migrations, seed data, API, and Frontend) will be available simultaneously!
