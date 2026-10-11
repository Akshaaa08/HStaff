# HStaff — Native Android Application

HStaff is a native Android home-services platform built with **Kotlin**, **Jetpack Compose**, and **Material 3**.

---

## Project Structure

```
HStaff/
├── android/
│   └── client-app/           # Android application module
│       ├── app/
│       │   ├── src/main/
│       │   │   ├── AndroidManifest.xml
│       │   │   ├── java/dev/hstaff/client/
│       │   │   │   ├── HStaffClientApp.kt
│       │   │   │   ├── MainActivity.kt
│       │   │   │   ├── data/            # Remote API, DTOs, Repositories
│       │   │   │   ├── domain/          # Models, State machine, Enums
│       │   │   │   ├── service/         # Firebase messaging
│       │   │   │   └── ui/              # Compose screens, theme, components
│       │   │   └── res/                 # Adaptive icons, values, XML tokens
│       │   ├── build.gradle.kts
│       │   └── proguard-rules.pro
│       ├── gradle/
│       │   ├── libs.versions.toml       # Version Catalog
│       │   └── wrapper/
│       ├── build.gradle.kts             # Root Gradle build script
│       └── settings.gradle.kts
└── docs/
    ├── android-deployment-guide.md      # Build, run, and Play Store release guide
    └── openapi.yaml                     # API specification
```

---

## Quick Start

1. Open **Android Studio** (2024.2+ / Ladybug or newer recommended).
2. Click **Open** and select:
   ```
   android/client-app
   ```
3. Allow Gradle to sync dependencies via `gradle/libs.versions.toml`.
4. Select an Android Emulator (API 30+) or a connected physical device.
5. Click **Run 'app'** (`Shift + F10`).

For detailed build, configuration, and Play Store publishing instructions, see [`docs/android-deployment-guide.md`](docs/android-deployment-guide.md).
