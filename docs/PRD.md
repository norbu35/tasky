# Product Requirements Document (PRD): Tasky

## 1. Executive Summary

**Product Name:** Tasky  
**Version:** 1.4 (Launch Baseline Realignment)  
**Status:** Phase 1 launch baseline only  
**Sources of truth:** `docs/maintenance/PRODUCTION_READINESS.md`, `docs/maintenance/FEATURE_ACTIVATION_POLICY.md`, `docs/LAUNCH_ROADMAP.md`

This PRD defines the verified launch product, not the full long-term roadmap. Phase 1 is a controlled pilot with zero monetization and founder concierge backstop. Later-phase items remain conditional until they are explicitly verified and promoted out of dormant, deferred, or implemented-gated status.

## 2. Product Thesis

Tasky is a trust-first domestic services marketplace for Mongolia. The launch product solves the immediate trust problem: verified identity, structured task posting, reliable booking, evidence-backed disputes, and founder-supported operations. The launch is intentionally conservative. It proves that customers and taskers can complete jobs on-platform before the business introduces paid rails or expansion products.

## 3. Launch Goals And Operating Rules

### 3.1 Phase 1 Goals

1. Enable a customer to post a task with structured intake, budget, location, and schedule.
2. Enable verified taskers to find tasks, apply, and complete bookings through a stable direct-settlement flow.
3. Preserve trust and safety with mandatory reviews, disputes, verification, and admin moderation.
4. Give the founder and admin team the tools needed to keep the pilot running manually where needed.

### 3.2 Launch KPIs

1. Task post to first applicant conversion
2. Task post to confirmed booking conversion
3. Booking completion rate
4. Review completion rate
5. Verification queue turnaround time
6. Dispute resolution time
7. Repeat booking rate

### 3.3 Measurement Rules

1. KPI gates use a trailing 28-day window unless a specific flow states otherwise.
2. KPI decisions require at least 50 events in the measurement window.
3. If data quality is degraded, hold the decision until tracking is repaired and backfilled.
4. Revenue, escrow adoption, subscription conversion, and other monetization metrics are not Phase 1 launch KPIs.

## 4. Primary Users

### 4.1 Customer

Busy urban households in Ulaanbaatar that need reliable help for cleaning, moving, and repairs. The launch product must reduce call-chain negotiation, build confidence in the selected tasker, and keep the task lifecycle visible.

### 4.2 Tasker

Verified individuals who want a steady stream of jobs without self-marketing on social feeds. The launch product must make it easy to discover relevant tasks, apply, complete work, and build reputation from real bookings.

### 4.3 Founder / Admin

The launch pilot depends on a founder-operated concierge backstop. Admin is not a future abstraction here; it is part of the product surface required to keep the pilot reliable.

## 5. Phase 1 Scope

### 5.1 Verified In Scope

| Area                        | Phase 1 requirement                                                                                                                       | Verified status |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Auth and onboarding         | Facebook OAuth is the launch auth path.                                                                                                   | Launch-live     |
| Task posting                | Structured intake, draft binding, deterministic scope summary, presigned photo upload, and schema version persistence.                    | Launch-live     |
| Booking and matching        | Open application flow, applicant review, booking confirmation, reschedule, no-show handling, and exact address reveal after confirmation. | Launch-live     |
| Messaging and notifications | In-app chat, push notifications, and booking lifecycle notifications.                                                                     | Launch-live     |
| Reviews and disputes        | Mandatory reviews, evidence-backed disputes, and admin resolution.                                                                        | Launch-live     |
| Admin operations            | Verification queue, category management, feature toggle management, user moderation, and dispute support.                                 | Launch-live     |
| Core infrastructure         | Idempotency, outbox, cursor pagination, structured logging, phone encryption, OAuth outage posture, and FCM.                              | Launch-live     |

### 5.2 Explicitly Out Of Scope For Launch

| Surface                                          | Current verified status                                               | Launch implication           |
| ------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------- |
| Phone OTP auth                                   | Deferred in API and roadmap.                                          | Not part of Phase 1.         |
| Lead fees, credits, and lead-unlock monetization | Partial, with no confirmed runtime consumer for `lead_fee_enabled`.   | Not launch-ready.            |
| Escrow, wallet, and payout flows                 | Implemented-gated and off for launch.                                 | Stay disabled for the pilot. |
| Referrals                                        | Deferred forward reference.                                           | Not part of Phase 1.         |
| Subscription                                     | Deferred forward reference.                                           | Not part of Phase 1.         |
| B2B Lite                                         | Deferred forward reference.                                           | Not part of Phase 1.         |
| DAN verification                                 | Deferred forward reference.                                           | Not part of Phase 1.         |
| Instant match                                    | Deferred forward reference.                                           | Not part of Phase 1.         |
| AI scope summary rewrite                         | The deterministic summary path is launch-live; AI rewrite is dormant. | Not part of Phase 1.         |

