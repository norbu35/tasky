# Product Requirements Document (PRD): Tasky MVP

## 1. Introduction
**Product Name:** Tasky  
**Version:** 1.0 (MVP)  
**Status:** Draft  
**Authors:** Product Lead  
**Date:** 2026-02-12  

### 1.1 Purpose
To build Mongolia's first **trust-centric** domestic service marketplace. Unlike existing classifieds (Unegui.mn) or Facebook groups, Tasky guarantees service delivery and payment security through a managed booking flow.

### 1.2 Target Audience
*   **Customers (Demand):** Busy urban professionals in Ulaanbaatar (25-45yo) who value time and safety over the absolute lowest price. They struggle to find reliable help for cleaning, moving, and repairs.
*   **Taskers (Supply):** Skilled individuals (cleaners, handymen, movers) seeking consistent work and income security without the hassle of self-marketing on Facebook.

### 1.3 Value Proposition
| Feature | Current Alternative (Unegui/FB) | Tasky Solution |
| :--- | :--- | :--- |
| **Trust** | "Stranger danger", no verification | ID-verified Taskers, Reviews, Dispute protection |
| **Booking** | Call 10 people to find one available | Real-time availability, Instant booking |
| **Pricing** | Haggle on the spot, "foreigner price" | Fixed budget set upfront, no surprises |
| **Payment** | Cash/Transfer to personal account (Risk) | Secure payment held in escrow until job done |

### 1.4 Scope Boundaries

#### MVP In Scope
1.  Customer onboarding (Phone/SMS OTP primary) and profile
2.  Task posting with category, fixed price budget (no hourly), schedule, and location (Pin-drop + Description)
3.  Tasker onboarding, profile, and identity verification (Gov ID upload + Manual approval)
4.  Search, matching, booking, and status tracking
5.  In-app messaging and notifications
6.  Local payment initiation (QPay MVP) and confirmation
7.  Ratings, reviews, cancellation, and disputes
8.  Essential admin operations (Dispute resolution, User moderation) - minimal viable tooling

#### Out of Scope (Until Post-MVP)
1.  Cross-border services
2.  Advanced dynamic pricing and promotions engine
3.  Multi-country compliance layers
4.  Full microservices decomposition

#### Program-Level KPIs
1.  Task post to booking conversion rate
2.  Booking completion rate
3.  Repeat customer rate (30/60/90 day cohorts)
4.  Time to first match
5.  Dispute rate and resolution time
6.  Net promoter score or equivalent trust metric

---

## 2. User Stories (The "Happy Path")

### 2.1 Customer Flow
1.  **Onboarding**: User downloads app $\rightarrow$ Enters Phone Number $\rightarrow$ Receives SMS OTP $\rightarrow$ Creates Profile (Name, Avatar).
2.  **Post a Task**: User selects "Cleaning" $\rightarrow$ Sets Location (Pin + "Behind State Dept Store") $\rightarrow$ Sets Schedule ("Tomorrow 10 AM") $\rightarrow$ Sets Budget ("50,000 MNT") $\rightarrow$ Posts Task.
3.  **Booking**: User receives notifications of interested Taskers $\rightarrow$ Views Tasker Profiles (Rating, Verified Badge) $\rightarrow$ Accepts one.
4.  **Payment**: User pays 100% of budget via **QPay** (App-to-App) to confirm booking. Funds are held by Tasky.
    User MUST explicitly accept the liability disclaimer before payment initiation.
5.  **Completion**: Tasker finishes job $\rightarrow$ User marks "Complete" $\rightarrow$ Rates Tasker.

### 2.2 Tasker Flow
1.  **Onboarding**: Tasker downloads app $\rightarrow$ Phone/OTP $\rightarrow$ Uploads ID Card (Front/Back) $\rightarrow$ Submits for Review.
2.  **Verification**: (Offline) Admin reviews ID $\rightarrow$ Approves Tasker.
3.  **Find Work**: Tasker browses "Open Tasks" feed $\rightarrow$ Filters by Category/Location $\rightarrow$ Views Task Details.
4.  **Accept/Offer**: Tasker accepts the Customer's budget $\rightarrow$ Waits for Customer confirmation.
5.  **Execution**: Tasker sees exact location *after* booking $\rightarrow$ Goes to site $\rightarrow$ Performs work $\rightarrow$ Marks "Done".
6.  **Payout**: Funds credited to "Tasky Wallet" (minus commission) $\rightarrow$ Tasker requests Payout $\rightarrow$ Admin transfers to bank.

---

