# H-Staff Android — Setup, Run & Build Guide

Follow in order. Steps 1–4 are one-time. After that, daily work is just steps 5–6.

## 1. Install prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | **22.11 or newer** (LTS) | `node -v` to check |
| JDK | **17** (Temurin/OpenJDK) | Android Studio bundles one (JBR); easiest is to use that, see 3 |
| Android Studio | latest stable | includes SDK Manager + emulator |
| Git | any | optional |

## 2. Android Studio SDK components
Open **Android Studio → More Actions → SDK Manager**.

**SDK Platforms tab** (tick "Show Package Details"): install **Android 16 (API 36)** and **Android 17 / API 37** (the project's `compileSdk` is 37; if API 37 isn't listed yet, Gradle will auto-download it on first build).
**SDK Tools tab**: install **Android SDK Build-Tools 37.0.0**, **NDK (Side by side) 27.1.12297006**, **Android SDK Command-line Tools (latest)**, **Android SDK Platform-Tools**, **Android Emulator**.

(Gradle can auto-install missing build-tools/NDK if the licences are accepted: run `sdkmanager --licenses` once, or accept in Studio.)

## 3. Environment variables
Find your SDK path in SDK Manager (e.g. `C:\Users\you\AppData\Local\Android\Sdk`, `~/Library/Android/sdk`, `~/Android/Sdk`).

