# HStaff Android App --- UI/UX Redesign & Implementation Specification

**Version:** 1.0\
**Date:** 17 October 2026\
**Audience:** AI coding agent, mobile/frontend developers, backend
developers, QA, product owner\
**Status:** Implementation-ready product and design brief

------------------------------------------------------------------------

## 1. Purpose

Redesign HStaff into a clean, premium, trustworthy local-services
marketplace for India. The current screens feel scattered, inconsistent,
and visually dense. The redesign must establish a clear information
hierarchy, consistent spacing, predictable navigation, polished
onboarding, and distinct experiences for **Customers** and **Workers**.

Use the supplied screenshots as references: - **HStaff screenshots:**
current product flows and existing brand colors/features. - **Invofy
screenshots:** visual direction for generous whitespace, editorial
typography, restrained cards, soft gradient surfaces, human-centered
imagery, clear sections, pricing/benefit blocks, testimonials, FAQs, and
a structured footer. - **Updated HStaff logo image:** use this as the
primary brand mark. Do not recreate it with text or substitute the old
logo.

The goal is not to copy the invoicing product. Adapt its visual language
to a home-services marketplace and preserve HStaff's own features and
workflows.

## 2. Non-negotiable technical constraints

1.  **Customer and Worker experiences are Android apps built with React
    Native.**
2.  Do not reintroduce Kotlin or Jetpack Compose for the mobile UI. The
    earlier native Kotlin/Jetpack Compose build path had build issues;
    this redesign is for the existing React Native app.
3.  Keep the current repository's actual framework, navigation, backend
    APIs, authentication, and data models where possible. Inspect the
    repository before editing. Do not replace working architecture
    merely to implement a visual redesign.
4.  Existing project context includes a Node.js/Express backend,
    PostgreSQL/PostGIS for location-aware services, Redis,
    OpenStreetMap/Leaflet in relevant web surfaces, and a separate
    React-based admin web app. Confirm the current repo state before
    assuming any dependency or service is present.
5.  The mobile app must not become a web app or embedded website.
    Implement native-feeling React Native screens and interactions.
6.  Use the existing API contracts if available. If a flow is not
    implemented in the backend, build the UI state and clearly mark the
    required API contract; do not fake successful payment, identity
    verification, booking, or worker approval.
7.  Do not hard-code secrets, OTPs, Aadhaar numbers, bank details,
    worker/customer records, prices, or production API keys.
8.  Keep customer and worker navigation, home screens, dashboards, and
    account states separate. Shared design components are allowed.
9.  Preserve accessibility, Android back-button behavior,
    loading/error/empty states, and small-screen support.

## 3. Product principles

-   **Trust first:** verification status, transparent pricing, clear
    worker details, safe OTP check-in, and visible support.
-   **One primary action per screen:** reduce competing buttons and
    visual clutter.
-   **Progressive disclosure:** show only what is needed at each step;
    use a stepper for longer booking and worker registration flows.
-   **Transparent pricing:** show base hourly rate, duration,
    material/supply surcharge, platform fee/taxes if applicable, and
    total before confirmation.
-   **Customer and Worker parity:** both roles receive a polished,
    complete experience, but their information architecture is
    purpose-built.
-   **No deceptive trust claims:** only use "Aadhaar verified",
    "background checked", "100% verified", or similar labels when the
    corresponding verification has actually succeeded and is supported
    by the system.
-   **Responsive by default:** Android phones first, including compact
    devices, larger font settings, keyboard visibility, and safe areas.
-   **Friendly Indian context:** INR formatting, +91 phone numbers,
    Indian address patterns, local service coverage, and accessible
    language.

## 4. Brand direction and design system

### 4.1 Logo and brand

-   Use the supplied updated HStaff logo image as the canonical logo
    asset.
-   Keep aspect ratio; never stretch, crop, recolor, or add effects to
    the logo unless a separate approved asset exists.
-   Create suitable variants only if the supplied artwork supports them:
    full logo for onboarding/home headers and compact mark for app
    icon/avatar-sized spaces.
-   Use the gradient roof mark as the key accent and the dark navy
    lettering as the primary brand anchor.
-   Ensure contrast on both light and gradient backgrounds. Prefer a
    white/neutral logo container if contrast is poor.
-   Replace every old logo instance, including login, signup, worker
    registration, profile, empty states, app header, and any in-app
    splash/launch screen.

### 4.2 Color tokens

Create centralized design tokens rather than scattering literal hex
values through components. The following are proposed starting values;
tune against the supplied logo asset and screenshot references.

  -----------------------------------------------------------------------
  Token                   Proposed value          Usage
  ----------------------- ----------------------- -----------------------
  `brand.navy`            `#101426`               Main text, primary
                                                  button, icons

  `brand.coral`           `#FF9A78`               Warm gradient start,
                                                  highlights

  `brand.pink`            `#E95D9B`               Gradient end, active
                                                  states, selected
                                                  controls

  `brand.green`           `#168765`               Verified, success,
                                                  completed

  `surface.base`          `#FFFFFF`               Main page

  `surface.subtle`        `#F8F8F6`               Inputs, secondary
                                                  surfaces

  `surface.warm`          `#FFF8F3`               Warm feature cards

  `text.primary`          `#171923`               Main text

  `text.secondary`        `#737583`               Supporting text

  `border.default`        `#E8E5E2`               Card/input borders

  `status.warning`        `#C97922`               Warnings

  `status.error`          `#C43D4D`               Validation and errors
  -----------------------------------------------------------------------

Use the coral-to-pink gradient sparingly: hero panels, primary
call-to-action backgrounds, selected chips, and a few illustrations. Do
not put a gradient behind every card.

