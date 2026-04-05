# Product Requirements Document (PRD): Tasky

## 1. Executive Summary

**Product Name:** Tasky
**Version:** 1.3 (Execution Alignment & AI Operating Plan)
**Status:** Active Baseline (Solo-Operated)
**Authors:** Product Lead
**Date:** 2026-03-03
**Supersedes:** v1.2 (Research-Integrated Rollout Baseline)

### 1.1 Value Proposition

| Feature        | Current Alternative (Unegui/FB)                        | Tasky Solution                                                                                                          |
|:---------------|:-------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------|
| **Trust**      | "Stranger danger", no verification                     | ID-verified Taskers, mandatory bilateral reviews, dispute protection                                                    |
| **Booking**    | Call 10 people to find one available                   | Real-time availability, fast confirmed booking in early phases, push-driven supply activation                           |
| **Pricing**    | Haggle on the spot, "foreigner price", 60%+ hide price | Fixed budget set upfront, no surprises                                                                                  |
| **Visibility** | Pay-to-play SEO, extreme spam/re-posting               | Algorithmic matching based on quality and relevance, 1 verified profile per person                                      |
| **Payment**    | Cash/Transfer with no platform record                  | Graduated: direct settlement → incentivised digital → escrow (at the speed of user trust)                               |
| **Safety**     | No recourse if something goes wrong                    | In-app-first messaging, controlled contact reveal policy, dispute evidence trail, platform-exclusive reputation         |
| **Leakage**    | Easy to bypass after first contact                     | In-app communication by default, with controlled customer contact reveal only after paid lead unlock in Phase 2+ `[F7]` |

## 2. Problem Statement / Opportunity

### 2.1 Purpose

To build Mongolia's first **trust-centric** domestic service marketplace. Tasky creates the trust and execution layer
that Facebook groups and Unegui.mn structurally cannot provide — verified identity, dispute resolution, reputation
portability, and progressive payment infrastructure — while rolling out monetization at the speed of user trust, not
technical capability.

## 3. Goals

### 3.1 Program-Level KPIs

1. Task post to booking conversion rate
2. Booking completion rate
3. Repeat customer rate (30/60/90 day cohorts)
4. Time to first match
5. Dispute rate and resolution time
6. Review completion rate (target: >85%)
7. Disintermediation / leakage indicators `[F7]`
8. Verification queue throughput (time-to-verify SLA)
9. Net promoter score or equivalent trust metric

### 3.2 Goal Operating Rules

1. Unless explicitly stated otherwise, KPI gates use a trailing 28-day window.
2. KPI gates are considered valid only when each metric has at least 50 underlying events in the measurement window.
3. If data quality fails (missing events, tracking outage, corrupted logs), gate decisions are paused until data is
   repaired and backfilled.

## 4. Users / Personas / JTBD

### 4.1 Target Audience

* **Customers (Demand):** Busy urban professionals in Ulaanbaatar (25–45yo) who value time, safety, convenience and
  quality over the absolute lowest price. They struggle to find reliable help for cleaning, moving, and repairs.
  Secondary: expats and new apartment owners.
* **Taskers (Supply):** Skilled individuals (cleaners, handymen, movers) seeking consistent work and income security
  without the hassle of self-marketing on Facebook. Includes ger-district workers, informal labourers, and university
  students seeking flexible part-time income. Over 98% of current market supply are solo operators, validating a
  consumer-to-consumer (C2C) primary focus. `[F1, F5, F13]`

### 4.2 JTBD and ICP Priority Matrix (Phase 0-2 Focus)

| Side     | ICP Priority | Segment                                                                                    | Core JTBD                                                                                                                                   | Success Signal (Trailing 28d)                                                         | Failure Signal                                                       |
|:---------|:-------------|:-------------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------|:--------------------------------------------------------------------------------------|:---------------------------------------------------------------------|
| Customer | P0           | Time-constrained apartment households in launch district(s) booking cleaning/handyman jobs | When home tasks appear, help me secure a trustworthy Tasker quickly at a predictable budget without call-chain negotiation.                 | Median post-to-confirmed-booking <= 2h; booking completion >= 90%                     | >25% of tasks receive no qualified applicant in first 2h             |
| Customer | P1           | Expats and first-time apartment owners                                                     | When I do not have a trusted local provider network, help me compare verified options and book with clear recourse if quality fails.        | First-post-to-booking conversion >= 35%; dispute rate < 8%                            | Trust-related cancellations >10%                                     |
| Customer | P2           | Repeat households (monthly service needs)                                                  | When I need repeat service, let me rebook proven Taskers in a few taps with minimal coordination overhead.                                  | Repeat booking share >= 30% by cohort month 3                                         | Rebooking usage <10% of completed bookings                           |
| Tasker   | P0           | Verified semi-professional Taskers in launch district(s)                                   | When I am available today, show nearby relevant jobs so I can secure consistent weekly income without social-media self-marketing.          | First accepted booking <= 7 days after verification; weekly active tasker rate >= 60% | >40% of newly verified Taskers have no accepted booking after 7 days |
| Tasker   | P1           | Students and part-time workers (time-boxed availability)                                   | When I have limited time windows, surface jobs that match my schedule and distance constraints.                                             | Acceptance rate on notified jobs >= 20%                                               | Notification-to-application rate <8%                                 |
| Tasker   | P2           | Informal labourers transitioning to app-based work                                         | When joining digitally for the first time, guide me through verification and first booking with low friction and clear payout expectations. | Verification completion >= 70%; first-application completion >= 60%                   | Verification drop-off >35% before submission                         |

## 5. Scope (In / Out)

### 5.1 Scope Boundaries

#### In Scope (All Phases)

1. Customer onboarding (Facebook OAuth only in Phase 0-1; SMS OTP primary from Phase 2 onward) and profile
2. Task posting with category-specific structured intake forms, fixed price budget (no hourly), schedule, and location (
   Pin-drop + Description)
3. Tasker onboarding, profile, and identity verification (Gov ID upload + Manual approval with SLA)
4. Search, matching, booking, and status tracking
5. In-app messaging and notifications with controlled contact reveal policy by phase `[F7]`
6. Booking confirmation with explicit liability disclaimer
7. Mandatory bilateral ratings and reviews `[F8]`
8. Cancellation, disputes, and strike system
9. Essential admin operations (Dispute resolution, User moderation, Verification queue with SLA)
10. **Global Internationalization (i18n)**: UI supports English (`en`) and Mongolian (`mn`), with Mongolian as default
11. Anti-leakage information controls (progressive location reveal, in-app-first communication, paid contact unlock in
    Phase 2+)
12. Phased monetization system (free → lead-fee → subscription → escrow/wallet), feature-toggled
13. Analytics instrumentation for funnel, leakage, and trust metrics `[F3]`

#### Out of Scope (Until Specified Phase)

| Item                                           | Target Phase |
|:-----------------------------------------------|:-------------|
| SMS OTP authentication                         | Phase 2      |
| Referral program (Tasker + Customer)           | Phase 2      |
| E-Mongolia DAN verification integration        | Phase 2      |
| QPay payment integration                       | Phase 2      |
| Escrow / in-app wallet / payout operations     | Phase 3      |
| Runtime LLM chat-style intake in posting path  | Phase 3      |
| Cross-border services                          | Post-Phase 4 |
| Advanced dynamic pricing and promotions engine | Phase 4      |
| Multi-country compliance layers                | Post-Phase 4 |
| Full microservices decomposition               | Post-Phase 4 |
| B2B Lite (bulk-buyer subscriptions)            | Phase 2      |
| B2B Managed (SaaS platform, Shape B)           | Post-Phase 4 |

## 6. User Flows / Stories

### 6.1 Customer Flow

1. **Onboarding**: User downloads app → Authenticates (Phase 0-1: Facebook OAuth; Phase 2+: Phone OTP) → Creates
   Profile (Name, Avatar).
