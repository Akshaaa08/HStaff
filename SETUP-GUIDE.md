# HStaff — Corrected Setup Guide (Native Android + Admin Web)

## Important: what this repository must run

HStaff requires three application clients/components:
1. **Native customer Android app:** Kotlin + Jetpack Compose.
2. **Native worker Android app:** Kotlin + Jetpack Compose.
3. **Separate admin web app:** React + TypeScript.

The shared backend is Node.js + Express + TypeScript, backed by PostgreSQL + PostGIS and Redis.

The current Docker Compose setup builds the backend and the existing `frontend/` web app plus PostgreSQL and Redis. It does **not**, by itself, prove that native Android apps exist. Android Studio/Gradle builds Android APKs; Docker is for the backend, database, Redis and any web services. Do not use Capacitor, React Native, Expo or a WebView as a substitute for the native apps.

## A. Start the current backend and web services

### 1. Prerequisites
- Git
- Docker Desktop for Windows, started and showing the engine is running
- VS Code
- Android Studio is not needed to start the existing Docker services; it is needed for native Android development.

Verify:

```powershell
git --version
docker --version
docker compose version
docker info
```

### 2. Open the repository
Open PowerShell and navigate to the actual local repository folder, for example:

```powershell
cd C:\Akshaa\codes\hstaff\HStaff
```

Verify the Compose file exists:

```powershell
Test-Path .\docker-compose.yml
```

Expected: `True`.

### 3. Inspect before building
Check `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore` and `frontend/.dockerignore`. The Docker build images must use a Node.js version compatible with the dependencies' `engines` fields and lockfile. Do not blindly change package versions or regenerate lockfiles.

If a dependency requires Node >=22 and the Dockerfile uses Node 20, update each relevant Node image stage to a compatible supported version (Node 24 is consistent with the developer's installed Node 24.15.0), preserving all other Dockerfile instructions.

Ensure `.dockerignore` excludes at least `.git`, `node_modules`, build outputs and caches where applicable, so the frontend build context does not transfer hundreds of megabytes unnecessarily.

### 4. Check npm registry connectivity if dependency install fails

```powershell
npm.cmd ping
curl.exe -I https://registry.npmjs.org/undici-types
```

If the build reports `ECONNRESET`, retry after confirming internet connectivity. Do not change registry or proxy settings unless diagnostics show they are needed.

### 5. Build and start the existing Compose services

```powershell
docker compose up --build
```

Leave this terminal open. In a second terminal:

```powershell
cd C:\Akshaa\codes\hstaff\HStaff
docker compose ps
docker compose logs --tail 100 api
```

Health check:

```powershell
curl.exe http://localhost:4000/health
```

The existing web frontend may be available at `http://localhost:5173` and API docs at `http://localhost:4000/docs`, depending on current Compose configuration.

Stop foreground Compose with `Ctrl+C`; to stop containers/network use:

```powershell
docker compose down
```

Do not use `docker compose down -v` unless you intentionally want to delete the database volume.

**Important:** Treat the existing `frontend/` as the current web frontend until its routes are inspected. Do not assume it is already the admin portal. Do not claim this step has launched an Android app.

## B. Set up native Android development

### 1. Install Android Studio
Download Android Studio from the official Android developer website and install the current stable release. In the setup wizard, install the Android SDK, platform tools, emulator and a compatible JDK. Use the versions recommended by the installed Android Studio/Android Gradle Plugin. Record versions in the Android project's Gradle files.

### 2. Create/open the native Android project
The target repository layout is:

```text
android/
  client-app/   # native customer Android app
  worker-app/   # native worker Android app
```

If these projects do not exist yet, they must be created as native Android Studio/Gradle projects using Kotlin and Jetpack Compose (Material 3). Do not initialize Capacitor or a WebView shell.

For each app:
1. Open Android Studio.
2. Create/open the corresponding Gradle project.
3. Let Gradle sync complete.
4. Select an emulator or connected Android phone.
5. Run the app and verify that a native Compose screen launches.
6. Build a debug APK only after Gradle sync and compilation succeed.

Example build command from a native project root (the root must contain `gradlew.bat`):

```powershell
.\gradlew.bat assembleDebug
```

The output is usually under `app\build\outputs\apk\debug\app-debug.apk`, but verify the actual module and output path.

### 3. Configure API base URL
- Android emulator → host machine: commonly `http://10.0.2.2:4000` for a locally published API.
- Physical Android phone: use the development computer's LAN IP and ensure Windows Firewall permits the connection, or use an HTTPS development deployment.
- Production: use the deployed HTTPS API URL.

Use a build-variant/configuration value for the base URL. Do not hard-code one developer's LAN IP in source control. Never place server-side secrets in the Android app.

### 4. Android capabilities
Implement using native Android APIs/libraries:
- Compose navigation and Material 3 UI
- Kotlin ViewModels, StateFlow, coroutines and repositories
- Retrofit/OkHttp and Kotlin serialization for API calls
- Secure token storage backed by Android Keystore
- Runtime permission handling for location, photos/documents and notifications
- FCM for push notifications
- An OpenStreetMap-compatible native Android map library selected and documented in `docs/decisions.md`; no Google Maps SDK
- Foreground location only for the MVP; no background tracking

### 5. Test the actual native apps
Test customer and worker flows separately on an emulator and physical phone. A website that happens to fit a phone screen does not count as the native Android app. A WebView/Capacitor wrapper does not satisfy the requirement.

## C. Required follow-up repository correction

Before claiming HStaff is fully set up:
1. Replace the conflicting technology descriptions in README and setup docs with this architecture.
2. Audit the existing `frontend/` and decide whether it is to become the admin portal; do not silently relabel or delete it.
3. Add native Kotlin/Compose projects under `android/client-app` and `android/worker-app`.
4. Keep the API contract in `docs/openapi.yaml` as the contract shared across TypeScript and Kotlin.
5. Add acceptance tests for both Android apps and the admin web.
6. Track each feature honestly as implemented, partial, planned or not implemented.