### 4.3 Typography

-   Use one clean, legible sans-serif family consistently. Prefer the
    existing app font if it is already integrated and licensed;
    otherwise use the platform sans-serif.
-   Use a clear type scale:
    -   Display/hero: 32--36sp, bold, tight line height.
    -   Screen title: 26--30sp, bold.
    -   Section heading: 20--22sp, semibold/bold.
    -   Card title: 16--18sp, semibold.
    -   Body: 15--16sp.
    -   Supporting/meta: 12--14sp.
    -   Button: 15--16sp, semibold.
-   Avoid too many all-caps labels. Small uppercase eyebrow labels are
    acceptable for a section introduction.
-   Keep body copy concise and readable. Do not shrink text to fit a
    card; allow wrapping.

### 4.4 Spacing, shape, elevation

-   Use an 8dp spacing system: 4, 8, 12, 16, 24, 32, 40, 48.
-   Screen horizontal padding: 20--24dp; compact screens may use 16dp.
-   Card padding: 16--20dp.
-   Standard card radius: 20--24dp; inputs/buttons: 14--18dp;
    chips/pills: fully rounded.
-   Use subtle borders and low elevation. Avoid heavy shadows, multiple
    nested cards, and a card inside every card.
-   Separate content through spacing and section backgrounds before
    adding borders.
-   Minimum touch target: 48dp.
-   Keep the bottom navigation clear of Android system navigation and
    gesture areas.

### 4.5 Motion principles

Animations should feel polished, not decorative or slow: - Standard
transitions: 180--260ms. - Screen transition: subtle horizontal slide or
fade/slide-up, consistent with the existing navigation library. - Press
feedback: scale to 0.98 and/or slight opacity change; restore
immediately on release. - Loading: skeletons for content lists, small
inline spinner for button actions, and a calm waiting animation for
matching. - Expand/collapse: 180--220ms height/opacity transition. - Use
native-driver animations where supported. - Respect Android "Remove
animations"/reduced-motion settings where practical. - Never block an
important action behind a long animation; no flashing, bouncing loops,
or excessive parallax.

## 5. Information architecture and role separation

### 5.1 Entry and role selection

The first meaningful screen should make the two paths obvious: - **Hire
help** --- customer flow. - **Work as a professional** --- worker flow.

If the user is already authenticated, route directly to the correct
role-specific home. Do not show the role selector repeatedly unless the
user explicitly chooses to switch roles and is permitted to do so.

### 5.2 Customer bottom navigation

Use a stable bottom bar with four items: 1. **Home** 2. **Discover** 3.
**Bookings** 4. **Profile**

Use a clear icon + label. The active item uses the brand coral/pink
accent; inactive items use a muted neutral. Do not allow a
screenshot/overlay/tool bar to cover the app navigation.

### 5.3 Worker bottom navigation

Use a distinct worker navigation: 1. **Dashboard** 2. **Requests** 3.
**Earnings** 4. **Profile**

Only show worker tabs after worker onboarding has been submitted. Before
approval, show a registration progress/status experience instead of an
empty job dashboard.

### 5.4 Admin

Admin is a separate web surface, not a customer/worker mobile tab. Admin
users review KYC, approve/reject worker applications, manage service
categories, bookings, complaints, refunds/payment reconciliation, and
coverage. Mobile UI must reflect admin status changes from the backend.

## 6. Customer experience --- screen-by-screen specification

### C01. Launch / splash

**Purpose:** establish brand while app initializes. - Center the
supplied HStaff logo with generous whitespace. - White or very pale
neutral background; optional small coral-pink glow behind the mark. -
Small loading indicator only if initialization takes more than a brief
moment. - Route based on authentication and role; do not leave users on
a splash indefinitely. - On initialization failure, show a retry state
rather than a permanent spinner.

### C02. Welcome / role entry

Use the cleaner, editorial style of the reference landing page. - Top
row: updated logo left; "Log in" text/pill button right. - Small trust
badge: "Trusted local help, close to home" (avoid unverified claims). -
Hero copy: **"Good people. Great help. Right next door."** - Supporting
copy: "Book trusted local professionals for everyday tasks, repairs, and
home services." - Hero background: subtle coral-to-pink gradient glow or
a warm gradient panel; do not sacrifice text contrast. - Primary CTA:
**Sign up to hire help**. - Secondary CTA: **Work as a helper**. -
Existing account action: **Log in**. - Below the fold, a compact
benefits panel: location-based matching, transparent pricing, secure
booking/check-in. - Keep the welcome page vertically scrollable on small
devices.

### C03. Login

The current login is visually weak; redesign to feel like a polished
commerce app while staying recognizably HStaff. - Header: logo, back
navigation if appropriate, concise title: **"Welcome back"**. -
Subtitle: "Sign in to continue with HStaff." - Phone number field with
+91 prefix and correct numeric keyboard. Use phone OTP as the primary
authentication method if that is the existing supported backend flow. -
Primary CTA: **Continue**. - OTP screen: six accessible digit boxes or
one semantic input styled as boxes; automatic focus advance, paste
support, backspace behavior, resend countdown, edit phone number,
loading/error states. - Email/password only if the current
authentication system supports it; do not introduce a second auth method
without backend support. - Optional Google sign-in only if configured
and working end-to-end. - Footer: terms/privacy acknowledgement, support
link, and a subtle role switch link ("Looking to work instead?" /
"Looking to hire instead?"). - No oversized illustrations, cluttered
social buttons, unexplained icons, or multiple competing primary
buttons. - Errors appear directly below the relevant field; preserve
entered values after recoverable errors. - Keyboard must not cover the
CTA; use keyboard-aware scrolling and safe-area padding.

