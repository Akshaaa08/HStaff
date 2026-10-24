# H-Staff — React Native (Android)

Android port of the H-Staff web prototype (`hstaff_frontend_zip`). Same screens, same booking flow, same design tokens.

- Full setup / run / build instructions: **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**
- Stack: React Native 0.88 (bare CLI, Hermes, New Architecture), TypeScript, Gradle project in `android/` (open that folder in Android Studio)

```
npm install
npm start            # Metro bundler (terminal 1)
npm run android      # build + install on emulator/device (terminal 2)
npm test             # 24 unit + render tests
npm run typecheck
```

## Source layout
```
App.tsx                      entry (SafeAreaProvider)
src/HStaffApp.tsx            app shell: screen switch, dock, sheets, Android back button
src/state/useHStaff.ts       ALL state + actions (port of the web state machine)
src/lib/domain.ts, auth.ts   booking rules, pricing, OTP + sign-up validation (unchanged logic)
src/lib/assets.ts            service icons + professional photos
src/lib/storage.ts           AsyncStorage session persistence (was localStorage)
src/theme.ts                 colours / fonts / shadows (converted from styles.css)
src/components/              ui.tsx (buttons, inputs), primitives.tsx, extras.tsx, motion.tsx
src/screens/                 AuthFlow, Home (tabs), Flow (booking), Misc, Sheets, shared
android/                     Gradle project (package com.hstaff, fonts in app/src/main/assets/fonts)
```
