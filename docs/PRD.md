# Product Requirements Document (PRD): Tasky MVP

## 1. Introduction

**Product Name:** Tasky  
**Version:** 1.1 (MVP Rebaseline: Liquidity-First)  
**Status:** Approved (Scope Baseline Re-Locked)  
**Authors:** Product Lead  
**Date:** 2026-02-17

### 1.1 Purpose

To build Mongolia's first **trust-centric** domestic service marketplace. In phase-1, Tasky prioritizes liquidity and
trust-building by reducing friction to booking and delaying in-app monetization until repeat usage and marketplace
reliability are established.

### 1.2 Target Audience

* **Customers (Demand):** Busy urban professionals in Ulaanbaatar (25-45yo) who value time and safety over the absolute
  lowest price. They struggle to find reliable help for cleaning, moving, and repairs.
* **Taskers (Supply):** Skilled individuals (cleaners, handymen, movers) seeking consistent work and income security
  without the hassle of self-marketing on Facebook.

### 1.3 Value Proposition

| Feature     | Current Alternative (Unegui/FB)       | Tasky Solution                                                                              |
|:------------|:--------------------------------------|:--------------------------------------------------------------------------------------------|
| **Trust**   | "Stranger danger", no verification    | ID-verified Taskers, Reviews, Dispute protection                                            |
| **Booking** | Call 10 people to find one available  | Real-time availability, Instant booking                                                     |
| **Pricing** | Haggle on the spot, "foreigner price" | Fixed budget set upfront, no surprises                                                      |
| **Payment** | Cash/Transfer with no platform record | Phase-1: platform-booked jobs with direct settlement between parties; monetization deferred |

### 1.4 Scope Boundaries

#### MVP In Scope

1. Customer onboarding (Facebook OAuth primary) and profile
2. Task posting with category, fixed price budget (no hourly), schedule, and location (Pin-drop + Description)
3. Tasker onboarding, profile, and identity verification (Gov ID upload + Manual approval)
4. Search, matching, booking, and status tracking
5. In-app messaging and notifications
6. Booking confirmation with explicit liability disclaimer (no in-app payment in phase-1)
7. Ratings, reviews, cancellation, and disputes
8. Essential admin operations (Dispute resolution, User moderation) - minimal viable tooling
9. **Global Internationalization (i18n)**: UI must support switching between English (`en`) and Mongolian (`mn`), with Mongolian set as the default primary language for release.

#### Out of Scope (Until Post-MVP)

1. Cross-border services
2. Advanced dynamic pricing and promotions engine
3. Multi-country compliance layers
4. Full microservices decomposition
5. QPay and other payment provider integrations
6. Internal wallet, payout operations, and platform fee monetization

#### Program-Level KPIs

1. Task post to booking conversion rate
2. Booking completion rate
3. Repeat customer rate (30/60/90 day cohorts)
4. Time to first match
5. Dispute rate and resolution time
6. Net promoter score or equivalent trust metric

### 1.5 Baseline Lock Rule

1. This PRD version (`1.1`) is the backlog generation baseline.
2. Scope changes after backlog generation require:
    * Change rationale and impact summary (scope, timeline, risk)
    * Traceability updates to REQ/NFR IDs
    * ADR entry when architecture or quality gates are affected

---

## 2. User Stories (The "Happy Path")

### 2.1 Customer Flow

1. **Onboarding**: User downloads app $\rightarrow$ Continues with Facebook OAuth $\rightarrow$ Creates Profile (Name,
   Avatar).
2. **Post a Task**: User selects "Cleaning" $\rightarrow$ Sets Location (Pin + "Behind State Dept Store") $\rightarrow$
   Sets Schedule ("Tomorrow 10 AM") $\rightarrow$ Sets Budget ("50,000 MNT") $\rightarrow$ Posts Task.
3. **Booking**: User receives notifications of interested Taskers $\rightarrow$ Views Tasker Profiles (Rating, Verified
   Badge) $\rightarrow$ Accepts one.
4. **Confirmation**: User explicitly accepts the liability disclaimer and confirms booking.
   Payment is settled directly between Customer and Tasker in phase-1 (no platform wallet/escrow).