### C04. Customer account creation

-   Collect only required information at first; do not force unnecessary
    data before browsing.
-   Fields depend on backend requirements: full name, phone
    verification, email optional/verified only if supported.
-   Show password fields only if password auth is genuinely used.
-   Inline validation, field-level errors, privacy/terms
    acknowledgement.
-   Successful registration routes to customer home and preserves any
    selected service/deep link where appropriate.

### C05. Customer home

The main screen should resemble a polished, structured marketplace---not
a long stack of unrelated cards.

**Header** - Logo/compact HStaff mark at top left. - Location pill with
pin and chevron; tapping opens location selection/current GPS. -
Notification icon and profile avatar on the right. - Keep header height
compact.

**Hero** - Small eyebrow: "HELP WHEN YOU NEED IT". - Heading: **"Who do
you need today?"** - Supporting line: "Vetted hourly domestic and
local-trade help, delivered to your doorstep." - Use a soft coral-pink
gradient background panel or a subtle background glow; avoid gradients
behind every section. - Search field: "Search cleaners, cooks,
electricians..." with search icon and clear button. - Search opens live
suggestions, recent searches, categories, and "no results" state.

**Popular services** - Section heading "Popular services" and "See
all". - Grid of 2 or 4 columns depending on device width, with
consistent icon containers. - Categories must come from the
backend/configuration, not duplicated hard-coded arrays. Initial
examples: Cleaning, Cooking, Plumbing, Electrical, Carpentry, General
Help, Service Staff, Security. The product supports 15 service
categories; show all 15 in the complete catalogue. - Each service has a
distinct but restrained pastel icon tile, consistent dimensions, label,
and selected state. - Icons should be from one icon family; do not mix
emoji, clip art, and different stroke weights.

**Trust / value proposition** - One warm outlined panel: "The HStaff
promise". - Explain real features: transparent hourly rates, verified
status where true, booking support, OTP check-in. - Avoid claiming "100%
ID verified" until admin verification is complete.

**Further home sections** 1. "Popular near you" professional/service
cards, if API data exists. 2. "Book in a few steps" with 3 short steps:
choose service, select time/materials, confirm booking. 3. Testimonials
only when real and consented; otherwise label as illustrative demo
content in development or omit. 4. "Need help?" support/query CTA. 5.
Compact FAQ teaser with 3 common questions. 6. Structured footer as
defined in Section 9. - Use whitespace and section rhythm. Avoid
repeating the same benefit in multiple cards. - If content is
unavailable, use a useful empty state; do not show fake ratings,
reviews, counts, or nearby workers.

### C06. Discover / service catalogue

-   Search bar at top.
-   Category filters/chips and service cards.
-   Filters: distance/area, rating (only if real), price range,
    availability, verified status.
-   Sort options: recommended, nearest, price low-to-high, rating (only
    when data exists).
-   Empty state: "No professionals found for these filters" + clear
    filters button.
-   Loading state: skeleton cards.
-   Avoid showing a worker as available unless the backend confirms
    current availability.

### C07. Service detail

-   Service name, clear description, what is included, estimated
    duration range, and pricing basis.
-   Show base rate as INR/hour or the actual supported pricing unit.
-   Explain what the customer should prepare and whether materials are
    normally required.
-   CTA: **Book this service**.
-   Show cancellation/rescheduling policy before confirmation.
-   If worker profiles are browsable before booking, show only real
    verified data and availability. If the current business model is
    request-first, skip the worker selection and proceed to booking
    details.

### C08. Booking flow --- use a 4--5 step progress indicator

Do not make booking a single, overloaded form. Keep the user's
selections when they go back.

**Step 1: Service** - Confirm category/service and task description. -
Allow a short note and optional reference photos only if upload support
exists. - Validate text length and file type/size. - Avoid asking the
user to repeat information already selected.

**Step 2: When do you need help?** - Two clear selectable cards: -
**Instant booking** --- "Find an available professional now." -
**Schedule for later** --- choose date and start time. - Instant is
enabled only when the backend supports real-time matching and service
coverage is active. - Scheduled flow must disallow past dates/times and
respect worker availability and booking lead-time rules. - Show local
time clearly and confirm the selected date/time before proceeding.

**Step 3: Materials and supplies** - Ask: **"Who will provide the
materials?"** - Option A: **I'll provide the materials** --- no
worker-supply surcharge. - Option B: **The professional brings the
materials** --- show a clearly disclosed estimated or fixed supply
charge, if supported. - Explain that the final material charge must be
disclosed before confirmation. Never silently add a surcharge. - If the
charge depends on the job, require a clear estimate/approval workflow;
do not invent an amount. - Preserve this choice in the booking summary
and backend payload.

**Step 4: Service address** - Use GPS only after requesting permission
and explaining why. - Allow selecting a saved address or entering a new
address, flat/doorstep details, landmark, and contact number if
needed. - Use OpenStreetMap-based location selection if that is the
existing stack; do not add a Google Maps dependency without approval. -
Display a pin/map preview and readable address. - Allow manual address
entry if GPS is unavailable or denied. - Validate service coverage on
the server before allowing confirmation. - Never display a full precise
address in public profiles or logs.

**Step 5: Review and confirm** Show a clean summary: - Service and task
notes. - Instant/scheduled selection, date and time. - Address
(appropriately truncated in summary). - Materials option and
surcharge. - Estimated hours/quantity, base rate, platform fee/tax if
applicable, and total estimate. - Cancellation terms and payment
method. - Primary CTA: **Confirm booking**. - Require explicit consent
before charging or placing a binding request. - Prevent double
submission and duplicate bookings on repeated taps.

### C09. Finding a professional / waiting state