## 3. Functional Requirements

### 3.1 Authentication & Identity
*   **REQ-AUTH-01**: System MUST allow login/signup via Phone Number + SMS OTP (4-6 digits).
*   **REQ-AUTH-02**: System MUST prevent duplicate accounts for the same phone number.
*   **REQ-AUTH-03**: System MUST issue a secure Session Token (JWT) upon successful OTP.
*   **REQ-AUTH-04**: System MUST allow a user to request Tasker role activation before identity verification (role becomes `TASKER`, status remains verification-gated).

### 3.2 Task Management
*   **REQ-TASK-01**: Customer MUST be able to create a task with: Category, Description, Photos (max 3), Location (Lat/Long + Text), Schedule (Date/Time), and Budget (Fixed Amount).
*   **REQ-TASK-02**: Task status lifecycle MUST be: `OPEN` → `ASSIGNED` → `COMPLETED` | `CANCELLED`. A task moves to `ASSIGNED` when a Customer accepts a Tasker's application and payment is secured.
*   **REQ-TASK-03**: Taskers MUST be able to view a feed of `OPEN` tasks.
    *   **Privacy Rule**: The feed MUST show only "Approximate Location" (e.g., District name or 500m radius). Exact address is HIDDEN until Booking is Confirmed.
*   **REQ-TASK-04**: Task photos uploaded via presigned URL (S3/MinIO), max 3 photos per task.
    *   **Flow**: Client requests Presigned URL(s) -> Client uploads file(s) directly to Storage -> Client submits Task creation with `photo_keys` array.
    *   **Endpoint Pattern**: `POST /tasks/photos/upload-url` for pre-create uploads. `POST /tasks/{id}/photos/upload-url` may be used for post-create additions (max 3 total photos).
*   **REQ-TASK-05**: Task categories are database-managed. Admin can add, edit, and deactivate categories. Taskers can filter feed by Category and Distance.

### 3.3 Booking & Matching
*   **REQ-BOOK-01**: Tasker can "Apply" to an `OPEN` task.
*   **REQ-BOOK-02**: Customer can view list of Applicants and "Confirm" one.
*   **REQ-BOOK-03**: Booking is NOT final until Payment is secured (State: `PENDING_PAYMENT` → `PAID`).
*   **REQ-BOOK-04**: Customer Cancellation Policy: Free cancellation > 4 hours before start. Late cancellation (< 4 hours) incurs 10% fee (min 5k MNT) paid to Tasker.
*   **REQ-BOOK-05**: Booking status lifecycle MUST be: `PENDING_PAYMENT` → `PAID` → `COMPLETED` | `CANCELLED`. This is separate from the Task status lifecycle.
*   **REQ-BOOK-06**: Tasker Cancellation Policy: Tasker may cancel a booking; full refund issued to Customer, task reverts to `OPEN`. Strike system: 3 cancellations within 30 days results in a 7-day suspension from the platform.

### 3.4 Payments (Wallet Model)
*   **REQ-PAY-01**: Integration with **QPay** to generate QR/Deeplink for Customer payment.
*   **REQ-PAY-02**: System MUST record a "Pending Credit" to Tasker's internal wallet upon job completion.
*   **REQ-PAY-03**: System MUST deduct a configurable Platform Fee (e.g., 10%) before crediting Tasker.
*   **REQ-PAY-04**: Tasker MUST be able to request a "Payout" of their wallet balance.
*   **REQ-PAY-05**: Admin MUST have a view to see "Pending Payouts" and mark them as "Processed" (Manual bank transfer initially).
*   **REQ-PAY-06**: Payout schedule is fixed: Tuesdays and Fridays. Tasker requests payout, admin processes on next scheduled day.

### 3.5 Trust & Safety
*   **REQ-SAFE-01**: Tasker profile MUST be "Pending" until Admin manually approves the ID upload.
    *   **Upload Pattern**: ID images are uploaded using presigned URL endpoint(s), and submitted by storage key.
*   **REQ-SAFE-02**: Both parties MUST be able to Rate (1-5 stars) and Review text after `COMPLETED`.
*   **REQ-SAFE-03**: Either party can raise a "Dispute" if the booking is `PAID` (work in progress) or `COMPLETED` (within 24h). Dispute pauses payout.
*   **REQ-SAFE-04**: System MUST auto-assign "Pro Badge" to Taskers with > 5 completed jobs and > 4.5 average rating.

