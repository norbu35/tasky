# Test-Rehab Pipeline — Final Verifier Report

Generated: 2026-04-23

## Verification Suite Results

| Gate                            | Result           | Detail                               |
| ------------------------------- | ---------------- | ------------------------------------ |
| `:services:api:test`            | **346/348 PASS** | 2 pre-existing contract failures     |
| `:services:api:openApiValidate` | **PASS**         | Spec valid (3 unused model warnings) |
| `pnpm -r typecheck`             | **PASS**         | All 4 packages clean                 |
| `pnpm -r test` (web)            | **234/234 PASS** |                                      |
| `pnpm -r test` (mobile)         | **723/725 PASS** | 2 pre-existing ReviewSubmitScreen    |

**Pre-existing failures (NOT introduced by test-rehab):**

- `TID-TASK-112-CONTRACT-DEFERRED-METADATA` — OpenAPI documentation alignment
- `TID-TASK-112-CONTRACT-SPRING-PARITY` — OpenAPI documentation alignment
- `TID-TASK-113-MOBILE-REVIEW-SUBMIT-PAYLOAD` (×2) — mobile payload now includes `pricing_mode` field

**Zero regressions from test-rehab work.**

---

## 1. Traceability Matrix

### Auth (9 covered)

| PRD Ref      | Scenario                                      | Backend Test(s)                          | Web | Mobile |
| ------------ | --------------------------------------------- | ---------------------------------------- | --- | ------ |
| REQ-AUTH-01  | SCN-AUTH-001: Dev auth throws in prod         | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-01  | SCN-AUTH-002: OTP request disabled            | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-01  | SCN-AUTH-003: OTP verify disabled             | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-01  | SCN-AUTH-004: Facebook OAuth creates CUSTOMER | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-02  | SCN-AUTH-005: Same facebook_id no duplicate   | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-03  | SCN-AUTH-006: JWT claims sub/role/exp/iat     | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-03  | SCN-AUTH-007: Invalid/expired token → 401     | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-ADMIN-03 | SCN-AUTH-008: BANNED/SUSPENDED denied auth    | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-09  | SCN-AUTH-012: FB outage fails closed 503      | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-10  | SCN-AUTH-013: Session survives outage         | `AuthHttpScenarioTests` + `ScnSmokeTest` | —   | —      |
| REQ-AUTH-09  | SCN-AUTH-014: Circuit breaker opens           | `AuthHttpScenarioTests`                  | —   | —      |
| REQ-AUTH-09  | SCN-AUTH-015: Open circuit fails closed       | `AuthHttpScenarioTests`                  | —   | —      |

### Security (10 covered)

| PRD Ref       | Scenario                                          | Backend Test(s)                                                        | Web | Mobile |
| ------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | --- | ------ |
| REQ-AUTH-03   | SCN-SEC-001: No JWT → reject                      | `SecurityInformationControlScenarioTests` + `AuthorizationMatrixTests` | —   | —      |
| REQ-AUTH-03   | SCN-SEC-002: CUSTOMER blocked from tasker/admin   | `AuthorizationMatrixTests`                                             | —   | —      |
| REQ-AUTH-03   | SCN-SEC-003: TASKER blocked from customer/admin   | `AuthorizationMatrixTests`                                             | —   | —      |
| REQ-AUTH-03   | SCN-SEC-004: ADMIN-only enforced                  | `AuthorizationMatrixTests`                                             | —   | —      |
| REQ-TASK-01   | SCN-SEC-005: Task creation role gate              | `AuthorizationMatrixTests`                                             | —   | —      |
| REQ-TASK-03   | SCN-SEC-006: Approximate location before confirm  | `SecurityInformationControlScenarioTests`                              | —   | —      |
| REQ-LEAK-03   | SCN-SEC-007: Exact address only after booking     | `SecurityInformationControlScenarioTests`                              | —   | —      |
| REQ-LEAK-01   | SCN-SEC-008: No tasker phone in customer payloads | `SecurityInformationControlScenarioTests`                              | —   | —      |
| REQ-P1-MSG-04 | SCN-SEC-011: No customer phone in tasker payloads | `AuthorizationMatrixTests`                                             | —   | —      |