After a valid request is created: - Show "Finding the right
professional..." with a calm animated location pulse or progress
indicator. - Show selected service, time, and a compact price
estimate. - Status text updates from the backend: searching, request
sent, professional accepted, no professional available, cancelled, or
expired. - Do not use a fake timer to claim a worker is being
contacted. - Provide **Cancel request** where the policy permits, with a
confirmation dialog if cancellation has consequences. - Use push
notification/deep-link handling if implemented; poll or subscribe using
the repository's existing mechanism. - If nobody accepts, show retry,
reschedule, or cancel options. Do not leave the user in an endless
spinner. - Once accepted, show professional's name, real profile photo,
rating/review count if available, verified status, service details, ETA
only if the system can calculate it, and a contact/help action. - Avoid
exposing the worker's personal phone number unless the product policy
explicitly permits it.

### C10. Booking details and status

Status timeline: 1. Request created 2. Professional accepted 3.
Professional on the way (only if supported) 4. Arrived / waiting for
start OTP 5. Service in progress 6. Service completed 7. Payment settled
8. Feedback submitted

Show only valid state transitions from backend. Include a help/dispute
entry point and a clear cancellation/reschedule policy.

### C11. Start OTP and attendance

-   Generate the start OTP securely on the server and display it only to
    the customer for the relevant booking.
-   Explain: "Share this code with your professional only when they
    arrive and you are ready to begin."
-   Worker enters the OTP in their app; backend verifies booking
    association, expiry, attempt limits, and state.
-   Successful verification changes the booking to "In progress" and
    records attendance time.
-   Do not store OTPs in plaintext logs or expose them to unrelated
    accounts.
-   Add rate limits and lockout/retry rules server-side.
-   Show a clear "Service started" state after server confirmation.
-   If OTP fails, show a recoverable error and safe retry; offer support
    after repeated failures.
-   End-of-service/completion confirmation must be a separate
    server-authorized event; the start OTP must not be reused as a
    completion code.

### C12. Payment and receipt

-   Customer pays the **platform**, not the worker directly, through the
    supported payment provider.
-   Show a final amount breakdown before payment: service charge,
    approved materials/supply charge, platform fee/taxes if applicable,
    discounts, and total.
-   Support only payment methods actually configured. If using a
    provider such as Razorpay, start in test mode and never claim a live
    transaction succeeded without a verified server-side webhook/status.
-   Payment states: pending, processing, successful, failed,
    refunded/partially refunded where supported.
-   Handle app closure, duplicate taps, delayed callbacks, and webhook
    delays safely.
-   Never store raw card data or UPI PINs. Use provider-hosted/SDK
    secure flows.
-   Issue a receipt/invoice view with booking ID, service date, line
    items, amount, payment status, and support action.
-   The platform's payout/commission calculation is backend-owned. Show
    the worker payout only according to configured policy and
    reconciliation status.

### C13. Feedback and reviews

After backend-confirmed completion: - Ask for a 1--5 star rating,
optional tags (punctual, professional, quality, communication), and
optional written feedback. - Make review submission one-time per
eligible booking unless moderation rules permit edits. - Avoid coercive
prompts and do not block receipt access. - Display submission success
and update booking state. - Report inappropriate behavior or raise a
complaint through a separate flow; a low rating alone is not a
substitute for a safety complaint.

### C14. Bookings

Tabs/filters: Upcoming, In progress, Completed, Cancelled. - Cards show
service, date/time, status, total estimate/paid amount, and next
action. - Tap to open booking details. - Empty states should explain how
to book and offer a home CTA. - Provide cancellation/reschedule only
when allowed by the backend policy.

### C15. Customer profile

-   Personal details and verified contact state.
-   Saved addresses.
-   Payment history/receipts.
-   Reviews submitted.
-   Help centre, FAQs, raise a query, privacy, terms, logout.
-   Do not show worker-specific earnings or KYC controls in customer
    profile.
-   Confirm before logout; handle session expiry cleanly.

### C16. Raise a query / support

-   Entry points from home, booking details, payment receipt, and
    profile.
-   Select topic: booking, payment, professional conduct/safety,
    account, other.
-   Link to a booking when relevant.
-   Message field and optional attachment only if supported.
-   Show ticket ID and current status after submission.
-   Provide an emergency/safety route appropriate to the product's
    actual operational capabilities; do not imply 24/7 response if not
    staffed.

## 7. Worker experience --- screen-by-screen specification

### W01. Worker entry

-   Use the same logo, typography, color system, and spacing, but
    worker-focused copy.
-   Heading: **"Turn your skills into income."**
-   Explain that the worker can choose the services they perform,
    availability, and service area.
-   CTA: **Register as a professional**.
-   Existing worker CTA: **Log in**.
-   Do not show the customer home/dashboard to an unapproved worker.

### W02. Worker registration wizard

Use a persistent progress indicator, one logical section per step,
save-and-resume where supported, and a clear "Why we need this"
explanation for sensitive information.

**Step 1 --- Contact details** - Full legal name. - Mobile number with
+91 prefix and OTP verification. - Email address and email verification
if required by policy/backend. - Show separate phone/email verification
states. - Validate duplicate accounts server-side. - Do not treat an
entered email as verified until the verification callback succeeds.

**Step 2 --- Profile photo / live selfie** - Explain: "Use a clear,
recent photo so customers can recognise you." - Offer camera capture and
gallery selection only if policy permits gallery selection; if a live
selfie is required for identity checks, use the camera-only flow for
that requirement. - Request camera permission contextually. - Show
framing guide, preview, retake, and confirm. - Validate image size/type
and upload progress. - Do not automatically label the selfie as verified
merely because it was uploaded.