The launch baseline deliberately excludes all monetization that depends on later-phase customer behavior. The product must work end-to-end without assuming future paid rails are already live.

## 6. Phase 1 User Flows

### 6.1 Customer Flow

1. Customer signs in with Facebook OAuth and creates a profile.
2. Customer chooses a category and completes the structured intake form.
3. The server binds the draft to a schema version and generates a deterministic job scope summary.
4. Customer adds up to three photos, location, schedule, and fixed budget, then posts the task.
5. Taskers browse the open feed, apply, and the customer reviews applicants.
6. Customer accepts a tasker, agrees to the liability disclaimer, and the booking becomes assigned.
7. Customer and tasker use in-app messaging during the job.
8. Customer marks the job complete and both parties submit reviews.
9. If the job fails, the customer or tasker opens a dispute and the admin team resolves it as evidence-only mediation.

### 6.2 Tasker Flow

1. Tasker signs in with Facebook OAuth and completes profile setup.
2. Tasker enables notifications and browses open tasks.
3. Tasker applies to tasks of interest.
4. Tasker sees the exact address only after booking confirmation in Phase 1.
5. Tasker completes the job, marks it done, and submits a review.
6. Tasker uses the review history and completed tasks count to build reputation in the launch period.

### 6.3 Founder / Admin Flow

1. Admin reviews the verification queue and approves or rejects taskers.
2. Admin manages categories and versioned intake schemas.
3. Admin uses feature toggles as operational controls, not as a claim that later-phase features are already live.
4. Admin can ban users, review disputes, and use concierge dispatch for unmatched tasks.

## 7. Functional Requirements

### 7.1 Authentication And Identity

- **REQ-P1-AUTH-01**: Phase 1 MUST allow Facebook OAuth sign-in and signup as the only launch authentication flow.
- **REQ-P1-AUTH-02**: The system MUST fail closed when Facebook OAuth is unavailable during launch, while preserving already valid sessions until expiry.
- **REQ-P1-AUTH-03**: The system MUST prevent duplicate Facebook identities from creating duplicate accounts.
- **REQ-P1-AUTH-04**: Users MAY request Tasker role activation before verification, but they MUST remain verification-gated until admin approval.

### 7.2 Task Posting

- **REQ-P1-TASK-01**: The task create flow MUST require category, description, photos, location, schedule, and fixed budget.
- **REQ-P1-TASK-02**: The system MUST render launch intake from category-specific structured schemas with 3 to 5 required questions.
- **REQ-P1-TASK-03**: Drafts MUST bind to the schema version loaded at draft start, and submit-time validation MUST use that bound version.
- **REQ-P1-TASK-04**: The system MUST generate a deterministic job scope summary before final submit and persist the fallback key-value summary if template rendering fails.
- **REQ-P1-TASK-05**: Deactivated categories MUST block new drafts and new task posts while preserving existing tasks.
- **REQ-P1-TASK-06**: Task photos MUST use presigned upload URLs and MUST remain capped at three total photos per task.

### 7.3 Booking And Matching

- **REQ-P1-BOOK-01**: Verified taskers MUST be able to browse open tasks and apply.
- **REQ-P1-BOOK-02**: Customers MUST be able to review applicants and confirm one tasker.
- **REQ-P1-BOOK-03**: Booking MUST require explicit liability disclaimer acceptance.
- **REQ-P1-BOOK-04**: Exact address reveal MUST occur only after booking confirmation in Phase 1.
- **REQ-P1-BOOK-05**: The booking state machine MUST support assigned, completed, cancelled, and no-show outcomes.
- **REQ-P1-BOOK-06**: Reschedule requests MUST be accepted only through the in-app flow, and immutable timeline events MUST record request, accept, decline, and expiry.
- **REQ-P1-BOOK-07**: No-show handling MUST enforce the reminder and dual-inactivity rules defined in the launch baseline.

### 7.4 Trust And Safety

- **REQ-P1-SAFE-01**: New taskers MUST remain pending until manual verification is completed by admin.
- **REQ-P1-SAFE-02**: Both parties MUST submit structured reviews after completion, with soft reminders at completion, 24 hours, and 72 hours.
- **REQ-P1-SAFE-03**: Disputes MUST be allowed only from assigned bookings or within 24 hours of completion.
- **REQ-P1-SAFE-04**: Phase 1 dispute resolution MUST be evidence-only mediation, with admin-visible misconduct notes where needed.
- **REQ-P1-SAFE-05**: Pro badge assignment MUST occur automatically at the launch threshold defined in the architecture and launch roadmap.
- **REQ-P1-SAFE-06**: Verification consent, review events, and admin media access MUST be auditable.