### Task (19 covered, 10 untested)

| PRD Ref         | Scenario                                                 | Backend Test(s)                      | Web | Mobile |
| --------------- | -------------------------------------------------------- | ------------------------------------ | --- | ------ |
| REQ-TASK-00     | SCN-TASK-001: Form loads active schema                   | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-00     | SCN-TASK-002: Missing intake answers → validation errors | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-01     | SCN-TASK-003: Missing base fields → validation           | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-01     | SCN-TASK-004: Budget = 1000 rejected                     | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-01     | SCN-TASK-005: Budget > 1000 accepted                     | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-01     | SCN-TASK-006: 4th photo rejected                         | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-03     | SCN-TASK-007: Feed only OPEN tasks                       | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-03     | SCN-TASK-008: Feed district/fuzzed location              | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-03     | SCN-TASK-009: Non-participant approximate                | `TaskScenarioTests` + `ScnSmokeTest` | —   | —      |
| REQ-TASK-03     | SCN-TASK-010: Owner exact location                       | `TaskScenarioTests` + `ScnSmokeTest` | —   | —      |
| REQ-TASK-03     | SCN-TASK-011: Booked tasker exact location               | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-03     | SCN-TASK-012: Cursor pagination deterministic            | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-03     | SCN-TASK-013: Invalid cursor → INVALID_CURSOR            | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-07     | SCN-TASK-014: Deterministic scope summary                | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-10     | SCN-TASK-015: Summary fallback on failure                | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-09     | SCN-TASK-016: Draft binds active schema                  | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-09     | SCN-TASK-017: Draft validates bound schema               | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-09     | SCN-TASK-018: Draft uses bound schema                    | `TaskScenarioTests`                  | —   | —      |
| REQ-TASK-11     | SCN-TASK-019: Deactivated category blocks new            | `TaskScenarioTests`                  | —   | —      |
| REQ-P1-TASK-08  | SCN-TASK-020: Outside UB service area rejected           | **UNTESTED**                         | —   | —      |
| REQ-P1-COVER-02 | SCN-TASK-021: Non-launch category rejected               | **UNTESTED**                         | —   | —      |
| REQ-P1-MATCH-01 | SCN-TASK-022: Only verified taskers apply                | **UNTESTED**                         | —   | —      |
| REQ-P1-MATCH-02 | SCN-TASK-023: Application needs pricing+note             | **UNTESTED**                         | —   | —      |
| REQ-P1-MATCH-03 | SCN-TASK-024: Customer reviews all applications          | **UNTESTED**                         | —   | —      |
| REQ-P1-MATCH-05 | SCN-TASK-025: Tasker withdraws application               | **UNTESTED**                         | —   | —      |
| REQ-P1-PRICE-02 | SCN-TASK-026: Budget mode shows posted budget            | **UNTESTED**                         | —   | —      |
| REQ-P1-PRICE-04 | SCN-TASK-027: Quote mode requires tasker price           | **UNTESTED**                         | —   | —      |
| REQ-P1-PRICE-03 | SCN-TASK-028: Counter-offer on budget mode               | **UNTESTED**                         | —   | —      |
| REQ-P1-PRICE-05 | SCN-TASK-029: Customer sees budget + counter             | **UNTESTED**                         | —   | —      |

### Booking (14 covered, 8 untested)