**Step 3 --- Skills and services** - Multi-select from the backend's 15
service categories. - A professional can select multiple skills,
e.g. Electrical + Plumbing. - For each skill, collect relevant
experience/qualification details only where needed. - Optional skill
description and service-specific subcategories. - Explain that choosing
a skill affects which requests appear. - Prevent submission without at
least one service category. - Store skill-to-worker relationships as
multiple records, not one comma-separated string.

**Step 4 --- Experience and availability** - Years of experience or
experience band. - Languages spoken, if useful for matching. - Working
days/time slots. - Instant requests toggle and scheduled-job
availability, if supported. - Maximum service radius/areas served. -
Optional qualifications/certificates if required for certain
categories. - Do not promise job volume or income.

**Step 5 --- Service location** - GPS-based pin with manual address
correction. - Service radius or allowed localities. - Use OpenStreetMap
if consistent with the current app. - Ask permission with context; allow
manual entry if denied. - Confirm coverage before submission.

**Step 6 --- Identity / Aadhaar KYC** - This is highly sensitive
identity data. Explain purpose, storage, who can access it, retention,
and verification process before collection. - Collect only what is
necessary and legally permitted. Prefer a compliant verification
provider/token/reference flow over storing full Aadhaar images or
Aadhaar numbers directly. - If document upload is approved by the
product's compliance/legal owner, support front/back capture where
required, edge detection/crop preview, blur/glare checks, retake, secure
upload, and a clear consent checkbox. - Mask Aadhaar numbers in the UI
and logs; never expose documents to customers. - Encrypt sensitive data
in transit and at rest; restrict access to designated admin/KYC roles;
audit document access. - Show statuses: Not started, Uploading,
Submitted, Under review, Action required, Approved, Rejected. -
Rejection must include a clear reason and a safe resubmission path. -
Never claim Aadhaar verification succeeded merely because a photo was
uploaded. - Before production release, confirm the lawful basis,
consent, data minimization, retention, and current applicable Indian
identity-data requirements with qualified counsel/compliance.

**Step 7 --- Bank account / UPI payout details** - Collect the minimum
payout details supported by the payment/payout provider. - Options: bank
account details or UPI ID, depending on backend/provider support. -
Explain that details are used for payouts only. - Validate format
client-side, then verify server-side/provider-side where supported. -
Mask bank account/UPI details after save; never show full values in
dashboard. - Never collect UPI PIN, card PIN, or banking passwords. -
Store secrets/tokens through approved backend/provider controls, not
local plaintext storage.

**Step 8 --- Review and submit** - Summary of contact verification,
skills, service areas, photo, KYC and payout status. - Consent to worker
terms, payout terms, and relevant policies. - CTA: **Submit for
review**. - Submission must be idempotent and return a server-backed
application status. - Show a success screen explaining that the worker
cannot accept jobs until approved.

### W03. Worker application pending

-   Status banner: **"Your profile is under review."**
-   Show step-by-step checklist with completed/pending items.
-   Explain what can be edited while pending.
-   If more information is needed, show the specific requested action.
-   Do not display fake earnings, fake jobs, or an "accept requests"
    switch before approval.
-   Notifications may inform the worker of status changes if
    notification infrastructure exists.

### W04. Worker dashboard (approved only)

**Header** - Greeting and worker name. - Availability toggle (Online /
Offline) with confirmation and server state. - Profile
completion/verification indicator where appropriate.

**Key cards** - Earnings: today, this week, and month-to-date (based on
real backend data). - Completed jobs. - Average rating and review count
(only real values). - Upcoming job. - Performance/badges based on
explicit rules. - Requests near the worker, if availability and location
are enabled.

**Visual hierarchy** - One main earnings card with a subtle brand
gradient. - Secondary metric cards in a tidy two-column grid where space
allows. - A concise "Next job" card. - Avoid filling the screen with too
many equal-weight cards. - Provide useful skeleton, empty, and error
states.

### W05. Incoming job request

-   Request card/screen includes service type, short task description,
    approximate distance/area, proposed date/time, expected duration,
    materials responsibility, estimated worker earnings, and any
    required notes.
-   Do not expose the customer's full address or personal data before
    acceptance unless operationally required.
-   Show a clear request expiry only when enforced by backend.
-   Primary actions: **Accept request** and **Decline**.
-   Require confirmation for consequential actions if appropriate, but
    avoid unnecessary dialogs.
-   Accept must use server-side concurrency control so two workers
    cannot claim the same job.
-   On success, show confirmed booking details. On conflict/expiry,
    explain that the request is no longer available.
-   Declining should not create a punitive implication unless an
    explicit, transparent policy exists.

### W06. Worker requests

-   Tabs: New, Accepted/Upcoming, In progress, Completed.
-   Clear status labels and filters.
-   New requests show accept/decline actions.
-   Accepted jobs show schedule, customer instructions, safe
    navigation/location access if supported, and contact/support
    controls.
-   Completed jobs show payout status and job summary.
-   Empty state should explain how to set availability/service area.

### W07. Worker arrival and start OTP

-   Worker opens accepted job and marks **I've arrived** only if that
    state is supported.
-   Show a secure OTP input screen.
-   Explain: "Ask the customer for the start code when you are at the
    service location and ready to begin."
-   Submit OTP to backend; show loading, invalid/expired,
    too-many-attempts, and success states.
-   Do not allow the worker to self-mark a job started without server
    OTP verification.
-   Successful start moves job to In progress and records attendance.
-   Include support/escalation if the customer cannot access the OTP.

### W08. Work in progress and completion

-   Show task notes, booking timer only if the system actually records
    time, and materials confirmation.
-   If the job's actual duration determines price, implement
    server-authoritative start/end timestamps and an explicit
    customer-visible pricing policy.
