# Product Requirements Document (PRD): Tasky

**Status:** Canonical  
**Version:** 2.0  
**Last updated:** 2026-04-22

## 1. Purpose

This PRD defines the intended **Phase 1 launch product** for Tasky. It is the primary source of truth for product behavior, launch scope, and requirement-level acceptance criteria.

When active documents conflict:

1. this PRD wins on intended product behavior
2. `docs/STRATEGY.md` constrains launch and market posture
3. maintenance policies constrain governance and rollout discipline
4. architecture, design, OpenAPI, tests, and implementation are derived from this PRD

Code may describe current implementation reality, but it does not silently redefine product intent.

## 2. Product Thesis

Tasky is a trust-first, liquidity-first service marketplace for Ulaanbaatar. Phase 1 is not trying to prove full city coverage, monetization, or mature marketplace automation. Phase 1 is trying to prove that a constrained launch cell can generate enough structured demand and supply to complete real jobs through a mostly self-serve product flow.

The product question for Phase 1 is:

**Can a customer in the pilot area post a structured task, receive qualified supply quickly, confirm a booking, and get the job completed without manual rescue?**

## 3. Phase 1 Success Condition

Phase 1 succeeds when the Bayangol pilot demonstrates:

- reliable qualified applications in the launch categories
- conversion from posting to confirmed booking
- enough completed jobs to show operational viability
- trust outcomes good enough to justify expansion
- decreasing reliance on assisted rescue over time

The KPI model in this PRD is normative. Supporting dashboards, exports, and alerts must conform to it.

## 4. Personas

### 4.1 Customer

A Ulaanbaatar resident who needs a one-off or occasional service task completed with minimal coordination overhead.

### 4.2 Tasker

An individual willing to perform listed services for payment. In Phase 1, tasker supply may come from anywhere in the city, including outskirts and student-heavy areas, but only taskers willing to serve Bayangol may participate in pilot demand.

### 4.3 Admin / Founder-Operator

The operator who manages verification, moderation, category intake schemas, feature toggles, waitlist demand, and dispute resolution, and who may provide launch rescue when native matching fails.

## 5. Phase 1 Launch Baseline

### 5.1 Coverage and pilot boundary

- Tasky is positioned as a product built for Ulaanbaatar.
- Phase 1 operational truth is **Bayangol-only live posting**.
- Customers outside Bayangol may browse, but they may not create live tasks.
- Out-of-area customers must be offered a waitlist that captures both **area** and **category**.
- Supply is citywide, but a tasker must explicitly declare willingness to serve Bayangol before applying to pilot tasks.
- Public copy must explicitly communicate that the pilot is currently live in Bayangol.

### 5.2 Launch categories

Phase 1 launches only the following service categories:

1. Home cleaning
2. Furniture assembly
3. Moving help / lifting help
4. Minor handyman

The following remain out of scope for Phase 1:

- safety-critical or regulated categories such as electrical, gas, structural, roofing, major plumbing, or lock work
- high-trust care categories such as childcare, eldercare, or in-home health-like support
- privacy-sensitive service types that require heavy disclosure to be intelligible
- highly ambiguous, quote-heavy categories such as renovation or custom interior projects
- categories involving vulnerable users or elevated abuse/moderation risk

### 5.3 Trust and money posture

Phase 1 trust is based on:

- verified identities
- structured task and booking records
- evidence trail
- moderation
- disputes and serious complaint handling

Phase 1 does **not** promise:

- payment hold
- payment protection
- escrow
- wallet safety guarantees

### 5.4 Phase 1 feature posture

Phase 1 does not depend on OTP-first auth, DAN, escrow, subscriptions, credits, referrals, B2B workflows, instant match, or other deferred monetization and expansion surfaces.

## 6. Core Product Principles

1. **Structure beats ambiguity.** Launch flows must prefer structured input over free-form negotiation.
2. **Native liquidity before assisted liquidity.** The product must measure native marketplace health before leaning on rescue channels.
3. **Trust before scale.** Coverage claims, copy, and interaction design must not outrun verification and moderation reality.
4. **Category-first learning.** Category is the primary decision slice for launch KPIs; district is diagnostic.
5. **No false availability.** The product must not imply that unsupported areas or deferred capabilities are already live.