| PRD Ref           | Scenario                                                | Backend Test(s)                         | Web | Mobile |
| ----------------- | ------------------------------------------------------- | --------------------------------------- | --- | ------ |
| REQ-BOOK-04       | SCN-BOOK-001-004: Cancellation policy (4 scenarios)     | `BookingScenarioTests`                  | —   | —      |
| REQ-BOOK-06       | SCN-BOOK-005: Tasker cancel reopens task                | `BookingScenarioTests` + `ScnSmokeTest` | —   | —      |
| REQ-BOOK-06       | SCN-BOOK-006: 3-strike tasker suspension                | **UNTESTED** (waived)                   | —   | —      |
| REQ-BOOK-03       | SCN-BOOK-007: Disclaimer acceptance required            | **UNTESTED**                            | —   | —      |
| REQ-BOOK-03       | SCN-BOOK-008: Disclaimer timestamp recorded             | `BookingScenarioTests`                  | —   | —      |
| REQ-BOOK-05       | SCN-BOOK-009: Terminal state transitions                | `BookingScenarioTests`                  | —   | —      |
| REQ-BOOK-11       | SCN-BOOK-010-016: No-show lifecycle (7 scenarios)       | `BookingScenarioTests`                  | —   | —      |
| REQ-BOOK-12       | SCN-BOOK-017-019: Reschedule lifecycle (3 scenarios)    | `BookingScenarioTests`                  | —   | —      |
| REQ-BOOK-13       | SCN-BOOK-020: Canonical schedule audit                  | `BookingScenarioTests`                  | —   | —      |
| REQ-BOOK-06       | SCN-BOOK-021: Safety/fraud cancel bypass                | `BookingScenarioTests`                  | —   | —      |
| REQ-P1-BOOK-01    | SCN-BOOK-022: Customer selects applicant                | **UNTESTED**                            | —   | —      |
| REQ-P1-BOOK-02/03 | SCN-BOOK-023: Selection expires 4h                      | **UNTESTED**                            | —   | —      |
| REQ-P1-BOOK-04    | SCN-BOOK-024: Non-selected apps auto-close              | **UNTESTED**                            | —   | —      |
| REQ-P1-PRICE-07   | SCN-BOOK-025: Price locked at confirmation              | **UNTESTED**                            | —   | —      |
| REQ-P1-BOOK-25    | SCN-BOOK-026: Tasker marks complete → customer confirms | **UNTESTED**                            | —   | —      |
| REQ-P1-BOOK-26    | SCN-BOOK-027: Auto-complete on customer silence         | **UNTESTED**                            | —   | —      |

### Category (5 covered, 3 untested)

| PRD Ref      | Scenario                                        | Backend Test(s)         | Web | Mobile |
| ------------ | ----------------------------------------------- | ----------------------- | --- | ------ |
| REQ-ADMIN-05 | SCN-CATEGORY-001: Add new category              | `CategoryScenarioTests` | —   | —      |
| REQ-ADMIN-05 | SCN-CATEGORY-002: Edit/deactivate/reorder       | `CategoryScenarioTests` | —   | —      |
| REQ-ADMIN-05 | SCN-CATEGORY-003-005: Schema lint (3 scenarios) | `CategoryScenarioTests` | —   | —      |
| REQ-ADMIN-05 | SCN-CATEGORY-006: Canary activation             | **UNTESTED**            | —   | —      |
| REQ-ADMIN-05 | SCN-CATEGORY-007: Rollback restores version     | **UNTESTED**            | —   | —      |
| REQ-ADMIN-05 | SCN-CATEGORY-008: Rollback without fallback     | **UNTESTED**            | —   | —      |

### Dispute (8 covered)

| PRD Ref        | Scenario                                    | Backend Test(s)        | Web | Mobile |
| -------------- | ------------------------------------------- | ---------------------- | --- | ------ |
| REQ-SAFE-03/10 | SCN-DISPUTE-001-008: Full dispute lifecycle | `DisputeScenarioTests` | —   | —      |

### Review (6 covered)

| PRD Ref              | Scenario                             | Backend Test(s)       | Web | Mobile |
| -------------------- | ------------------------------------ | --------------------- | --- | ------ |
| REQ-SAFE-02/07/08/11 | SCN-REVIEW-001-006: Review lifecycle | `ReviewScenarioTests` | —   | —      |

