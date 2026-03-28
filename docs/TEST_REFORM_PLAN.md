# Backend Test Reform Plan

**Date:** 2026-03-28  
**Status:** Proposed  
**Scope:** `src/test/java/mn/tasky/`

---

## 1. Diagnosis

### 1.1 PIT Baseline (Run 2026-03-28)

| Metric | Value |
|---|---|
| Line coverage (mutated classes only) | **41%** |
| Mutations generated | 3046 |
| Killed | 653 (21%) |
| No coverage | 1981 (65%) |
| Test strength (killed / covered) | **61%** |

The 65% no-coverage figure is the headline problem: the majority of the production codebase is
not reached by any unit test at all. Of the code that is covered, 39% of mutations still survive —
meaning tests ran over it but wouldn't catch a real bug.

### 1.2 Package-Level Breakdown (Worst Offenders)

| Package | Mutations | Kill% | No-cov% | PRD Criticality |
|---|---|---|---|---|
| `auth.application` | 586 | 11% | 81% | CRITICAL — auth, OTP, Facebook OAuth, badges |
| `task.application` | 401 | 12% | 81% | CRITICAL — task lifecycle, pagination, photos |
| `booking.application` | 233 | 16% | 72% | CRITICAL — cancellation, fees, no-show logic |
| `category.application` | 108 | 0% | 85% | HIGH — schema activation, intake validation |
| `common.security` | 160 | 31% | 38% | CRITICAL — JWT, ban check, rate limit |
| `task.api` | 142 | 19% | 71% | HIGH — controller mapping, validation |
| `messaging.application` | 45 | 20% | 75% | HIGH — phone leak detection |
| `common.outbox` | 56 | 0% | 100% | HIGH — at-least-once delivery |
| `analytics.application` | 26 | 0% | 100% | MEDIUM |
| `notification.application` | 35 | 0% | 100% | MEDIUM |

### 1.3 Root Causes

#### Cause 1: Tests derived from code, not requirements

AI agents wrote tests by reading method signatures and class names. The result:
- `BookingServiceTests` tests `BookingService` methods. `BadgeEvaluationTests` tests
  `BadgeEvaluationService`. The test name maps to an internal class, not to a user-observable
  behavior.
- No test references `REQ-BOOK-04` (late cancellation policy), `REQ-BOOK-11` (no-show dual
  inactivity check), or `REQ-SAFE-04` (Pro badge hysteresis). The acceptance criteria in the PRD
  have no test coverage mapping.

#### Cause 2: Controller unit tests test HTTP wiring, not business outcomes

`BookingControllerUnitTests` has 52 tests. **51 of 52 assert only on `HttpStatus`** — they verify
that when `bookingLifecycleService.cancelBooking()` returns a specific enum, the controller
returns `409`. This contributes zero to domain logic coverage because the service is fully mocked.

These 52 tests cover `booking.api` at 68% kill rate. But `booking.application` — which contains
all the actual cancellation logic — is 16% kill rate with 72% no-coverage. The effort is inverted.

#### Cause 3: Service layer mocks hide the real behavior

`BookingServiceTests` uses a hand-rolled in-memory `BookingDao` mock with 120 lines of
`doAnswer` setup. This is better than pure Mockito mocks — but it means the tests still can't
catch bugs in the interaction between service and DB (cursor encoding, SQL filter logic). The
survived mutations in `TaskService.listTasks` (cursor arithmetic, filter conditions) are all in
code that no unit test reaches.

#### Cause 4: Critical PRD rules have no test at all

| PRD Requirement | Status |
|---|---|
| REQ-BOOK-04: Free cancel >4h, incident <4h | **No test for the 4-hour boundary condition** |
| REQ-BOOK-11: No-show dual-inactivity check | **No unit test** |
| REQ-BOOK-12: Reschedule timer authority | Integration test exists, no unit test |
| REQ-AUTH-02: Duplicate facebook_id → 409 | Integration test exists |
| REQ-AUTH-03: JWT claims (sub, role, exp) | No assertion on claims structure |
| REQ-SAFE-03: Dispute only from ASSIGNED or within 24h of COMPLETED | **No unit test** |
| REQ-SAFE-10: Dispute evidence grace period → auto-close | **No test** |
| REQ-LEAK-04: Phone number detection in messages | `PhoneLeakDetectorTests` exists ✓ |
| REQ-TASK-09: Draft bound to schema version at start | Integration test exists |
| REQ-TASK-10: Scope summary fail-open | `ScopeSummaryGeneratorTests` exists ✓ |