## 7. Canonical Domain Concepts

### 7.1 Launch cell

For Phase 1 operations, the pilot area is defined by the customer task location being inside Bayangol. KPI scorecards are sliced primarily by category, with district as drilldown.

### 7.2 Pilot-eligible task

A `pilot_eligible_task` is a task whose service location is inside Bayangol, belongs to a launch category, and is not invalidated by spam, fraud, or admin rejection.

### 7.3 Qualified application

A `qualified_application` is an application submitted through the platform by a tasker who, at the time of apply:

- is identity-verified and active
- is eligible for the task category
- has passed category-specific vetting where required
- has declared willingness to serve the task area
- is not banned, paused, or otherwise blocked from taking work

Time-slot availability is not part of qualification in Phase 1.

### 7.4 Booking confirmation

A booking is `confirmed` only when:

- a customer selects a specific applicant
- the selected tasker accepts within the active acceptance window
- the platform records the selection and acceptance as a confirmed booking

### 7.5 Assisted vs self-serve outcomes

Task progress is classified into one of three buckets:

1. **Self-serve** — native posting, native application, native booking, no rescue
2. **System-assisted** — task-level external distribution was used
3. **Manual-assisted** — an operator performed task-specific rescue

Self-serve metrics exclude both assisted classes.

### 7.6 Intervention

`intervention = true` means the task required non-standard rescue or assistance to progress. Track:

- `intervention_type = manual_rescue | external_distribution | ops_override`
- `intervention_stage = pre_match | post_match | post_booking | completion_rescue`

### 7.7 Out-of-area demand

Out-of-area posting attempts must be captured with:

- `out_of_area_post_attempted`
- `out_of_area_waitlist_joined`
- `waitlist_area`
- `waitlist_category`

## 8. Core User Journeys

### 8.1 Customer journey

1. Sign in with Facebook OAuth.
2. Browse available categories and select a launch category.
3. Start a category-specific intake flow.
4. Provide task location, schedule, structured scope details, pricing mode, optional photos, and title.
5. If the task location is outside Bayangol, posting is blocked and the customer is offered a waitlist by area and category.
6. If eligible, post the task and await applications.
7. Compare applications and select one tasker.
8. The selected tasker accepts within the SLA and the booking becomes confirmed.
9. The task proceeds to fulfillment.
10. The tasker marks the job complete.
11. The customer confirms or disputes completion. If silent, SMS nudges and timeout handling apply.
12. After completion, the customer must submit a structured review before posting another task.

### 8.2 Tasker journey

1. Sign in with Facebook OAuth.
2. Request tasker role activation.
3. Complete verification and declare service willingness for Bayangol.
4. Browse and apply to eligible open tasks.
5. Submit a structured application with pricing response and short note.
6. Withdraw before selection if needed.
7. If selected, accept within the SLA.
8. Complete the job and mark it complete.
9. Submit the required post-completion review before applying to another task.

### 8.3 Admin journey

1. Review verification submissions.
2. Manage launch categories and intake schemas.
3. Manage feature activation posture.
4. Moderate users and resolve disputes or serious complaints.
5. Operate the waitlist.
6. Trigger or monitor assisted distribution when native matching fails.
7. Perform task-level rescue when required.

## 9. Detailed Functional Requirements

## 9.1 Coverage and availability

- **REQ-P1-COVER-01**: The product MUST present itself as built for Ulaanbaatar while enforcing Bayangol-only live posting in Phase 1.
- **REQ-P1-COVER-02**: The system MUST determine pilot eligibility from the customer task location, not from the tasker home location.
- **REQ-P1-COVER-03**: Customers outside Bayangol MUST be allowed to browse, but live posting MUST be blocked.
- **REQ-P1-COVER-04**: When out-of-area posting is blocked, the product MUST offer waitlist capture keyed by both area and category.
- **REQ-P1-COVER-05**: Taskers MAY onboard from anywhere in Ulaanbaatar, but they MUST explicitly declare willingness to serve Bayangol before applying to pilot tasks.
- **REQ-P1-COVER-06**: Public launch copy, onboarding copy, and unsupported-area copy MUST explicitly communicate the Bayangol pilot boundary.

## 9.2 Authentication and accounts

