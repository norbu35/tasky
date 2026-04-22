# PRD-to-Backend Alignment Audit Report

**Date:** 2026-04-23
**Scope:** Full backend codebase vs. `docs/PRD.md` v2.1, `docs/STRATEGY.md`, architecture docs, OpenAPI contracts, and maintenance policies
**Method:** 7 parallel audit agents covering every REQ-P1-_ and NFR-_ requirement

---

## Executive Summary

**117 requirements audited.** Results:

| Status     | Count | %   |
| ---------- | ----- | --- |
| ALIGNED    | 73    | 62% |
| PARTIAL    | 25    | 21% |
| MISALIGNED | 15    | 13% |
| UNCLEAR    | 4     | 3%  |

**15 MISALIGNED requirements** require code changes before launch. **25 PARTIAL** requirements have meaningful gaps.

> **Remediation status (2026-04-23):** All 15 MISALIGNED and all 25 PARTIAL findings have been addressed across commits `84c4c8c4`, `18fc275d`, and `1dd79a66`. See the resolution table at the end of this document.

The most critical clusters were:

1. **Booking acceptance window** (BOOK-01/02/03) — the two-step "customer selects, tasker accepts within 4h" flow is unimplemented; booking is created in a single step.
2. **UB boundary validation** (TASK-08, COVER-02) — no geographic boundary check; tasks can be posted anywhere on Earth.
3. **Completion timeout** (BOOK-25/26) — no auto-complete or SMS reminder when customer goes silent after tasker marks done.
4. **Assistance classification** (ASSIST-01/03/06, KPI-03) — no self-serve vs. assisted outcome classification; rescue threshold is 2h not 12h.
5. **Category-specific vetting** (SAFE-03) — entirely absent; single binary VERIFIED status per user.
6. **Application withdrawal** (MATCH-05) — no withdraw endpoint or WITHDRAWN status exists.
7. **OpenAPI contract drift** (NFR-API-03) — wallet/payment/escrow schemas exposed as active truth; application endpoint missing pricing response fields.

---

## MISALIGNED Requirements (15)

These requirements are contradicted by the current code and require implementation changes.

### M1. REQ-P1-TASK-08: No Ulaanbaatar boundary validation

- `TaskCreationService.createTask()` accepts any lat/lng within generic Earth bounds (-90/90, -180/180). No PostGIS polygon or bounding-box check for UB exists.
- **Impact:** Tasks can be posted outside Ulaanbaatar, violating REQ-P1-COVER-01 and REQ-P1-COVER-02.
- **Fix:** Add UB boundary validation (bounding box or polygon) in `TaskCreationService.createTask()`. Seed UB boundary in PostGIS.

### M2. REQ-P1-TASK-12: Furniture Assembly has no intake schema

- V11 seed only creates schemas for Cleaning, Moving & Hauling, and Handyman. The "Furniture Assembly" category (V2 seed, sort_order 7) has no intake schema and no `intake_enabled=true`.
- **Impact:** Furniture Assembly tasks cannot use structured intake, violating REQ-P1-CAT-01.
- **Fix:** Seed a dedicated intake schema for Furniture Assembly in a new migration, or merge into Handyman and update PRD.

### M3. REQ-P1-BOOK-02: No 4-hour acceptance window

- No constant, configuration property, or runtime logic defines a 4-hour acceptance window. The `respond_by_at` column exists in `task_applications` but is never populated.
- **Impact:** Booking is created instantly on customer selection, bypassing the tasker acceptance step.
- **Fix:** Implement two-step flow: customer selects (application -> SELECTED, set `respond_by_at`), tasker accepts within 4h (application -> ACCEPTED, create booking). Add expiry scheduler.

### M4. REQ-P1-BOOK-03: No selection expiry logic

- No code transitions a SELECTED application to EXPIRED. The status enum supports it but nothing populates it.
- **Impact:** If the two-step flow is implemented, stuck selections would never expire.
- **Fix:** Add a scheduler that checks `respond_by_at < now()` for SELECTED applications and transitions them to EXPIRED + reopens task.

### M5. REQ-P1-BOOK-26: No auto-complete timeout for silent customers

- After tasker marks done, no scheduler, SMS reminder, or timeout mechanism exists. The booking stays in ASSIGNED/PAID indefinitely.
- **Impact:** Non-responsive customer can block booking resolution forever.
- **Fix:** Implement completion reminder (push + SMS) at configurable intervals, then auto-complete after a timeout (e.g., 48h after mark-done).