### 7.5 Messaging And Notifications

- **REQ-P1-MSG-01**: In-app messaging MUST be available after a tasker applies to a task.
- **REQ-P1-MSG-02**: Messaging history MUST persist for both parties and admin review.
- **REQ-P1-MSG-03**: Push notifications MUST cover task discovery, hiring, booking confirmation, reschedule events, no-show reminders, and review reminders.

### 7.6 Admin And Operations

- **REQ-P1-ADMIN-01**: Admin MUST be able to review pending verifications.
- **REQ-P1-ADMIN-02**: Admin MUST be able to add, edit, deactivate, and activate category intake schemas.
- **REQ-P1-ADMIN-03**: Admin MUST be able to manage feature toggles as rollout controls.
- **REQ-P1-ADMIN-04**: Admin MUST be able to ban and unban users.
- **REQ-P1-ADMIN-05**: Admin MUST be able to resolve disputes and use concierge dispatch for launch backstop operations.

## 8. Latent Capabilities Appendix

This appendix is the canonical PRD view of dormant and deferred capabilities. Status values come from
`docs/maintenance/FEATURE_ACTIVATION_POLICY.md`; if implementation evidence changes,
update that artifact first and then update this appendix.

| Surface                     | Current verified status                                                                  | Product implication                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `ai_scope_summary_enabled`  | Launch path is deterministic-summary only; AI rewrite has no confirmed runtime consumer. | Keep dormant until a real consumer and verification path exist.             |
| `escrow_enabled`            | Implemented-gated backend path exists, but launch baseline keeps it off.                 | Current activation candidate only after an explicit later rollout decision. |
| `lead_fee_enabled`          | Partial; no confirmed runtime consumer in the matrix.                                    | Not activation-ready.                                                       |
| `promoted_listings_enabled` | Partial, with an architecture-to-code discrepancy and no matching backend evidence.      | Not activation-ready.                                                       |
| `subscription_enabled`      | Deferred and shell-only.                                                                 | Not activation-ready.                                                       |
| `b2b_enabled`               | Deferred and shell-only, with no matching runtime evidence.                              | Not activation-ready.                                                       |
| Referrals                   | Deferred forward reference.                                                              | Not activation-ready.                                                       |
| DAN verification            | Deferred forward reference.                                                              | Not activation-ready.                                                       |
| Instant match               | Deferred forward reference.                                                              | Not activation-ready.                                                       |
| Phone OTP auth              | Deferred forward reference.                                                              | Future migration path, not Phase 1 scope.                                   |

The point of this table is to preserve research signal without confusing implementation presence, shell presence, and launch readiness. A surface can exist in docs or UI without being a launch commitment.

## 9. Non-Goals For Launch

1. No platform monetization in Phase 1.
2. No assumption that later-phase product lines can be turned on without implementation work.
3. No launch dependency on OTP, escrow, subscriptions, referrals, B2B, instant match, or DAN.
4. No AI summary rewrite dependency in the posting path.
5. No customer-facing promise of payments, rewards, or business billing that is not in the launch baseline.

## 10. Open Product Questions

1. What exact Phase 2 migration path will be used for OTP-authenticated users?
2. What verified runtime path will be used before `lead_fee_enabled` or `promoted_listings_enabled` can be considered activation-ready?
3. What evidence and performance thresholds are required before escrow leaves the implemented-gated state?
4. Which future-phase surfaces should remain in PRD versus move to separate phase specs once implementation begins?

## Appendix A: Architecture Traceability (Implementability Gate)

This appendix maps PRD requirements to their architecture coverage. A PRD requirement is considered architecturally covered only when mapped to schema, flow, security/ops policy, and test strategy. Source: extracted from `docs/architecture/common.md` §9 during the architecture doc split.