- **REQ-P1-AUTH-01**: Facebook OAuth MUST be the only launch authentication method for new session creation in Phase 1.
- **REQ-P1-AUTH-02**: The system MUST fail closed for new authentication when Facebook OAuth is unavailable.
- **REQ-P1-AUTH-03**: Existing valid sessions MUST remain usable until expiry during temporary Facebook provider outage.
- **REQ-P1-AUTH-04**: The system MUST prevent duplicate Facebook identities from creating duplicate user accounts.
- **REQ-P1-AUTH-05**: BANNED users and actively suspended users MUST be denied authentication even if provider credentials are otherwise valid.
- **REQ-P1-AUTH-06**: OTP-based auth flows MAY remain implemented behind flags, but they MUST remain disabled for Phase 1 launch and MUST NOT appear in customer-facing launch UX.

## 9.3 Roles, verification, and tasker eligibility

- **REQ-P1-SAFE-01**: A user MAY request tasker role activation before verification, but MUST remain verification-gated until approved.
- **REQ-P1-SAFE-02**: New taskers MUST remain pending until manual verification is completed by admin.
- **REQ-P1-SAFE-03**: Category-specific vetting MUST be supported for categories that require additional eligibility beyond identity verification.
- **REQ-P1-SAFE-04**: A tasker MUST explicitly declare service-area willingness for Bayangol before the system treats them as eligible supply for pilot tasks.
- **REQ-P1-SAFE-05**: The platform MUST preserve auditable evidence of verification consent, verification decision, and verification state changes.

## 9.4 Category model and fixed templates

- **REQ-P1-CAT-01**: Phase 1 task creation MUST use category-specific intake templates. A generic free-form posting flow MUST NOT be the primary creation path.
- **REQ-P1-CAT-02**: The launch category catalog MUST include home cleaning, furniture assembly, moving help / lifting help, and minor handyman.
- **REQ-P1-CAT-03**: Minor handyman MUST be subtype-based and MUST exclude regulated, dangerous, or diagnosis-heavy work.
- **REQ-P1-CAT-04**: Admin MUST be able to add, edit, activate, deactivate, and reorder category templates.
- **REQ-P1-CAT-05**: Deactivating a category MUST block new draft and create requests for that category while preserving existing task lifecycle continuity.

## 9.5 Task posting and intake

- **REQ-P1-TASK-01**: The task create flow MUST require task location, preferred date, time window, short title, structured scope fields, and pricing mode.
- **REQ-P1-TASK-02**: Task photos MUST be optional but strongly encouraged.
- **REQ-P1-TASK-03**: Task photos MUST use presigned upload URLs and MUST be capped at three photos per task.
- **REQ-P1-TASK-04**: Draft creation MUST bind to the active intake schema version at form start.
- **REQ-P1-TASK-05**: Submit-time validation MUST execute against the draft-bound schema version even if a newer version has since been activated.
- **REQ-P1-TASK-06**: The system MUST generate a deterministic scope summary from structured intake answers before final submit.
- **REQ-P1-TASK-07**: If summary rendering fails, the system MUST persist a canonical key-value fallback summary without blocking posting.
- **REQ-P1-TASK-08**: The system MUST reject out-of-area live posting attempts while still recording the attempt and offering waitlist capture.
- **REQ-P1-TASK-09**: Task feeds visible before booking confirmation MUST expose only district-level or approximate location, not exact address or precise coordinates.
- **REQ-P1-TASK-10**: Exact task address MUST be revealed only after booking confirmation, and only to the task owner, confirmed tasker, and authorized admin surfaces.

## 9.6 Category-specific template requirements

- **REQ-P1-TASK-11**: Home cleaning intake MUST capture property type, room count or size bracket, cleaning type, supplies provided yes/no, pets present yes/no, preferred date and time window, and pricing mode.
- **REQ-P1-TASK-12**: Furniture assembly intake MUST capture furniture type, item count, brand/model when known, delivered yes/no, instructions available yes/no, preferred date and time window, and pricing mode.
- **REQ-P1-TASK-13**: Moving help intake MUST capture move type, estimated load size, pickup stairs/elevator, dropoff stairs/elevator, vehicle needed yes/no, helper count needed, preferred date and time window, and pricing mode.
- **REQ-P1-TASK-14**: Minor handyman intake MUST capture task subtype, material/item available yes/no, wall/surface type where relevant, estimated item count, preferred date and time window, and pricing mode.
- **REQ-P1-TASK-15**: Each launch template MAY collect optional photos and notes, but the required fields MUST be sufficient for a tasker to make a yes/no application decision without pre-booking chat.

