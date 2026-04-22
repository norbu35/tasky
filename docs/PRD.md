# Product Requirements Document (PRD): Tasky

**Status:** Canonical  
**Version:** 1.5  
**Last updated:** 2026-04-22

## 1. Purpose

This PRD defines the intended Phase 1 launch product. When active docs conflict, this file wins on product behavior.

## 2. Phase 1 Launch Baseline

### 2.1 Pilot boundary

- Tasky is built for Ulaanbaatar.
- Live customer posting is available only in **Bayangol** during Phase 1.
- Supply is citywide, but a tasker must explicitly declare willingness to serve Bayangol before applying.
- Out-of-area customers may browse, but posting is blocked and a waitlist is offered by **area** and **category**.
- Public launch copy must explicitly say the pilot is live in Bayangol.

### 2.2 Launch categories

Phase 1 launches only:

1. Home cleaning
2. Furniture assembly
3. Moving help / lifting help
4. Minor handyman

Safety-critical, regulated, high-trust care, privacy-sensitive, and highly ambiguous quote-heavy categories remain out
of scope.

### 2.3 Pricing and trust posture

- Phase 1 supports both `I have a budget` and `I want quotes`.
- Counter-offers are allowed on budgeted posts.
- Quote submission is structured, not open-ended negotiation.
- Price locks at confirmed booking.
- Phase 1 trust promise is verified identities, structured booking records, evidence trail, disputes, and moderation.
- Phase 1 must make **no** customer-facing promise that payment is held, protected, or escrowed.

## 3. Core User Flows

### 3.1 Customer

1. Customer signs in with Facebook OAuth.
2. Customer selects a launch category and completes a fixed category template.
3. Customer provides location, preferred date, time window, short title, structured scope fields, optional photos, and
   pricing mode.
4. If the location is outside Bayangol, posting is blocked and the customer may join a waitlist by area and category.
5. Customer posts the task and sees all applications.
6. Customer selects one tasker.
7. Selected tasker accepts within the SLA and the booking becomes confirmed.
8. Tasker marks the job complete.
9. Customer confirms completion or disputes it. If the customer is silent, the system sends SMS and may auto-complete
   after timeout with ops fallback.
10. Both parties owe structured reviews after completion.

### 3.2 Tasker

1. Tasker signs in with Facebook OAuth.
2. Tasker requests tasker role activation and remains verification-gated until approved.
3. Tasker declares willingness to serve Bayangol.
4. Tasker browses pilot-eligible tasks and applies with a structured response.
5. Tasker may withdraw before selection.
6. If selected, the tasker accepts within the SLA and the booking becomes confirmed.
7. Tasker completes the job and marks it complete.
8. Tasker submits the required structured review after completion.

### 3.3 Founder / Admin

1. Admin reviews verification submissions.
2. Admin manages category templates and feature toggles.
3. Admin moderates users and resolves disputes or serious complaints.
4. Admin provides manual rescue when native matching fails.

## 4. Functional Requirements

### 4.1 Authentication And Identity

- **REQ-P1-AUTH-01**: Phase 1 MUST allow Facebook OAuth sign-in and signup as the only launch authentication flow.
- **REQ-P1-AUTH-02**: The system MUST fail closed when Facebook OAuth is unavailable during launch, while preserving already valid sessions until expiry.
- **REQ-P1-AUTH-03**: The system MUST prevent duplicate Facebook identities from creating duplicate accounts.
- **REQ-P1-AUTH-04**: Users MAY request Tasker role activation before verification, but they MUST remain verification-gated until admin approval.

### 4.2 Task Posting

- **REQ-P1-TASK-01**: Phase 1 task creation MUST use fixed category-specific templates, not a generic free-form posting flow.
- **REQ-P1-TASK-02**: The task create flow MUST require task location, preferred date, time window, short title, structured scope fields, optional-but-encouraged photos, and a pricing mode of either `I have a budget` or `I want quotes`.
- **REQ-P1-TASK-03**: Drafts MUST bind to the schema version loaded at draft start, and submit-time validation MUST use that bound version.
- **REQ-P1-TASK-04**: The system MUST generate a deterministic scope summary before final submit and persist the fallback key-value summary if template rendering fails.
- **REQ-P1-TASK-05**: Posting MUST be blocked outside Bayangol in Phase 1, while browse remains available and the product offers waitlist capture by area and category.
- **REQ-P1-TASK-06**: Task photos MUST use presigned upload URLs and MUST remain capped at three total photos per task.

### 4.3 Booking And Matching