| PRD Capability Area                                               | Architecture Coverage                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0-1 Facebook OAuth + outage posture                         | `api.md` §4.1 `users` identity model, §4.2 identity/outage flow, §5.3 auth outage policy                                                                                                    |
| Structured intake forms (Phase 0-2)                               | `api.md` §4.1 `categories` + `category_schema_versions` + `task_drafts` + `tasks`, §4.2 intake flow, `common.md` §5.1 schema safety, `shared-frontend.md` §8 renderer contract              |
| Deterministic scope summary + fail-open                           | `api.md` §4.1 `tasks.scope_summary_source`, §4.2 intake flow, §5.3 AI safety, `shared-frontend.md` §8 summary contract                                                                      |
| Task/Booking lifecycle with NO_SHOW                               | `api.md` §4.1 `tasks.status`, `bookings.status`, `booking_timeline_events`; §4.2 task/booking flow                                                                                          |
| Reschedule authority + timer integrity                            | `api.md` §4.1 `booking_schedule_events`, §4.2 reschedule flow                                                                                                                               |
| Repeat booking + instant match fallback logic                     | `api.md` §4.1 `instant_match_offers`, §4.2 ranking/repeat/instant-match flow, §5.6 booking contract                                                                                         |
| No-applicant rescue flow                                          | `api.md` §4.1 `task_rescue_events`, §4.2 rescue flow                                                                                                                                        |
| Information controls (contact/address reveal)                     | `api.md` §5.3 authorization reveal rules, §4.2 monetization/message flow                                                                                                                    |
| Phase 0-1 direct settlement + legal disclaimer persistence        | `api.md` §4.1 `bookings.settlement_mode` + disclaimer fields, §4.2 monetization flow, §5.3 liability contract                                                                               |
| Phase 2 lead-unlock pricing and debit policy                      | `api.md` §4.1 `lead_unlock_prices`, `credit_transactions`, §5.6 monetization contract; activation gap remains until runtime consumer is confirmed                                           |
| Phase 3 subscription and escrow walleting                         | `api.md` §4.1 wallet + subscription tables, §4.2 monetization flow, `common.md` §5.1 idempotency; escrow is implemented-gated, subscription remains deferred                                |
| Phase 2 B2B Lite and Phase 4 alternate rails preparedness         | `api.md` §4.1 `business_accounts`/`business_locations`/`business_members`, §4.2 monetization flow, `common.md` §5.2 per-rail telemetry; document as future activation work, not live gating |
| Mandatory bilateral reviews                                       | `api.md` §4.1 `booking_reviews` + `review_enforcement_cases`, §4.2 reviews/disputes flow                                                                                                    |
| Reliability score and Pro badge automation                        | `api.md` §4.1 `tasker_reliability_scores` + `tasker_badges`, §4.2 reviews/disputes flow, §5.6 trust scoring contract                                                                        |
| Disputes with evidence                                            | `api.md` §4.1 `disputes` + `dispute_evidence`, `common.md` §5.1 idempotency scope                                                                                                           |
| Messaging default with tamper-evident retention                   | `api.md` §4.1 `messages.content_hash`, §4.2 messaging flow                                                                                                                                  |
| Notifications with SMS fallback idempotency                       | `api.md` §4.1 `notification_log.event_key`, §5.6 dispute/review contract                                                                                                                    |
| Verification and admin auditability                               | `api.md` §4.1 `verifications`, `audit_events`, `common.md` §5.2 operational alerts                                                                                                          |
| Admin operations (category lifecycle, feature toggles, concierge) | `api.md` §4.1 `categories`/`category_schema_versions`/`feature_toggles`/`audit_events`, §4.2 rescue + category lifecycle flows                                                              |
| Category deactivation + existing-task continuity                  | `api.md` §4.2 category lifecycle flow, `shared-frontend.md` §8 draft/submit contract                                                                                                        |
| Referral tracking, phase-aware rewards, and conversion            | `api.md` §4.1 `referrals` + `referral_rewards`, §4.2 category/referral flow                                                                                                                 |
| Referral fraud caps and ops review                                | `api.md` §4.2 referral flow alerts, `common.md` §5.2 fraud/threshold observability                                                                                                          |
| Frontend design system and cross-platform parity                  | `shared-frontend.md` §2–§4 token/parity contracts, §6 file structure, §7 test naming                                                                                                        |
| NFR security/privacy + retention + consent                        | `api.md` §4.1 verification consent fields, §5.3 privacy controls, `common.md` §5.3 legal controls                                                                                           |
| NFR performance                                                   | `common.md` §5.3 feed performance budget + §5.2 latency alerting                                                                                                                            |
| NFR localization/i18n                                             | `common.md` §4.2 i18n contract                                                                                                                                                              |
| NFR API/versioning/pagination/error envelope                      | `api.md` §5.1, §5.2, §5.5, §5.6                                                                                                                                                             |
| NFR reliability + offline cache                                   | `common.md` §5.1 idempotency/policy guards/offline support                                                                                                                                  |
| MVP observability and scope-clarity gate                          | `common.md` §5.2 product events + required dimensions + alerts                                                                                                                              |

**Gate rule:** Any PRD delta touching functional requirements must update this appendix and the corresponding architecture doc sections in the same PR.