## 9.7 Pricing model

- **REQ-P1-PRICE-01**: Every launch-category task MUST support exactly two pricing modes: `I have a budget` and `I want quotes`.
- **REQ-P1-PRICE-02**: When a customer chooses `I have a budget`, the posted budget MUST be visible to applicants.
- **REQ-P1-PRICE-03**: When a customer chooses `I have a budget`, taskers MUST be allowed either to accept the budget or to submit a counter-offer.
- **REQ-P1-PRICE-04**: When a customer chooses `I want quotes`, taskers MUST submit a price quote as part of the application.
- **REQ-P1-PRICE-05**: The customer MUST see both original budget and counter-offer where counter-offers exist.
- **REQ-P1-PRICE-06**: Quote and counter-offer submission MUST be structured, not open-ended free-form negotiation.
- **REQ-P1-PRICE-07**: The agreed booking price MUST lock at confirmed booking.
- **REQ-P1-PRICE-08**: Pricing state changes relevant to booking must be auditable.

## 9.8 Applications and matching

- **REQ-P1-MATCH-01**: Only qualified taskers MUST be allowed to apply to a pilot-eligible task.
- **REQ-P1-MATCH-02**: Applications MUST include a structured pricing response and a short structured note.
- **REQ-P1-MATCH-03**: Customers MUST be able to review all applications on a task. The UI MAY rank or highlight top candidates, but MUST NOT hard-cap comparison to a fixed maximum.
- **REQ-P1-MATCH-04**: Customers MUST select exactly one applicant to proceed toward booking confirmation.
- **REQ-P1-MATCH-05**: Taskers MUST be allowed to withdraw an application before customer selection.
- **REQ-P1-MATCH-06**: Open-ended pre-booking chat MUST NOT be available in Phase 1.
- **REQ-P1-MATCH-07**: The product MUST rely on structured application data rather than pre-booking chat to support customer choice.

## 9.9 Booking confirmation and scheduling

- **REQ-P1-BOOK-01**: A booking MUST become confirmed only when the customer selects a tasker and the selected tasker accepts within the active acceptance window.
- **REQ-P1-BOOK-02**: The default acceptance window for a selected tasker MUST be four hours.
- **REQ-P1-BOOK-03**: If the selected tasker does not accept within the window, the pending selection MUST expire without confirming the booking.
- **REQ-P1-BOOK-04**: Non-selected applications MUST close automatically once one tasker is confirmed.
- **REQ-P1-BOOK-05**: Booking confirmation MUST require explicit liability disclaimer acceptance.
- **REQ-P1-BOOK-06**: The booking record MUST store the acceptance of the liability disclaimer and the locked booking price.
- **REQ-P1-BOOK-07**: Exact address reveal MUST occur only after booking confirmation.
- **REQ-P1-BOOK-08**: Direct raw phone-number exchange MUST NOT be required for Phase 1 fulfillment; if messaging or calling exists post-confirmation, it MUST remain platform-mediated and available for admin review.
- **REQ-P1-BOOK-09**: Only in-app reschedule requests and responses may change policy timers.
- **REQ-P1-BOOK-10**: Reschedule lifecycle events MUST be immutable and auditable, including request, accept, decline, and expiry.
- **REQ-P1-BOOK-11**: Accepted reschedule requests MUST update the canonical schedule and reset policy timers.
- **REQ-P1-BOOK-12**: Declined or expired reschedule requests MUST preserve the prior accepted schedule.

## 9.10 Booking lifecycle, cancellation, and no-show

