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

- **20 Complete Screens**:
  1. `SplashScreen`: Animated logo presentation with spring scale transition
  2. `WelcomeScreen`: Hero landing, verified badges, photo collage, role CTAs
  3. `AuthPhoneScreen`: Indian mobile number verification (`+91` prefix, 10-digit validation)
  4. `AuthOtpScreen`: 6-digit OTP verification with demo auto-fill (`123456`)
  5. `HomeScreen`: Header, active booking tracker banner, search, category grid, top-rated helpers, city selector
  6. `DiscoverScreen`: Full searchable directory of all 15 services
  7. `ModeScreen` (Booking Step 1): Instant vs Scheduled booking options
  8. `RequirementsScreen` (Booking Step 2): Task selection and 1-8 hour duration stepper
  9. `MaterialsScreen` (Booking Step 2b): Client vs Helper tool provision and special notes
  10. `LocationScreen` (Booking Step 3): Interactive vector OpenStreetMap preview & address selector
  11. `ProfessionalsScreen` (Booking Step 4): Sorting by Nearest, Top Rated, and Price
  12. `ProfessionalProfileScreen` (Booking Step 4b): Bio, skills, equipment, languages, reviews, and hourly rates
  13. `SummaryScreen` (Booking Step 5): Itemized INR breakdown (Rate × Hours + Safety fee) and request dispatch
  14. `ServiceStatusScreen`: Live state tracker (En route ETA, Start OTP, active shift timer, end OTP)
  15. `PaymentScreen`: Simulated UPI, Cards, and Net Banking checkout with edge case failure testing
  16. `RatingScreen`: 1-5 star review, compliment badges, and written feedback
  17. `CompleteScreen`: Final receipt confirmation and return to home
  18. `BookingsScreen`: Upcoming active jobs vs Past completed history tabs
  19. `ProfileScreen`: User stats, ID verification guarantee, and logout
  20. `NotificationsScreen`: Real-time alerts, OTP arrivals, and system notices

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