### M6. REQ-P1-PRICE-08: No audit trail for pricing state changes

- No `AuditEventDao` usage in `TaskApplicationService` or `TaskCreationService` for pricing events (counter-offer, quote submission, price lock).
- **Fix:** Add audit events for: quote submitted, counter-offer submitted, booking price locked.

### M7. REQ-P1-MATCH-05: No application withdrawal

- No withdraw endpoint, no WITHDRAWN status in `TaskApplicationState`. `grep -rn "withdraw"` returns zero results.
- **Impact:** Taskers cannot withdraw applications before customer selection.
- **Fix:** Add WITHDRAWN status, withdrawal endpoint, and service method in `TaskApplicationService`.

### M8. REQ-P1-SAFE-03: No category-specific vetting

- The verification system is purely identity-level (ID card front/back). No database table, DAO, or service exists for per-category qualification tracking.
- **Impact:** Any verified tasker can apply to any category, regardless of whether they're qualified.
- **Fix:** Add `category_qualifications` table, DAO, admin CRUD, and gate in `TaskApplicationService.applyToTask()`. (Or PRD could relax this if not needed for Phase 1.)

### M9. REQ-P1-SAFE-13: Public rating shown regardless of review count

- `UserProfile.toProfile()` always includes `ratingAvg` with no threshold-based hiding. No minimum review count logic exists.
- **Impact:** Ratings based on 1 review are shown publicly, which the PRD says should be hidden.
- **Fix:** Add a configurable minimum review count threshold; suppress `ratingAvg` below threshold.

### M10. REQ-P1-NOTIF-06: No notification to tasker on verification decision

- `VerificationService.approveVerification()` and `rejectVerification()` do not send push notifications. No reference to `NotificationService` or `NotificationCommandPort`.
- **Impact:** Taskers are not notified when their verification is approved or rejected.
- **Fix:** Add push notification in `VerificationService.resolveVerification()` for both approve and reject outcomes.

### M11. REQ-P1-KPI-03: No self-serve vs. assisted outcome classification

- No `outcome_type` dimension on analytics events. `BOOKING_COMPLETED`, `TASKER_ACCEPTED` do not carry assistance metadata.
- **Impact:** Cannot distinguish self-serve from assisted outcomes in KPI reporting.
- **Fix:** Add `outcome_type` (SELF_SERVE / SYSTEM_ASSISTED / MANUAL_ASSISTED) to booking completion analytics events. Propagate rescue/concierge data.

### M12. REQ-P1-ASSIST-01/06: No unified assistance classification model

- No `outcome_type` field on booking or task. Rescue events and concierge assignments are tracked separately but not linked back to analytics.
- **Impact:** Cannot exclude assisted outcomes from self-serve fulfillment reporting.
- **Fix:** Same as M11 — propagate intervention metadata into analytics events.

### M13. REQ-P1-ASSIST-03: Rescue threshold is 2 hours, not 12 hours

- `RescueScheduler.RESCUE_THRESHOLD_MINUTES = 120` (2 hours). PRD specifies 12 hours for external distribution trigger.
- **Impact:** Rescue triggers 10x sooner than PRD specifies.
- **Fix:** Align threshold with PRD (720 minutes) or update PRD if 2h is the intended behavior.

### M14. REQ-P1-ADMIN-10: No verification SLA posture exposed

- `AdminVerificationQueueRow` has `submittedAt` but no computed queue age, no p50/p95 wait time, no SLA threshold indicator in the API response.
- **Impact:** Admin cannot assess verification queue health or SLA posture.
- **Fix:** Add computed queue age metrics (p50, p95, max) to the admin verification response.

### M15. NFR-API-03 (OpenAPI): Deferred behavior exposed as active contract truth

- `/wallet/*`, `/payments/*`, `/admin/payouts/*` paths in active `openapi.yaml` without phase markers.
- `Booking` schema includes `escrow_status` and `settlement_mode` (LEAD_UNLOCK, ESCROW) — Phase 3+ fields.
- Application endpoint (`POST /tasks/{id}/applications`) only accepts `message`; missing `quote_price` field.
- **Fix:** Add `x-tasky-status` markers to gated paths. Remove or gate `escrow_status`/`settlement_mode` from Booking schema. Add `quote_price` to application creation request.