-   Worker taps **Complete service**; backend moves the job to awaiting
    customer confirmation/payment/completion according to the actual
    policy.
-   Do not let the worker arbitrarily alter price or material fees after
    customer approval.
-   Any extra work/extra materials must use a change-request flow with
    customer approval before billing.

### W09. Worker earnings and payouts

-   Summary cards: available balance, pending balance, paid out, recent
    jobs.
-   Earnings breakdown per booking: customer charge, platform
    commission/fees as configured, approved adjustments, worker net
    earnings.
-   Show payout state: pending, processing, paid, failed.
-   Provide payout history and transaction/reference IDs where
    appropriate.
-   Never represent customer payments as worker earnings until
    settlement logic confirms the amount.
-   Payout calculations, commission, taxes, refunds and reconciliation
    must be server-authoritative.
-   If payout integration is not implemented, show a clearly labelled
    development state rather than fake "paid" status.

### W10. Worker badges, reviews and profile

-   Badges are earned through explicit backend rules, e.g. "On time" or
    "Highly rated"; never manually fabricate them.
-   Reviews show rating, date, service, and moderated text.
-   Worker can edit permitted profile fields, skills, service radius,
    schedule, profile photo, and payout details through secure flows.
-   Changes to identity/KYC-sensitive fields may require re-review.
-   Show account/verification status and support contact.
-   Keep customer-only items out of this profile.

## 8. Booking, status and pricing rules

### 8.1 Booking state model

Use a server-authoritative state machine. Suggested states: - `draft` -
`searching` - `accepted` - `worker_en_route` (only if implemented) -
`arrived` - `in_progress` - `awaiting_completion_confirmation` (if
required) - `completed` - `payment_pending` - `paid` - `cancelled` -
`expired` - `disputed` - `refunded` / `partially_refunded` where
supported

Define legal transitions in the backend. The client must not invent
transitions or let users jump between states by navigating to screens.

### 8.2 Price calculation

Before confirmation, calculate/display: - Service base rate × billable
duration/quantity. - Approved worker-supplied material charge, if
selected and supported. - Platform fee and applicable tax, if any. -
Discount, if valid. - Total estimate and whether the final total can
vary.

All pricing inputs must be validated server-side. A material surcharge
must be visible before the customer confirms. If the final bill can
change with actual duration, clearly explain the rule and show the final
bill before payment.

### 8.3 Payment and worker payout separation

-   Customer payment goes to the platform/payment provider flow.
-   Platform records payment status and handles refunds/disputes
    according to policy.
-   Worker net payout is calculated separately and paid through an
    approved payout mechanism.
-   Payment capture, booking completion, commission, payout eligibility,
    and payout settlement are separate concepts.
-   Do not build a wallet or escrow claim unless the provider and
    legal/business model support it.

## 9. Shared footer, support and informational content

The reference screenshots use a large, structured footer. For a native
Android app, adapt the footer into the **scrollable home/welcome
content** and a dedicated Help/About area; do not force a huge
website-style footer onto every transactional screen.

Footer sections: 1. HStaff logo and a one-sentence description:
"Reliable local help for everyday tasks, repairs, and home services." 2.
**Explore:** Services, How it works, Service areas. 3. **For
professionals:** Become a professional, Worker help, Earnings and
payouts. 4. **Support:** FAQs, Raise a query, Booking help, Safety and
trust. 5. **Legal:** Terms, Privacy policy, Cancellation/refund policy,
Worker terms. 6. Optional social links only if official accounts exist.
7. Bottom copyright line with current year. - Use a warm coral-to-pink
gradient as a contained background panel or soft wash, inspired by the
Invofy footer. Maintain text contrast and avoid a huge logo that pushes
useful content far below the fold. - All links must work. Do not show
placeholder social icons or dead destinations. - In booking flows, show
compact help/legal links rather than the full footer.

## 10. Navigation and flow maps

### Customer

`Launch → Welcome → Hire help → Login/OTP or Sign up → Customer Home → Search/Discover → Service Detail → Booking Stepper → Review → Request Matching → Accepted Booking → Arrival/Start OTP → In Progress → Completion → Payment/Receipt → Feedback → Bookings`

Alternative states: -
`Matching → No worker available → Retry / Schedule / Cancel` -
`Booking → Cancel/Reschedule → Policy confirmation → Updated status` -
`Payment → Failed/Pending → Retry/check status/support` -
`Any relevant screen → Raise a query → Ticket confirmation`

### Worker

`Launch → Welcome → Work as a helper → Login/OTP or Register → Contact verification → Selfie → Skills → Experience/Availability → Location → KYC → Payout details → Review/Submit → Pending review → Admin approval → Worker Dashboard → Incoming Request → Accept → Job Details → Arrival → Start OTP → In Progress → Complete → Earnings/Payout`

Alternative states: -
`Pending review → Action required → Update submission` -
`Pending review → Rejected → Read reason → Correct/resubmit` -
`Request → Expired/already accepted → Return to Requests` -
`OTP invalid → Retry/support` -
`Payout failed → Show reason if available → Update details/contact support`

### Admin dependency

`Worker submitted → Admin reviews identity/profile/skills → Approve / Reject / Request changes → Backend status update → Worker notified and mobile UI refreshed`

## 11. Component inventory

