# 🏡 H-Staff (Hourly) — On-Demand Domestic Staffing Platform

> **Live Backend API**: `https://hourly-fxya.onrender.com/api/v1`  
> **Android APK Release**: [Download `h-staff-v1.0.0.apk`](https://expo.dev/artifacts/eas/TxNOa_lGYgmnMQgjg1pjx_S1Fxeyod6PtZqszFp-aiU.apk) *(or local file `react-native/Hourly/h-staff-v1.0.0.apk`)*

H-Staff is a production-grade, on-demand domestic staff booking application connecting homeowners across Maharashtra with 100% ID-verified domestic professionals (Cleaning, Cooking, Gardening, Electrical, Plumbing, Driver, and Elderly Care) on transparent hourly rates.

---

## 📚 Complete Documentation
For the complete technical breakdown, routing tables, and lifecycle state machines:
👉 **[Read the Master System Architecture & Route Guide](./SYSTEM_ARCHITECTURE.md)**

---

## 📁 Repository Structure

```
hstaff/
├── backend/
│   └── hourly/                 # NestJS 11 REST API with Firestore & Passport JWT
│       ├── src/
│       │   ├── modules/        # auth, bookings, payments, workers, services, notifications
│       │   └── firebase/       # Firestore engine & seed data
│       └── Dockerfile          # Production container setup for Render cloud
│
├── react-native/
│   └── Hourly/                 # React Native Mobile App (Expo SDK 57)
│       ├── src/
│       │   ├── app/            # Screen router & root navigation
│       │   ├── screens/        # 20 role-isolated screens (Client funnels & Worker dashboard)
│       │   ├── components/     # Leaflet map bridge, gradient buttons, status chips
│       │   ├── context/        # AppContext state machine & live syncing
│       │   └── services/       # Typed backend API client
│       ├── assets/             # Brand logos, adaptive icon, and splash screen
│       └── h-staff-v1.0.0.apk  # Compiled standalone Android APK
│
└── SYSTEM_ARCHITECTURE.md       # Full Tech Stack, Routes, Auth & System Design specification
```

---

## ⚡ Quick Start

### 1. Backend Service
```bash
cd backend/hourly
npm install
npm run build
npm run start:prod
# Runs at http://localhost:4000
```

### 2. React Native App
```bash
cd react-native/Hourly
npm install
npm start
# Press 'a' for Android emulator, 'w' for web preview, or scan QR with Expo Go
```