### 3.6 Notifications
*   **REQ-NOTIF-01**: System MUST send Push Notifications for:
    *   Tasker: New matching task nearby.
    *   Tasker: "You are hired!" (Booking confirmed).
    *   Customer: "Tasker applied to your task".
    *   Customer: "Tasker marked job complete".
*   **REQ-NOTIF-02**: System MUST send SMS fallback for "Hired" and "Booking Confirmed" events if app is not open.

### 3.7 In-App Messaging
*   **REQ-MSG-01**: In-app messaging between Customer and Tasker, available after a Tasker applies to a task. Real-time delivery via WebSocket (STOMP).
*   **REQ-MSG-02**: Message history MUST be persisted and accessible to both parties and admin (for dispute resolution).

### 3.8 Admin & Operations
*   **REQ-ADMIN-01**: Admin Dashboard MUST allow searching Users by Phone Number.
*   **REQ-ADMIN-02**: Admin MUST have a "Dispute Manager" view:
    *   See disputed task details and chat logs.
    *   Action: "Refund Customer" (Full/Partial).
    *   Action: "Release to Tasker" (Full/Partial).
*   **REQ-ADMIN-03**: Admin MUST be able to "Ban User" (prevents login).

---

## 4. Non-Functional Requirements
*   **NFR-SEC-01**: All PII (Phone, ID photos) MUST be encrypted at rest.
*   **NFR-PERF-01**: "Open Task" feed MUST load in < 1s on 4G network.
*   **NFR-LOC-01**: App MUST handle Mongolian Cyrillic input and display correctly.
*   **NFR-LEGAL-01**: Booking flow MUST include explicit "Liability Disclaimer" checkbox (Tasky is connector, not provider).
    *   **Contract Rule**: Payment initiation endpoint MUST require `liability_disclaimer_accepted=true`.
*   **NFR-RELI-01**: Payment status updates (Webhooks) MUST be idempotent and handle retries.
*   **NFR-RELI-02**: Mobile app MUST provide read-only local cache of "My Tasks" for offline viewing.
*   **NFR-API-01**: All list endpoints MUST support cursor-based pagination.

---

## 5. Analytics & Metrics (Success)
*   **North Star**: **Weekly Completed Bookings**.
*   **Key Metrics**:
    *   Conversion: % of `OPEN` tasks that become `ASSIGNED` (with `PAID` booking).
    *   Fulfillment: % of `PAID` bookings that become `COMPLETED`.
    *   Trust: % of Bookings with a Dispute.

---

## 6. Risks & Mitigations
| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Platform Leakage** | Users meet once, then trade offline to save 10%. | Hard to stop. Focus on "First Match" value. Offer insurance/guarantee for on-platform jobs (Post-MVP). |
| **Fake Tasks/Spam** | Competitors flood feed with fake jobs. | Rate limit task posting. Verify Customer phone numbers. |
| **Payment Delays** | Manual payouts are slow. | Set clear expectations ("Payouts processed every Tuesday/Friday"). |

---

## 7. Future Scope (Post-MVP)
*   "Dan" (E-Mongolia) Verification.
*   Advanced dynamic pricing and promotions engine.
*   Cross-border services.
*   SocialPay / Card payments.
## 8. Appendix: Core Data Entities
*   **User**: ID, Phone, Role (Customer/Tasker/Admin), Status (Pending/Verified/Banned), WalletBalance.
*   **Task**: ID, CustomerID, CategoryID, Description, Photos, Location (Lat/Long, Text), Budget, Status (`OPEN`/`ASSIGNED`/`COMPLETED`/`CANCELLED`), ScheduleTime.
*   **Booking**: ID, TaskID, TaskerID, Price, Status (`PENDING_PAYMENT`/`PAID`/`COMPLETED`/`CANCELLED`), CreatedAt.
*   **Category**: ID, Name, NameMN, IconURL, IsActive, SortOrder.
*   **Transaction**: ID, UserID, Amount, Type (Deposit/Fee/Payout/Refund), ReferenceID.
*   **Dispute**: ID, BookingID, Reason, Status, ResolutionNotes.
*   **Conversation**: ID, TaskID, CustomerID, TaskerID, CreatedAt.
*   **Message**: ID, ConversationID, SenderID, Content, CreatedAt.
*   **TaskerStrike**: ID, UserID, BookingID, Reason, CreatedAt.

### 8.1 Seed Categories (MVP)
1.  **Cleaning** (Гэр цэвэрлэгээ)
2.  **Plumbing** (Сантехник)
3.  **Moving** (Нүүлгэлт)
4.  **Electrical** (Цахилгаан)
5.  **Handyman** (Засвар үйлчилгээ)