5. **Completion**: Tasker finishes job $\rightarrow$ User marks "Complete" $\rightarrow$ Rates Tasker.

### 2.2 Tasker Flow (Progressive Verification)

1. **Level 1 (Window Shopper)**: Tasker downloads app $\rightarrow$ Enters Phone/Facebook OAuth $\rightarrow$ Selects intended Categories $\rightarrow$ **Enables Push Notifications**.
   * *State:* Unverified. Can view task feed and receive push alerts, but cannot apply.
2. **Level 2 (First Job Barrier)**: Tasker attempts to "Apply" to a task $\rightarrow$ Prompted to upload ID Card + Selfie $\rightarrow$ Submits for Review.
3. **Level 3 (Verified)**: Admin manually reviews ID + Selfie in backend $\rightarrow$ Approves Tasker $\rightarrow$ Tasker matches and performs work.
4. **Execution**: Tasker sees exact location *after* booking $\rightarrow$ Goes to site $\rightarrow$ Performs work $\rightarrow$ Marks "Done".
5. **Settlement**: Tasker is paid directly by Customer using off-platform methods agreed in chat/booking notes.
3. **Find Work**: Tasker browses "Open Tasks" feed $\rightarrow$ Filters by Category/Location $\rightarrow$ Views Task
   Details.
4. **Accept/Offer**: Tasker accepts the Customer's budget $\rightarrow$ Waits for Customer confirmation.
5. **Execution**: Tasker sees exact location *after* booking $\rightarrow$ Goes to site $\rightarrow$ Performs
   work $\rightarrow$ Marks "Done".
6. **Settlement**: Tasker is paid directly by Customer using off-platform methods agreed in chat/booking notes.

---

## 3. Functional Requirements

### 3.1 Authentication & Identity

* **REQ-AUTH-01**: System MUST allow login/signup via Facebook OAuth as the primary flow. Phone/SMS OTP is deferred
  behind a feature flag for future activation.
* **REQ-AUTH-02**: System MUST prevent duplicate accounts for the same `facebook_id`.
* **REQ-AUTH-03**: System MUST issue a secure Session Token (JWT) upon successful OAuth authentication.
* **REQ-AUTH-04**: System MUST allow a user to request Tasker role activation before identity verification (role becomes
  `TASKER`, status remains verification-gated).

### 3.2 Task Management

* **REQ-TASK-01**: Customer MUST be able to create a task with: Category, Description, Photos (max 3), Location (
  Lat/Long + Text), Schedule (Date/Time), and Budget (Fixed Amount).
* **REQ-TASK-02**: Task status lifecycle MUST be: `OPEN` → `ASSIGNED` → `COMPLETED` | `CANCELLED`. A task moves to
  `ASSIGNED` when a Customer accepts a Tasker's application and confirms liability disclaimer acceptance.
* **REQ-TASK-03**: Taskers MUST be able to view a feed of `OPEN` tasks.
    * **Privacy Rule**: The feed MUST show only "Approximate Location" (e.g., District name or 500m radius). Exact
      address is HIDDEN until Booking is Confirmed.
* **REQ-TASK-04**: Task photos uploaded via presigned URL (S3/MinIO), max 3 photos per task.
    * **Flow**: Client requests Presigned URL(s) -> Client uploads file(s) directly to Storage -> Client submits Task
      creation with `photo_keys` array.
    * **Endpoint Pattern**: `POST /tasks/photos/upload-url` for pre-create uploads. `POST /tasks/{id}/photos/upload-url`
      may be used for post-create additions (max 3 total photos).
* **REQ-TASK-05**: Task categories are database-managed. Admin can add, edit, and deactivate categories. Taskers can
  filter feed by Category and Distance.

### 3.3 Booking & Matching

* **REQ-BOOK-01**: Tasker can "Apply" to an `OPEN` task.
* **REQ-BOOK-02**: Customer can view list of Applicants and "Confirm" one.
* **REQ-BOOK-03**: Booking is final when a Customer accepts an applicant and explicitly accepts liability disclaimer
  terms.