#### Cause 5: Redundant tests

`BookingServiceTests` has both `customerLateCancelNoFee` and `customerFreeCancel`. Both
assert `cancellationFee == null` and differ only in the scheduled time offset (1h vs 10h).
Neither test changes the boundary — both are in the "free cancel" zone of the 4-hour rule and
produce identical assertions. One is redundant and neither covers the boundary itself.

---

## 2. Target State

### 2.1 Test Pyramid (After Reform)

```
        ┌────────────────────────┐
        │   Integration Smoke    │  ~30 tests
        │  (Testcontainers + DB) │  Happy path per domain only
        │  Keep existing, slim   │  Tag: @Tag("integration")
        └──────────────────────┬─┘
               ────────────────
        ┌─────────────────────────────────────┐
        │     Service / Domain Tests          │  ~200 tests  ← PRIMARY INVESTMENT
        │  No Spring context, no DB           │  One test = one PRD acceptance criterion
        │  Fast, pure Java, in-memory DAOs    │
        └──────────────────────┬──────────────┘
               ─────────────────────────────
        ┌──────────────────────────────────────────────┐
        │  API Contract Tests (MockMvc, no DB)         │  ~80 tests
        │  Test HTTP mapping, auth, error envelopes    │
        │  One test = one API.yaml operation rule      │
        └──────────────────────────────────────────────┘
```

### 2.2 Naming Convention (Requirement-First)

Every test name must cite its source, using one of:
- `REQ-AUTH-02: duplicate facebook_id is rejected with 409 DUPLICATE_IDENTITY`
- `PRD §6.4.5: late cancel within 4h records reliability incident, first is warning-only`
- `API /bookings/{id}/cancel: unauthenticated returns 401`

The current practice of naming after internal methods (`BookingController cancel returns
in-progress idempotency response`) is banned for new tests.

### 2.3 PIT Targets (To Be Raised After Each Phase)

| Phase | Mutation threshold | Test strength target |
|---|---|---|
| After Phase 1 (cleanup) | 0 (current) | establish baseline |
| After Phase 2 (domain) | 40% | 70%+ on covered code |
| After Phase 3 (contract) | 55% | 75%+ on covered code |
| Steady state | 65% | 80%+ |

---

## 3. Execution Plan

### Phase 1 — Cleanup (Remove noise, don't add tests)
**Goal:** Remove or reclassify tests that consume maintenance effort without providing coverage value.
**Effort:** ~1 day

#### 1a. Delete: Redundant cancellation tests in `BookingServiceTests`

`customerLateCancelNoFee` and `customerFreeCancel` both assert `cancellationFee == null`.
Delete `customerFreeCancel`. Rename `customerLateCancelNoFee` to:
```
REQ-BOOK-04: cancellation within 4 hours records reliability incident but no fee
```
Replace the deleted test with the missing boundary case:
```
REQ-BOOK-04: cancellation more than 4 hours before schedule is free (no incident, no fee)
REQ-BOOK-04: cancellation at exactly 4-hour boundary is treated as late
```

#### 1b. Reclassify: Controller unit tests to "HTTP mapping" category

All 52 `BookingControllerUnitTests` tests are legitimate — they test HTTP mapping. But they
should not be relied on for business logic coverage. Add a class-level `@Tag("http-mapping")`
and a comment explaining their scope:

```java
/**
 * HTTP mapping tests for BookingController.
 * Scope: verifies that service return values are translated to correct HTTP status codes
 * and response envelopes. Business logic is NOT tested here; see BookingService*Tests.
 * PRD traceability: these tests do not carry REQ-* identifiers by design.
 */
```

Same treatment for: `AdminDisputeControllerUnitTests`, `AdminPayoutControllerUnitTests`,
`AdminTaskControllerUnitTests`, `AdminUserControllerUnitTests`, `DisputeControllerUnitTests`,
`TaskControllerUnitTests`, `VerificationControllerUnitTests`, `ReviewControllerUnitTests`,
`MessagingControllerUnitTests`.

These are not deleted — HTTP mapping tests have value — but they are explicitly scoped out
of requirement traceability.

#### 1c. Add missing boundary: `BadgeEvaluationTests`

One boundary case is present (`revoke at exactly 4.0 → no revoke`). Missing:
- `REQ-SAFE-04: badge is NOT assigned at completedTasks == 14 even with high rating`
- `REQ-SAFE-04: badge remains assigned when rating is between 4.0 and 4.5 (hysteresis)`