### Messaging (4 covered, 1 untested)

| PRD Ref       | Scenario                                 | Backend Test(s)          | Web | Mobile |
| ------------- | ---------------------------------------- | ------------------------ | --- | ------ |
| REQ-MSG-01-03 | SCN-MSG-001-003: Conversation lifecycle  | `MessagingScenarioTests` | —   | —      |
| REQ-LEAK-04   | SCN-MSG-004: Phone number flagged        | `MessagingScenarioTests` | —   | —      |
| REQ-P1-MSG-01 | SCN-MSG-005: No pre-booking chat Phase 1 | **UNTESTED**             | —   | —      |

### Notification (5 covered, 2 untested)

| PRD Ref         | Scenario                                          | Backend Test(s)             | Web | Mobile |
| --------------- | ------------------------------------------------- | --------------------------- | --- | ------ |
| REQ-NOTIF-01    | SCN-NOTIF-001-005: Push notification lifecycle    | `NotificationScenarioTests` | —   | —      |
| REQ-P1-NOTIF-06 | SCN-NOTIF-006: Verification decision notification | **UNTESTED**                | —   | —      |
| REQ-P1-NOTIF-05 | SCN-NOTIF-007: Completion prompt notification     | **UNTESTED**                | —   | —      |

### Analytics (3 covered, 2 untested)

| PRD Ref       | Scenario                                       | Backend Test(s)          | Web | Mobile |
| ------------- | ---------------------------------------------- | ------------------------ | --- | ------ |
| REQ-SAFE-06   | SCN-ANALYTICS-001-003: Core events             | `AnalyticsScenarioTests` | —   | —      |
| REQ-P1-KPI-04 | SCN-ANALYTICS-004: Qualified application event | **UNTESTED**             | —   | —      |
| REQ-P1-KPI-04 | SCN-ANALYTICS-005: Intervention recorded event | **UNTESTED**             | —   | —      |

### Verification (5 untested)

| PRD Ref         | Scenario                                         | Backend Test(s) | Web | Mobile |
| --------------- | ------------------------------------------------ | --------------- | --- | ------ |
| REQ-P1-SAFE-01  | SCN-VERIF-001: Tasker role activation request    | **UNTESTED**    | —   | —      |
| REQ-P1-SAFE-02  | SCN-VERIF-002: Pending until admin verification  | **UNTESTED**    | —   | —      |
| REQ-P1-SAFE-05  | SCN-VERIF-003: Verification audit trail          | **UNTESTED**    | —   | —      |
| REQ-P1-ADMIN-01 | SCN-VERIF-004: Admin approve/reject verification | **UNTESTED**    | —   | —      |
| REQ-P1-ADMIN-10 | SCN-VERIF-005: Verification queue SLA posture    | **UNTESTED**    | —   | —      |

### Assistance (8 untested — PRODUCT GAPS)

| PRD Ref             | Scenario                                           | Backend Test(s)                  | Web | Mobile |
| ------------------- | -------------------------------------------------- | -------------------------------- | --- | ------ |
| REQ-P1-ASSIST-01    | SCN-ASSIST-001-003: Outcome classification         | **UNTESTED** (no implementation) | —   | —      |
| REQ-P1-ASSIST-03-07 | SCN-ASSIST-004-008: External distribution + rescue | **UNTESTED** (no implementation) | —   | —      |

### Integration (4 covered, 1 untested)

| PRD Ref     | Scenario                                  | Backend Test(s) | Web | Mobile |
| ----------- | ----------------------------------------- | --------------- | --- | ------ |
| REQ-AUTH-01 | SCN-SMOKE-001: FB outage E2E              | `ScnSmokeTest`  | —   | —      |
| REQ-BOOK-05 | SCN-SMOKE-002: Tasker cancel E2E          | `ScnSmokeTest`  | —   | —      |
| REQ-TASK-01 | SCN-SMOKE-003: Task create E2E            | `ScnSmokeTest`  | —   | —      |
| REQ-TASK-03 | SCN-SMOKE-004: Approximate location E2E   | `ScnSmokeTest`  | —   | —      |
| REQ-AUTH-03 | SCN-SMOKE-005: Error envelope consistency | `ScnSmokeTest`  | —   | —      |