- **REQ-P1-BOOK-01**: Verified taskers who declare Bayangol service willingness MUST be able to browse pilot-eligible tasks, apply, and withdraw before customer selection.
- **REQ-P1-BOOK-02**: Customers MUST be able to review all applications and select one tasker; the UI MAY highlight a top few, but there is no hard comparison cap.
- **REQ-P1-BOOK-03**: Booking MUST require explicit liability disclaimer acceptance and MUST become confirmed only after the selected tasker accepts within the default four-hour SLA.
- **REQ-P1-BOOK-04**: Exact address reveal and direct contact details MUST occur only after booking confirmation.
- **REQ-P1-BOOK-05**: The booking lifecycle MUST support confirmed booking, completion, cancellation, dispute, and no-show outcomes, and non-selected applications MUST close automatically once one tasker is confirmed.
- **REQ-P1-BOOK-06**: Reschedule requests MUST be accepted only through the in-app flow, immutable timeline events MUST record request, accept, decline, and expiry, and chat-only schedule mentions MUST not change policy timers.
- **REQ-P1-BOOK-07**: Completion MUST follow the Phase 1 sequence of tasker marks complete -> customer confirms or disputes -> SMS reminder on silence -> timeout auto-complete -> ops fallback for edge cases.

### 4.4 Trust, Reviews, And Complaints

- **REQ-P1-SAFE-01**: New taskers MUST remain pending until manual verification is completed by admin.
- **REQ-P1-SAFE-02**: After a booking reaches `COMPLETED`, both parties MUST submit structured reviews, and until the review obligation is fulfilled the customer MUST be blocked from posting a new task and the tasker MUST be blocked from applying to a new one.
- **REQ-P1-SAFE-03**: Serious complaints and disputes MUST remain separate from normal reviews and MUST use evidence-backed moderation flows.
- **REQ-P1-SAFE-04**: Phase 1 customer trust messaging MUST promise verified identity, booking records, evidence trail, disputes, and moderation, and MUST NOT promise payment hold, payment protection, or escrow.
- **REQ-P1-SAFE-05**: Pro badge assignment MAY remain automatic at the launch threshold defined in derived implementation docs, but it is secondary to verification and moderation trust controls.
- **REQ-P1-SAFE-06**: Verification consent, review locks, and admin evidence access MUST be auditable.

### 4.5 Contact And Notifications

- **REQ-P1-MSG-01**: Phase 1 MUST NOT allow open-ended pre-booking chat. Before selection, the tasker interaction surface is limited to the structured application and pricing response.
- **REQ-P1-MSG-02**: After booking confirmation, any contact that exists MUST remain platform-mediated, persisted, and available for admin review.
- **REQ-P1-MSG-03**: Notifications MUST cover application activity, selection, booking confirmation, completion prompts, review obligations, disputes, and rescue/escalation moments.

### 4.6 Admin Operations

- **REQ-P1-ADMIN-01**: Admin MUST be able to review pending verifications.
- **REQ-P1-ADMIN-02**: Admin MUST be able to add, edit, deactivate, and activate category intake schemas.
- **REQ-P1-ADMIN-03**: Admin MUST be able to manage feature toggles as rollout controls.
- **REQ-P1-ADMIN-04**: Admin MUST be able to ban and unban users.
- **REQ-P1-ADMIN-05**: Admin MUST be able to resolve disputes and use concierge dispatch or manual rescue for launch backstop operations.

## 5. KPI Model

### 5.1 Hard-gate metrics

1. Qualified Match Rate within 24h
2. Post -> Confirmed Booking Rate within 48h
3. Intervention Rate
4. Trust Failure Rate

### 5.2 Monitored metrics

1. Self-Serve Fulfillment Rate
2. Booking Completion Rate
3. Verification Queue Turnaround

### 5.3 KPI implementation policy

- All seven KPIs must exist on a real dashboard before launch.
- Alerts are required only for hard-gate metrics.
- KPI computation must come from backend-exported business metrics derived from canonical events and state transitions.
- Category is the primary KPI slice; district is drilldown.

## 6. Non-Goals For Launch

1. No customer-facing payment hold, protection, or escrow promise.
2. No launch dependency on OTP auth, credits, referrals, subscriptions, B2B, instant match, DAN, or escrow activation.
3. No generic citywide posting.
4. No open-ended pre-booking chat.

## 7. Canonical Lifecycle Vocabulary

Phase 1 documentation should normalize on:

- `pilot_eligible_task`
- `qualified_application`
- `confirmed_booking`
- `completed_booking`
- `intervention`
- `intervention_type = manual_rescue | external_distribution | ops_override`
- `intervention_stage = pre_match | post_match | post_booking | completion_rescue`
- `out_of_area_post_attempted`
- `out_of_area_waitlist_joined`
- `waitlist_area`
- `waitlist_category`