2. **Post a Task**: User selects "Cleaning" → Completes category-specific structured intake form (3-5 fixed questions)
   → Uploads Photos (0-3, optional) → Sets Location (Pin + "Behind State Dept Store") → Sets Schedule ("Tomorrow
   10 AM") → Sets Budget ("50,000 MNT") → Reviews auto-generated "Job Scope Summary" (editable) → Posts Task.
3. **Matching and Fast Confirmation** *(model evolves by phase — see Section 7.3)*:
    * *Phase 0–1 (Open Application):* User receives notifications of interested Taskers who applied → Views Tasker
      Profiles (Rating, Verified Badge, Review Count) → Accepts one.
    * *Phase 2+ (Algorithm-Assisted):* System proactively notifies best-matching Taskers and ranks applicants by
      relevance. User sees "Recommended" applicants at the top → Accepts one.
    * *Phase 3+ (Instant Match option):* For repeat bookings or high-liquidity categories, User can tap "Match me now"
      to auto-assign the highest-ranked available Tasker, or choose to review applicants manually.
4. **Confirmation**: User explicitly accepts the liability disclaimer and confirms booking. Service payment is settled
   directly between Customer and Tasker in Phase 0-2 (no platform wallet/escrow). In Phase 2, QPay is used for
   lead-unlock credit purchases. In Phase 3+, service payment can flow through QPay/escrow.
5. **Completion**: Tasker finishes job → User marks "Complete" → User is prompted to submit category ratings (quality,
   punctuality, communication) with optional freetext. Review policy is mandatory, but enforcement is soft first (
   completion prompt, 24h reminder, 72h reminder). Hard lock on next task posting is used only for risk-triggered
   cases (open dispute, 2 consecutive missed reviews, or active trust/safety investigation). `[F8]`

### 6.2 Tasker Flow (Progressive Verification)

1. **Level 1 (Window Shopper)**: Tasker downloads app → Authenticates (Phase 0-1: Facebook OAuth; Phase 2+: Phone OTP) →
   Selects intended Categories → **Enables Push Notifications**.
    * *State:* Unverified. Can view task feed and receive push alerts, but cannot apply. In Phase 1, Taskers can access
      the AI Profile Polish feature to automatically enhance their profile descriptions (single-player value).
2. **Level 2 (First Job Barrier)**: Tasker attempts to "Apply" to a task → Prompted to upload ID Card + Selfie → Submits
   for Review.
3. **Level 3 (Verified)**: Admin manually reviews ID + Selfie within **24-hour SLA** `[F9]` → Approves Tasker → Tasker
   matches and performs work.
4. **Finding Work** *(model evolves by phase — see Section 7.3)*:
    * *Phase 0–1:* Tasker browses "Open Tasks" feed → Filters by Category/Location → Applies to tasks of interest.
    * *Phase 2+:* Tasker also receives proactive push notifications for algorithm-selected tasks that match their
      category, proximity, and rating. Tasker can apply directly from the notification.
5. **Execution**: Tasker sees exact location *after* booking → Goes to site → Performs work → Marks "Done".
6. **Review**: Tasker is prompted to submit category ratings (task clarity, respectfulness, punctuality) with optional
   freetext. Review policy is mandatory, but enforcement is soft first (completion prompt, 24h reminder, 72h reminder).
   Hard lock on next application is used only for risk-triggered cases (open dispute, 2 consecutive missed reviews, or
   active trust/safety investigation). `[F8]`
7. **Settlement**: Phase 1: Tasker is paid directly by Customer using off-platform methods agreed in booking notes.
   Phase 2: settlement remains direct while Taskers pay lead-unlock credits via QPay. Phase 3+: escrow flow becomes
   available.

### 6.3 Referral Flow *(Phase 2+)* `[F4]`

1. **Tasker Referral**: Existing verified Tasker shares referral link → New Tasker signs up and completes first job in
   Phase 2+ → Both receive priority matching boost at launch; platform credit variants are enabled in later phases.
2. **Customer Referral**: Existing Customer shares referral link → New Customer posts first task that reaches completion
   in Phase 2+ → Referrer receives priority matching boost at launch; booking credit variants are enabled in later
   phases.

### 6.4 Unhappy-Path Flows and Decision Rules

The following rules are normative and mapped to Section 7 requirements.

1. **No Applicant Window (Phase 0-2)**: If a task has zero eligible applicants after 120 minutes during 08:00-22:00
   local time, system starts rescue flow: prompt customer to adjust budget/schedule, push to additional nearby verified
   Taskers, and queue for concierge dispatch follow-up.
2. **Selected Tasker Timeout**: In Phase 2 application flow, selected Tasker confirmation expires after 15 minutes. In
   Phase 3+ instant match flow, auto-match confirmation expires after 5 minutes. In both cases, the next ranked Tasker
   is notified and after 3 declines/timeouts the task falls back to open-application flow.
3. **No-Show Rule**: System sends both parties a pre-no-show reminder at scheduled start +10 minutes to update
   arrival/task status. At scheduled start +15 minutes, counterparty may flag `NO_SHOW` only if the system verifies
   neither party has submitted an in-app status update/check-in in the previous 30 minutes (including after the
   reminder), and no mutually accepted in-app reschedule has superseded that schedule. Booking transitions to `NO_SHOW`,
   enters admin reliability review, and repeated no-shows (>=2 in trailing 28 days) trigger strike review.
4. **Reschedule Confirmation Rule**: After booking is `ASSIGNED`, either party may request a new schedule in-app.
   Schedule changes are effective only after counterparty acceptance; chat-only agreements do not change schedule
   enforcement timers. On acceptance, no-show reminder/timers reset to the new confirmed schedule.
5. **Late Cancellation Rule**: Cancellation more than 4 hours before schedule is no-penalty. Cancellation within 4
   hours (or after arrival/check-in) records a reliability incident; first incident in trailing 28 days is warning-only,
   and 2 incidents in trailing 28 days trigger ranking penalty and potential strike review.
6. **Dispute Evidence Rule**: Disputes can be opened in `ASSIGNED` or within 24 hours of `COMPLETED`. At least one
   evidence artifact is required (chat excerpt, photo, or written timeline). If evidence is not provided after one
   reminder, dispute auto-closes after 24 hours as insufficient evidence.
7. **Review Escalation Rule**: Review submission is mandatory at policy level. Enforcement sequence is completion
   prompt -> 24h reminder -> 72h reminder -> hard lock only when risk conditions trigger (open dispute, 2 consecutive
   missed reviews, or active trust/safety investigation).

---

## 7. Functional Requirements

### 7.1 Authentication & Identity

* **REQ-AUTH-01** *(Phase 0-1)*: System MUST allow login/signup via Facebook OAuth as the exclusive authentication flow
  for all users in Phase 0-1. No alternate auth path is provided in this phase. `[F5]`
* **REQ-AUTH-02**: System MUST prevent duplicate accounts for the same `facebook_id`.
* **REQ-AUTH-03**: System MUST issue a secure Session Token (JWT) upon successful OAuth authentication.
* **REQ-AUTH-04**: System MUST allow a user to request Tasker role activation before identity verification (role becomes
  `TASKER`, status remains verification-gated).
* **REQ-AUTH-05** *(Phase 2)*: System MUST add SMS OTP and make phone verification mandatory for authentication in Phase
  2+. SMS rate-limiting and cost controls MUST be enforced. `[F5]`
* **REQ-AUTH-06** *(Phase 2 migration)*: Users created in Phase 0-1 with Facebook-only auth MUST register and verify a
  phone number via OTP before continuing normal usage in Phase 2+.
* **REQ-AUTH-07** *(Phase 2 identity model)*: For migrated users, `facebook_id` remains stored as secondary identity
  metadata; `phone_number` becomes the primary login identifier.
* **REQ-AUTH-08** *(Phase 2 new users)*: New users in Phase 2+ MUST be able to register with phone OTP without requiring
  a connected Facebook identity.
* **REQ-AUTH-09** *(Phase 0-1 outage posture)*: If Facebook OAuth is unavailable in Phase 0-1, new login/signup is
  unavailable and the service is treated as temporarily unavailable until Facebook recovers.
* **REQ-AUTH-10** *(Phase 0-1 outage operations)*: During OAuth outage windows, existing valid sessions MUST remain
  usable until normal session expiry, and clients MUST display a user-facing incident banner/state indicating login and
  signup are temporarily unavailable.

### 7.2 Task Management

* **REQ-TASK-00** *(Phase 0-2 baseline)*: Task posting MUST require category-specific fixed intake forms rendered from a
  database-managed `intake_schema` (JSON schema-driven dynamic renderer). In Phase 0-2, every active customer-postable
  category MUST have an active intake schema. Each active schema MUST define 3-5 required structured questions using
  fixed-choice primitives (single-select, multi-select, dropdown, yes/no toggle, numeric counter). Conversational LLM
  chat-style intake is out of scope in Phase 0-2. `[F17]`
* **REQ-TASK-01**: Customer MUST be able to create a task with: Category, Description, Photos (max 3), Location (
  Lat/Long + Text), Schedule (Date/Time), and Budget (Fixed Amount > 1,000 MNT to prevent placeholders). Description
  MAY be prefilled from REQ-TASK-07 and edited by the Customer before submit. `[F14]`
* **REQ-TASK-02**: Task status lifecycle MUST be: `OPEN` → `ASSIGNED` → `COMPLETED` | `CANCELLED` | `NO_SHOW`. A task
  moves to `ASSIGNED` when a Customer accepts a Tasker's application and confirms liability disclaimer acceptance. A
  task moves to `NO_SHOW` when its linked booking is finalized as `NO_SHOW` under REQ-BOOK-11.
* **REQ-TASK-03**: Taskers MUST be able to view a feed of `OPEN` tasks. `[F15]`
    * **Privacy Rule**: The feed MUST show only "Approximate Location" (e.g., District name or 500m radius). Exact
      address is HIDDEN until Booking is Confirmed. `[F7]`
* **REQ-TASK-04**: Task photos uploaded via presigned URL (S3/MinIO), max 3 photos per task.
    * **Flow**: Client requests Presigned URL(s) → Client uploads file(s) directly to Storage → Client submits Task
      creation with `photo_keys` array.
    * **Endpoint Pattern**: `POST /tasks/photos/upload-url` for pre-create uploads. `POST /tasks/{id}/photos/upload-url`
      may be used for post-create additions (max 3 total photos).
* **REQ-TASK-05**: Task categories are database-managed. Admin can add, edit, and deactivate categories. Taskers can
  filter feed by Category and Distance.
* **REQ-TASK-06**: Structured intake answers MUST be persisted with schema version metadata and returned in task detail
  payloads for Customer, Tasker, and Admin views.
* **REQ-TASK-07** *(Phase 0-2)*: Before final task submit, system MUST generate a human-readable "Job Scope Summary"
  from intake answers using deterministic template rules. Customer MAY edit this summary before posting.
* **REQ-TASK-08** *(Phase 3+ optional)*: If `ai_scope_summary_enabled` is activated, system MAY asynchronously rewrite
  the Job Scope Summary with LLM after form completion. Task posting MUST remain available with deterministic summary
  fallback if AI generation fails or is unavailable.
* **REQ-TASK-09**: Task posting drafts MUST bind to the `intake_schema_version` loaded at draft start; submit-time
  validation MUST use that bound version even if a newer schema version is activated later.
* **REQ-TASK-10**: If deterministic Job Scope Summary generation fails, task posting MUST fail open by generating a
  canonical structured fallback summary from raw intake answers (key-value format), and MUST log the failure for
  operations review.
* **REQ-TASK-11**: When a category is deactivated, creation of new drafts and new task posts for that category MUST be
  blocked, while existing tasks remain visible and continue lifecycle operations under their original category data.

### 7.3 Booking & Matching

The matching model graduates across phases, following the same trust-before-automation principle as monetization.
Industry precedent (TaskRabbit, Thumbtack) shows that open-bidding models work at low liquidity but break at scale —
completion rates drop as matching friction grows faster than liquidity. Algorithmic matching requires rating and
behavioural data that does not exist at launch. Therefore: start manual, graduate to algorithmic.

#### Matching Model Evolution

| Phase         | Model                                   | How it works                                                                                                                                                                                                                                                                                                                   |
|:--------------|:----------------------------------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Phase 0–1** | **Open Application**                    | Taskers browse the task feed and apply to tasks of interest. Customer reviews applicants and selects one. Founder's concierge dispatch mode (REQ-ADMIN-07) is the backstop for unmatched tasks.                                                                                                                                |
| **Phase 2**   | **Algorithm-Assisted Application**      | When a task is posted, the system proactively notifies the best-matching Taskers (ranked by category match, proximity, rating, completion rate, and availability). Taskers still apply; Customer sees applicants sorted by platform-computed relevance score with a "Recommended" label on top-ranked applicants.              |
| **Phase 3+**  | **Hybrid: Application + Instant Match** | The Phase 2 model remains the default. Additionally, for repeat bookings and high-liquidity categories (≥10 verified Taskers with >4.0 rating within the district), Customers can opt for "Match me now" — the system auto-assigns the highest-ranked available Tasker. Customer can always fall back to reviewing applicants. |

#### Requirements

* **REQ-BOOK-01**: Tasker can "Apply" to an `OPEN` task. In Phase 0–1, Taskers discover tasks by browsing the feed. In
  Phase 2+, the system additionally sends proactive push notifications to the best-matching Taskers for each new task.
* **REQ-BOOK-02**: Customer can view list of Applicants and "Confirm" one. In Phase 2+, applicants MUST be sorted by a
  platform-computed relevance score (inputs: category match, proximity, rating, completion rate, review count).
  Top-ranked applicants are labelled "Recommended".
* **REQ-BOOK-03**: Booking is final when a Customer accepts an applicant and explicitly accepts liability disclaimer
  terms. In Phase 2+, applicant acceptance is completed only after the selected Tasker spends the required lead-unlock
  credits (see REQ-PAY-11).
* **REQ-BOOK-04**: Customer Cancellation Policy: Free cancellation > 4 hours before start. Late cancellation (< 4 hours)
  results in a cancellation fee (Phase 2+) or a reliability incident warning on the first occurrence. A second late
  cancellation within 28 days flags the user's future tasks with a "Low Customer Reliability" warning visible to
  applicants, and revokes their access to Instant Match (REQ-BOOK-08) for 30 days.
* **REQ-BOOK-05**: Booking status lifecycle MUST be: `ASSIGNED` → `COMPLETED` | `CANCELLED` | `NO_SHOW`. This is
  separate from the Task status lifecycle.
* **REQ-BOOK-06**: Tasker Cancellation Policy: Tasker may cancel a booking, which incurs a moderation strike; task
  reverts to `OPEN`. 3 strikes within a 30-day rolling window result in an automatic 7-day suspension. Exception:
  Taskers may select "Safety/Fraud" as the cancellation reason, which bypasses the automated strike but immediately
  opens a Trust & Safety investigation ticket. Abuse of the safety override results in immediate platform review.
* **REQ-BOOK-07**: Repeat Booking shortcut: Customer can rebook a previously hired Tasker with one tap for a new task in
  the same category. `[F7]`
* **REQ-BOOK-08** *(Phase 3+)*: **Instant Match**: For categories meeting the high-liquidity threshold (≥10 verified
  Taskers with >4.0 rating in-district), Customers MAY choose "Match me now". The system auto-assigns the highest-ranked
  available Tasker based on the relevance score. The Tasker receives a time-limited accept/decline notification (
  5-minute window). If declined or expired, the next-ranked Tasker is notified. After 3 declines, the task falls back to
  the standard application flow.
* **REQ-BOOK-09**: No-applicant rescue flow: if a task has zero eligible applicants after 120 minutes during 08:00-22:00
  local time, the system MUST trigger rescue actions (prompt budget/schedule adjustment, broadened push activation, and
  concierge queueing).
* **REQ-BOOK-10**: Selected Tasker timeout standards MUST be phase-specific: 15-minute window for selected applicant
  confirmation in Phase 2, and 5-minute window for auto-match confirmation in Phase 3+. After 3 declines/timeouts, flow
  falls back to open application.
* **REQ-BOOK-11**: No-show handling MUST enforce reminder + dual-inactivity verification against the current confirmed
  schedule: at scheduled start +10 minutes, system MUST notify both parties to update arrival/task status; at scheduled
  start +15 minutes, counterparty MAY flag `NO_SHOW` only if system verifies neither party has posted an in-app status
  update/check-in in the preceding 30 minutes (including after the +10 reminder), and no accepted in-app reschedule has
  superseded the schedule. When validated, booking transitions to `NO_SHOW`, enters reliability review, and repeated
  no-shows (>=2 in trailing 28 days) trigger strike review.
* **REQ-BOOK-12**: Assigned-booking reschedule flow: while booking is `ASSIGNED`, either party MUST be able to submit a
  reschedule request with proposed Date/Time and optional reason. Counterparty can accept or decline. If accepted, the
  linked task `ScheduleTime` is updated, booking remains `ASSIGNED`, and no-show reminder/timers reset to the new
  schedule. If declined or unanswered until the current scheduled start time, the original schedule remains active.
* **REQ-BOOK-13**: Schedule authority and auditability: chat messages may discuss schedule changes, but policy timers (
  no-show and late cancellation) MUST use only the latest mutually accepted in-app schedule. System MUST persist
  immutable booking timeline events for reschedule request, accept, decline, and expiry actions.

### 7.4 Information Controls `[F7]`

These controls serve different purposes depending on the monetization phase:

* **Phase 0–1 (no fees):** The primary rationale is **habit formation and repeat-booking capture**. There is no fee to
  bypass, so "anti-leakage" is not the driver. Instead, keeping all communication in-app ensures: (a) users form the
  habit of platform-mediated contact *before* fees exist, so the transition to paid phases is frictionless; (b) repeat
  bookings flow through the platform rather than via a phone number exchanged on booking #1; (c) dispute evidence is
  complete even when settlement is off-platform.
* **Phase 2+ (fees active):** The rationale shifts to **anti-leakage**. With lead fees or escrow in place, information
  control becomes the highest-leverage mechanism to prevent platform bypass. `[F6, F7]`

* **REQ-LEAK-01**: Tasker phone numbers MUST NEVER be displayed to Customers in the UI — not in profiles, not in booking
  confirmations, not anywhere.
* **REQ-LEAK-02**: Customer contact details (phone) MUST be hidden until the selected Tasker accepts the booking and
  spends lead-unlock credits in Phase 2+.
* **REQ-LEAK-03**: Exact task address MUST be revealed only after booking is confirmed (Phase 1) or after lead
  unlock/payment commitment in paid phases.
* **REQ-LEAK-04**: In-app message content MUST be monitored for phone number sharing patterns (automated detection with
  admin alert). Enforcement is advisory in Phase 0–1, escalating in later phases.
* **REQ-LEAK-05**: Dispute resolution and platform guarantees (when introduced) MUST be explicitly limited to
  on-platform bookings. Off-platform arrangements have zero platform recourse — both parties must be informed of this.

### 7.5 Monetization (Phased) `[F6]`

Monetization is implemented in four stages, each behind a feature toggle. Progression between stages is gated by trust
and usage milestones, not calendar dates.

#### Phase 0-1 — Free (0% Commission, Direct Settlement)

* **REQ-PAY-01**: In Phase 0-1, platform fees are ZERO. Core matching is completely free for both Customers and Taskers.
* **REQ-PAY-02**: Settlement occurs directly between Customer and Tasker off-platform (cash, bank transfer, or
  peer-to-peer QPay at their discretion). The platform does not intermediate payment.
* **REQ-PAY-03**: Booking flow MUST include clear messaging that payment is arranged directly between parties and that
  the platform is a connector, not a payment processor.

#### Phase 2 — Standard Lead-Fee (Credit-Based Accept-to-Unlock)

Lead fees use an on-platform **credit system**. Core matching remains free in Phase 2 (free browse/apply/selection). The
lead fee is charged only when the selected Tasker accepts and unlocks Customer contact information. This preserves
low-friction matching while standardizing monetization on confirmed lead intent.

* **REQ-PAY-10**: In Phase 2, Taskers MUST be able to browse and apply to tasks for free. Core matching remains free for
  both Customers and Taskers.
* **REQ-PAY-11**: After a Customer selects an applicant, the selected Tasker receives a confirmation notification with a
  **15-minute** accept/decline window. Accepting consumes lead-unlock credits and unlocks Customer contact information.
* **REQ-PAY-12**: If the selected Tasker declines or the window expires, the Customer is prompted to select the next
  applicant. No credit is charged when the selected Tasker declines or times out.
* **REQ-PAY-13**: If a booking is cancelled by the Customer after lead unlock, the spent credits MUST be refunded to the
  Tasker's credit balance.
* **REQ-PAY-14**: Lead-unlock credit pricing MUST follow category-tiered pricing
  as defined in REQ-PAY-27. The initial ramp-up period MAY use a flat introductory
  rate before tiered pricing activates, configurable by admin.
* **REQ-PAY-15**: Credit charge points in Phase 2 are restricted to accepted lead unlock events only; the platform MUST
  NOT charge credits for browsing or applying.
* **REQ-PAY-16**: Customer retains full selection agency from the applicant list (algorithm-ranked in Phase 2).
* **REQ-PAY-17**: Applications per task MAY be capped (configurable, default: 10) to maintain reasonable Tasker success
  rates.
* **REQ-PAY-18**: System MUST surface each Tasker's application success rate and unlock conversion metrics in the Tasker
  analytics dashboard.

##### Phase 2 Credit System Requirements

* **REQ-PAY-19**: **Credit Packs**: Taskers purchase credits via QPay in tiered packs (e.g., 5 credits, 10 credits, 20
  credits). Larger packs offer a discount (e.g., 10 credits for the price of 8). Credit pack pricing is configurable by
  admin.
* **REQ-PAY-20**: **Early Adopter Subsidy**: All newly onboarded Taskers receive **5 free credits** on signup. This
  covers the first lead unlock events under the standard Phase 2 model.
* **REQ-PAY-21**: Credit balance MUST be prominently displayed in the Tasker's app. Low-balance alerts MUST be sent when
  balance reaches 1 credit.
* **REQ-PAY-22**: Credits are non-expiring and non-refundable for cash (refunds from cancelled bookings return credits,
  not MNT). Legal review required for stored-value regulatory classification.

##### Phase 2 Promoted Listings & Visibility Products

* **REQ-PAY-23**: **Promoted Listing "Онцлох"**: Task owners MAY purchase a 7-day
  visibility boost at 15,000 MNT via QPay one-time payment. Promoted tasks receive
  a sort-order boost in category feed and a visual "Онцлох" label. Maximum one
  active promotion per task. Feature-gated behind `promoted_listings_enabled` toggle.
* **REQ-PAY-24**: **Urgent Boost "Яаралтай"**: Task owners MAY purchase a 3-day
  high-priority boost at 25,000 MNT via QPay one-time payment. Urgent tasks appear
  above promoted tasks in feed and push notifications. Visual "Яаралтай" label.
  Feature-gated behind `promoted_listings_enabled` toggle.

##### Phase 2 B2B Lite (Domain Model)

B2B Lite targets Airbnb/Booking.com hosts, offices, and restaurants as high-volume
bulk buyers of the existing marketplace. B2B tasks reuse the standard task/booking
flow — B2B is a thin coordination layer, not a parallel system.

* **REQ-PAY-25**: **Business Accounts**: System MUST support business account
  registration with: account name, owner (FK → users, CUSTOMER role), locations
  (label, address, PostGIS coordinates), and members (OWNER, MANAGER roles).
  Business account CRUD is feature-gated behind `b2b_enabled` toggle.
* **REQ-PAY-26**: **B2B Task Tagging & Priority Dispatch**: Tasks created by
  business members on behalf of a business account MUST be tagged with
  `business_account_id`. B2B tasks receive a configurable priority weight boost
  in the matching/ranking algorithm. The standard task/booking flow is reused —
  no separate B2B booking path. Business members can list all tasks for their
  account.
* **REQ-PAY-27**: **Category-Tiered Lead Credit Pricing**: Lead-unlock credit
  cost MUST vary by category tier. Initial tiers: Cleaning/Moving 1,500 MNT,
  Plumbing/Electrical 3,000 MNT, Renovation/Tutoring 5,000 MNT. Tier-to-category
  mapping is admin-configurable. REQ-PAY-14 (ramp-up policy) is refined by
  this requirement to use tiered pricing instead of flat ramp-up.
* **REQ-PAY-28**: **Grandfathering**: Taskers who completed 5+ bookings before
  the first paid product launch receive a permanent 5% discount on all future
  paid products (subscriptions, credit packs). Implemented as a `grandfathered`
  flag on user profile. Discount is applied at checkout.

#### Phase 3 — Subscription + Escrow

* **REQ-PAY-30**: **Tasky Pro Subscription**: Taskers holding the earned Pro Badge
  (REQ-SAFE-04) are eligible for a monthly subscription with two tiers:
    * **Standard** (9,900 MNT/month): 3 free lead unlocks per month, priority
      ranking in search results, Pro Subscriber visual indicator.
    * **Premium** (29,000 MNT/month): 10 free lead unlocks per month,
      top-of-category placement, analytics dashboard (application success rate,
      profile views, earnings summary), portfolio showcase (up to 10 photos).
  Subscription requires the earned Pro Badge as an eligibility gate. Pro Badge
  uses hysteresis thresholds: assigned at >=4.5 avg rating, revoked at <4.0
  (already implemented in `BadgeEvaluationService.java`). Taskers who lose
  Pro Badge status retain their active subscription until the current billing
  period ends, then cannot renew until Pro Badge is re-earned. Subscription
  billing via QPay recurring.
  Feature-gated behind `subscription_enabled` toggle.
* **REQ-PAY-31**: Integration with **QPay** to generate QR/Deeplink for Customer payment at booking confirmation.
* **REQ-PAY-32**: System MUST support **opt-in escrow** flow: For bookings above
  a configurable threshold (initial: 300,000 MNT), Customer MAY choose deposit
  protection at booking confirmation. When opted in: Customer pays 10-20% deposit
  via QPay → funds held by platform → released to Tasker's wallet 4 hours after
  Customer marks completion (or earlier if manually confirmed). Escrow is NOT
  the default settlement mode. Direct settlement remains available for all
  bookings. `[F6]`
* **REQ-PAY-33**: System MUST record a "Pending Credit" to Tasker's internal wallet upon job completion.
* **REQ-PAY-34**: System MUST deduct a configurable Platform Fee (initial: 5% for Phase 1/2 cohort Taskers, 10–15% for
  new Taskers post-Phase 3) before crediting Tasker.
* **REQ-PAY-35**: Tasker MUST be able to request a "Payout" of their wallet balance.
* **REQ-PAY-36**: Admin MUST have a view to see "Pending Payouts" and mark them as "Processed" (Manual bank transfer
  initially).
* **REQ-PAY-37**: Payout schedule is fixed: Tuesdays and Fridays. Tasker requests payout, admin processes on next
  scheduled day.
* **REQ-PAY-38**: Exact task address MUST be gated behind payment commitment (escrow deposit) once escrow is active.
* **REQ-PAY-39**: **B2B Subscription Billing**: Business accounts (REQ-PAY-25) MUST
  be offered monthly subscription plans:
    * **Host Lite** (99,000 MNT/location/month): Single-unit Airbnb hosts and
      guesthouses. Priority dispatch for tasks from this account.
    * **Ops Standard** (249,000 MNT/location/month): Offices, restaurants, and
      heavy-use hosts. Priority dispatch plus dedicated concierge escalation path.
  Billing occurs on the account's `billing_cycle_day` (1-28) via QPay payment link.
  Plan pricing is stored as `PricingPlan` rows and is admin-configurable.
  Feature-gated behind `b2b_enabled` toggle.

#### Phase 4 — Recurring Revenue & Ecosystem

* **REQ-PAY-40** *(Phase 4)*: **Tasky Plus (Customer Subscription)**: Monthly
  subscription for priority matching (< 1 hour guarantee), waived trust fees,
  saved favorites, and home service history.
* **REQ-PAY-41** *(Phase 4)*: **B2B Managed (Shape B)**: Contingent on B2B Lite
  (REQ-PAY-25/26/39) validation. Adds recurring schedule templates, SLA
  guarantees, PMS integrations (Guesty, Hostaway), and Multi-Site plan (599,000
  MNT/company/month, up to 5 locations). Requires demonstrated Shape A traction:
  20+ paying B2B accounts for 3+ consecutive months.
* **REQ-PAY-42** *(Phase 4)*: SocialPay and bank-transfer alternatives alongside
  QPay.
* **REQ-PAY-43** *(Phase 4)*: **Family Plan** (19,900 MNT/month): Priority
  matching to Pro-subscribed providers, saved provider favorites, household
  service history.

### 7.6 Trust & Safety

* **REQ-SAFE-01**: Tasker profile MUST be "Pending" until Admin manually approves the ID upload within a **24-hour SLA
  target**. `[F9]`
    * **Upload Pattern**: ID images are uploaded using presigned URL endpoint(s), and submitted by storage key.
  * **First-cohort concierge**: For the first 50 Taskers, verification MAY include a brief video or in-person interview
    conducted by the founder to establish a baseline trust standard.
* **REQ-SAFE-02**: Both parties MUST submit a structured review after a booking reaches `COMPLETED` status. **Reviews
  are mandatory** and enforced by default through a soft-gate sequence (completion prompt + reminders at 24h and 72h).
  Hard lock on the Customer's next task posting and the Tasker's next application applies only when risk conditions are
  met: open dispute, 2 consecutive missed reviews, or active trust/safety investigation. `[F8]`
    * **Review structure**: Star ratings (1–5) across predefined categories, plus an optional freetext comment. Category
      ratings reduce inflation in high-context cultures by forcing granular evaluation; optional freetext keeps friction
      low in the soft-gate flow.
    * **Customer → Tasker categories**: Quality of work, Punctuality, Communication.
    * **Tasker → Customer categories**: Task description clarity, Respectfulness, Punctuality.
    * **Display**: Tasker profiles show per-category averages alongside the overall average. Customer profiles show
      overall average only.
* **REQ-SAFE-03**: Either party can raise a "Dispute" if the booking is `ASSIGNED` (work in progress) or `COMPLETED` (
  within 24h).
    * **Phase 1 resolution policy**: Disputes are handled as evidence-only mediation. No monetary compensation, refund,
      or platform credit is issued by Tasky for direct-settlement bookings.
    * **Wrongful party handling**: If admin determines a clear wrongful party, an internal misconduct note is attached
      to that user's profile. This note is visible to admins only.
* **REQ-SAFE-04**: System MUST auto-assign "Pro Badge" to Taskers with >15 completed jobs and >4.5 average rating during
  Phase 0-1. Thresholds are reviewed and may be revised in later phases as liquidity grows.
* **REQ-SAFE-05** *(Phase 2)*: E-Mongolia DAN integration as a fast-path verification alternative to manual ID review.
  Manual review remains as fallback. `[F9]`
* **REQ-SAFE-06**: System MUST track and surface "Tasker Reliability Score" based on: completion rate, punctuality
  rating average, overall review average, and cancellation history. This score influences search ranking in Phase 2+
  algorithmic matching.
* **REQ-SAFE-07**: Before ID/selfie upload, user MUST explicitly consent to identity-data processing. Consent record
  MUST include policy version, timestamp, and user ID.
* **REQ-SAFE-08**: Admin access to verification media MUST be audit-logged (viewer ID, action, timestamp, object key).
* **REQ-SAFE-09**: Identity data retention/deletion MUST follow policy-driven lifecycle rules and support user-initiated
  account deletion requests.
* **REQ-SAFE-10**: Dispute evidence minimum: a dispute opened from `ASSIGNED` or within 24 hours of `COMPLETED` MUST
  include at least one evidence artifact (chat excerpt, photo, or written timeline). If evidence remains missing 24
  hours after reminder, dispute auto-closes as insufficient evidence.
* **REQ-SAFE-11**: Review enforcement timing MUST follow soft-gate cadence: immediate completion prompt, reminder at 24
  hours, reminder at 72 hours, and hard lock only for risk-triggered cases defined in REQ-SAFE-02.

### 7.7 Notifications

* **REQ-NOTIF-01**: System MUST send Push Notifications for:
    * Tasker (Unverified & Verified): New matching task nearby (Critical for supply activation). `[F1]`
    * Tasker: "You are hired!" (Booking confirmed).
    * Tasker *(Phase 2)*: "A Customer selected you! Accept and unlock contact with credits" (15-minute accept/decline
      window).
    * Customer: "Tasker applied to your task".
    * Customer: "Tasker marked job complete".
    * Customer *(Phase 2)*: "Tasker declined — select another applicant" (if selected Tasker declines or times out).
    * Customer/Tasker: Reschedule request received (from counterparty) for an `ASSIGNED` booking.
    * Customer/Tasker: Reschedule outcome (accepted/declined/expired).
    * Customer/Tasker: Pre-no-show reminder at scheduled start +10 minutes to update arrival/task status (used by
      REQ-BOOK-11 verification).
    * Customer/Tasker: Reminder to complete review for last booking (if not yet submitted), with reminders at 24h and
      72h.
    * Customer/Tasker *(Phase 2+)*: Referral reward earned.
    * Tasker: Low credit balance alert (balance ≤ 1 credit).
* **REQ-NOTIF-02** *(Phase 2)*: System MUST send SMS fallback for "Hired" and "Booking Confirmed" events if app is not
  open. SMS requires Phase 2 OTP infrastructure.

### 7.8 In-App Messaging

* **REQ-MSG-01**: In-app messaging between Customer and Tasker, available after a Tasker applies to a task. Real-time
  delivery via WebSocket (STOMP).
* **REQ-MSG-02**: Message history MUST be persisted and accessible to both parties and admin (for dispute resolution).
* **REQ-MSG-03**: Messaging is the default communication channel between parties. In Phase 2+, Customer contact
  information is revealed only to the selected Tasker after paid lead unlock; Tasker contact details remain hidden from
  Customers. `[F7]`

### 7.9 Admin & Operations

* **REQ-ADMIN-01**: Admin Dashboard MUST allow searching Users by Name and Facebook ID (Phone Number search added in
  Phase 2 when SMS OTP is active).
* **REQ-ADMIN-02**: Admin MUST have a "Dispute Manager" view:
    * See disputed task details and chat logs.
    * Action: "Resolve for Customer", "Resolve for Tasker", or "Escalate" with rationale notes.
  * **Phase 1 rule**: resolution is evidence-only mediation. Admin can add/update an internal misconduct note on the
    wrongful party profile (admin-visible only).
  * **Phase 3 Extension**: monetary "Refund/Release" actions when wallet is enabled.
* **REQ-ADMIN-03**: Admin MUST be able to "Ban User" (prevents login).
* **REQ-ADMIN-04**: Admin MUST have a **Verification Queue** dashboard showing pending Tasker verifications, sorted by
  submission time, with SLA countdown (24h target). Queue throughput is a tracked operational metric. `[F9]`
* **REQ-ADMIN-05**: Admin MUST have a **Category Management** interface to add, edit, deactivate, and reorder seed
  categories, and to create/update/activate versioned category `intake_schema` definitions. Schema activation MUST
  require lint/validation checks, preview against sample payloads, canary activation controls, and rollback to the last
  known good schema version.
* **REQ-ADMIN-06**: Admin MUST have a **Feature Toggle** panel to control monetization phase activation (lead-fee,
  promoted-listings, b2b, subscription, escrow) without code deployment.
* **REQ-ADMIN-07**: **Concierge Dispatch Mode** *(Phase 0-1)*: Admin/founder can manually assign a Tasker to a task,
  overriding the normal application flow. Used for the first ~30 bookings to guarantee fulfillment quality within
  founder ops capacity. `[Gemini1 — Wizard of Oz]`

### 7.10 Referral Program `[F4]`

* **REQ-REF-01** *(Phase 2)*: Both Taskers and Customers MUST have a shareable referral link/code accessible from their
  profile.
* **REQ-REF-02** *(Phase 2)*: Referral attribution MUST be tracked: who referred whom, when, and conversion event (first
  completed booking).
* **REQ-REF-03**: Referral rewards are:
    * Phase 2 (launch): Priority matching boost (referred Tasker's applications surface higher for 30 days).
    * Phase 3+: Platform credit applied to lead fees (Taskers) or booking credits (Customers).
* **REQ-REF-04** *(Phase 2)*: Referral fraud detection: cap rewards at 10 successful referrals per user per month.

### 7.11 Frontend Design System

* **REQ-UI-01**: Web UI MUST be implemented using `shadcn/ui` primitives as the base component library. New web screens
  and features MUST compose from those primitives rather than introducing additional UI component frameworks.
* **REQ-UI-02**: Mobile UI MUST implement platform-native component equivalents that follow the same design tokens,
  naming semantics, states, and interaction behaviour defined by the web design system.

### 7.12 Functional Requirement Acceptance Criteria Matrix

#### 7.12.1 Authentication & Identity

* **REQ-AUTH-01**: In Phase 0-1, only Facebook OAuth login/signup endpoints are enabled; any non-Facebook auth endpoint
  returns `403 FEATURE_DISABLED`; E2E auth tests pass for both Customer and Tasker personas via Facebook OAuth.
* **REQ-AUTH-02**: Creating a second account with an existing `facebook_id` is blocked with deterministic
  `409 DUPLICATE_IDENTITY`; database enforces unique index on `facebook_id`; duplicate-attempt test is present.
* **REQ-AUTH-03**: Successful OAuth login returns a signed JWT with `sub`, `role`, `exp`, and `iat` claims; token expiry
  is enforced server-side; invalid signature and expired-token requests are rejected with `401`.
* **REQ-AUTH-04**: A verified Customer can request Tasker activation and receives role `TASKER` with verification status
  unchanged; applying to tasks before verification is blocked with `403 VERIFICATION_REQUIRED`.
* **REQ-AUTH-05**: In Phase 2+, phone OTP is mandatory for sign-in/up; OTP requests are rate-limited per phone and
  request source using configuration-defined limits; exceeded attempts return `429`.
* **REQ-AUTH-06**: Migrated Phase 0-1 users are hard-gated to OTP phone verification before non-auth product actions;
  all gated endpoints return `403 OTP_MIGRATION_REQUIRED` until verification completes.
* **REQ-AUTH-07**: For migrated users, login by `phone_number` succeeds and `facebook_id` remains retrievable as
  read-only metadata; identity lookup and audit logs mark `phone_number` as primary credential.
* **REQ-AUTH-08**: In Phase 2+, new users can complete registration/login with OTP only, without linking Facebook;
  registration flow test confirms no Facebook prerequisite.
* **REQ-AUTH-09**: During Facebook OAuth outage in Phase 0-1, login/signup routes fail closed with
  `503 AUTH_PROVIDER_UNAVAILABLE`; status page/health signal reflects degraded auth state.
* **REQ-AUTH-10**: During OAuth outages in Phase 0-1, users with already-valid sessions can continue authenticated usage
  until token/session expiry; clients display outage banner/state for blocked login/signup.

#### 7.12.2 Task Management

* **REQ-TASK-00**: For all active customer-postable categories in Phase 0-2, task-post UI and API load form structure
  from active `intake_schema` (versioned). Schema activation is blocked unless it has 3-5 required questions and
  supported fixed-choice field types. Task submit with missing required answers fails with field-level validation
  errors.
  In Phase 0-2, no conversational intake path is invoked on posting.
* **REQ-TASK-01**: Task creation fails unless Category, Description, Location (`lat`,`lng`,`text`), Schedule (
  `ISO-8601`), and Budget are provided; Budget must be integer > 1,000 MNT; photo count is 0-3; validation errors are
  field-specific.
* **REQ-TASK-02**: Task state transitions only follow `OPEN -> ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW`; invalid
  transitions are rejected with `409 INVALID_STATE_TRANSITION`; transition audit records are immutable.
* **REQ-TASK-03**: Tasker feed includes only `OPEN` tasks and never exposes exact address fields pre-confirmation; API
  payload includes district or fuzzed location only; privacy regression tests verify no exact coordinates leak.
* **REQ-TASK-04**: Presigned upload flow requires `POST /tasks/photos/upload-url` before create and optional
  `POST /tasks/{id}/photos/upload-url` post-create; max total photos per task is 3; fourth photo attempt returns
  `422 PHOTO_LIMIT_EXCEEDED`.
* **REQ-TASK-05**: Admin can add/edit/deactivate/reorder categories in DB-backed UI/API; deactivated categories cannot
  be selected for new tasks; tasker feed filtering by Category and Distance returns deterministic filtered sets.
* **REQ-TASK-06**: On task creation, structured intake answers and `intake_schema_version` are stored with the task and
  returned in task detail APIs for Customer, Tasker, and Admin roles.
* **REQ-TASK-07**: Deterministic "Job Scope Summary" is auto-generated from intake answers before final submit,
  prefilled into editable Description, and persisted with the posted task.
* **REQ-TASK-08**: When optional AI summary rewrite is enabled, generation runs asynchronously and never blocks task
  posting; on AI failure/unavailability, deterministic summary remains authoritative.
* **REQ-TASK-09**: Draft records persist bound `intake_schema_version` at form start; submit validation executes against
  that bound version even if a newer active schema exists.
* **REQ-TASK-10**: If deterministic summary rendering fails, task submission still succeeds using canonical key-value
  fallback summary; failure event is logged with category and schema version.
* **REQ-TASK-11**: Deactivated categories reject new draft/create requests; existing tasks keep category metadata and
  proceed through allowed lifecycle transitions.

#### 7.12.3 Booking & Matching

* **REQ-BOOK-01**: Verified Taskers can apply only to `OPEN` tasks; in Phase 2+, proactive push is sent to top-ranked
  eligible Taskers for each new task; notification delivery attempts are logged with recipient IDs.
* **REQ-BOOK-02**: Customer applicant list loads with all eligible applicants; in Phase 2+, list ordering strictly
  follows descending relevance score and top-ranked entries include `recommended=true`.
* **REQ-BOOK-03**: Booking reaches final confirmed state only after Customer acceptance plus
  `liability_disclaimer_accepted=true`; in Phase 2+, confirmation additionally requires successful lead-unlock debit
  event.
* **REQ-BOOK-04**: Customer cancellations >4h before schedule create no incident; late cancellations (<=4h) result in a
  cancellation fee (Phase 2+) or a reliability incident warning on the first occurrence; a second late cancellation in 28
  days flags future tasks with "Low Customer Reliability" visible to applicants and revokes Instant Match for 30 days.
* **REQ-BOOK-05**: Booking status transitions are restricted to `ASSIGNED -> COMPLETED|CANCELLED|NO_SHOW`; task and
  booking state machines are independently persisted and validated in contract tests.
* **REQ-BOOK-06**: Tasker cancellation reopens linked task to `OPEN` and incurs a moderation strike; 3 strikes in any
  rolling 30-day window automatically set a 7-day suspension. Exception: "Safety/Fraud" reason bypasses the strike but
  opens an immediate Trust & Safety ticket; abuse of this override triggers immediate platform review.
* **REQ-BOOK-07**: Rebook action is available on completed bookings and pre-fills same-category Task creation; rebook is
  initiated by a single primary action from booking history.
* **REQ-BOOK-08**: Instant Match is visible only when liquidity threshold (>=10 verified Taskers with >4.0 rating in
  district) is met; each offer expires at 5 minutes; after 3 declines/timeouts system falls back to open application
  automatically.
* **REQ-BOOK-09**: For tasks with zero eligible applicants at 120 minutes during 08:00-22:00 local time, rescue flow
  triggers all three actions (budget/schedule prompt, broadened push, concierge queue) and records the rescue trigger
  event.
* **REQ-BOOK-10**: Selected applicant confirmation timeout is 15 minutes in Phase 2 and 5 minutes in Phase 3+ instant
  match; timeout/decline counter resets per task after fallback and transition is logged.
* **REQ-BOOK-11**: At schedule +10 minutes, both parties receive reminder; `NO_SHOW` flag at +15 is accepted only if no
  status update/check-in from either party in prior 30 minutes and no accepted reschedule exists; repeated no-shows (>
  =2/28d) create strike-review case.
* **REQ-BOOK-12**: In `ASSIGNED`, either party can submit reschedule request with proposed datetime; accepted requests
  update canonical schedule and reset timers; declined/expired requests preserve original schedule.
* **REQ-BOOK-13**: No-show and late-cancel timers always reference latest mutually accepted in-app schedule only;
  chat-only schedule mentions never alter timers; immutable timeline stores request/accept/decline/expiry events.

#### 7.12.4 Information Controls

* **REQ-LEAK-01**: Tasker phone fields are absent from all Customer-facing APIs/UI states (profile, chat, booking,
  receipts); automated schema tests fail if phone appears in Customer payloads.
* **REQ-LEAK-02**: Customer phone remains masked until selected Tasker accepts and (Phase 2+) lead-unlock debit
  succeeds; pre-unlock reads return masked format only.
* **REQ-LEAK-03**: Exact address fields are unretrievable until booking-confirmed state in Phase 1 or
  payment/lead-unlock commitment in paid phases; unauthorized retrieval attempts return `403 ADDRESS_LOCKED`.
* **REQ-LEAK-04**: Messaging pipeline scans outbound text for phone-sharing patterns and raises admin alert events;
  Phase 0-1 actions are advisory-only, later phases support escalation workflows.
* **REQ-LEAK-05**: Off-platform bookings cannot open guarantee/refund workflows; UI and API both display explicit
  no-recourse notice before booking finalization and at dispute intake.

#### 7.12.5 Monetization (Phased)

* **REQ-PAY-01**: When phase is set to Phase 0-1 free mode, all fee fields are 0 and no charge transaction type can be
  created from booking flow.
* **REQ-PAY-02**: Booking completion in Phase 0-1 stores settlement method as `DIRECT`; no escrow wallet ledger entries
  are created.
* **REQ-PAY-03**: Booking confirmation screen and API response include connector-payment disclaimer text; confirmation
  API rejects requests missing disclaimer acknowledgement.
* **REQ-PAY-10**: In Phase 2, Taskers can browse/apply with zero credits; credit balance is unchanged for browse/apply
  actions in audit logs.
* **REQ-PAY-11**: After customer selection, selected Tasker sees 15-minute accept/decline timer; on accept, credits are
  atomically debited exactly once and customer contact unlock is performed only after successful debit.
* **REQ-PAY-12**: Decline or timeout creates no credit debit; customer receives `select next applicant` prompt/event;
  prior selected applicant cannot auto-relock contact without reselection.
* **REQ-PAY-13**: If customer cancels after successful lead unlock, identical credit amount is refunded to Tasker ledger
  and marked as `REFUND` transaction with booking reference.
* **REQ-PAY-14**: Lead-unlock pricing follows category-tiered model (REQ-PAY-27);
  tier-to-category mapping is admin-configurable; all price changes are versioned
  with effective timestamp; optional flat introductory rate may precede tiered
  activation.
* **REQ-PAY-15**: Credit charges are allowed only on `LEAD_UNLOCK_ACCEPTED`; attempts to charge on browse/apply/create
  events are blocked and logged as policy violations.
* **REQ-PAY-16**: Customer can always choose any eligible applicant regardless of ranking position; UI tests verify no
  forced selection of top-ranked Tasker.
* **REQ-PAY-17**: Application cap defaults to 10 per task and is admin-configurable; on cap reached, subsequent apply
  attempts return `409 APPLICATION_CAP_REACHED`.
* **REQ-PAY-18**: Tasker dashboard exposes success rate and unlock conversion with trailing 28-day window and minimum
  sample-size indicator; metric definitions match Section 9.2 formulas.
* **REQ-PAY-19**: Credit packs are purchasable via QPay in configured tiers; pack purchase creates immutable `PURCHASE`
  ledger entry and updates balance exactly by pack credit count.
* **REQ-PAY-20**: On first Tasker onboarding completion, system grants exactly 5 signup credits once per user; duplicate
  bonus grants are prevented by idempotency key.
* **REQ-PAY-21**: Current credit balance is visible on Tasker home and billing screens; low-balance push triggers when
  balance transitions to <=1 credit.
* **REQ-PAY-22**: Credits never expire automatically and cannot be converted to cash; cancellation refunds return
  credits only; legal review is required for stored-value regulatory classification.
* **REQ-PAY-31**: QPay integration returns valid QR/deeplink payload for booking payment attempts; failed generation
  returns retryable error without mutating booking state.
* **REQ-PAY-33**: On booking completion under escrow, a wallet `PENDING_CREDIT` entry is created once per booking and
  linked to booking transaction ID.
* **REQ-PAY-34**: Platform fee is deducted using active configurable rate before net crediting Tasker wallet; payout
  statement shows gross, fee, and net amounts.
* **REQ-PAY-35**: Tasker can submit payout request only when available wallet balance is positive and not on hold;
  request state transitions are auditable.
* **REQ-PAY-36**: Admin panel lists pending payouts with requester, amount, and created time; processing action requires
  explicit status update and processor audit trail.
* **REQ-PAY-37**: Payout processing is executable only on Tuesdays and Fridays (platform timezone); off-schedule
  processing attempts are blocked.
* **REQ-PAY-38**: When escrow is active, exact address remains locked until payment commitment is successful;
  pre-payment address fetch returns `403 ADDRESS_LOCKED`.
* **REQ-PAY-23**: Promoted listing purchase creates time-bounded sort boost;
  feed query respects boost expiry; QPay one-time payment verified before
  activation; maximum one active promotion per task enforced.
* **REQ-PAY-24**: Urgent boost appears above promoted listings in feed and
  push; 3-day expiry enforced; QPay one-time payment verified.
* **REQ-PAY-25**: Business account CRUD operations enforce owner-is-CUSTOMER
  constraint; locations store PostGIS coordinates; member roles limited to
  OWNER and MANAGER; membership check enforced on all B2B endpoints.
* **REQ-PAY-26**: Tasks with `business_account_id` appear in business task
  listing; priority weight boost is applied in matching query; standard
  task/booking flow is unchanged for B2B tasks.
* **REQ-PAY-27**: Lead-unlock credit cost varies by category tier; tier
  mapping is admin-configurable; category change on a task recalculates
  unlock cost.
* **REQ-PAY-28**: Grandfathered flag is set for eligible taskers; 5% discount
  applied at checkout for all paid products; flag is permanent and
  non-revocable.
* **REQ-PAY-30**: Subscription requires active Pro Badge; two tiers with
  distinct free-lead-unlock counts; QPay recurring billing; badge loss
  blocks renewal but does not cancel active period.
* **REQ-PAY-32**: Escrow is opt-in; threshold is admin-configurable; direct
  settlement remains default; deposit percentage is 10-20% of booking value.
* **REQ-PAY-39**: B2B plans bill monthly on configured cycle day; QPay
  payment link generated per cycle; plan pricing is admin-configurable;
  suspended accounts retain data but lose priority dispatch.
* **REQ-PAY-40**: Tasky Plus subscribers receive priority queueing and SLA
  tracking that shows <1 hour match guarantee eligibility; non-subscribers
  cannot access Plus-only queue.
* **REQ-PAY-41**: B2B Managed (Shape B) activation requires 20+ paying
  B2B Lite accounts for 3+ months; recurring schedule templates support
  weekly/biweekly/monthly patterns; PMS webhook integration tested against
  Guesty and Hostaway APIs.
* **REQ-PAY-42**: In Phase 4, checkout supports QPay plus SocialPay/bank-
  transfer rails with per-rail success/failure telemetry and fallback
  messaging.
* **REQ-PAY-43**: Family Plan billing via QPay recurring; priority matching
  routes to Pro-subscribed providers; saved favorites persisted per household.

#### 7.12.6 Trust & Safety

* **REQ-SAFE-01**: New Tasker verification status remains `PENDING` until admin decision; median review time and SLA
  breach metrics are computed against 24-hour target; upload flow accepts presigned-key references only.
* **REQ-SAFE-02**: After `COMPLETED`, both parties receive structured review form; soft-gate reminders trigger at
  completion, +24h, +72h; hard lock is enforced only when configured risk conditions are true.
* **REQ-SAFE-03**: Dispute creation is allowed only in `ASSIGNED` or within 24 hours of `COMPLETED`; Phase 1 resolution
  actions are limited to evidence-only outcomes and admin misconduct note updates.
* **REQ-SAFE-04**: Pro Badge is auto-assigned when Tasker has >15 completed jobs and >4.5 average rating in Phase 0-1;
  assignment logic is deterministic and idempotent.
* **REQ-SAFE-05**: In Phase 2, DAN verification path can independently approve identity; if DAN fails/unavailable,
  manual review route remains available without blocking applicant submission.
* **REQ-SAFE-06**: Reliability score is computed from completion rate, punctuality average, overall average, and
  cancellation history with documented weighting; Phase 2 ranking consumes this score in applicant ordering.
* **REQ-SAFE-07**: Identity upload cannot proceed until consent checkbox is accepted; persisted consent record includes
  `user_id`, `policy_version`, and timestamp.
* **REQ-SAFE-08**: Every admin read/download action on verification media writes immutable audit log (`viewer_id`,
  action, timestamp, object_key); audit queries support incident lookups by user and date range.
* **REQ-SAFE-09**: Identity assets follow policy lifecycle (active account +90 days) and are deleted/anonymized on
  eligible user deletion requests; deletion jobs emit completion evidence logs.
* **REQ-SAFE-10**: Dispute submission requires at least one evidence artifact; if missing evidence remains after
  reminder and 24-hour grace, dispute auto-closes as `INSUFFICIENT_EVIDENCE`.
* **REQ-SAFE-11**: Review enforcement cadence strictly follows immediate prompt, +24h reminder, +72h reminder; hard lock
  action requires one of the REQ-SAFE-02 risk flags and logs trigger reason.

#### 7.12.7 Notifications

* **REQ-NOTIF-01**: Push notifications are emitted for every listed trigger event with correct recipient role and
  localized content; emission and delivery attempts are logged.
* **REQ-NOTIF-02**: In Phase 2, when app is inactive, SMS fallback is sent for `HIRED` and `BOOKING_CONFIRMED`;
  duplicate SMS for same event is prevented by idempotency key.

#### 7.12.8 In-App Messaging

* **REQ-MSG-01**: Messaging becomes available only after task application exists; real-time transport uses
  WebSocket/STOMP and supports real-time delivery for online participants.
* **REQ-MSG-02**: All message events are durably stored and retrievable by both participants and authorized admin;
  tamper-evident message audit metadata is retained.
* **REQ-MSG-03**: Messaging is default communication path; in Phase 2+, customer contact unlock depends on lead unlock
  and Tasker contact remains hidden from customers in all message payloads.

#### 7.12.9 Admin & Operations

* **REQ-ADMIN-01**: Admin search supports Name and Facebook ID in Phase 0-1, and adds Phone Number criterion in Phase 2;
  search responses are permission-scoped and paginated.
* **REQ-ADMIN-02**: Dispute Manager displays task context, chat evidence, and allows `Resolve for Customer`,
  `Resolve for Tasker`, or `Escalate` with mandatory rationale note.
* **REQ-ADMIN-03**: Ban action blocks new login/session refresh and returns `403 USER_BANNED`; existing active sessions
  are revoked according to authentication policy.
* **REQ-ADMIN-04**: Verification Queue lists pending submissions ordered by submission time, shows SLA countdown to 24h
  target, and exports throughput metrics daily.
* **REQ-ADMIN-05**: Category Management supports add/edit/deactivate/reorder operations plus `intake_schema`
  create/update/activate/version actions, with schema lint/preview checks, canary activation, rollback to
  last-known-good version, audit logging, and immediate propagation to task-posting category picker.
* **REQ-ADMIN-06**: Feature Toggle panel can enable/disable lead-fee, promoted-listings, b2b, subscription, and escrow
  independently without redeploy; toggle changes are audited with actor and timestamp.
* **REQ-ADMIN-07**: In Phase 0-1, admin can manually assign Tasker to task via concierge flow; assignment writes
  override reason and actor ID and respects verification eligibility checks.

#### 7.12.10 Referral Program

* **REQ-REF-01**: In Phase 2, each user profile exposes unique shareable referral link/code; link resolves to onboarding
  flow with referrer attribution token.
* **REQ-REF-02**: Referral records persist `referrer_id`, `referred_id`, attribution timestamp, and first
  completed-booking conversion timestamp; attribution is immutable after conversion.
* **REQ-REF-03**: Reward engine applies phase-specific reward logic (Phase 2 priority boost; Phase 3+ credit rewards)
  only after qualifying conversion event.
* **REQ-REF-04**: Fraud control blocks reward accrual beyond 10 successful referrals per user per calendar month and
  emits manual-review alert on threshold breach attempts.

#### 7.12.11 Frontend Design System

* **REQ-UI-01**: All newly added web components are composed from `shadcn/ui` primitives; CI check fails if unauthorized
  web component framework dependencies are introduced.
* **REQ-UI-02**: Mobile components map to shared token and state semantics used on web; parity tests verify equivalent
  states (default/disabled/error/loading/success) across platforms.

---

## 8. Non-Functional Requirements

### 8.1 Security & Privacy

* **NFR-SEC-01**: All PII (Phone, ID photos) MUST be encrypted at rest.
* **NFR-SEC-02**: Platform MUST comply with Mongolia's **Law on Protection of Personal Information** (effective May 1,
  2022). Biometric and identity data requires explicit consent. `[Research: regulatory]`
* **NFR-SEC-03**: Data retention policy MUST be defined and communicated: ID verification images retained while the
  user's account is active + 90 days.
* **NFR-SEC-04**: Access logs for PII and identity assets MUST be immutable and queryable for incident investigation.
* **NFR-SEC-05**: Consent records for identity-data processing MUST be persisted and linked to policy/version metadata.

### 8.2 Performance

* **NFR-PERF-01**: "Open Task" feed MUST load in < 1s on 4G network (median Mongolian mobile speed: 15.49 Mbps).
  `[Research: infrastructure]`

### 8.3 Localisation

* **NFR-LOC-01**: App MUST handle Mongolian Cyrillic input and display correctly. Database and frontend rendering MUST
  be hardened for Cyrillic string processing (UTF-8 throughout). `[Gemini1]`

### 8.4 Legal

* **NFR-LEGAL-01**: Booking flow MUST include explicit "Liability Disclaimer" checkbox (Tasky is connector, not
  provider).
    * **Contract Rule**: Booking acceptance endpoint MUST require `liability_disclaimer_accepted=true`.
* **NFR-LEGAL-02**: Platform MUST position legally as a **technology marketplace facilitator**, not an employer. Terms
  of Service must explicitly disclaim employment relationship. `[Research: 2-year contractor reclassification risk]`
* **NFR-LEGAL-03**: System SHOULD track cumulative Tasker engagement duration. Alert when a Tasker approaches 2 years of
  continuous platform activity for legal review of contractor status. `[Research: labour law]`

### 8.5 Reliability

* **NFR-RELI-01**: Booking state-changing operations MUST be idempotent and handle retries safely.
* **NFR-RELI-02**: Mobile app MUST provide read-only local cache of "My Tasks" for offline viewing.

### 8.6 API

* **NFR-API-01**: All list endpoints MUST support cursor-based pagination.
* **NFR-API-02**: Public API endpoints MUST be versioned (`/v1`) and contract-breaking changes MUST include migration
  notes.
* **NFR-API-03**: State-changing endpoints in booking and payments MUST support idempotency keys to prevent duplicate
  effects on retries.
* **NFR-API-04**: API error responses MUST follow a standard envelope with machine-readable error codes.

### 8.7 Observability

* **NFR-OBS-01**: System MUST emit product analytics events for MVP funnel milestones (task intake started, task intake
  completed, intake schema render failed, intake validation failed, deterministic summary generation failed with
  fallback,
  job scope summary edited, task posted, application submitted, tasker accepted, booking confirmed, booking completed,
  dispute raised) with locale and platform dimensions.
* **NFR-OBS-02**: System MUST instrument **leakage indicators**: message content flagged for phone number patterns,
  repeat off-platform contact attempts, booking-to-repost ratios. `[F7]`
* **NFR-OBS-03**: System MUST track **review completion rate** per cohort (target: >85%). `[F8]`
* **NFR-OBS-04**: System MUST track **verification queue metrics**: submissions per day, median time-to-approval, SLA
  breach count. `[F9]`
* **NFR-OBS-05**: System MUST track **monetization stage adoption**: lead-fee payment rate, subscription conversion
  rate, escrow opt-in rate (when each is active).
* **NFR-OBS-06**: Intake-related observability events MUST include at minimum `category_id`, `intake_schema_version`,
  and `client_app_version` dimensions.

### 8.8 UI

* **NFR-UI-01**: Web and Mobile MUST consume a shared design token source of truth (color, spacing, typography, radius,
  elevation, motion), with platform-specific adapters as needed.
* **NFR-UI-02**: All new web UI flows MUST support keyboard navigation and meet WCAG 2.1 AA contrast requirements.

---

## 9. Success Metrics

* **North Star**: **Category Liquidity Score** — `% of tasks receiving at least one qualified application within 24h`.
* **Key Metrics**:
    * Weekly Completed Bookings (execution throughput)
    * Conversion: % of `OPEN` tasks that become `ASSIGNED`.
    * Fulfillment: % of terminal bookings that end in `COMPLETED` (bookings ending in `NO_SHOW` are counted as
      unfulfilled).
    * Trust: % of Bookings with a Dispute.
    * Review health: Review completion rate (bilateral). Target >85%.
    * Leakage: % of bookings where message content is flagged for contact sharing.
    * Repeat usage: % of Customers who book again within 30 days.
    * Supply health: Verification queue SLA adherence (target: 95% within 24h).
    * Time to first match: median hours from task post to first Tasker application.
  * Scope clarity: median pre-booking clarification message count per `ASSIGNED` booking.

### 9.1 Liquidity Thresholds (District-First) `[F2]`

Before expanding marketing to additional districts, the following thresholds MUST be met in the active district using a
trailing 28-day window:

| Metric                                 | Threshold |
|:---------------------------------------|:----------|
| Active verified Taskers (per category) | ≥ 10      |
| Median time to first application       | < 2 hours |
| Booking completion rate                | > 75%     |
| Repeat customer rate (30-day)          | > 20%     |

Initial supply gathering district: **Sukhbaatar** (highest density of target demand demographic, apartment districts).
`[Gemini1]`
Initial demand marketing district: **Sukhbaatar**.

### 9.2 Metric Definitions & Data Rules

| Metric              | Definition                                                                              | Decision Rule                                                        |
|:--------------------|:----------------------------------------------------------------------------------------|:---------------------------------------------------------------------|
| Conversion          | `ASSIGNED / OPEN` tasks in trailing 28 days                                             | Track weekly; phase-gate decisions require >=50 OPEN tasks in window |
| Fulfillment         | `COMPLETED / (COMPLETED + CANCELLED + NO_SHOW)` bookings in trailing 28 days            | Gate-critical in all phases                                          |
| Dispute rate        | `Disputes opened / COMPLETED` bookings in trailing 28 days                              | Escalate operations review if >8% for 2 consecutive weeks            |
| Repeat usage        | Customers with >=2 completed bookings in 30 days / active customers                     | Used for monetization readiness                                      |
| Time to first match | Median time from task creation to first qualified application                           | Used for district/category expansion decisions                       |
| Leakage indicator   | Bookings with phone-sharing signal / total bookings                                     | Advisory in Phase 0-1, enforcement in Phase 2+                       |
| Scope clarity       | Median pre-booking clarification message count per `ASSIGNED` booking                   | Alert and operations review if >2.0 for 2 consecutive weeks          |
| Monthly net revenue | Gross platform revenue minus direct variable platform costs (payment rails, SMS, infra) | Must be >= 6,000,000 MNT for 2 consecutive months before Phase 3     |

### 9.3 Phase 3 Trigger Formula (Adjustable)

Use this to recalculate the Phase 3 revenue gate as real unit economics change:

- `MonthlyNetRevenue = GrossRevenue - DirectVariableCosts`
- `GrossRevenue = LeadFeeRevenue + SubscriptionRevenue + EscrowFeeRevenue + OtherRevenue`
- `DirectVariableCosts = PaymentRailFees + SMSCosts + InfraCosts + RefundCosts`
- `RequiredPaidTransactions = ceil(TargetNetRevenue / UnitContributionMargin)`
- `UnitContributionMargin = AvgRevenuePerPaidTransaction - AvgVariableCostPerPaidTransaction`

Worked example for the current gate (diversified revenue):

- `TargetNetRevenue = 6,000,000 MNT`
- Phase 2 revenue mix: promoted listings (~900K) + B2B trial (0) = ~900K from
  non-credit sources (only Phase 2 products count toward Phase 3 gate)
- Remaining from lead credits: `RequiredCreditRevenue = 6,000,000 - 900,000 = 5,100,000 MNT`
- If `AvgCreditPrice = 2,500 MNT` (blended across tiers) and `AvgVariableCost = 500 MNT`
- Then `UnitContributionMargin = 2,000 MNT`
- `RequiredPaidCreditUnlocks = ceil(5,100,000 / 2,000) = 2,550 credit unlocks/month` (~85/day)
- Note: this example uses conservative month-10 projections from the debate
  composite blueprint. Actual mix will vary.

---

## 10. Dependencies and Assumptions

### 10.1 Research Basis

This version integrates findings from five market research outputs (March 2026):

- Mongolia market demographics, digital landscape, and competitive analysis
- Payment behaviour analysis for on-platform settlement strategy
- Strategic blueprints for AI-powered solo-developer marketplace execution
- Lead-fee monetization and cold-start playbook for Ulaanbaatar
- Unegui.mn Domestic Services Market Report (Scrape data analysis)

Key evidence supporting product decisions is cited inline primarily as `[F#]` references mapped in Section 14.3. Where a
claim is operational and not yet mapped to a finding ID, a source-tag citation is used and should be normalized to an
`F#` reference in the next PRD revision.

### 10.2 Baseline Lock Rule

1. This PRD version (`1.3`) is the backlog generation baseline.
2. Scope changes after backlog generation require:
    * Change rationale and impact summary (scope, timeline, risk)
    * Traceability updates to REQ/NFR IDs
    * Decision log entry in project docs when architecture or quality gates are affected

### 10.3 Operational Constraints (Solo Developer)

This product is developed by a solo developer with no external funding. The following constraints apply to all phases
until funding or team expansion occurs:

* **AI-assisted development:** Claude, ChatGPT, and Gemini subscriptions are the primary force multiplier for
  engineering, QA, marketing content, and customer support triage.
* **Zero paid infrastructure in Phase 1:** Free-tier cloud services wherever possible. Paid infrastructure scales only
  with validated revenue.
* **No runtime LLM dependency on posting path in Phase 0-2:** Structured intake and job scope summary generation MUST
  use deterministic templates. Optional AI summary polish is asynchronous with deterministic fallback.
* **Manual operations acceptable:** Concierge dispatch, manual verification, and founder-as-backstop are expected
  operational modes in early phases.
* **Founder manual-ops budget:** Combined concierge dispatch + manual verification time is capped at **10 hours/week**.
* **No SMS costs in Phase 1:** SMS OTP is deferred in Phase 0-1. SMS cost line-items begin in Phase 2 when OTP becomes
  mandatory.
* **No DAN integration in Phase 0-1:** E-Mongolia DAN requires contractual relationships and compliance overhead.
  Manual ID verification with defined SLA is the Phase 0-1 approach.

### 10.4 Explicit Dependency Posture

1. **Facebook OAuth in Phase 0-1 is a deliberate single point of dependency.** No alternate auth path is provided in
   this period.
2. **Facebook outage periods are accepted as operational failure windows in Phase 0-1.** The product response is
   incident communication and recovery; authentication remains unavailable until Facebook recovers.
3. **Phase 2 introduces mandatory SMS OTP migration.** Existing Facebook-auth users must verify phone OTP; new users can
   register without Facebook linkage.
4. **OAuth outage runbook requirement (Phase 0-1):** while new login/signup is unavailable, existing valid sessions must
   continue until expiry and the app must surface outage state to users.

---

## 11. Risks and Mitigations

| Risk                                                       | Impact   | Likelihood | Mitigation                                                                                                                                                                                   |
|:-----------------------------------------------------------|:---------|:-----------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Platform Leakage** (users settle offline)                | High     | High       | In-app messaging from day one builds habits before fees exist. Location gated to booking state. Repeat-booking convenience. Reputation is platform-exclusive. `[F7]`                         |
| **Fake Tasks / Spam**                                      | Medium   | Medium     | Rate limit task posting. Validate OAuth identities and abuse signals.                                                                                                                        |
| **Low-quality task scope from weak descriptions**          | High     | High       | Enforce category-specific structured intake (3-5 required questions), deterministic job scope summaries, and schema governance in admin category management. `[F17]`                         |
| **Off-Platform Settlement Disputes** (Phase 1)             | Medium   | High       | Evidence-only mediation policy, admin-only misconduct notes for wrongful party, strong dispute evidence capture (chat, timestamps, photos), explicit liability disclaimer.                   |
| **Founder Ops Overload** (manual concierge + verification) | High     | Medium     | Hard cap founder manual operations at 10 hours/week. If exceeded for 2 consecutive weeks, freeze expansion activities and reduce category/district scope.                                    |
| **Admin Verification Bottleneck**                          | High     | High       | 24h SLA, verification queue dashboard, concierge first-cohort onboarding. DAN fast-path in Phase 2. `[F9]`                                                                                   |
| **Facebook OAuth Outage / Policy Change** (Phase 0-1)      | Critical | Medium     | Accepted operational failure window in Phase 0-1 (auth unavailable until Facebook recovers). Communicate outage status, preserve existing bookings, and execute incident/postmortem process. |
| **2-Year Labour Law Contractor Reclassification**          | High     | Low–Med    | Legal disclaimer in ToS. Engagement duration tracking with admin alerts. Legal review at 18-month mark. `[Research: labour law]`                                                             |
| **Seasonal Demand Collapse** (summer)                      | Medium   | High       | Seasonal category expansion (tutoring, digital tasks in summer). Adjust marketing spend seasonally. `[F10]`                                                                                  |
| **Rating Inflation** in high-context culture               | Medium   | High       | Mandatory reviews reduce non-participation. Structured rating prompts (specific criteria, not just stars). Sentiment analysis on review text. `[F8]`                                         |
| **Market Size Ceiling** (UB ~500K–600K households)         | High     | High       | B2B Lite from Phase 2 (supply lock-in + revenue diversification). Phase 4 city expansion (Darkhan, Erdenet). Higher-value category expansion. B2B Managed services. `[F12]`                  |
| **Solo Developer Burnout**                                 | High     | High       | AI automation for support, QA, marketing. Strict scope discipline. Manual ops only where unavoidable. `[Gemini1]`                                                                            |
| **Leakage Spike at Take Rate Introduction**                | High     | High       | Do not introduce take rate until ≥40% of active customers have completed 3+ bookings. Grandfather early Taskers at lower rate. `[Payment behaviour]`                                         |
| **Credit / Referral Abuse**                                | High     | Medium     | Credit velocity limits, referral graph anomaly detection, per-user monthly reward caps, and manual review queue for suspicious clusters.                                                     |
| **Facebook ToS Enforcement Risk**                          | High     | Medium     | Keep supply-side cross-posting as default. Gate any demand-side scraping behind legal review, low-volume throttles, and immediate kill switch.                                               |
| **Payout Fraud / Operational Error**                       | High     | Medium     | Dual-approval for payout processing, payout hold windows for newly verified Taskers, and daily reconciliation reports.                                                                       |

---

## 12. Rollout / Milestones

### 12.1 Operating Principles

1. **Solo developer, AI-assisted.** All phases assume a single developer using Claude, ChatGPT, and Gemini subscriptions
   as force multipliers. Team expansion is a Phase 3+ consideration contingent on revenue or funding.
2. **Trust before revenue.** Monetization stages are gated by trust and usage milestones, not calendar dates.
3. **District-first, category-constrained.** Launch in one district with ≤6 categories. Expand only after liquidity
   thresholds are met.
4. **Feature-toggled monetization.** All payment stages are implemented behind feature flags and activated by admin
   configuration, not code deployment.
5. **Concierge-first operations.** The founder personally backstops the first ~30 bookings to guarantee quality and
   learn failure modes within the 10h/week ops budget.
6. **Metric discipline over intuition.** Exit/kill criteria use trailing 28-day windows and must meet minimum event
   counts before decisions are made.

### 12.2 Phase 0 — Foundation & Controlled Pilot

**Goal:** Ship a working product with zero monetization and validate core flows through a controlled live pilot.
**Revenue:** $0
**Duration:** Until core flows are stable and pilot exit criteria are met.

| Area                    | Deliverable                                                                                                                                                                                                     |
|:------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Auth**                | Facebook OAuth only. No SMS OTP. Phone field is optional profile data, not an auth method.                                                                                                                      |
| **Task Management**     | Full task CRUD with category, schema-driven structured intake forms (3-5 required questions), deterministic editable job scope summary, photos, location, schedule, and budget. Cyrillic-hardened throughout.   |
| **Booking**             | Application → Customer confirmation → Liability disclaimer → Booking lifecycle. Concierge dispatch override for founder.                                                                                        |
| **Messaging**           | WebSocket real-time chat. Phone number detection alerting (advisory only).                                                                                                                                      |
| **Reviews**             | Mandatory bilateral reviews with soft-gate reminders; hard lock only for risk-triggered cases (dispute, repeated non-submission, or active investigation).                                                      |
| **Verification**        | Manual ID upload + admin review queue with 24h SLA tracking.                                                                                                                                                    |
| **Notifications**       | Push notifications for all critical events (FCM).                                                                                                                                                               |
| **Disputes**            | Raise → Admin review → Resolve with notes.                                                                                                                                                                      |
| **Admin**               | Verification queue, dispute manager, user moderation, category management, concierge dispatch mode, feature toggle panel.                                                                                       |
| **Analytics**           | Funnel events, leakage indicators, review completion tracking, verification SLA tracking.                                                                                                                       |
| **Information control** | No phone exposure anywhere. Location revealed only after booking. In-app messaging only. Rationale in Phase 0: habit formation and repeat-booking capture (not anti-leakage — there are no fees to bypass yet). |
| **i18n**                | English + Mongolian (Mongolian default).                                                                                                                                                                        |
| **Categories**          | Seed: Cleaning, Handyman, Moving (3 categories maximum at launch). Validated by market data: Moving supply is highly fragmented, Cleaning has highest demand views. `[F16]`                                     |
| **Geography**           | Marketing constrained to Sukhbaatar district. App is available citywide but supply acquisition targets one district.                                                                                            |

**Supply Acquisition Strategy:**

- Scrape Unegui.mn "Services" section and Facebook groups to identify active service providers. Direct outreach to
  recruit first 50 Taskers. `[Gemini1, Research]`
- Guerrilla marketing: QR-code flyers at universities (NUM, MUST), malls, and the 100 Ail building materials district.
- Founder personally onboards and (optionally) interviews first 50 Taskers.
- "Single-player value": verified Tasker profile serves as a professional portfolio even before demand arrives.
  `[Gemini1]`

**Demand Acquisition Strategy:**

- Cross-post new Tasky tasks to relevant Facebook groups with deep links. `[Strategy doc]`
- Word-of-mouth from founder's personal network.
- Demand campaigns are focused on **Sukhbaatar** in Phase 0-1.
- Founder acts as ultimate backstop: if no Tasker is available, founder coordinates manually or executes the task
  personally for the first ~30 bookings. `[Gemini1]`

**Seasonal Targeting:** Optimal launch window is **October–November** to build supply ahead of the **Tsagaan Sar** (
January–February) peak cleaning demand. `[F10]`

**Exit Criteria for Phase 1:**

- 15+ verified active Taskers across launch categories
- 30+ completed bookings
- Booking completion rate > 70%
- Core flows stable with < 1% critical error rate

### 12.3 Phase 1 — Liquidity & Trust Validation

**Goal:** Prove marketplace liquidity and build user trust through consistent, high-quality matches. Remain at zero
monetization.
**Revenue:** $0
**Duration:** Until exit criteria are met.

| Area            | Additions over Phase 0                                                                                                                                                                                                         |
|:----------------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Operations**  | Transition from concierge dispatch to application-first matching. Founder monitors but does not manually assign every booking. Matching remains open-application model; data collection for future algorithmic ranking begins. |
| **Geography**   | If Sukhbaatar liquidity thresholds met, expand supply acquisition to adjacent districts (Bayangol, Khan-Uul).                                                                                                                  |
| **Categories**  | Expand to 6 categories: add Plumbing, Electrical, and Renovation to the seed set (medium-complexity, higher-value). Plumbing is highly monopolized on incumbents, offering strong disruption value. `[F16]`                    |
| **Task Intake** | Roll out schema-driven intake forms for newly added categories with admin-managed schema versioning and quality checks.                                                                                                        |
| **Analytics**   | Baseline leakage rate. Baseline repeat customer rate. Baseline time-to-first-match by category and district.                                                                                                                   |
| **Referrals**   | Referral readiness only: tracking hooks and operational playbook prepared for Phase 2 launch.                                                                                                                                  |
| **Profile**     | AI Profile Polish: Taskers can use AI to enhance their profile descriptions, increasing the single-player value of the platform.                                                                                               |

**Kill Criteria** (if unmet, pivot or shut down):

- Cannot sustain 30 active Taskers after 90 days of operation.
- Cannot reach 100 completed bookings within 90 days of Phase 1 start.
- Disintermediation rate > 60% (measured by follow-up surveys or telemetry). `[Gemini1]`

**Exit Criteria for Phase 2:**

- 200+ total completed bookings
- 40%+ of active customers have completed 3+ bookings (habit formation threshold)
- Repeat customer rate (30-day) > 25%
- Verification SLA adherence > 90%

### 12.4 Phase 2 — Soft Monetization (Lead-Fee + Promoted Listings + B2B Lite)

**Goal:** Introduce first revenue streams through promoted listings, category-tiered
lead credits, and B2B Lite domain model while keeping core matching free.
**Revenue:** Promoted listing purchases + credit purchases from Taskers + B2B trial
accounts (free in Phase 2, paid in Phase 3). Target: cover infrastructure costs.
**Duration:** Until Phase 3 readiness criteria are met.

| Area                | Additions over Phase 1                                                                                                                                                                                                                   |
|:--------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Matching**        | Algorithm-assisted application model live (REQ-BOOK-01/02 Phase 2). Proactive push to best-matching Taskers. Applicant list sorted by relevance score with "Recommended" labels.                                                         |
| **Auth**            | SMS OTP activated as primary login method for Phase 2+. Existing Facebook-auth users must register and verify phone OTP. New users can register with OTP without connected Facebook ID. `[F5]`                                           |
| **Verification**    | E-Mongolia DAN API integration enabled as fast-path identity verification in Phase 2. Manual review remains as fallback path.                                                                                                            |
| **Promoted**        | Promoted listing "Онцлох" (15K MNT/7d) and Urgent Boost "Яаралтай" (25K MNT/3d) live. QPay one-time payment. Ships early in Phase 2 (months 4-6) as lowest-engineering-cost revenue.                                                   |
| **Credits**         | Credit system live. QPay merchant integration for credit pack purchases. Category-tiered pricing (REQ-PAY-27): Cleaning/Moving 1.5K, Plumbing/Electrical 3K, Renovation/Tutoring 5K MNT. 5 free credits on Tasker signup.                |
| **Monetization**    | Standard lead-fee model: Core matching remains free. Taskers pay credits only when accepting a selected lead to unlock Customer contact information (15-minute accept/decline window).                                                    |
| **B2B Lite**        | Months 5-6: founder outreach to Airbnb/Booking.com hosts. Months 6-7: manual concierge for 5-10 accounts (no engineering). Months 8-10: B2B system module ships (accounts, locations, members, task tagging, priority dispatch).          |
| **Grandfathering**  | Phase 0 taskers with 5+ completed bookings receive permanent 5% discount on all future paid products (REQ-PAY-28).                                                                                                                       |
| **Notifications**   | SMS fallback for critical events (Hired, Booking Confirmed) when app is not open.                                                                                                                                                        |
| **Incentives**      | QPay digital payment incentives: MNT 5,000-10,000 booking credit for first digital payment. "Secure Booking" badge. `[Payment]`                                                                                                         |
| **Referrals**       | Referral program goes live (REQ-REF-01..04): shareable link/code, attribution tracking, and priority-boost reward at launch.                                                                                                             |
| **Task Intake**     | Structured intake coverage expanded to all active categories. Optional AI summary polish may be tested behind feature toggle with deterministic fallback retained as default.                                                             |
| **Admin**           | Credit pack pricing configuration, category-tier mapping, promoted listing management, B2B account management, revenue reporting, and SMS cost monitoring.                                                                               |
| **Geography**       | Expand to remaining central UB districts if liquidity thresholds met.                                                                                                                                                                    |
| **Categories**      | Add remaining seed categories based on demand signals (Furniture Assembly, Tutoring, Digital Tasks).                                                                                                                                     |

**Exit Criteria for Phase 3:**

- Monthly net revenue (after direct payment/SMS/infra costs) of **>= 6,000,000 MNT**
  for 2 consecutive months
    - Rationale: diversified revenue (promoted listings + lead credits + B2B trial
      data) makes 6M achievable. Sufficient operating buffer before escrow/wallet
      complexity is enabled.
- Lead unlock acceptance rate > 85% with no sustained complaint spike
- QPay payment habit established (>30% of bookings settled via QPay)
- 500+ total completed bookings
- Pro Badge Taskers: 10+ (eligible for subscription tier)
- 10+ active B2B accounts (free trial or manual concierge)

### 12.5 Phase 3 — Subscription + Opt-In Escrow + B2B Billing

**Goal:** Lock in elite supply with Tasky Pro subscriptions. Activate B2B paid
billing. Introduce opt-in escrow for high-value bookings.
**Revenue:** Tasky Pro subscriptions (Tasker MRR) + B2B subscriptions + platform
fee on escrow transactions + continued promoted listings and lead credits.

| Area             | Additions over Phase 2                                                                                                                                                                        |
|:-----------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Matching**     | Instant Match option live (REQ-BOOK-08) for high-liquidity categories. "Match me now" button with 5-minute accept/decline window. Fallback to application flow after 3 declines.              |
| **Subscription** | Tasky Pro Subscription live (REQ-PAY-30): Standard (9,900 MNT/mo) and Premium (29,000 MNT/mo). Eligibility requires earned Pro Badge. QPay recurring billing.                                |
| **B2B Billing**  | B2B subscription plans live (REQ-PAY-39): Host Lite (99K/location/mo) and Ops Standard (249K/location/mo). Monthly billing via QPay. Conversion of Phase 2 trial accounts to paid.            |
| **Payment**      | Opt-in escrow flow live (REQ-PAY-32): Customer chooses deposit protection for bookings >300K MNT. 10-20% deposit held, released after completion. Direct settlement remains default.          |
| **Payouts**      | Tasker wallet with payout requests. Admin payout processing (Tuesdays and Fridays). Manual bank transfer initially.                                                                           |
| **Anti-leakage** | Exact address gated behind escrow payment commitment for escrow bookings. Phone number detection in messages becomes enforced (warning + admin flag).                                         |
| **Dispute**      | Monetary dispute resolution: "Refund Customer" / "Release to Tasker" actions in admin panel.                                                                                                  |
| **Geography**    | Full UB coverage. Begin market assessment for city 2 (Darkhan or Erdenet).                                                                                                                    |
| **Trust**        | Completion guarantee pilot: unsatisfactory work → partial refund or free redo (limited to escrow bookings).                                                                                   |

**Exit Criteria for Phase 4:**

- 20+ paying B2B subscription accounts for 3+ consecutive months
- Tasky Pro subscriber count: 30+ (Standard + Premium combined)
- Escrow opt-in rate: >15% of eligible bookings (>300K MNT)
- Monthly revenue: 12M+ MNT from diversified streams

### 12.6 Phase 4 — Recurring Revenue & Expansion

**Goal:** Diversify revenue with consumer subscriptions and B2B expansion. Expand
beyond UB. Evaluate B2B Managed (Shape B) based on Shape A traction.
**Revenue:** Tasky Plus + B2B expansion (Multi-Site) + Family Plan + transaction fees.

| Area             | Additions over Phase 3                                                                                                                                                  |
|:-----------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Customer Sub** | Tasky Plus (REQ-PAY-40): monthly subscription for priority matching (< 1 hour guarantee) and waived trust fees.                                                         |
| **Family Plan**  | Family Plan (REQ-PAY-43): 19,900 MNT/month for household service history, saved favorites, priority routing to Pro-subscribed providers.                                |
| **B2B Managed**  | Contingent on B2B Lite validation (REQ-PAY-41). If 20+ paying accounts sustained: recurring schedule templates, SLA guarantees, Multi-Site plan (599K MNT/company/mo).  |
| **Geography**    | Launch in Darkhan and/or Erdenet using Phase 0 playbook (district-first, concierge, 3 categories).                                                                      |
| **Categories**   | Higher-value categories: renovation, deep electrical, ger district specialised services, expat concierge. `[F12]`                                                       |
| **Payment**      | SocialPay and bank-transfer alternatives alongside QPay (REQ-PAY-42).                                                                                                   |
| **Pricing**      | Dynamic pricing experimentation engine (surge, seasonal, category-based).                                                                                               |
| **Insurance**    | Investigate platform insurance/guarantee product for high-value bookings.                                                                                               |

### 12.7 Seasonal Calendar `[F10]`

| Season                    | Demand Impact                                           | Platform Action                                                           |
|:--------------------------|:--------------------------------------------------------|:--------------------------------------------------------------------------|
| **Oct–Nov** (pre-winter)  | Supply acquisition window                               | Optimal launch timing. Recruit Taskers before peak demand.                |
| **Jan–Feb** (Tsagaan Sar) | Peak cleaning demand — highest-leverage consumer moment | Marketing push. Ensure supply capacity. First major liquidity test.       |
| **Apr–May** (spring thaw) | Secondary cleaning + maintenance surge                  | Category expansion opportunity (plumbing, electrical).                    |
| **Jun–Aug** (summer)      | Demand drop. Some supply returns to rural areas         | Counter-seasonal categories (tutoring, digital tasks). Reduced marketing. |
| **Sep–Oct**               | Demand recovery. University students return             | Student supply recruitment for next Tsagaan Sar cycle.                    |

### 12.8 Solo Founder AI Operating Plan

This plan defines how AI is used as a force multiplier while keeping final authority, money movement, and trust
decisions under deterministic system and human control.

#### Operating Principles

1. AI assists; deterministic services decide. Booking/payment/state transitions are rule-driven and auditable.
2. High-risk actions (verification, dispute outcomes, payouts, moderation bans) require human approval.
3. Every AI-assisted workflow has measurable quality thresholds before scale-up.

#### AI Copilot Portfolio

1. **Verification Copilot**: Prioritizes verification queue by fraud-risk and SLA breach risk.
2. **Dispute Copilot**: Summarizes evidence, proposes outcomes, and highlights policy citations for admin decision.
3. **Supply Activation Copilot**: Recommends push timing, district/category activation, and outreach priority lists.
4. **Retention Copilot**: Generates rebook nudges, churn risk segments, and referral prompts.
5. **Founder Ops Copilot**: Produces weekly action brief with top failures, risks, and recommended interventions.
6. **Task Scope Summary Copilot** *(Phase 3+ optional)*: Rewrites structured intake answers into concise, readable job
   scope summaries without changing required structured fields.

#### Evaluation and Guardrails

1. Maintain a golden evaluation set for verification fraud flags, dispute summaries, and recommendation quality.
2. Gate deployment on precision/recall thresholds and manual spot checks per release.
3. Log model version, prompt version, and decision trace for every AI-assisted action.
4. Enforce PII minimization in prompts and redact sensitive fields by default.

#### 90-Day Solo Execution Cadence

1. **Weeks 1-4**: Launch Verification + Founder Ops copilots; measure ops-hour savings and false positive rate.
2. **Weeks 5-8**: Add Dispute + Supply Activation copilots; enforce review SLAs and conversion lift tracking.
3. **Weeks 9-12**: Add Retention copilot; evaluate repeat booking lift and referral conversion impact.

### 12.9 Execution Upgrades (v1.3)

1. **Canonical Decision Matrix**: Maintain a single PRD table for auth policy, pricing model, category limits, and phase
   gates to prevent cross-doc drift.
2. **Founder Capacity Budget**: Track weekly hour allocation (verification, dispatch, dispute, growth) and auto-freeze
   scope expansion if >10 hours for 2 consecutive weeks.
3. **Credit Abuse Controls**: Enforce velocity limits, anomaly detection, and manual review thresholds before increasing
   lead-unlock prices.
4. **Phase Readiness Reviews**: Require a formal checklist review for each phase transition (metrics, risk controls,
   legal readiness, rollback plan).
5. **Ops Runbook Automation**: Auto-generate weekly action reports from analytics + AI copilot outputs to reduce founder
   planning overhead.

---

## 13. Open Questions

1. What is the grace-period length for mandatory OTP migration of Phase 0-1 Facebook users in early Phase 2 rollout?
2. ~~What is the exact ramp-up ladder for lead-unlock credits by category and district?~~ **Resolved**: REQ-PAY-27
   defines category-tiered pricing (Cleaning/Moving 1,500 MNT, Plumbing/Electrical 3,000 MNT, Renovation/Tutoring
   5,000 MNT). Tier-to-category mapping is admin-configurable.
3. What legal and compliance constraints apply to stored-value credits beyond current assumptions, and which controls
   are mandatory before scale?
4. What minimum alert/ops tooling is required before demand-side Facebook scraping can be enabled, given ToS enforcement
   risk?
5. When should AI scope-summary polish graduate from optional experiment to default experience, and what quality gate
   should be required?

## 14. Appendix

### 14.1 Future Scope (Post-Phase 4)

* Cross-border services
* Multi-country compliance layers
* Full microservices decomposition
* Advanced AI-driven matching and pricing
* Platform insurance product
* MongolBank integrations for regulated financial services
* Ger district specialised service verticals `[Gemini1]`
* Expat and tourist concierge services `[Gemini1]`

---

### 14.2 Appendix: Core Data Entities

* **User**: ID, FacebookID, Phone (nullable), Role (Customer/Tasker/Admin), Status (Pending/Verified/Banned),
  ReferralCode, ReferredBy, AdminInternalNotes (admin-only).
* **Task**: ID, CustomerID, CategoryID, Description, Photos, Location (Lat/Long, Text), Budget, Status (`OPEN`/
  `ASSIGNED`/`COMPLETED`/`CANCELLED`/`NO_SHOW`), ScheduleTime, IntakeAnswersJSON, IntakeSchemaVersion,
  ScopeSummarySource (TEMPLATE/LLM/USER_EDITED).
* **Booking**: ID, TaskID, TaskerID, Price, Status (`ASSIGNED`/`COMPLETED`/`CANCELLED`/`NO_SHOW`), CreatedAt,
  SettlementMethod (DIRECT/QPAY/ESCROW).
* **Category**: ID, Name, NameMN, IconURL, IsActive, SortOrder, LeadUnlockCreditCost (nullable, Phase 2), IntakeEnabled,
  IntakeSchemaJSON, IntakeSchemaVersion.
* **CreditBalance** *(Phase 2)*: ID, TaskerID, Balance, TotalPurchased, TotalSpent, TotalRefunded.
* **CreditTransaction** *(Phase 2)*: ID, TaskerID, Amount, Type (PURCHASE/SPEND/REFUND/SIGNUP_BONUS), ReferenceID (
  BookingID or CreditPackID), CreatedAt.
* **CreditPack** *(Phase 2)*: ID, Name, CreditCount, PriceMNT, IsActive.
* **Subscription** *(Phase 3)*: ID, TaskerID, Tier, StartDate, EndDate, Status (ACTIVE/CANCELLED/EXPIRED), Amount.
* **Wallet** *(Phase 3)*: ID, UserID, Balance, Currency.
* **Transaction** *(Phase 3)*: ID, UserID, Amount, Type (Deposit/PlatformFee/Payout/Refund/SubscriptionPayment),
  ReferenceID.
* **Dispute**: ID, BookingID, Reason, Status, ResolutionNotes, ResolutionAction (
  RESOLVE_CUSTOMER/RESOLVE_TASKER/REFUND/RELEASE), WrongfulPartyUserID (nullable), InternalOutcomeNote (admin-only).
* **Conversation**: ID, TaskID, CustomerID, TaskerID, CreatedAt.
* **Message**: ID, ConversationID, SenderID, Content, CreatedAt, PhoneNumberFlagged (boolean).
* **TaskerStrike**: ID, UserID, BookingID, Reason, CreatedAt.
* **Referral**: ID, ReferrerID, ReferredID, ConversionEvent, ConvertedAt, RewardType, RewardApplied.
* **FeatureToggle**: ID, FeatureName, IsEnabled, ActivatedAt, DeactivatedAt.

#### 14.2.1 Seed Categories (Phase 0 Launch)

1. **Cleaning** (Гэр цэвэрлэгээ)
2. **Handyman** (Засвар үйлчилгээ)
3. **Moving** (Нүүлгэлт)

#### 14.2.2 Phase 1 Expansion Categories

4. **Plumbing** (Сантехник)
5. **Electrical** (Цахилгаан)
6. **Renovation** (Засал)

#### 14.2.3 Phase 2+ Categories (Demand-Driven)

7. **Furniture Assembly** (Тавилга угсрах)
8. **Tutoring** (Хичээл заах) `[Gemini2 — student supply]`
9. **Digital Tasks** (Дижитал ажил) `[Gemini2 — student supply]`

#### 14.2.4 Intake Schema Baseline Examples (Phase 1-2)

These are baseline examples for `Category.IntakeSchemaJSON` and are implemented as fixed forms, not conversational
chat.

1. **Cleaning**
    - `property_type` (single-select): Apartment, Ger, Office, House
    - `size_or_rooms` (numeric counter or bounded select): 1, 2, 3, 4+
    - `cleaning_type` (single-select): Standard, Deep Clean, Move-in/Move-out, Post-Renovation
    - `supplies_provided` (boolean): Yes/No
2. **Moving**
    - `moving_scope` (multi-select): A few items, 1-2 room apartment, 3+ room apartment, Office
    - `origin_floor_elevator` (single-select): Ground, 2nd-4th (no elevator), 5+ (no elevator), Freight elevator,
      Passenger elevator
    - `destination_floor_elevator` (single-select): Ground, 2nd-4th (no elevator), 5+ (no elevator), Freight elevator,
      Passenger elevator
    - `heavy_lifting_required` (boolean): Yes/No
3. **Plumbing**
    - `primary_issue` (single-select): Blocked pipe, Leak/Burst, Installation, Low pressure, Frozen pipe
    - `issue_location` (single-select): Bathroom, Kitchen, Heating system, Main line

---

### 14.3 Appendix: Research References

| ID  | Finding Summary                                                                                        | Source                             |
|:----|:-------------------------------------------------------------------------------------------------------|:-----------------------------------|
| F1  | Mongolia digitally ready: 85% smartphone, 83.9% internet, 88% Facebook penetration                     | MONGOLIA_MARKET_RESEARCH.md        |
| F2  | UB concentration supports district-first liquidity strategy                                            | MONGOLIA_MARKET_RESEARCH.md        |
| F3  | Core gap vs incumbents is trust infrastructure, not listing availability                               | MONGOLIA_MARKET_RESEARCH.md        |
| F4  | Relationship-driven culture: referrals are culturally aligned, not just growth tactics                 | MONGOLIA_MARKET_RESEARCH.md        |
| F5  | Supply side includes phone-first workers; Facebook-only auth excludes some Taskers                     | MONGOLIA_MARKET_RESEARCH.md        |
| F6  | QPay is dominant rail, but platform escrow trust must be earned via graduation                         | PAYMENT_BEHAVIOUR_ANALYSIS.md      |
| F7  | Off-platform leakage solved by information control, not fee policy                                     | PAYMENT_BEHAVIOUR_ANALYSIS.md      |
| F8  | Voluntary reviews underperform in high-context cultures; must be workflow-enforced                     | MONGOLIA_MARKET_RESEARCH.md        |
| F9  | Manual verification bottleneck can kill supply growth; need SLA and concierge ops                      | MONGOLIA_MARKET_RESEARCH.md        |
| F10 | Seasonal demand (Tsagaan Sar peak) is a major planning variable                                        | MONGOLIA_MARKET_RESEARCH.md        |
| F11 | 2-year contractor reclassification risk under Mongolian labour law                                     | MONGOLIA_MARKET_RESEARCH.md        |
| F12 | UB market ceiling (~500K–600K households) requires expansion plan                                      | MONGOLIA_MARKET_RESEARCH.md        |
| F13 | 98.3% of market supply is individual solo-operators, not companies                                     | unegui_market_report_2026-03-03.md |
| F14 | 60%+ of unegui listings hide prices or use placeholders; structured pricing is a critical gap          | unegui_market_report_2026-03-03.md |
| F15 | Location data on incumbent platforms is broken/fake (no GPS); GPS-based matching is needed             | unegui_market_report_2026-03-03.md |
| F16 | Moving is highly fragmented (ideal cold-start); Plumbing is highly monopolized                         | unegui_market_report_2026-03-03.md |
| F17 | Median incumbent listing description length is 52 chars; structured intake is needed for scope quality | unegui_market_report_2026-03-03.md |

---

*End of PRD v1.3*