* **REQ-BOOK-04**: Customer Cancellation Policy: Free cancellation > 4 hours before start. Late cancellation (< 4 hours)
  is recorded as a reliability incident in the booking history and trust metrics.
* **REQ-BOOK-05**: Booking status lifecycle MUST be: `ASSIGNED` → `COMPLETED` | `CANCELLED`. This is separate from the
  Task status lifecycle.
* **REQ-BOOK-06**: Tasker Cancellation Policy: Tasker may cancel a booking; task reverts to `OPEN`. Strike system: 3
  cancellations within 30 days results in a 7-day suspension from the platform.

### 3.4 Monetization (Post-MVP, Deferred)

* **REQ-PAY-01** *(Post-MVP)*: Integration with **QPay** to generate QR/Deeplink for Customer payment.
* **REQ-PAY-02** *(Post-MVP)*: System MUST record a "Pending Credit" to Tasker's internal wallet upon job completion.
* **REQ-PAY-03** *(Post-MVP)*: System MUST deduct a configurable Platform Fee (e.g., 10%) before crediting Tasker.
* **REQ-PAY-04** *(Post-MVP)*: Tasker MUST be able to request a "Payout" of their wallet balance.
* **REQ-PAY-05** *(Post-MVP)*: Admin MUST have a view to see "Pending Payouts" and mark them as "Processed" (Manual bank
  transfer initially).
* **REQ-PAY-06** *(Post-MVP)*: Payout schedule is fixed: Tuesdays and Fridays. Tasker requests payout, admin processes
  on next scheduled day.

### 3.5 Trust & Safety

* **REQ-SAFE-01**: Tasker profile MUST be "Pending" until Admin manually approves the ID upload.
    * **Upload Pattern**: ID images are uploaded using presigned URL endpoint(s), and submitted by storage key.
* **REQ-SAFE-02**: Both parties MUST be able to Rate (1-5 stars) and Review text after `COMPLETED`.
* **REQ-SAFE-03**: Either party can raise a "Dispute" if the booking is `ASSIGNED` (work in progress) or `COMPLETED` (
  within 24h).
* **REQ-SAFE-04**: System MUST auto-assign "Pro Badge" to Taskers with > 5 completed jobs and > 4.5 average rating.

### 3.6 Notifications

* **REQ-NOTIF-01**: System MUST send Push Notifications for:
    * Tasker (Unverified & Verified): New matching task nearby (Critical for Phase 1 Liquidity strategy).
    * Tasker: "You are hired!" (Booking confirmed).
    * Customer: "Tasker applied to your task".
    * Customer: "Tasker marked job complete".
* **REQ-NOTIF-02**: System MUST send SMS fallback for "Hired" and "Booking Confirmed" events if app is not open.

### 3.7 In-App Messaging

* **REQ-MSG-01**: In-app messaging between Customer and Tasker, available after a Tasker applies to a task. Real-time
  delivery via WebSocket (STOMP).
* **REQ-MSG-02**: Message history MUST be persisted and accessible to both parties and admin (for dispute resolution).

### 3.8 Admin & Operations

* **REQ-ADMIN-01**: Admin Dashboard MUST allow searching Users by Phone Number.
* **REQ-ADMIN-02**: Admin MUST have a "Dispute Manager" view:
    * See disputed task details and chat logs.
    * Action: "Resolve for Customer", "Resolve for Tasker", or "Escalate" with rationale notes.
    * **Post-MVP Extension**: monetary "Refund/Release" actions when wallet is enabled.
* **REQ-ADMIN-03**: Admin MUST be able to "Ban User" (prevents login).

### 3.9 Frontend Design System

* **REQ-UI-01**: Web UI MUST be implemented using `shadcn/ui` primitives as the base component library. New web screens
  and features MUST compose from those primitives rather than introducing additional UI component frameworks.
* **REQ-UI-02**: Mobile UI MUST implement platform-native component equivalents that follow the same design tokens,
  naming semantics, states, and interaction behavior defined by the web design system.

---

## 4. Non-Functional Requirements

