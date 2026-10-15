# HStaff Hourly Backend API (NestJS + Firebase Firestore & Auth)

Complete enterprise backend service tailored for the **HStaff Hourly** React Native application. Powered by **NestJS**, **Firebase Admin SDK (Firestore & Firebase Auth)**, **Passport JWT**, and zero-crash architecture.

---

## 🌟 Architecture Overview

- **Framework:** NestJS (Node.js TypeScript)
- **Database:** Google Cloud Firestore (via `firebase-admin` with automatic seeding on first boot)
- **Authentication:** Firebase Authentication & Mobile OTP verification with JWT Bearer Token (`@nestjs/passport`, `passport-jwt`, `firebase-admin/auth`)
- **Zero-Crash Resilience:** Built-in in-memory Firestore engine ensures the backend runs out-of-the-box even before Google Cloud service account keys are provided.
- **Authorization:** Role-Based Access Control (`@Roles('client', 'worker', 'admin')`, `RolesGuard`)
- **Lifecycle Engine:** 17-state booking state machine with dual OTP verification (`startOtp`, `endOtp`)
- **Notification Delivery:** Dynamic OTPs dispatched straight to in-app user notifications for instant testing.

---

## 🚀 Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env` inside `backend/hourly`:

```bash
cp .env.example .env
```

To connect to your live Firebase Cloud project:
1. Go to [Firebase Console](https://console.firebase.google.com/) -> Project Settings -> **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Place this file inside `backend/hourly/firebase-service-account.json`.

*(If you don't have a Firebase project yet, the backend automatically runs in resilient local Firestore mode so development and testing never crash!)*

---

### 2. Run Locally

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm run start:prod
# Or in watch mode for development:
npm run start:dev
```

Server runs at: `http://localhost:4000`

---

## 🔐 Authentication & In-App OTP Flow

### Step 1: Request OTP
**`POST /api/v1/auth/request-otp`**
```json
{
  "phone": "9876543210",
  "role": "client"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone and notification tray.",
  "demoCode": "482915"
}
```

The 6-digit OTP is also pushed instantly into the user's Firestore notification stream, rendering an in-app banner on the React Native frontend with a "Tap to fill" button!

### Step 2: Verify OTP & Receive JWT / Firebase Token
**`POST /api/v1/auth/verify-otp`**
```json
{
  "phone": "9876543210",
  "otp": "482915"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "firebase_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": "usr_9876543210",
    "phone": "9876543210",
    "name": "Client User",
    "role": "client",
    "city": "Pune"
  }
}
```

Include this token in all subsequent requests:
```http
Authorization: Bearer <access_token>
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/health` | Server Health & Firebase Uptime | No |
| `POST` | `/api/v1/auth/request-otp` | Request dynamic 6-digit phone OTP | No |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP and obtain JWT + Firebase tokens | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/v1/services` | List all 15 pre-seeded service categories | No |
| `GET` | `/api/v1/services/:name` | Get service category details | No |
| `GET` | `/api/v1/workers` | Query verified workers (filter by `service`, `city`, `sort`) | No |
| `GET` | `/api/v1/workers/:id` | Get worker profile & credentials | No |
| `POST` | `/api/v1/bookings` | Create new booking (generates start/end OTPs) | Yes |
| `GET` | `/api/v1/bookings` | List user bookings (client or worker filtered) | Yes |
| `GET` | `/api/v1/bookings/:id` | Retrieve booking details | Yes |
| `PATCH` | `/api/v1/bookings/:id/status` | Update booking lifecycle status | Yes |
| `POST` | `/api/v1/bookings/:id/start-otp` | Worker verifies start OTP | Yes |
| `POST` | `/api/v1/bookings/:id/end-otp` | Worker verifies end OTP | Yes |
| `POST` | `/api/v1/bookings/:id/cancel` | Cancel booking | Yes |
| `POST` | `/api/v1/payments` | Process simulated transaction (UPI, Cards, Net Banking) | Yes |
| `GET` | `/api/v1/payments/booking/:id` | Get payment record for booking | Yes |
| `POST` | `/api/v1/reviews` | Submit star rating, tags & review comment | Yes |
| `GET` | `/api/v1/reviews/worker/:id` | Retrieve reviews for a worker | No |
| `GET` | `/api/v1/notifications` | Get user notifications list | Yes |
| `PATCH`| `/api/v1/notifications/:id/read` | Mark single notification as read | Yes |
| `POST` | `/api/v1/notifications/mark-all-read`| Mark all notifications as read | Yes |

---

## 📱 React Native Frontend Integration

The mobile application in [`react-native/Hourly`](../react-native/Hourly) connects dynamically:
- **Android Emulator:** Automatically connects to `http://10.0.2.2:4000/api/v1`
- **Physical Device:** Dynamically resolves your computer's Wi-Fi network host address via Expo `Constants.expoConfig.hostUri`.
- **Web / iOS:** Automatically connects to `http://localhost:4000/api/v1`