Build reusable, theme-aware components: - `HStaffLogo` -
`ScreenContainer` / safe-area wrapper - `TopBar` / `LocationPill` /
`NotificationButton` - `PrimaryButton`, `SecondaryButton`, `TextButton`,
`IconButton` - `TextField`, `PhoneField`, `OTPInput`, `PasswordField` if
applicable - `SectionHeader` - `ServiceCategoryTile` - `ServiceCard`,
`ProfessionalCard`, `BookingCard`, `RequestCard` - `PriceBreakdown` -
`StatusBadge`, `VerificationBadge`, `RatingSummary` - `StepProgress` -
`EmptyState`, `ErrorState`, `LoadingSkeleton` - `ConfirmDialog`,
`BottomSheet`, `Toast/InlineAlert` - `AddressPicker` / map preview -
`GradientPanel` (use sparingly) - `ReviewForm` - `FooterSections` for
welcome/home scroll content - Worker `EarningsSummaryCard`,
`AvailabilityToggle`, `KYCStatusCard`

Avoid creating multiple nearly identical components with slightly
different padding/colors. Centralize design tokens and variants.

## 12. Animation and interaction catalogue

  ------------------------------------------------------------------------
  Interaction             Behavior                 Target duration
  ----------------------- ------------------------ -----------------------
  Primary button press    Scale to 0.98 and subtle 100--140ms
                          opacity                  

  Screen navigation       Consistent slide/fade    180--260ms
                          transition               

  Service tile selection  Border/accent and gentle 140--180ms
                          scale                    

  Filter chips            Immediate selected state 120--180ms
                          with light transition    

  Accordion/FAQ           Height + opacity         180--220ms
                          transition               

  Booking step transition Fade/slide content;      180--240ms
                          preserve form state      

  Loading button          Disable duplicate taps;  Immediate
                          spinner replaces/joins   
                          label                    

  Search results          Debounced query,         Data-driven
                          skeleton-to-content      
                          transition               

  Matching professional   Gentle pulsing           Subtle, low-frequency
                          location/worker          
                          illustration             

  OTP success             Small                    180--240ms
                          checkmark/confirmation   
                          transition               

  Toast                   Slide/fade in and out;   180ms in
                          accessible announcement  

  Modal/bottom sheet      Fade backdrop + slide    200--260ms
                          sheet                    

  Worker availability     Animate thumb, then      160--200ms
  toggle                  reconcile with server    

  Dashboard refresh       Skeleton/refresh         Data-driven
                          indicator without layout 
                          jump                     
  ------------------------------------------------------------------------

Every animation must have a static fallback. Animation must never be the
only indication of state; include text/icon/state labels.

## 13. Loading, empty, error, offline and permission states

Every API-backed screen must handle: - Initial loading. - Refresh
loading. - Empty result. - Recoverable network error with retry. -
Authentication/session expiry. - Permission denied. - Partial data. -
Server validation error. - Duplicate submission. - Offline/no
connection. - Stale status or a booking changed elsewhere.

Location: - Explain why GPS is requested. - If denied, provide manual
address/search. - Never block browsing completely because GPS is
unavailable. - Confirm service coverage using backend rules.

Camera/photos: - Ask permission only when the user starts that action. -
Explain purpose and provide a recovery path if denied. - Show upload
progress and failure retry. - Avoid retaining temporary image files
longer than needed.

Notifications: - Ask at a meaningful point, not immediately at first
launch without context. - If denied, the app must still function;
provide in-app status refresh.

## 14. Accessibility and usability requirements

-   Minimum 48dp touch targets.
-   Support Android font scaling and screen readers
    (`accessibilityLabel`, role, state, hint as appropriate).
-   Keep text/background contrast strong, especially on gradients and
    pastel tiles.
-   Do not communicate status using color alone; include text and/or
    icon.
-   All forms have visible labels, meaningful error text, and sensible
    focus order.
-   OTP inputs support paste, keyboard navigation, and screen-reader
    descriptions.
-   Do not rely on placeholder text as the only field label.
-   Avoid horizontal scrolling for critical form fields.
-   Handle keyboard appearance, Android back button, status bar, and
    gesture navigation.
-   Test on compact and large Android phones and with enlarged font
    size.

## 15. Privacy, security and trust requirements

-   Treat Aadhaar, bank details, phone/email, precise location, and
    identity photos as sensitive.
-   Minimize collection and retention; obtain explicit consent and
    explain purpose.
-   Use TLS for network traffic, secure server storage, role-based
    access, access auditing, and masked UI/logging.
-   Never store OTPs, passwords, payment secrets, UPI PINs, or identity
    documents in debug logs.
-   Do not expose the customer's full address to workers before the
    business rules permit it; do not expose worker KYC to customers.
-   Client-side checks improve UX but do not replace backend validation.
-   Use server-side authorization for customer/worker roles and every
    booking/payment/KYC operation.
-   Apply rate limits and attempt limits to OTP, login, KYC uploads, and
    sensitive actions.
-   Use secure token storage appropriate to React Native and the current
    app stack.
-   Ensure admin approval is server-authoritative and auditable.
-   Before release, validate applicable Indian privacy, identity-data,
    payments, and consumer-protection requirements with qualified
    specialists.

## 16. React Native implementation guidance for the AI coding agent

### 16.1 First inspect, then edit

Before coding: 1. Inspect the repository tree and identify the actual
mobile app root. 2. Read `package.json`, navigation setup, app entry
point, theme files, API client, auth flow, and existing screens. 3.
Identify whether React Navigation or Expo Router is already used;
preserve the existing routing framework. 4. Identify whether the app is
Expo-managed or React Native CLI; do not introduce incompatible native
dependencies. 5. Identify current backend endpoints and data contracts.
Document missing endpoints rather than assuming they exist. 6. Locate
the supplied HStaff logo asset in the repo. If absent, add the approved
asset to the correct asset directory without altering its proportions.
7. Run the existing app/build/test commands and note baseline errors
before changing code.

### 16.2 Implementation order