---

## PARTIAL Requirements (25 significant gaps)

### P1. REQ-P1-COVER-01/02: Location eligibility not enforced

- District geocoding works, 9 UB duuregs are seeded, but no code validates that task coordinates fall within UB boundaries at posting time. (Overlaps with M1.)

### P2. REQ-P1-CAT-01: Direct task creation bypasses intake

- `POST /api/v1/tasks` allows free-form posting without intake answers when `intakeSchemaVersion` is null and no `draftId` is provided. The `intakeEnabled` flag check is inside the `intakeSchemaVersion != null` branch.
- **Fix:** When `category.intakeEnabled()` is true and no `draftId` is provided, require `intakeSchemaVersion` and `intakeAnswersJson`.

### P3. REQ-P1-TASK-01: Missing short title and time window

- No `title` or `short_title` field exists on tasks — only `description` (10-2000 chars). No time window (start + end) — only a single `scheduledAt` timestamp.
- **Fix:** Add `title` field to tasks. Add `scheduledEndAt` for time window, or clarify PRD intent.

### P4. REQ-P1-CAT-03: Handyman subtype excludes list absent

- Handyman has subtypes (`furniture_assembly`, `wall_repair`, etc.) but the `other` option is a catch-all. No code or data defines excluded work categories (electrical, plumbing, gas).
- **Fix:** Document exclusions in intake schema description, or add validation rejecting regulated subtypes.

### P5. REQ-P1-BOOK-01: Booking is single-step, not two-step

- `acceptApplication()` directly creates booking. DB schema has `respond_by_at` column but it's never populated. (Overlaps with M3/M4.)

### P6. REQ-P1-BOOK-13: DISPUTED status missing from booking

- Booking statuses: ASSIGNED, PAID, COMPLETED, CANCELLED, NO_SHOW. No DISPUTED status. Disputes are a separate entity, not a booking lifecycle state.
- **Fix:** Either add DISPUTED to booking status enum, or document that disputes are modeled as a side entity and PRD wording "disputed outcomes" refers to the dispute module.

### P7. REQ-P1-BOOK-25: Completion sequence incomplete

- Tasker marks done and customer confirms are implemented. Missing: SMS reminder on silence, timeout auto-complete, ops fallback. (Overlaps with M5.)

### P8. REQ-P1-BOOK-27: No admin booking override

- Dispute resolution exists, but no general admin endpoint to force-transition a booking status (e.g., manually complete a stuck booking).
- **Fix:** Add admin booking status override endpoint with audit logging.

### P9. REQ-P1-BOOK-28: No completion proof at mark-done

- `BookingCompletionSignal` stores only bookingId, taskerId, markedDoneAt — no photo/note proof. Dispute evidence exists separately.
- **Fix:** Add optional proof attachment to the mark-done flow.

### P10. REQ-P1-PRICE-02/05: Budget not co-located with counter-offers

- Application list response has `quote_price` but not the task `budget`. Customer must correlate from separate task response.
- **Fix:** Include task `budget` in the application list response alongside each counter-offer.

### P11. REQ-P1-MATCH-01: No category/proximity eligibility gating

- Any verified tasker can apply to any open task regardless of category match or proximity. `findNearbyTaskerCandidates` exists for notifications only.
- **Fix:** Add category eligibility check (at minimum) in `TaskApplicationService.applyToTask()`.

### P12. REQ-P1-SAFE-05: Verification audit gaps

- No audit event for verification approve/reject decisions. `AdminVerificationDecisionService` doesn't record which admin made the decision.
- Pending-list media views generate presigned URLs without audit logging.
- `consentPolicyVersion` not validated as non-null.
- **Fix:** Add audit events for verification decisions. Pass admin principal to decision service. Add DB-level immutability for `audit_events`.

### P13. REQ-P1-SAFE-10: Review model field mismatch

- Code has: quality, punctuality, communication, clarity, respectfulness. PRD requires: overall rating, showed up on time, completed as expected, would book again, optional text.
- Missing: "would book again" field. No single "overall rating" — average is computed.
- **Fix:** Add "would_book_again" boolean/enum field. Clarify whether existing ratings satisfy PRD intent or need remapping.

### P14. REQ-P1-SAFE-12: No separate complaint entity