The second one is already in the file. The first is missing. Add it.

#### 1d. Remove `@DirtiesContext` from integration tests

`BookingIntegrationTests` and `SecurityBaselineIntegrationTests` use
`@DirtiesContext(BEFORE_EACH_TEST_METHOD)`. This restarts the application context for every
test method — a major source of integration test slowness. Integration tests should use database
transaction rollback or explicit fixture cleanup instead. This is a separate task (tracked in
`BookingIntegrationTests` cleanup), but calling it out here to block further tests being written
in this pattern.

---

### Phase 2 — Domain Service Tests (The Primary Investment)
**Goal:** Cover the three dark packages with PRD-anchored unit tests.
**Effort:** ~4-5 days  
**PIT impact:** Expected to raise kill rate from 21% to ~45%, test strength to 70%+

#### 2a. New file: `AuthServiceDomainTests.java`

Target package: `mn.tasky.auth.application` (586 mutations, 11% kill rate, 81% no-coverage)

Key services to cover: `AuthService`, `OtpService`, `AuthServiceConfiguration`,
`FacebookCircuitBreaker`

Tests to write, one per PRD criterion:

**OTP validation (REQ-AUTH-05)**
```
REQ-AUTH-05: OTP request rate limit — 5 requests per phone per hour blocks further requests
REQ-AUTH-05: OTP verify with expired code returns OTP_EXPIRED
REQ-AUTH-05: OTP verify with wrong code increments fail counter, 5 failures → LOCKED
REQ-AUTH-05: OTP verify with correct code clears fail counter and issues access token
REQ-AUTH-05: rate limit resets after the configured window expires
```

**Facebook auth (REQ-AUTH-01)**
```
REQ-AUTH-01: valid Facebook token creates new user with CUSTOMER role
REQ-AUTH-02: existing facebook_id returns same user (no duplicate)
REQ-AUTH-02: two different facebook_ids cannot share the same phone number
REQ-AUTH-09: Facebook circuit breaker opens after configurable failure count
REQ-AUTH-09: circuit breaker rejects login with CIRCUIT_OPEN while open, not AUTH_PROVIDER_UNAVAILABLE
```

**Banned user check (Architecture §5.3)**
```
ARCH-SEC: banned user status check returns BANNED immediately regardless of valid JWT
ARCH-SEC: suspended user with future suspension_end_at is blocked
ARCH-SEC: suspended user with past suspension_end_at is allowed
```

**Badge evaluation (REQ-SAFE-04)** — add to existing `BadgeEvaluationTests.java`
```
REQ-SAFE-04: badge not assigned when completedTasks is 14 (below threshold)
```

#### 2b. New file: `TaskServiceDomainTests.java`

Target package: `mn.tasky.task.application` (401 mutations, 12% kill rate, 81% no-coverage)

Key behaviors to cover:

**Intake validation (REQ-TASK-00, REQ-TASK-09)**
```
REQ-TASK-00: task submission with missing required intake answer fails with VALIDATION_FAILED
REQ-TASK-09: task submission validates against the schema version bound at draft creation, not the current active version
REQ-TASK-09: if schema version at draft creation is no longer active, submission still uses that version
REQ-TASK-11: task creation fails with CATEGORY_INACTIVE when category is deactivated
```

**Scope summary (REQ-TASK-07, REQ-TASK-10)**
```
REQ-TASK-10: scope summary generation failure falls back to key-value format without blocking task creation
REQ-TASK-07: deterministic summary is generated from intake answers using template rules
```

**Privacy rules (REQ-TASK-03, Architecture §5.3)**
```
ARCH-PRIVACY: listTasks for a tasker returns approximate location, not exact coordinates
ARCH-PRIVACY: getTask before booking is confirmed hides exact location_text
ARCH-PRIVACY: getTask with confirmed booking exposes location_text to tasker
```

**Pagination (Architecture §5.5)**
```
ARCH-PAGINATION: cursor encodes the last-seen id; decoding it returns the correct offset
ARCH-PAGINATION: invalid/malformed cursor returns INVALID_CURSOR error, not 500
ARCH-PAGINATION: limit above max (100) is clamped to max
```

**Budget validation (REQ-TASK-01)**
```
REQ-TASK-01: task creation with budget <= 1000 MNT is rejected
REQ-TASK-01: task creation with budget exactly 1001 MNT is accepted
```