**Phase 1 --- foundation** - Centralized theme tokens, typography,
spacing, radius, elevation. - Shared buttons, inputs, cards, section
headers, empty/loading/error states. - Logo integration and global
navigation/safe-area behavior.

**Phase 2 --- customer visual redesign** - Welcome/role entry. -
Login/OTP. - Customer home and service catalogue. - Service detail and
booking stepper. - Matching/waiting, booking details, OTP attendance. -
Payment/receipt, feedback, bookings, profile, support.

**Phase 3 --- worker visual redesign** - Worker entry and registration
wizard. - KYC/payout privacy states. - Pending/rejected/approved
application states. - Worker dashboard, requests, job details, OTP,
completion, earnings, profile.

**Phase 4 --- integration and polish** - Connect all screens to actual
API contracts. - Add loading/error/empty/offline states. - Verify deep
links/push notifications if supported. - Add accessibility and
responsive fixes. - Run tests and produce a change summary.

### 16.3 Code quality rules

-   Use TypeScript if the existing React Native project already uses it;
    do not migrate the entire app solely for this redesign.
-   Keep screen components focused; extract reusable UI components.
-   Use a central theme file and typed navigation params where
    applicable.
-   Avoid giant monolithic screen files, duplicated styling, hard-coded
    business rules, and arbitrary timeout-based fake API results.
-   Keep business logic and API calls out of presentational components
    where feasible.
-   Validate forms with the project's existing validation approach.
-   Use a consistent icon library already installed in the repository;
    do not mix emoji and unrelated icon sets.
-   Do not install a new animation/map/form library without checking
    existing dependencies and compatibility.
-   Use the repository's existing OpenStreetMap integration where
    available.
-   Keep API URLs and environment configuration out of committed
    secrets.
-   Provide concise comments for non-obvious state transitions and
    security-sensitive behavior.

### 16.4 API integration contract checklist

Confirm or define endpoints for: - Auth: request OTP, verify OTP,
refresh/logout, profile. - Customer: addresses, categories, service
catalogue, search/filter. - Booking: quote/price estimate, create
request, matching status, accept/decline, cancel/reschedule,
details/history. - Attendance: issue/start OTP, verify OTP, mark
arrival/start, completion. - Payments: create payment/order, verify
provider callback/webhook server-side, receipt, refund status. -
Reviews/support: submit review, create/list support ticket. - Worker:
application create/update, photo/document upload, KYC status, skills,
availability, service area, requests, accept/decline, earnings, payout
history. - Admin: approval/rejection/request changes and audit events on
the separate admin surface.

Use actual route names and schemas from the repository if they already
exist. Avoid inventing endpoint names in code before inspecting the
backend.

## 17. Acceptance criteria / definition of done

### Visual

-   [ ] Supplied updated HStaff logo is used consistently.
-   [ ] Customer and worker journeys look intentionally different while
    sharing the same brand system.
-   [ ] Login is clean, minimal, accessible, and keyboard-safe.
-   [ ] Customer home has a clear hero, search, popular services,
    trust/value content, help/query access, testimonials/FAQ only when
    legitimate, and structured lower-page content.
-   [ ] Footer content is organized and functional; it does not clutter
    transactional screens.
-   [ ] Cards, inputs, spacing, typography, icons, radii, and gradients
    are consistent.
-   [ ] No overlapping bottom navigation, clipped controls, or
    keyboard-obscured buttons.
-   [ ] Small-screen and large-font layouts remain usable.

### Customer workflow

-   [ ] Customer can choose a service and instant or scheduled booking
    where supported.
-   [ ] Customer can choose who supplies materials and sees any
    surcharge before confirming.
-   [ ] Customer can review address, time, service and full price
    breakdown before submission.
-   [ ] Matching status comes from the backend; no endless fake waiting
    state.
-   [ ] Start OTP is securely generated/verified by the backend.
-   [ ] Payment status is verified by the backend/provider; receipt and
    feedback work.
-   [ ] Booking history, support, and cancellation/reschedule states are
    clear.

### Worker workflow

-   [ ] Worker can verify contact details, select multiple skills, add a
    selfie, service area, KYC and payout details.
-   [ ] Sensitive data is masked and handled securely.
-   [ ] Worker remains blocked from accepting requests until admin
    approval.
-   [ ] Worker sees incoming requests only when eligible/available.
-   [ ] Accept/decline is concurrency-safe on the server.
-   [ ] Worker uses customer-provided start OTP to begin attendance.
-   [ ] Dashboard, badges, reviews, earnings, and payouts show actual
    backend data only.

### Engineering

-   [ ] Existing React Native architecture and navigation are preserved
    unless a documented reason requires change.
-   [ ] No Kotlin/Jetpack Compose rewrite is introduced.
-   [ ] No fake payment, verification, earnings, ratings, or booking
    success.
-   [ ] Every async flow has loading, success, error, and retry
    behavior.
-   [ ] Build/lint/tests run where available; remaining failures are
    documented.
-   [ ] The coding agent provides a final summary of files changed,
    screens completed, APIs used/missing, tests run, and unresolved
    risks.

## 18. Final instruction to the AI coding agent

Treat this document as the product and UI/UX source of truth. Start by
auditing the existing React Native repository and its API contracts.
Then implement the redesign incrementally, reusing working code and
shared components. Prioritize the logo, design tokens, role-specific
navigation, welcome/login, customer home, and complete booking lifecycle
before adding decorative polish. Build real, connected states wherever
the backend supports them; clearly identify any backend work still
required. Do not replace React Native with Kotlin/Jetpack Compose, do
not rewrite the backend without necessity, and do not fabricate data or
claim sensitive verification/payment actions succeeded when they have
not.