### Frontend-Only Tests (not scenario-backed)

| Surface | Test IDs                                                                                                                             | Status       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| Web     | TID-TASK-000-WEB-UNIT, TID-TASK-114-WEB-\* (4 tests), adminApiClient tests                                                           | 234/234 PASS |
| Mobile  | TID-TASK-000-MOBILE-UNIT, TID-TASK-071-MOBILE-_, TID-TASK-082/083-MOBILE-_, TID-TASK-090-MOBILE-_, TID-TASK-113/149/150/151-MOBILE-_ | 723/725 PASS |

---

## 2. Dead-Test / Dead-Code Report

### Files Deleted (3)

| File                                                       | Reason                                                          |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `services/api/.../OtpRateLimitScenarioTests.java`          | Future-phase (OTP rate limiting) — retired SCN-AUTH-009/010/011 |
| `services/api/.../PaymentConfirmedHandlerTest.java`        | Future-phase (payment workflows) — no active scenario           |
| `services/api/.../wallet/BookingCompletedHandlerTest.java` | Future-phase (wallet/credits) — no active scenario              |

### Code Removed from Existing Files

| File                                                      | What was removed                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `AuthHttpScenarioTests.java`                              | `OtpEnabledScenarios` nested class (3 test methods for OTP success/rate-limit)       |
| `SecurityInformationControlScenarioTests.java`            | SCN-SEC-009/010 tests (OTP brute-force, device-trust)                                |
| `UserProfileServiceTests.java`                            | `InstantMatch` and `RequiresOtpMigration` test methods                               |
| `BookingScenarioTests.java`                               | `revokeInstantMatch()` assertion from SCN-BOOK-004                                   |
| `CategoryScenarioTests.java`                              | 5 false DisplayNames corrected (SCN-CATEGORY-006-009/011 → `needs-scenario:` prefix) |
| `apps/web/src/lib/adminApiClient.test.ts`                 | 4 deferred-endpoint test entries (payment/wallet/escrow)                             |
| `apps/mobile/__tests__/App.test.tsx`                      | OTP flow test                                                                        |
| `apps/mobile/__tests__/.../BookingConfirmScreen.test.tsx` | `instant_match` field test                                                           |

### Tests Flagged as Shallow (mutation kill rate = 0)

| Scenario             | Domain    | Notes                                                   |
| -------------------- | --------- | ------------------------------------------------------- |
| SCN-ANALYTICS-001    | analytics | Assertion-strength follow-up needed (P2)                |
| SCN-ANALYTICS-002    | analytics | Assertion-strength follow-up needed (P2)                |
| SCN-ANALYTICS-003    | analytics | Assertion-strength follow-up needed (P2)                |
| SCN-CATEGORY-001-005 | category  | Mutation kill rate 0 — assertions don't catch mutations |

### 13 Backend Test Files Without Scenario Backing (`needs-scenario:`)

These tests test real service behavior but have no corresponding scenario in the active baseline. They are NOT dead — they provide infrastructure/utility coverage — but they should gain scenario backing over time:

- `UserProfileServiceTests`
- `UserStatusResolverTests`
- `UserSearchServiceTests`
- `ModerationServiceTests`
- `VerificationServiceTests`
- `TaskDraftLocationTests`
- `TaskApplicationServiceTests`
- `TaskPhotoServiceTests`
- `TaskQueryServiceTests`
- `RecentLocationsTests`
- `OutboxRelayServiceTests`
- `DistrictGeocodingProviderTests`
- `LocationApiTests`
- `AdminTaskConciergeAssignmentServiceTest`

---

## 3. Remaining Gaps Report