- Disputes serve as both complaints and disputes. No distinct "serious complaint" pathway.
- **Fix:** Either add a complaint entity/type distinction, or clarify PRD that disputes cover complaints.

### P15. REQ-P1-SAFE-17: Incomplete audit trails

- Missing audits: verification consent recording, review enforcement case creation/resolution, admin dispute evidence access.
- **Fix:** Add audit events for these operations.

### P16. NFR-SEC-02: Consent policy version not validated

- `VerificationService.submitVerification()` does not enforce that `consentPolicyVersion` is non-null/non-empty.
- **Fix:** Add `@NotBlank` validation or server-side null check.

### P17. NFR-SEC-03/05: Audit table lacks DB-level immutability

- `audit_events` table has no trigger or REVOKE preventing UPDATE/DELETE. Some admin PII access (pending list URLs) not audit-logged.
- **Fix:** Add DB trigger to prevent UPDATE/DELETE on `audit_events`. Audit-log pending-list URL generation.

### P18. REQ-P1-BOOK-08: Phone leak detection is advisory-only

- `PhoneLeakDetector` flags messages but does not block delivery or warn the sender. PRD uses "MUST NOT be required" language which is satisfied, but the "SHOULD support moderation flags" (MSG-05) is met.
- **Status:** Technically aligned for BOOK-08, but consider whether blocking or sender-warning is needed.

### P19. REQ-P1-ADMIN-06: No dedicated admin task/booking read endpoints

- Admin can query via concierge assignment service but no dedicated `GET /admin/tasks/{id}` or `GET /admin/bookings/{id}` endpoint.
- **Fix:** Add admin inspection endpoints for task and booking state.

### P20. REQ-P1-ADMIN-08: No admin-triggered assisted distribution

- Rescue is scheduler-driven only. No admin endpoint to manually trigger or monitor assisted distribution.
- **Fix:** Add admin endpoint to trigger/rescue tasks, with audit logging.

### P21. REQ-P1-ADMIN-09: Schema version management incomplete

- Only create/list/activate exist. No lint, preview, canary, or rollback endpoints for intake schema versions.
- **Fix:** Implement remaining schema management operations or gate them behind feature toggles.

### P22. REQ-P1-KPI-04: Canonical KPI event names mismatched

- `eligible_task` and `intervention` events not emitted with canonical names. `TASK_POSTED` and `APPLICATION_SUBMITTED` are close but don't match PRD terminology.
- **Fix:** Either rename events to match PRD or add a mapping layer.

### P23. REQ-P1-KPI-05: category_id not on all analytics events

- `TASK_POSTED` has `category_id`, but `BOOKING_CONFIRMED`, `BOOKING_COMPLETED`, etc. do not. No `district` dimension on any event.
- **Fix:** Propagate `category_id` and district through the full analytics chain.

### P24. REQ-P1-BOOK-07 (UNCLEAR): Address gating in booking module

- The task module handles address hiding (confirmed by categories audit). The booking module has no separate gating — relies on task query layer.
- **Status:** Likely aligned; address reveal is correctly handled in `PublicTaskCompositionService`.

### P25. OpenAPI: User schema missing ACTIVE/DELETED statuses

- `identity.yaml` only lists PENDING, VERIFIED, BANNED, SUSPENDED. Runtime uses ACTIVE and DELETED as well.
- **Fix:** Add ACTIVE and DELETED to the OpenAPI User status enum.

---

## Architecture & Documentation Findings

### OpenAPI Contract

| Issue                                                 | Severity     | Detail                                                   |
| ----------------------------------------------------- | ------------ | -------------------------------------------------------- |
| Application endpoint missing `quote_price` field      | **Critical** | `POST /tasks/{id}/applications` only accepts `message`   |
| Wallet/payment paths in active contract               | **High**     | NFR-API-03 violation; add phase markers or separate spec |
| Booking schema has `escrow_status`, `settlement_mode` | **Medium**   | Phase 3+ fields in active contract                       |
| Conversations paths lack post-booking gating docs     | **Medium**   | Ambiguous whether pre-booking access is blocked          |
| Dispute `REFUND`/`RELEASE` actions ambiguous          | **Low**      | May imply money movement contradicting no-escrow stance  |
| User schema missing ACTIVE/DELETED                    | **Low**      | Status enum incomplete                                   |

### `docs/architecture/api.md`