- **REQ-P1-BOOK-13**: The booking lifecycle MUST support confirmed, completed, canceled, disputed, and no-show outcomes.
- **REQ-P1-BOOK-14**: Customer cancellation more than four hours before scheduled start MUST not create a reliability incident.
- **REQ-P1-BOOK-15**: Customer cancellation at or within four hours of scheduled start MUST create a reliability incident.
- **REQ-P1-BOOK-16**: Tasker cancellation of a confirmed booking MUST reopen the linked task to eligible supply unless the customer cancels instead.
- **REQ-P1-BOOK-17**: Repeated tasker cancellation behavior MUST support reliability enforcement, including suspension thresholds defined in derived operations policy.
- **REQ-P1-BOOK-18**: Safety or fraud-coded tasker cancellations MUST bypass ordinary automated strike logic and open the appropriate trust-and-safety handling path.
- **REQ-P1-BOOK-19**: The system MUST send a no-show reminder to both participants at scheduled start plus ten minutes if the booking remains unresolved.
- **REQ-P1-BOOK-20**: A no-show flag MUST NOT be accepted before fifteen minutes after scheduled start.
- **REQ-P1-BOOK-21**: Recent in-app activity within the configured lookback window MUST block premature no-show adjudication.
- **REQ-P1-BOOK-22**: A future accepted in-app reschedule MUST supersede no-show adjudication on the original schedule.
- **REQ-P1-BOOK-23**: A valid no-show adjudication MUST transition booking and task state consistently and leave an audit trail.
- **REQ-P1-BOOK-24**: Repeated no-show behavior MUST support strike-review or equivalent trust escalation.

## 9.11 Completion flow

- **REQ-P1-BOOK-25**: Task completion MUST follow this sequence: tasker marks complete -> customer confirms or disputes -> SMS reminder on silence -> timeout auto-complete -> ops fallback for edge cases.
- **REQ-P1-BOOK-26**: Customer silence after tasker-marked completion MUST not block the product indefinitely; the platform MUST support timeout-based auto-complete after reminder attempts.
- **REQ-P1-BOOK-27**: Ops MUST be able to review and resolve edge cases before finalization when the normal completion flow stalls or becomes contested.
- **REQ-P1-BOOK-28**: Completion proof MAY remain optional for most launch categories, but the product MUST support attaching evidence artifacts where disputes or complaints require them.

## 9.12 Reviews, reputation, complaints, and disputes

- **REQ-P1-SAFE-06**: After a booking reaches `COMPLETED`, both parties MUST owe a structured review.
- **REQ-P1-SAFE-07**: Until the owed review is submitted, the customer MUST be blocked from posting a new task and the tasker MUST be blocked from applying to another task.
- **REQ-P1-SAFE-08**: Review obligation MUST be enforced as a post-completion gate, not as part of the completion-state definition itself.
- **REQ-P1-SAFE-09**: The platform MUST send a review prompt immediately at completion and support reminder prompts for unresolved review obligations.
- **REQ-P1-SAFE-10**: The structured review model MUST support at least an overall rating, whether the tasker showed up on time, whether the task was completed as expected, whether the user would book again, and optional text.
- **REQ-P1-SAFE-11**: Tasker-to-customer reviews MUST be supported in Phase 1.
- **REQ-P1-SAFE-12**: Serious complaints MUST remain a separate path from ordinary reviews.
- **REQ-P1-SAFE-13**: Public reputation in Phase 1 MUST prioritize verification and trust badges; public rating display MUST remain hidden until a minimum review-count threshold is reached.
- **REQ-P1-SAFE-14**: A dispute MUST be openable during an active booking and for a limited period after completion.
- **REQ-P1-SAFE-15**: Dispute submission MUST require evidence artifacts or enter a grace process that can auto-close for insufficient evidence.
- **REQ-P1-SAFE-16**: Phase 1 dispute resolution MUST remain limited to evidence-backed moderation outcomes and admin misconduct notes rather than escrow or payout adjudication.
- **REQ-P1-SAFE-17**: Verification consent, review enforcement, complaint handling, and admin evidence access MUST remain auditable.
- **REQ-P1-SAFE-18**: Customer-facing trust messaging MUST promise identity, records, evidence, moderation, and dispute handling, and MUST NOT promise payment protection, payment hold, or escrow.

## 9.13 Messaging, privacy, and contact