**Windows (PowerShell, then restart terminal):**
```
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
setx PATH "$env:PATH;$env:LOCALAPPDATA\Android\Sdk\platform-tools"
```
**macOS / Linux (`~/.zshrc` or `~/.bashrc`):**
```
export ANDROID_HOME=$HOME/Library/Android/sdk     # Linux: $HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
Check: `adb --version`.
If Gradle complains about Java, point it at Studio's JDK: set `JAVA_HOME` to Studio's `jbr` folder (Windows: `C:\Program Files\Android\Android Studio\jbr`, macOS: `/Applications/Android Studio.app/Contents/jbr/Contents/Home`).

## 4. Install the project
```
unzip HStaff-android.zip && cd HStaff
npm install
```

## 5. Run & test locally (emulator or phone)

**Create an emulator** (once): Android Studio → Device Manager → Create Device → e.g. Pixel 8 → system image **API 36** → Finish → ▶ start it.
**Or a real phone:** enable Developer options + USB debugging, connect by USB, accept the prompt, `adb devices` must list it.

Then two terminals in the project folder:
```
npm start            # terminal 1: Metro bundler, leave running
npm run android      # terminal 2: builds, installs and launches the app
```
First build takes 5–15 min (Gradle downloads dependencies); later builds are fast. Edit any file in `src/` and the app hot-reloads.

Useful: shake device / `Ctrl+M` (emulator) → dev menu · `r r` in Metro terminal → reload · `adb logcat *:E` for native errors.

**Test checklist (mirrors the web flow):**
1. Landing → "Sign up to hire help" → fill form. Demo OTP is **123456**. Use "Enter address manually" or allow location.
2. Home → pick a service → Instant/Scheduled (native date/time pickers) → requirements → materials → location → professionals → profile → summary → Send request.
3. After ~3s request auto-accepts → Track → "arrived" → Start code and End code are displayed in-app (and in the sheet hint) → timer → Review → End OTP → Payment → Rating → Complete.
4. Profile → Switch to Professional to test the helper side. Sheet **Request options** lets you simulate Decline/Timeout.
5. Android back button / back gesture: closes sheet → previous screen → Home → exits.
6. Kill and reopen the app: session and past bookings persist.

## 6. Open in Android Studio (to build/sign)
**File → Open →** select the **`HStaff/android`** folder (not the project root). Wait for Gradle sync.
- Run ▶ from Studio works while `npm start` (Metro) is running — this is the debug build.
- If sync says "SDK location not found": create `android/local.properties` containing `sdk.dir=/your/sdk/path` (Windows: `sdk.dir=C\:\\Users\\you\\AppData\\Local\\Android\\Sdk`).

## 7. Build a release APK / AAB
1. Create a keystore (once, keep it safe — losing it means you can't update the app):
```
keytool -genkeypair -v -storetype PKCS12 -keystore hstaff-release.keystore -alias hstaff -keyalg RSA -keysize 2048 -validity 10000
```
Move it to `android/app/`.
2. Add to `~/.gradle/gradle.properties` (not into the repo):
```
HSTAFF_STORE_FILE=hstaff-release.keystore
HSTAFF_STORE_PASSWORD=****
HSTAFF_KEY_ALIAS=hstaff
HSTAFF_KEY_PASSWORD=****
```
3. In `android/app/build.gradle` add under `android { }` a `release` signingConfig reading those four properties and set `buildTypes.release.signingConfig signingConfigs.release` (the template currently signs release with the debug key — fine for testing only).
4. Build: `cd android && ./gradlew assembleRelease` (APK: `app/build/outputs/apk/release/`) or `./gradlew bundleRelease` (AAB for Play Store). Windows: `gradlew.bat`.
Or in Studio: **Build → Generate Signed App Bundle / APK**.

## 8. Troubleshooting
| Symptom | Fix |
|---|---|
| `SDK location not found` | `local.properties` (see 6) or set `ANDROID_HOME` |
| `Unsupported class file major version` / Java errors | use JDK 17 or Studio's JBR via `JAVA_HOME` |
| Red screen "Unable to load script" on a **real phone** | `adb reverse tcp:8081 tcp:8081`, then reload |
| Build stuck/old state | `cd android && ./gradlew clean`, then `npm start -- --reset-cache` |
| Missing NDK / build-tools | install the exact versions in step 2 |
| Fonts look wrong | confirm `android/app/src/main/assets/fonts/*.ttf` exist, then clean build |
| Keyboard covers an input | tell me which screen; layout uses `KeyboardAvoidingView` with edge-to-edge |

---

# What changed from the web prototype (and why)

**Kept 1:1:** every screen and the whole state machine (`useHStaff.ts` = the old `HStaffApp` state/handlers), booking rules/pricing/OTP/validation (`lib/domain.ts`, `lib/auth.ts` — same code and same tests), copy, colours (OKLCH converted to hex), Inter font, gradients, animations (page-in, floating badges, aurora, marquee, pulse), choice/chip/sheet/dock styling.

**Necessary changes for native Android:**
| Web | Android |
|---|---|
| TanStack Start / Vite / Tailwind / shadcn | React Native 0.88 + StyleSheet + small component kit in `components/ui.tsx` |
| Phone-frame mockup + fake status bar | Real device screen, real status bar, safe-area/edge-to-edge insets |
| `localStorage` | AsyncStorage (same key and shape) |
| `<input type=date/time>` | Native Android date/time dialogs |
| `<select>` | Modal list (`SelectField`) |
| `<input type=file>`, camera capture | `react-native-image-picker` (selfie), `@react-native-documents/picker` (ID: image or PDF) |
| `navigator.geolocation` | Android runtime permission request |
| CSS `backdrop-filter`, blurred blobs | Slightly more opaque glass; SVG radial-gradient blobs |
| Hover/focus CSS | Press feedback; 48dp touch targets kept |
| Browser back | Android hardware/gesture back (sheet → history → Home → exit) |
| `toLocaleString('en-IN')` | Own Indian-grouping formatter (same output, no Intl dependency) |
| Scheduled default date `2026-10-09` (hard-coded) | Today's date |
| Brand-icon set from lucide (removed in v1) | Inlined SVG paths |
| Web-only files (routes, vite config, `.lovable`, tests via vitest) | Dropped / tests moved to Jest |

**Needs your attention:**
- **Logo:** `logo.png` was not actually in the zip (only a `.asset.json` pointer to a CDN URL). I rebuilt the wordmark as vector (roof + H + script "Staff", `HStaffLogo` in `primitives.tsx`) and generated launcher icons. To use your real artwork: put `logo.png` in `src/assets/` and replace the body of `HStaffLogo` with an `<Image>`.
- **Launcher icon** is a generated placeholder (`android/app/src/main/res/mipmap-*`); replace via Android Studio → *Image Asset*.
- Social links in the footer are non-functional, as in the prototype. All OTP/payment/tracking remain **simulated demo behaviour** (no backend), same as the web version.
- Package id is `com.hstaff` — change before publishing (Studio: refactor rename + `applicationId` in `android/app/build.gradle`).