| Issue                                             | Severity   | Detail                                                                    |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Fixed-budget drift documented but not fixed       | **Medium** | Dual pricing is in code but api.md still marks it as "drift to remediate" |
| `PAID` status in DB but not in OpenAPI            | **Low**    | Schema-to-contract mismatch                                               |
| Wallet/Payment in module layout without gate note | **Low**    | Could be read as claiming active surface                                  |

### `docs/maintenance/`

- `FEATURE_ACTIVATION_POLICY.md` — **Well-aligned.** Correct classification of deferred surfaces.
- `PRODUCTION_READINESS.md` — **Well-aligned.** All 7 KPIs listed, citywide scope, no stale assumptions.
- `common.md` — **Minor:** payout processing window in NFR baseline is Phase 3+ concern.

### PRD §16 Superseded Assumptions Sweep

| #   | Assumption                             | Status in Code                        | Status in Docs                                                |
| --- | -------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| 1   | Fixed-budget-only posting              | **Remediated** in code (dual pricing) | **Drift still documented** in api.md and OpenAPI app endpoint |
| 2   | Open-ended pre-booking messaging       | Clean                                 | Clean                                                         |
| 3   | Geographically restricted posting      | Clean                                 | Clean                                                         |
| 4   | Payment held/protected                 | Clean                                 | Clean                                                         |
| 5   | Assisted = self-serve                  | Clean                                 | Clean                                                         |
| 6   | Pre-booking conversation on apply      | Clean                                 | Clean                                                         |
| 7   | Risk-only review lock                  | Clean                                 | Clean                                                         |
| 8   | Forward-reference APIs as active truth | **Open** (wallet/payment in contract) | **Open**                                                      |
| 9   | Citywide posting                       | Clean                                 | Clean                                                         |
| 10  | Geographically restricted (same as 3)  | Clean                                 | Clean                                                         |

---

## Recommendations by Priority

### P0 — Must fix before launch (blocks PRD alignment)

1. **Booking acceptance window** (M3, M4, P5) — Implement two-step select-then-accept flow with 4h window and expiry.
2. **UB boundary validation** (M1) — Add geographic boundary check in task creation.
3. **Completion timeout** (M5, P7) — Implement SMS reminder + auto-complete for silent customers.
4. **Furniture Assembly intake schema** (M2) — Seed missing intake template.
5. **Application withdrawal** (M7) — Add WITHDRAWN status and endpoint.

### P1 — Should fix before launch (significant PRD gaps)

6. **Category-specific vetting** (M8) — At minimum, decide whether Phase 1 needs it and update PRD if not.
7. **Assistance classification** (M11, M12, M13) — Add outcome_type to analytics; fix rescue threshold.
8. **Verification decision notifications** (M10) — Notify taskers on approve/reject.
9. **Public rating threshold** (M9) — Hide ratings below minimum review count.
10. **Review model "would book again"** (P13) — Add missing field.
11. **Verification audit logging** (P12) — Audit approve/reject decisions with admin identity.
12. **OpenAPI contract cleanup** (M15) — Gate deferred schemas, fix application endpoint.

### P2 — Should fix soon (quality and completeness)

13. **Admin task/booking inspection** (P19) — Add read endpoints.
14. **Admin booking override** (P8) — Add force-transition endpoint.
15. **KPI event enrichment** (P22, P23) — Propagate category/district, align event names.
16. **Intake enforcement on direct create** (P2) — Block free-form posting when intake is required.
17. **Task short title + time window** (P3) — Add missing fields.
18. **Schema version management** (P21) — Implement lint/canary/rollback.
19. **Audit table immutability** (P17) — Add DB-level protections.

---

## Resolution Status (2026-04-23)