#### 2c. Extend: `BookingServiceTests.java` → `BookingServiceDomainTests.java`

Replace the current file (keep the good parts, add missing coverage).

**Cancellation policy (REQ-BOOK-04, REQ-BOOK-06)**
```
REQ-BOOK-04: customer cancel > 4h before schedule → success, no incident, no fee
REQ-BOOK-04: customer cancel < 4h before schedule → success, reliability incident recorded, no fee (first incident)
REQ-BOOK-04: customer cancel at exactly 4h before schedule → treated as free (boundary)
REQ-BOOK-06: tasker cancel → success, no fee, task reverts to OPEN
```

**No-show (REQ-BOOK-11)**
```
REQ-BOOK-11: flagNoShow before +15 minutes from confirmed schedule returns TOO_EARLY
REQ-BOOK-11: flagNoShow with recent status activity (< 30min) from either party returns ACTIVITY_DETECTED
REQ-BOOK-11: flagNoShow with accepted reschedule that supersedes original schedule returns RESCHEDULE_SUPERSEDES
REQ-BOOK-11: valid flagNoShow transitions booking to NO_SHOW and records timeline event
REQ-BOOK-11: flagNoShow on already-NO_SHOW booking is idempotent
```

**Liability disclaimer (REQ-BOOK-03)**
```
REQ-BOOK-03: booking confirmation without liability_disclaimer_accepted=true is rejected
REQ-BOOK-03: disclaimer acceptance timestamp is recorded on the booking
```

**Booking state machine completeness (REQ-BOOK-05)**
```
REQ-BOOK-05: ASSIGNED → COMPLETED is valid
REQ-BOOK-05: ASSIGNED → CANCELLED is valid
REQ-BOOK-05: ASSIGNED → NO_SHOW is valid
REQ-BOOK-05: COMPLETED → CANCELLED is invalid (INVALID_TRANSITION)
REQ-BOOK-05: CANCELLED → COMPLETED is invalid (INVALID_TRANSITION)
REQ-BOOK-05: NO_SHOW → COMPLETED is invalid (INVALID_TRANSITION)
```

#### 2d. New file: `DisputeServiceDomainTests.java`

Target: `mn.tasky.dispute.application` (already 68% kill rate — good, but PRD rules need verification)

```
REQ-SAFE-03: dispute can be opened when booking is ASSIGNED
REQ-SAFE-03: dispute can be opened within 24h of COMPLETED
REQ-SAFE-03: dispute cannot be opened > 24h after COMPLETED → DISPUTE_WINDOW_EXPIRED
REQ-SAFE-10: dispute opened without evidence enters 24h grace period
REQ-SAFE-10: dispute in grace period with no evidence after 24h auto-closes as INSUFFICIENT_EVIDENCE
REQ-SAFE-10: dispute in grace period with evidence added before deadline proceeds normally
```

#### 2e. New file: `CategorySchemaDomainTests.java`

Target: `mn.tasky.category.application` (108 mutations, 0% kill rate, 85% no-coverage)

```
REQ-TASK-00: schema activation is blocked if schema has fewer than 3 required questions
REQ-TASK-00: schema activation is blocked if schema has more than 5 required questions
REQ-TASK-00: schema activation is blocked if any question uses an unsupported field type (e.g., free-text)
REQ-ADMIN-05: rollback to last_known_good version succeeds when a last-known-good exists
REQ-ADMIN-05: rollback fails with NO_FALLBACK when no last-known-good version exists
REQ-TASK-11: deactivating a category blocks new task creation for that category
REQ-TASK-11: deactivating a category does not affect existing tasks in that category
```

---

### Phase 3 — API Contract Tests
**Goal:** Verify the API surface matches `docs/API.yaml` — not mocked service behavior but
actual HTTP contract rules.
**Effort:** ~3 days  
**Approach:** `@WebMvcTest` + Spring MockMvc (no Testcontainers), with real service beans where
logic-free, mocked otherwise.

These tests answer: "Does the HTTP layer behave exactly as the API contract specifies?"

#### 3a. New file: `BookingApiContractTests.java`

One test per API rule from `API.yaml`:

```
API /bookings/{id} GET: returns 200 with booking envelope matching schema
API /bookings/{id} GET: returns 401 when unauthenticated
API /bookings/{id} GET: returns 404 when booking does not belong to caller
API /bookings/{id}/cancel POST: requires Idempotency-Key header → 400 if absent
API /bookings/{id}/cancel POST: returns 422 with MISSING_DISCLAIMER when liability_disclaimer_accepted=false
API /bookings/{id}/cancel POST: response envelope has code, message, trace_id on error (API §5.2)
```

