# HStaff (Hourly) — React Native Application (Expo SDK 57)

Converted from the native Android Kotlin/Jetpack Compose client into a cross-platform **React Native application powered by Expo SDK 57**.

---

## 📱 Features & Converted Architecture

This application faithfully reproduces all native features, design tokens, and domain models from `android/client-app`:

- **Brand Design System**:
  - Color palette based on OKLCH tokens (`Peach #FFDDC1`, `Coral #FF9C7A`, `Pink #E96B9A`, `Mint #D2F5E6`, `Lavender #E8E3F8`)
  - Smooth LinearGradients (`['#FF9C7A', '#E96B9A']`)
  - Material 3 & Glassmorphic visual hierarchy

- **State Management & Domain State Machine (`src/context/AppContext.tsx` & `src/types/index.ts`)**:
  - Full 17-state lifecycle machine:
    `DRAFT` → `OPEN` → `REQUESTED` → `ACCEPTED` → `CONFIRMED` → `EN_ROUTE` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED_PENDING_PAYMENT` → `PAYMENT_PENDING` → `PAYMENT_COMPLETED` → `CLOSED`
    (with fallback & edge handling for `DECLINED`, `EXPIRED`, `CANCELLED`, `DISPUTED`, `FAILED`)
  - Live in-progress shift elapsed timer (`HH:mm:ss`) updated in real-time
  - Start OTP (`482713`) check-in and Completion OTP (`724819`) verification
  - 15 certified service categories with tone styling
  - Multi-city launch coverage (Pune, Mumbai, Nashik, Ahilyanagar, Chhatrapati Sambhajinagar)

- **20 Complete Role-Isolated Screens**:
  1. `SplashScreen`: Animated logo presentation with spring scale transition
  2. `WelcomeScreen`: Hero landing, verified badges, feature showcase card, role CTAs (No photos of women)
  3. `AuthPhoneScreen`: Indian mobile number verification (`+91` prefix, 10-digit validation)
  4. `AuthOtpScreen`: 6-digit OTP verification with live auto-fill from notification tray
  5. `SignupScreen`: Client doorstep location setup / Worker category, skills, hourly rate & photo upload
  6. `HomeScreen`: Client header, active booking tracker, search, categories, nearby workers / Worker Dashboard
  7. `WorkerDashboardScreen`: Dedicated worker dashboard with incoming requests, arrival OTP verification, single-tap finish, and live earnings
  8. `DiscoverScreen`: Full searchable directory of all 15 domestic services
  9. `ModeScreen` (Booking Step 1): Instant dispatch (~30 min arrival) vs Scheduled booking options
  10. `RequirementsScreen` (Booking Step 2): Task selection and 1-8 hour duration stepper
  11. `MaterialsScreen` (Booking Step 3): Client vs Helper tool provision and special notes
  12. `LocationScreen` (Booking Step 4): Interactive Leaflet map preview, automated GPS detection, doorstep address input
  13. `ProfessionalsScreen` (Booking Step 5a): Live worker distance in km (Haversine formula), completed jobs count, and rate
  14. `ProfessionalProfileScreen` (Booking Step 5b): Bio, skills, equipment, languages, and hourly rates
  15. `SummaryScreen` (Booking Step 5c): Itemized upfront price calculation (`Rate × Hours`), doorstep address, and dispatch
  16. `ServiceStatusScreen`: Live state tracker (En route ETA, Start OTP, active shift timer, payment prompt)
  17. `PaymentScreen`: Official Razorpay Payment Gateway (UPI, Cards, NetBanking) & Doorstep Cash (COD)
  18. `CompleteScreen`: Final receipt confirmation, transaction reference, and return to home
  19. `BookingsScreen`: Strict partitioned history: Upcoming active jobs vs Past completed history tabs
  20. `ProfileScreen` & `NotificationsScreen`: User stats, ID verification guarantee, and real-time alerts

👉 **For the complete architecture, routing table, and API specs, see [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md)**

---

## 🚀 Quick Start

From `react-native/Hourly`:

```bash
# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### Run on Platforms:

- **Android Emulator / Device**:
  ```bash
  npm run android
  ```
- **Web Browser**:
  ```bash
  npm run web
  ```
- **iOS Simulator** (macOS):
  ```bash
  npm run ios
  ```

---

## 📂 Project Structure

```
react-native/Hourly/
├── assets/                     # App icons & images
├── src/
│   ├── app/
│   │   ├── _layout.tsx         # Root layout with SafeAreaProvider & AppProvider
│   │   ├── index.tsx           # Master navigation coordinator
│   │   └── explore.tsx         # Route redirect
│   ├── components/
│   │   └── common/
│   │       ├── AppHeader.tsx
│   │       ├── BottomNavBar.tsx
│   │       ├── BookingProgressBar.tsx
│   │       ├── ChoiceCard.tsx
│   │       ├── EmptyState.tsx
│   │       ├── GradientButton.tsx
│   │       ├── MapMockup.tsx
│   │       ├── OtpDisplay.tsx
│   │       ├── OutlinedButton.tsx
│   │       ├── PriceBreakdownCard.tsx
│   │       ├── ProfessionalCard.tsx
│   │       ├── ScreenTopBar.tsx
│   │       ├── StateSymbol.tsx
│   │       ├── StatusChip.tsx
│   │       └── VerificationBadge.tsx
│   ├── context/
│   │   └── AppContext.tsx      # Global store & client view model
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── WelcomeScreen.tsx
│   │   ├── AuthPhoneScreen.tsx
│   │   ├── AuthOtpScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── DiscoverScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── booking/
│   │   │   ├── ModeScreen.tsx
│   │   │   ├── RequirementsScreen.tsx
│   │   │   ├── MaterialsScreen.tsx
│   │   │   ├── LocationScreen.tsx
│   │   │   ├── ProfessionalsScreen.tsx
│   │   │   ├── ProfessionalProfileScreen.tsx
│   │   │   └── SummaryScreen.tsx
│   │   ├── service/
│   │   │   └── ServiceStatusScreen.tsx
│   │   └── payment/
│   │       ├── PaymentScreen.tsx
│   │       ├── RatingScreen.tsx
│   │       └── CompleteScreen.tsx
│   ├── theme/
│   │   ├── colors.ts           # HStaff brand color tokens
│   │   └── index.ts            # Typography and shadows
│   └── types/
│       └── index.ts            # Booking state machine, DTOs & mock data
├── package.json
└── tsconfig.json
```
