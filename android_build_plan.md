# HStaff Android Build Plan

## What we're creating

Two native Android apps under `android/` in the repo:
- `android/client-app/` — Customer app (Kotlin + Jetpack Compose + Material 3)
- `android/worker-app/` — Worker app (Kotlin + Jetpack Compose + Material 3)

Both share identical design DNA (pink-to-peach gradient, glassmorphism, Material 3) translated from the web frontend CSS tokens.

---

## Design token translation (CSS → Compose)

| Web token | Android Color |
|---|---|
| `--peach` oklch(.91 .049 43) | `0xFFFFDDC1` (#FFDDC1) |
| `--coral` oklch(.84 .083 18) | `0xFFFF9C7A` (#FF9C7A) |
| `--pink` oklch(.76 .128 354) | `0xFFE96B9A` (#E96B9A) |
| `--soft-pink` oklch(.92 .047 3) | `0xFFFDE8EE` |
| `--mint` oklch(.92 .035 159) | `0xFFD2F5E6` |
| `--lavender` oklch(.93 .025 293) | `0xFFE8E3F8` |
| `--yellow` oklch(.95 .055 86) | `0xFFFDF3CB` |
| `--success` oklch(.42 .09 161) | `0xFF2D7D5A` |
| `--brand-gradient` | Brush.linearGradient(Peach → Coral → Pink) |
| `--radius` 1.5rem | 24.dp |
| `--canvas` | `0xFFF1EDEA` |
| `--foreground` | `0xFF1F1F2E` |
| `--muted-foreground` | `0xFF6E6E8A` |

---

## Screens by app

### client-app screens
1. **SplashScreen** – session check, animated logo
2. **WelcomeScreen** – "Good people. Great help." landing with photos
3. **RoleScreen** – choose Hire / Work
4. **AuthPhoneScreen** – phone number entry (+91 prefix)
5. **AuthOtpScreen** – 6-digit OTP entry
6. **HomeScreen** – header, location selector, hero, search, active booking card, instant banner, popular services grid, nearby workers
7. **DiscoverScreen** – full service grid with search
8. **ModeScreen** – Instant / Scheduled selection (step 1 of 5)
9. **RequirementsScreen** – task type + duration stepper (step 2 of 5)
10. **MaterialsScreen** – materials + notes (step 2b)
11. **LocationScreen** – OSM map mockup + address picker (step 3)
12. **ProfessionalsScreen** – professional list with sort chips (step 4)
13. **ProfessionalProfileScreen** – full profile with reviews (step 4 detail)
14. **SummaryScreen** – booking summary + price breakdown (step 5)
15. **ServiceStatusScreen** – live booking state machine (all status variants)
16. **PaymentScreen** – UPI / Cards / Net Banking
17. **RatingScreen** – star rating + tags + review text
18. **CompleteScreen** – success screen
19. **BookingsScreen** – Upcoming / Past tabs
20. **ProfileScreen** – profile menu
21. **NotificationsScreen** – booking/safety updates

### worker-app screens
1. **SplashScreen**
2. **WelcomeScreen**
3. **AuthPhoneScreen**
4. **AuthOtpScreen**
5. **SetupScreen** – name, skill category, hourly rate, experience, tools, KYC upload
6. **HomeScreen** – online/offline toggle, earnings banner, active job card, new requests
7. **JobsScreen** – Active / Past tabs
8. **JobDetailsScreen** – request details with Accept/Decline
9. **ServiceStatusScreen** – active job flow (En Route → Arrived → OTP → In Progress → End OTP)
10. **EarningsScreen** – weekly summary + recent jobs list
11. **ProfileScreen**

---

## Project structure

```
android/
├── client-app/
│   ├── build.gradle.kts (app module)
│   ├── settings.gradle.kts
│   ├── gradle/wrapper/
│   ├── app/
│   │   ├── build.gradle.kts
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── java/dev/hstaff/client/
│   │   │       ├── HStaffClientApp.kt          (Application class)
│   │   │       ├── MainActivity.kt
│   │   │       ├── ui/theme/
│   │   │       │   ├── Theme.kt
│   │   │       │   ├── Color.kt
│   │   │       │   └── Type.kt
│   │   │       ├── domain/
│   │   │       │   ├── model/                  (Booking, Professional, etc.)
│   │   │       │   └── repository/
│   │   │       ├── data/
│   │   │       │   ├── remote/                 (ApiService, DTOs)
│   │   │       │   └── repository/
│   │   │       ├── ui/
│   │   │       │   ├── navigation/AppNavGraph.kt
│   │   │       │   ├── screens/
│   │   │       │   │   ├── splash/
│   │   │       │   │   ├── welcome/
│   │   │       │   │   ├── auth/
│   │   │       │   │   ├── home/
│   │   │       │   │   ├── discover/
│   │   │       │   │   ├── booking/
│   │   │       │   │   ├── service/
│   │   │       │   │   ├── payment/
│   │   │       │   │   ├── rating/
│   │   │       │   │   ├── bookings/
│   │   │       │   │   ├── profile/
│   │   │       │   │   └── notifications/
│   │   │       │   └── components/             (shared composables)
│   │   │       └── util/
│   │   └── src/main/res/
│   │       ├── drawable/
│   │       └── values/
└── worker-app/
    └── (same structure, dev.hstaff.worker package)
```

---

## Dependencies

```kotlin
// Core
implementation("androidx.core:core-ktx:1.13.1")
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
implementation("androidx.activity:activity-compose:1.9.3")

// Compose BOM
implementation(platform("androidx.compose:compose-bom:2024.12.01"))
implementation("androidx.compose.ui:ui")
implementation("androidx.compose.ui:ui-graphics")
implementation("androidx.compose.ui:ui-tooling-preview")
implementation("androidx.compose.material3:material3")

// Navigation
implementation("androidx.navigation:navigation-compose:2.8.5")

// ViewModel
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")

// Retrofit
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.11.0")
implementation("com.squareup.okhttp3:okhttp:4.12.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

// Kotlin Serialization
implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

// Coroutines
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

// Encrypted SharedPreferences (token storage)
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// Coil (image loading)
implementation("io.coil-kt.coil3:coil-compose:3.0.4")

// FCM
implementation("com.google.firebase:firebase-messaging-ktx:24.1.0")
```

---

## Build sequence

1. Root-level Gradle files
2. App-level Gradle files
3. AndroidManifest
4. Theme (Color, Type, Theme)
5. Domain models
6. Navigation graph + routes
7. Screen composables (top → down)
8. ViewModels
9. Network layer