- **REQ-P1-MSG-01**: Phase 1 MUST NOT support open-ended pre-booking chat.
- **REQ-P1-MSG-02**: Any post-confirmation contact channel that exists MUST remain platform-mediated and available for admin review.
- **REQ-P1-MSG-03**: Non-participants MUST NOT be able to read or send post-confirmation messages.
- **REQ-P1-MSG-04**: Raw direct contact details MUST remain hidden until the product intentionally unlocks them through an approved policy surface; Phase 1 does not require such unlock for normal operation.
- **REQ-P1-MSG-05**: If message content contains obvious off-platform contact-sharing patterns, the system SHOULD support moderation flags.

## 9.14 Notifications

- **REQ-P1-NOTIF-01**: The system MUST notify eligible taskers when a newly posted pilot task matches their role and category eligibility.
- **REQ-P1-NOTIF-02**: The system MUST notify the selected tasker when chosen by a customer.
- **REQ-P1-NOTIF-03**: The system MUST notify both participants when a booking becomes confirmed.
- **REQ-P1-NOTIF-04**: The system MUST notify both participants about no-show reminders and other schedule-critical lifecycle events.
- **REQ-P1-NOTIF-05**: The system MUST notify both participants about completion prompts and review obligations.
- **REQ-P1-NOTIF-06**: The system MUST notify taskers of verification decisions and customers of waitlist submission where applicable.
- **REQ-P1-NOTIF-07**: Notification delivery for launch-critical lifecycle events MUST be auditable.

## 9.15 Assistance model and rescue

- **REQ-P1-ASSIST-01**: The product MUST classify task outcomes as self-serve, system-assisted, or manual-assisted.
- **REQ-P1-ASSIST-02**: Task-level external distribution MUST NOT be used by default.
- **REQ-P1-ASSIST-03**: External distribution MAY trigger only when a pilot-eligible task has received no qualified application within twelve hours of posting.
- **REQ-P1-ASSIST-04**: External distribution MUST be limited in Phase 1 to home cleaning, furniture assembly, moving help, and minor handyman.
- **REQ-P1-ASSIST-05**: External distribution payloads MUST be sanitized and MUST NOT expose exact address, raw contact details, or unsupported trust claims.
- **REQ-P1-ASSIST-06**: Tasks advanced through external distribution MUST remain eligible for booking and completion metrics but MUST be excluded from self-serve fulfillment reporting.
- **REQ-P1-ASSIST-07**: Manual task-specific rescue performed by the operator MUST be recorded as intervention.
- **REQ-P1-ASSIST-08**: General marketing or broad supply seeding MUST NOT be misclassified as task-level intervention.

## 9.16 Admin operations

- **REQ-P1-ADMIN-01**: Admin MUST be able to review pending verifications and approve or reject them.
- **REQ-P1-ADMIN-02**: Admin MUST be able to manage category templates and activation state.
- **REQ-P1-ADMIN-03**: Admin MUST be able to manage feature toggles as rollout controls, but toggles alone MUST NOT be treated as product readiness.
- **REQ-P1-ADMIN-04**: Admin MUST be able to ban and unban users.
- **REQ-P1-ADMIN-05**: Admin MUST be able to review evidence, complaints, disputes, and moderation flags.
- **REQ-P1-ADMIN-06**: Admin MUST be able to inspect and manage waitlist demand by area and category.
- **REQ-P1-ADMIN-07**: Admin MUST be able to perform manual rescue, but such rescue MUST remain auditable and separately measurable from self-serve activity.
- **REQ-P1-ADMIN-08**: Admin MUST be able to monitor or trigger assisted distribution within the launch rules.

## 9.17 Analytics, KPI instrumentation, and launch telemetry

- **REQ-P1-KPI-01**: The platform MUST expose the canonical business events and state transitions needed to compute the Phase 1 KPI stack.
- **REQ-P1-KPI-02**: KPI computation MUST be based on backend-exported business metrics or derived state transitions, not ad hoc dashboard SQL.
- **REQ-P1-KPI-03**: The product MUST distinguish self-serve outcomes from assisted outcomes in its event model.
- **REQ-P1-KPI-04**: The platform MUST emit telemetry for pilot-eligible task creation, qualified applications, confirmed bookings, completed bookings, interventions, out-of-area post attempts, and waitlist joins.
- **REQ-P1-KPI-05**: Category MUST be the default scorecard slice for launch KPI reporting, with district as drilldown.
- **REQ-P1-KPI-06**: All launch-critical KPI events and state changes MUST remain auditable enough to support operational review.