* **NFR-SEC-01**: All PII (Phone, ID photos) MUST be encrypted at rest.
* **NFR-PERF-01**: "Open Task" feed MUST load in < 1s on 4G network.
* **NFR-LOC-01**: App MUST handle Mongolian Cyrillic input and display correctly.
* **NFR-LEGAL-01**: Booking flow MUST include explicit "Liability Disclaimer" checkbox (Tasky is connector, not
  provider).
    * **Contract Rule**: Booking acceptance endpoint MUST require `liability_disclaimer_accepted=true`.
* **NFR-RELI-01**: Booking state-changing operations MUST be idempotent and handle retries safely.
* **NFR-RELI-02**: Mobile app MUST provide read-only local cache of "My Tasks" for offline viewing.
* **NFR-API-01**: All list endpoints MUST support cursor-based pagination.
* **NFR-OBS-01**: System MUST emit product analytics events for MVP funnel milestones (task posted, application
  submitted, tasker accepted, booking confirmed, booking completed, dispute raised) with locale and platform dimensions.
* **NFR-UI-01**: Web and Mobile MUST consume a shared design token source of truth (color, spacing, typography, radius,
  elevation, motion), with platform-specific adapters as needed.
* **NFR-UI-02**: All new web UI flows MUST support keyboard navigation and meet WCAG 2.1 AA contrast requirements.

---

## 5. Analytics & Metrics (Success)

* **North Star**: **Weekly Completed Bookings**.
* **Key Metrics**:
    * Conversion: % of `OPEN` tasks that become `ASSIGNED`.
    * Fulfillment: % of `ASSIGNED` bookings that become `COMPLETED`.
    * Trust: % of Bookings with a Dispute.

---

## 6. Risks & Mitigations

| Risk                                 | Impact                                           | Mitigation                                                                                                                          |
|:-------------------------------------|:-------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------|
| **Platform Leakage**                 | Users meet once, then trade offline to save 10%. | Hard to stop. Focus on "First Match" value. Offer insurance/guarantee for on-platform jobs (Post-MVP).                              |
| **Fake Tasks/Spam**                  | Competitors flood feed with fake jobs.           | Rate limit task posting. Validate OAuth identities and abuse signals.                                                                |
| **Off-Platform Settlement Disputes** | Payment proof can be ambiguous in phase-1.       | Strong dispute evidence capture (chat, timestamps, photos), explicit liability disclaimer, and clear post-MVP monetization roadmap. |

---

## 7. Future Scope (Post-MVP)

* "Dan" (E-Mongolia) Verification and MongolBank integrations.
* Advanced dynamic pricing and promotions engine.
* Cross-border services.
* QPay integration, platform escrow/wallet, and payout operations.
* SocialPay / Card payments.

## 8. Appendix: Core Data Entities

* **User**: ID, FacebookID, Phone (nullable), Role (Customer/Tasker/Admin), Status (Pending/Verified/Banned).
* **Task**: ID, CustomerID, CategoryID, Description, Photos, Location (Lat/Long, Text), Budget, Status (`OPEN`/
  `ASSIGNED`/`COMPLETED`/`CANCELLED`), ScheduleTime.
* **Booking**: ID, TaskID, TaskerID, Price, Status (`ASSIGNED`/`COMPLETED`/`CANCELLED`), CreatedAt.
* **Category**: ID, Name, NameMN, IconURL, IsActive, SortOrder.
* **Transaction** *(Post-MVP)*: ID, UserID, Amount, Type (Deposit/Fee/Payout/Refund), ReferenceID.
* **Dispute**: ID, BookingID, Reason, Status, ResolutionNotes.
* **Conversation**: ID, TaskID, CustomerID, TaskerID, CreatedAt.
* **Message**: ID, ConversationID, SenderID, Content, CreatedAt.
* **TaskerStrike**: ID, UserID, BookingID, Reason, CreatedAt.

### 8.1 Seed Categories (MVP)

1. **Cleaning** (Гэр цэвэрлэгээ)
2. **Plumbing** (Сантехник)
3. **Moving** (Нүүлгэлт)
4. **Electrical** (Цахилгаан)
5. **Handyman** (Засвар үйлчилгээ)