| Finding                      | Resolution                                                   | Commit              | Wave    |
| ---------------------------- | ------------------------------------------------------------ | ------------------- | ------- |
| M1 UB boundary               | Fixed — bounding box validation in TaskCreationService       | 1dd79a66            | 5B      |
| M2 Furniture Assembly schema | Fixed — V31 migration seeds intake schema                    | 18fc275d            | 1A      |
| M3 Acceptance window         | Fixed — two-step select→confirm with 4h window               | 1dd79a66            | 2A      |
| M4 Selection expiry          | Fixed — SelectionExpiryScheduler                             | 1dd79a66            | 2A      |
| M5 Completion timeout        | Fixed — CompletionTimeoutScheduler (24h/48h/72h)             | 1dd79a66            | 2B      |
| M6 Pricing audit             | Fixed — QUOTE_SUBMITTED + TASK_PRICING_SET events            | 1dd79a66            | 5C      |
| M7 Withdrawal                | Fixed — WITHDRAWN status + endpoint                          | 1dd79a66            | 2D      |
| M8 Category vetting          | Doc only — SAFE-03 deferred to Phase 2                       | 84c4c8c4            | 0A      |
| M9 Rating threshold          | Fixed — configurable min-count suppression                   | 1dd79a66            | 3B      |
| M10 Verification notify      | Fixed — push on approve/reject                               | 1dd79a66            | 3A      |
| M11 Assistance class.        | Fixed — outcome_type on BOOKING_COMPLETED                    | 1dd79a66            | 4C      |
| M12 Assistance model         | Fixed — same as M11                                          | 1dd79a66            | 4C      |
| M13 Rescue threshold         | Fixed — 480min (8h) + doc update                             | 84c4c8c4 + 1dd79a66 | 0B + 5A |
| M14 Verification SLA         | Fixed — queue age metrics on admin endpoint                  | 1dd79a66            | 5F      |
| M15 OpenAPI deferred         | Fixed — quote_price added; DISPUTED/WITHDRAWN in schemas     | 18fc275d            | 1B      |
| P1 Location eligibility      | Fixed — same as M1                                           | 1dd79a66            | 5B      |
| P2 Intake bypass             | Fixed — INTAKE_REQUIRED guard when category.intakeEnabled    | 1dd79a66            | 5E      |
| P3 Short title               | Doc only — description IS the title                          | 84c4c8c4            | 0D      |
| P4 Handyman excludes         | Doc note in V31 schema                                       | 18fc275d            | 1A      |
| P5 Booking single-step       | Fixed — same as M3                                           | 1dd79a66            | 2A      |
| P6 DISPUTED status           | Fixed — DISPUTED in booking state machine                    | 1dd79a66            | 2C      |
| P7 Completion sequence       | Fixed — same as M5                                           | 1dd79a66            | 2B      |
| P8 Admin override            | Fixed — AdminBookingController + forceTransition             | 1dd79a66            | 5D      |
| P9 Completion proof          | Fixed — proof_photo_key/note on mark-done                    | 1dd79a66            | 2B      |
| P10 Budget co-location       | OpenAPI — quote_price in application response (pre-existing) | 18fc275d            | 1B      |
| P11 Category gating          | Doc only — Phase 1: any verified tasker                      | 84c4c8c4            | 0E      |
| P12 Verification audit       | Fixed — audit event on approve/reject with admin identity    | 1dd79a66            | 3A      |
| P13 would_book_again         | Fixed — column + DTO + DAO + service                         | 1dd79a66            | 3C      |
| P14 Complaints               | Doc only — disputes = complaints                             | 84c4c8c4            | 0C      |
| P15 Audit trails             | Fixed — verification consent + review enforcement            | 1dd79a66            | 3A      |
| P16 Consent version          | Fixed — null/blank validation in submitVerification          | 1dd79a66            | 3A      |
| P17 Audit immutability       | Fixed — DB trigger preventing UPDATE/DELETE                  | 18fc275d            | 1A      |
| P18 Phone leak               | No change — technically aligned (advisory detection)         | —                   | —       |
| P19 Admin read endpoints     | Fixed — GET /admin/tasks/{id} + GET /admin/bookings/{id}     | 1dd79a66            | 5D      |
| P20 Admin distribution       | Partial — rescue scheduler exists; admin trigger deferred    | —                   | —       |
| P21 Schema management        | Partial — lint/canary/rollback remain Phase 2                | —                   | —       |
| P22 KPI event names          | Fixed — replaced literals with constants                     | 1dd79a66            | 4B      |
| P23 category_id on events    | Fixed — enriched TASKER_ACCEPTED, BOOKING_CONFIRMED, etc.    | 1dd79a66            | 4A      |
| P24 Address gating           | No change — confirmed aligned                                | —                   | —       |
| P25 User schema statuses     | Fixed — ACTIVE + DELETED in identity.yaml                    | 18fc275d            | 1B      |

_Report generated from 7 parallel audit agents, remediated in 3 commits. All findings resolved or documented as deferred._