## 10. KPI Model

## 10.1 Hard-gate metrics

1. **Qualified Match Rate within 24h**  
   `% of pilot_eligible_task posts receiving at least one qualified_application within 24h`
2. **Post -> Confirmed Booking Rate within 48h**  
   `% of pilot_eligible_task posts that reach confirmed_booking within 48h of posting`
3. **Intervention Rate**  
   `% of pilot_eligible_task posts requiring intervention`
4. **Trust Failure Rate**  
   `% of confirmed bookings ending in objective trust-damaging failure`

### 10.1.1 Hard-gate thresholds

| Metric                                    |    Green |   Yellow |     Red |
| ----------------------------------------- | -------: | -------: | ------: |
| Qualified Match Rate within 24h           | `>= 50%` | `40-49%` | `< 40%` |
| Post -> Confirmed Booking Rate within 48h | `>= 25%` | `15-24%` | `< 15%` |
| Intervention Rate                         | `<= 40%` | `41-55%` | `> 55%` |
| Trust Failure Rate                        | `<= 15%` | `16-20%` | `> 20%` |

## 10.2 Monitored metrics

1. **Self-Serve Fulfillment Rate**  
   `% of pilot_eligible_task posts reaching completed_booking within 7 days of posting, through the platform flow, with no intervention`
2. **Booking Completion Rate**  
   `% of confirmed bookings reaching completed_booking within 7 days of confirmation`
3. **Verification Queue Turnaround**  
   median and p95 from complete document submission to final decision, split for identity verification and category vetting

### 10.2.1 Monitored targets

| Metric                           | Target                         |
| -------------------------------- | ------------------------------ |
| Self-Serve Fulfillment Rate      | `>= 15%`                       |
| Booking Completion Rate          | `>= 65%`                       |
| Identity Verification Turnaround | median `<= 36h`, p95 `<= 96h`  |
| Category Vetting Turnaround      | median `<= 72h`, p95 `<= 120h` |

## 10.3 KPI policy rules

- All seven KPIs MUST exist on a real dashboard before launch.
- Alerts are required only for the hard-gate metrics.
- KPI decisions are valid only once denominator thresholds are met.
- Category is the primary launch scorecard slice; district is diagnostic drilldown.
- Native self-serve reporting MUST exclude both system-assisted and manual-assisted outcomes.

## 11. Non-Goals for Phase 1

- no customer-facing payment hold, protection, or escrow promise
- no citywide live posting
- no generic task-posting flow as the primary launch flow
- no open-ended pre-booking chat
- no launch dependency on OTP auth, DAN, subscriptions, credits, referrals, B2B, instant match, or escrow activation
- no claim that assisted distribution counts as native marketplace health

## 12. Superseded Assumptions To Remove From Derived Artifacts

The following assumptions are invalid for Phase 1 and MUST be removed from code, tests, contracts, architecture notes, design artifacts, and copy if they still appear:

1. **Fixed-budget-only posting** — invalid. Phase 1 supports both budgeted posts and quote requests.
2. **Open-ended pre-booking messaging** — invalid. Phase 1 uses structured applications with no open-ended pre-booking chat.
3. **Citywide live posting** — invalid. Phase 1 allows live posting only in Bayangol.
4. **Payment held or protected by Tasky** — invalid. Phase 1 makes no escrow or payment-protection promise.
5. **Assisted outcomes counted as self-serve** — invalid. System-assisted and manual-assisted outcomes are excluded from self-serve fulfillment.
6. **Founder intervention as a separate core metric from manual intervention** — invalid for Phase 1. Use a generic intervention model.
7. **Review lock only under risk flags** — invalid. In Phase 1, owed review blocks the next post/apply action until fulfilled.
8. **Pre-booking conversation created on apply** — invalid. Phase 1 does not require or expose open-ended pre-booking conversation.
9. **Forward-reference or future-phase APIs treated as active product truth** — invalid. Launch contracts must reflect live or implemented-and-gated behavior only.

## 13. Acceptance-of-Alignment Rule

The product is aligned only when:

- code and tests implement this PRD
- Strategy, KPI, maintenance, architecture, design, and contract docs do not exceed this PRD
- public copy does not promise behavior outside this PRD
- launch dashboards measure the KPI model defined here