#### 3b. New file: `TaskApiContractTests.java`

```
API /tasks POST: requires category_id, budget, scheduled_at, location → 422 on missing fields
API /tasks POST: budget <= 1000 MNT → 422 INVALID_BUDGET
API /tasks POST: TASKER role → 403 (security layer enforces CUSTOMER-only)
API /tasks GET: returns cursor-paginated envelope with data[] and cursor.next
API /tasks GET: cursor parameter is opaque (can be any string the server issued)
API /tasks/{id} GET: approximate_lat/lng is returned for open tasks, not exact (REQ-TASK-03)
```

#### 3c. New file: `AuthApiContractTests.java`

```
API /auth/otp/request: missing phone → 422 MISSING_PHONE
API /auth/otp/request: invalid phone format → 422 INVALID_PHONE_FORMAT
API /auth/otp/verify: wrong code → 401 INVALID_OTP
API /auth/otp/verify: correct code → 200 with access_token, refresh_token, user.id, user.role
API /auth/facebook: missing token → 422
API /auth/facebook: Facebook returns error → 503 AUTH_PROVIDER_UNAVAILABLE (circuit breaker open)
API /auth/refresh: expired refresh token → 401 TOKEN_EXPIRED
```

#### 3d. Extend: `AuthorizationMatrixTests.java`

The current matrix covers 6 endpoints. Extend it to cover all role-restricted endpoints in
`API.yaml`. Each row in the matrix is derived from the `security` block of the OpenAPI spec,
not from `SecurityConfig.java`. If the matrix test fails, it proves the API spec and the
implementation have drifted.

---

### Phase 4 — Integration Smoke Layer (Thin and Stable)
**Goal:** Verify the three most critical end-to-end flows actually work against a real database.
Keep this layer *thin* — no exhaustive scenarios, those belong in domain tests.
**Effort:** ~2 days (mostly refactoring existing tests)

#### Keep (slim to happy-path only):
- `BookingIntegrationTests` → keep 3 tests: full booking lifecycle, cancellation writes to DB,
  no-show flag writes timeline event. Delete the 12 remaining (they are covered by domain tests).
- `FacebookAuthIntegrationTests` → keep 2 tests: new user signup flow, duplicate-id rejection.
- `TaskLifecycleIntegrationTests` → keep the task post → assign → complete → review flow.
  Delete individual unit-behavior tests (budget validation etc.) — those move to domain tests.

#### Remove `@DirtiesContext`:
Replace with explicit `@Transactional` test rollback or per-test fixture teardown. This alone
will cut integration test runtime by ~60%.

#### New smoke test: `InformationControlSmokeTest.java`
One integration test that verifies the privacy rules end-to-end:
```
REQ-TASK-03 smoke: GET /tasks feed returns approximate_lat/lng, not exact location_point
REQ-LEAK-01 smoke: Tasker phone number is not present anywhere in GET /users/{id} response for a customer
```

---

### Phase 5 — Governance: Keep It Clean
**Goal:** Ensure AI agents and future developers don't regress.
**Effort:** ~1 day

#### 5a. Requirement traceability checker in CI

Extend `ApiContractTraceabilityTests.java` with a requirement coverage check:

```java
@Test
void everyPrdRequirementHasAtLeastOneTestWithItsId() {
    // Reads the set of REQ-* IDs defined in docs/PRD.md (section 7.12 acceptance criteria)
    // Scans src/test/**/*.java @DisplayName annotations for those IDs
    // Fails if any REQ-* in the phase-0/1 scope has no corresponding test
}
```

This means agents can't write a test without citing the requirement, and requirements can't
be added without also adding a test.

#### 5b. PIT threshold ratchet

After Phase 2 is complete, raise `mutationThreshold` in `build.gradle.kts` to 40.
After Phase 3 is complete, raise to 55.
Commit the threshold increase in the same PR as the tests that justify it.

The threshold is a floor, not a target. Ratcheting it means the floor can only go up.

#### 5c. Test authoring rules (add to AGENTS.md)

