# HStaff — Architecture Correction Notice

## Product clients

HStaff requires:
- **Customer Android app:** native Kotlin + Jetpack Compose.
- **Worker Android app:** native Kotlin + Jetpack Compose.
- **Admin portal:** separate React + TypeScript web application.
- **Shared backend:** Node.js + Express + TypeScript.
- **Data services:** PostgreSQL 16 + PostGIS and Redis.

A mobile-responsive web page is not the Android app. React Native/Expo and Capacitor/WebView are not acceptable replacements for the required native Android apps.

## Current repository status must be described accurately

The existing Docker Compose setup starts the configured backend, database, Redis and existing `frontend/` web service. It does not automatically create or compile Kotlin Android apps. Do not state that Android apps are implemented until `android/client-app` and `android/worker-app` contain buildable Gradle projects and have been tested on Android devices.

Use `HStaff-TRD-CORRECTED.md` as the product/architecture source of truth and `HStaff-SETUP-GUIDE-CORRECTED.md` for local setup. Keep the current `frontend/` directory until it has been audited; determine whether it should become `admin-web/` before moving or deleting files.