### Category A: Implementation Gaps (no code exists to test)

| Gap                                                                                                                          | Scenarios Blocked      | Impact                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| **Assistance domain** — no `AssistanceClassificationService`, `InterventionService`, or `mn.tasky.assistance` package exists | SCN-ASSIST-001-008 (8) | High — PRD P1 requires outcome classification and external distribution |
| **Verification domain** — partial implementation exists (`VerificationServiceTests` has tests), but no scenario-backed tests | SCN-VERIF-001-005 (5)  | High — manual verification is P1 launch gate                            |

### Category B: Scenarios With No Test (implementation exists)

| Domain                   | Scenarios                 | Risk     | Notes                                                             |
| ------------------------ | ------------------------- | -------- | ----------------------------------------------------------------- |
| Booking selection flow   | SCN-BOOK-022-024 (3)      | Critical | Customer selects applicant, selection expires, non-selected close |
| Booking completion       | SCN-BOOK-026-027 (2)      | Critical | Tasker mark complete, auto-complete timeout                       |
| Booking price lock       | SCN-BOOK-025 (1)          | Critical | Price locked at confirmation                                      |
| Booking disclaimer       | SCN-BOOK-007 (1)          | Critical | Disclaimer acceptance required                                    |
| Task application         | SCN-TASK-022-025 (4)      | High     | Verified tasker apply, pricing+note, review all, withdraw         |
| Task pricing modes       | SCN-TASK-026-029 (4)      | High     | Budget mode, quote mode, counter-offer, display                   |
| Task service area        | SCN-TASK-020-021 (2)      | High     | UB boundary, launch category gate                                 |
| Category canary/rollback | SCN-CATEGORY-006-008 (3)  | High     | Canary activation, rollback, no-fallback                          |
| Verification             | SCN-VERIF-001-005 (5)     | High     | Full manual verification flow                                     |
| Notification             | SCN-NOTIF-006-007 (2)     | Medium   | Verification decision, completion prompt                          |
| Analytics                | SCN-ANALYTICS-004-005 (2) | Medium   | Qualified application, intervention events                        |
| Messaging                | SCN-MSG-005 (1)           | Medium   | No pre-booking chat guarantee                                     |

### Category C: Known Implementation Bugs

| Bug                            | File                             | Detail                                                                                |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------- |
| `revokeInstantMatch()` residue | `BookingService.cancelBooking()` | Phase 2 method still called — should be gated behind feature flag or removed          |
| Budget minimum mismatch        | `TaskScenarioTests` + validation | PRD says ">1000 MNT accepted" but `@Min(5000)` enforces 5000. Product must reconcile. |

### Category D: Pre-Existing Test Failures

| Test                                             | Surface          | Root Cause                                                                  |
| ------------------------------------------------ | ---------------- | --------------------------------------------------------------------------- |
| `TID-TASK-112-CONTRACT-DEFERRED-METADATA`        | Backend contract | OpenAPI spec-only endpoints missing deferral metadata                       |
| `TID-TASK-112-CONTRACT-SPRING-PARITY`            | Backend contract | Spring MVC paths not documented in OpenAPI                                  |
| `TID-TASK-113-MOBILE-REVIEW-SUBMIT-PAYLOAD` (×2) | Mobile           | Test expects payload without `pricing_mode` but implementation now sends it |

---

## Summary Statistics

| Metric                        | Count                                  |
| ----------------------------- | -------------------------------------- |
| Total active scenarios        | **134**                                |
| Covered by tests              | **94** (70%)                           |
| Untested (implementation gap) | **8** (assistance domain)              |
| Untested (needs test written) | **31**                                 |
| Waived (pending feature)      | **1** (SCN-BOOK-006 tasker suspension) |
| Files deleted (dead tests)    | **3**                                  |
| Files modified (cleanup)      | **8**                                  |
| Pre-existing failures         | **4** (2 backend + 2 mobile)           |
| Test-rehab regressions        | **0**                                  |