```markdown
## Backend Test Rules

### What tests MUST do
- Every test `@DisplayName` MUST start with the REQ-* or API path it verifies
  (e.g., `"REQ-BOOK-04: late cancel within 4h records incident"`)
- Service/domain tests MUST NOT use `@SpringBootTest` or any Testcontainers dependency
- Service/domain tests MUST use real in-memory repositories (not Mockito mocks)
  for the service under test; mock only external boundaries (FCM, S3, Facebook OAuth)

### What tests MUST NOT do  
- Controller unit tests MUST NOT assert on business logic — only HTTP status codes
  and response envelope shape
- Tests MUST NOT use `@DirtiesContext` — use transaction rollback or fixture teardown
- Tests MUST NOT copy the method name as the display name
  (e.g., `"cancelBooking() works"` is banned)
- Tests MUST NOT mock internal service calls within the same domain package
```

#### 5d. PIT in CI (non-blocking gate for now)

Add `pitest` to the CI pipeline as a reporting step (not a blocking gate yet):

```yaml
# In CI:
- name: Mutation Testing
  run: ./gradlew pitest
  continue-on-error: true  # non-blocking until threshold is raised
- name: Upload PIT Report
  uses: actions/upload-artifact@v3
  with:
    name: pitest-report
    path: build/reports/pitest/
```

Once threshold is at 40+, change `continue-on-error: false`.

---

## 4. Priority Order

Do these in sequence. Each phase produces runnable, passing tests before the next starts.

| Phase | What | When to start | Done when |
|---|---|---|---|
| **1** | Cleanup: delete redundant, reclassify controllers, add missing boundary | Immediately | PIT shows same or better score, no regressions |
| **2a** | `AuthServiceDomainTests` | After Phase 1 | `auth.application` kill rate > 50% |
| **2b** | `TaskServiceDomainTests` | After 2a | `task.application` kill rate > 50% |
| **2c** | `BookingServiceDomainTests` | After 2b | `booking.application` kill rate > 60% |
| **2d** | `DisputeServiceDomainTests` | After 2c | `dispute.application` kill rate > 75% |
| **2e** | `CategorySchemaDomainTests` | After 2c | `category.application` kill rate > 60% |
| **3** | API Contract Tests | After Phase 2 | All `API.yaml` operations have ≥1 contract test |
| **4** | Integration layer slim-down | After Phase 3 | Integration tests run in < 5 minutes |
| **5** | Governance: CI gate, AGENTS.md rules, traceability checker | After Phase 4 | `mutationThreshold=55` in CI |

---

## 5. What Not to Do

These are patterns the AI agents used that produced the current state. Don't repeat them.

| Anti-pattern | Why it's wrong | What to do instead |
|---|---|---|
| `when(dao.findById(id)).thenReturn(mock)` in service tests | Mocks the component being tested; test only verifies the mock, not the service | Use real in-memory DAO implementation |
| Test name = method name | Creates coupling to code structure; breaks when refactored | Name after the behavior/requirement |
| 52 controller tests for HTTP status codes | Zero contribution to domain logic coverage | Keep ≤10 per controller; scope to wiring only |
| `@DirtiesContext` per test method | Restarts Spring context for every test; 10× slower | Use `@Transactional` rollback or fixture teardown |
| Testing only the happy path | Mutations on conditionals all survive | Every branch condition needs both true/false covered |
| Asserting only that a mock was called | Verifies invocation, not correctness | Assert on the returned state or side-effected data |

---

## 6. Appendix: Specific Survived Mutations Requiring Immediate Attention

These survived mutations indicate bugs that could already be in production:

| Class | Line | Mutation | Risk |
|---|---|---|---|
| `BookingService.cancelBooking:300` | remove call to `BookingReliabilityIncidentDao.insert` | Reliability incident is never recorded for late cancels — REQ-BOOK-04 broken |
| `BookingService.completeBooking:267` | remove call to `AuthService.updateUserStats` | Completion stats not updated after booking completes — badge and reliability score stale |
| `BookingService.createBooking:98` | replace equality check with false | Unknown booking creation condition bypassed — needs investigation |
| `AuthService.validateOtpConfiguration:153-165` | 8 survived mutations on 4 equality checks | OTP configuration validation entirely untested — misconfiguration silently accepted |
| `TaskService.listTasks:554` | `+` → `-` in cursor arithmetic | Pagination offset arithmetic wrong — users see wrong page |
| `AuthService.isNonProductionProfile:171` | replaced boolean return with true | Dev auth bypass could be active in production — HIGH RISK |

The last one (`isNonProductionProfile`) is especially concerning: if this returns `true` in
production, the dev auth bypass path is active. This should be investigated before any other work.
