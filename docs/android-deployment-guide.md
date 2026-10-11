# HStaff Android Application — Developer & Deployment Guide

This guide details how to build, run, test, and deploy the native Android client application for **HStaff**.

---

## 1. Architecture & Tech Stack

The HStaff Android client is built natively with modern Android architectural components:

- **UI Layer**: Jetpack Compose + Material 3, custom design tokens translated directly from HStaff's design system (`brandGradient`, `hstaffPink`, `peach`, `coral`, `mint`, `lavender`, glassmorphic cards).
- **Navigation**: Jetpack Compose Navigation (`AppNavGraph.kt`) supporting the complete end-to-end user journey:
  - Splash & Landing (`SplashScreen`, `WelcomeScreen`)
  - Phone OTP Authentication (`AuthPhoneScreen`, `AuthOtpScreen`)
  - Home & Discovery (`HomeScreen`, `DiscoverScreen`)
  - 5-Step Booking Flow:
    1. Mode Selection (`ModeScreen` - Instant vs. Scheduled)
    2. Requirements (`RequirementsScreen` - Task type & hours stepper)
    3. Materials & Instructions (`MaterialsScreen`)
    4. Location Selection (`LocationScreen` - Address & simulated GPS)
    5. Professional Selection & Profile (`ProfessionalsScreen`, `ProfessionalProfileScreen`)
    6. Review & Summary (`SummaryScreen`)
  - Live Booking State Machine (`ServiceStatusScreen` - Requested, Confirmed, En Route, Arrived, In Progress, Verification OTPs, Rating & Complete)
  - Payment Flow (`PaymentScreen` - UPI, Cards, Net Banking)
  - Feedback & Completed (`RatingScreen`, `CompleteScreen`)
  - Account & History (`BookingsScreen`, `ProfileScreen`, `NotificationsScreen`)
- **State Management**: Android ViewModel with Kotlin StateFlow (`ClientViewModel.kt`).
- **Data & Network Layer**: Retrofit 2 + OkHttp 4 + Kotlinx Serialization JSON (`HStaffApiService.kt`), supporting both live API backend communication and offline standalone demo mode.
- **Security & Storage**: Keystore-backed `EncryptedSharedPreferences` for secure session token persistence.
- **Push Notifications**: Firebase Cloud Messaging (`HStaffMessagingService.kt`).

---

## 2. Prerequisites

To build and run the Android app, ensure your workstation has:
1. **Android Studio**: Ladybug (2024.2.1) or newer recommended.
2. **JDK**: Java Development Kit 17 or 21 (bundled with Android Studio).
3. **Android SDK**:
   - `compileSdk`: 35 (Android 15)
   - `minSdk`: 26 (Android 8.0 Oreo)
   - `targetSdk`: 35

---

## 3. How to Run Locally

### Option A: Open with Android Studio (Recommended)
1. Launch **Android Studio**.
2. Select **File > Open...** and navigate to:
   ```
   <repo-root>/android/client-app
   ```
3. Allow Gradle to sync dependencies automatically via the version catalog (`gradle/libs.versions.toml`).
4. Select an Android Emulator (API 30+) or connect a physical Android device with USB debugging enabled.
5. Click **Run 'app'** (`Shift + F10`).

### Option B: Command Line (Gradle)
From the `android/client-app` directory:

```powershell
# On Windows
./gradlew assembleDebug

# Install on a connected device/emulator
./gradlew installDebug
```

---

## 4. Connecting to the Local Backend

When running the HStaff backend services locally via Docker / Node:
1. Start the local backend:
   ```powershell
   cd <repo-root>
   docker compose up -d
   ```
2. **Android Emulator**:
   - By default, the debug build is configured to connect to `http://10.0.2.2:4000`, which aliases the host machine's `localhost:4000`.
3. **Physical Android Device**:
   - Update `API_BASE_URL` in `android/client-app/app/build.gradle.kts` to your machine's local LAN IP:
     ```kotlin
     buildConfigField("String", "API_BASE_URL", "\"http://192.168.1.X:4000\"")
     ```
   - Alternatively, use reverse port forwarding via ADB:
     ```powershell
     adb reverse tcp:4000 tcp:4000
     ```
     and leave `API_BASE_URL` as `"http://localhost:4000"`.

---

## 5. Deployment & Release Readiness

### 1. Keystore Generation
Generate a cryptographically secure upload keystore:
```powershell
keytool -genkey -v -keystore hstaff-release.jks -alias hstaff -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Release Signing
Add your signing credentials securely in `android/client-app/app/build.gradle.kts` or via environment variables:
```kotlin
signingConfigs {
    create("release") {
        storeFile = file(System.getenv("KEYSTORE_PATH") ?: "hstaff-release.jks")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS") ?: "hstaff"
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}
buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
        isMinifyEnabled = true
        isShrinkResources = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
        buildConfigField("String", "API_BASE_URL", "\"https://api.hstaff.dev\"")
    }
}
```

### 3. Build Production Bundle (.aab)
For publishing on Google Play Store:
```powershell
./gradlew bundleRelease
```
The output Android App Bundle will be generated at:
`app/build/outputs/bundle/release/app-release.aab`

For standalone APK distribution:
```powershell
./gradlew assembleRelease
```
The output APK will be located at:
`app/build/outputs/apk/release/app-release.apk`

---

## 6. Verification Checklist

- [x] End-to-end navigation flows translated from mobile web.
- [x] Full design system fidelity (OKLCH colors mapped to Compose Color tokens, custom gradients, rounded surfaces).
- [x] Reactive state management using Kotlin StateFlow and ViewModel.
- [x] Standalone offline fallbacks + Retrofit 2 remote API integration.
- [x] AndroidManifest configured with permissions (`INTERNET`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`).
- [x] Adaptive icon vector resources and color tokens included.
- [x] R8/ProGuard rules configured for Kotlin Serialization and Retrofit.
