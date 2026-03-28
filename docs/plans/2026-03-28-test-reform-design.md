# Test Reform Design
**Date:** 2026-03-28  
**Status:** Approved  
**Supersedes:** `docs/TEST_REFORM_PLAN.md` (developer-authored first draft)  
**Owner:** Solo + AI agents

---

## Context

PIT mutation baseline (2026-03-28): 41% line coverage, 21% kill rate, 65% of mutations have
zero test coverage. The root cause is not missing tests — it is missing *specifications*.
AI agents reverse-engineered tests from code, producing tests that verify implementation
details rather than product behavior. The existing `TEST_REFORM_PLAN.md` addresses symptoms
(package coverage gaps) without fixing the structural cause (agents have no authoritative
spec to work from).

This design fixes the structure.

---

## The Three-Layer Model

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: Scenario Files  (human authors)       │
│  tests/scenarios/<domain>.md                    │
│  Plain language. PRD-anchored. Risk-tagged.     │
│  Agents are FORBIDDEN from modifying these.     │
└──────────────────┬──────────────────────────────┘
                   │ agents implement ↓
┌──────────────────▼──────────────────────────────┐
│  LAYER 2: Test Code  (agents implement)         │
│  src/test/java/mn/tasky/                        │
│  Every test cites a scenario ID.                │
│  Mutation testing runs here.                    │
└──────────────────┬──────────────────────────────┘
                   │ CI enforces ↓
┌──────────────────▼──────────────────────────────┐
│  LAYER 3: Registry + Gates  (automated)         │
│  tests/registry.yaml                            │
│  Risk-classifies scenarios.                     │
│  Defines what must pass before a deploy.        │
└─────────────────────────────────────────────────┘
```

**Key constraint:** agents receive scenarios, they do not author them. A feature with no
scenario file has no tests — and that absence is visible and intentional, not accidentally
missing.

---

## Risk Classification

Four tiers based on: user harm if broken × detectability without tests.

| Tier | Label | Criteria |
|---|---|---|
| 1 | Critical | Data loss, security breach, incorrect money flow, silent failures |
| 2 | High | Core user flows broken, visible but harmful |
| 3 | Medium | Degraded experience, non-blocking workarounds exist |
| 4 | Low | Cosmetic or low-frequency edge cases |

**Tier assignments:**

| Domain | Tier | Rationale |
|---|---|---|
| auth — JWT, ban check, OTP rate limit, Facebook circuit breaker | Critical | Auth bypass = security breach |
| booking — state machine, cancellation fee/incident, no-show, disclaimer | Critical | Incorrect state = money/trust loss |
| security — RBAC, address/phone reveal rules | Critical | Reveal = privacy breach |
| payment — credit debit idempotency, lead-unlock gating | Critical | Double charge / missed charge |
| task — lifecycle, privacy rules, intake validation, pagination | High | Core posting flow |
| dispute — window rules, evidence grace period | High | Trust/safety |
| review — enforcement cadence, hard lock triggers | High | Trust/safety |
| category — schema activation, deactivation rules | High | Data integrity |
| notification, analytics, messaging | Medium | Degraded but not blocking |
| observability, scheduling, i18n fallbacks | Low | Self-correcting |

**Coverage requirements per tier:**

| Tier | Scenario coverage | Mutation kill floor | JaCoCo line floor |
|---|---|---|---|
| Critical | 100% of PRD acceptance criteria | 75% | 80% |
| High | 100% of PRD acceptance criteria | 60% | 80% |
| Medium | Happy path + primary error path | 40% | None enforced |
| Low | Best-effort | None | None |

---

## Scenario File Format

**Location:** `tests/scenarios/<domain>.md`  
**ID format:** `SCN-<DOMAIN>-NNN`  
**One file per domain. Human-authored only.**

```markdown
# Booking Scenarios

## SCN-BOOK-001
**Risk:** Critical
**PRD:** REQ-BOOK-04
**Title:** Customer cancels more than 4 hours before schedule — free cancellation

Given a booking in ASSIGNED status scheduled 5 hours from now
When the customer cancels
Then the booking status is CANCELLED
And no cancellation fee is recorded
And no reliability incident is recorded

---

## SCN-BOOK-002
**Risk:** Critical  
**PRD:** REQ-BOOK-04
**Title:** Customer cancels within 4 hours — reliability incident recorded, no fee

Given a booking in ASSIGNED status scheduled 3 hours from now
When the customer cancels
Then the booking status is CANCELLED
And no cancellation fee is recorded
And a reliability incident IS recorded for the customer
```

**Format rules:**
- `Given/When/Then/And` — plain English, no Cucumber tooling
- One observable outcome per `Then` / `And` line
- Boundary conditions are separate scenarios, not combined
- No implementation hints — no DAO names, method names, Spring beans
- Boundary scenarios are explicitly numbered (SCN-BOOK-001 at 5h, SCN-BOOK-003 at exactly 4h)

**Agent instruction template:**
> "Implement all scenarios in `tests/scenarios/<domain>.md` with `status: untested` in
> `tests/registry.yaml`. Each test `@DisplayName` must be exactly the scenario ID and title.
> Do not modify the scenario file. Run `scripts/sync-registry.sh` after implementing."

---

## YAML Registry

**Location:** `tests/registry.yaml`  
**Generated by:** `scripts/sync-registry.sh`  
**Never hand-edited except:** `notes` and `override_status` fields.

```yaml
# Auto-generated by scripts/sync-registry.sh
# Edit scenario entries in tests/scenarios/<domain>.md only.
# Hand-edit only: notes, override_status.

scenarios:
  SCN-BOOK-001:
    title: "Customer cancels more than 4 hours before schedule — free cancellation"
    domain: booking
    risk: critical
    prd_ref: REQ-BOOK-04
    test_type: domain-unit
    status: untested          # untested | partial | covered
    mutation_kill_rate: null  # updated by PIT report parser
    notes: null               # explain known gaps here
    override_status: null     # "waived: <reason>" creates audit trail
```

**`sync-registry.sh` responsibilities:**
1. Parse `SCN-*` entries from all `tests/scenarios/*.md`, upsert into `registry.yaml`
2. Scan `src/test/**/*.java` `@DisplayName` annotations for `SCN-*` IDs, update `status`
3. Parse `build/reports/pitest/mutations.xml`, update `mutation_kill_rate` per domain

**CI gate check reads registry and fails if:**
- Any Critical scenario: `status != covered` → blocks merge to main
- Any High scenario: `status != covered` → blocks production deploy
- Any Critical domain: `mutation_kill_rate < 75` → blocks production deploy
- Any High domain: `mutation_kill_rate < 60` → blocks production deploy

---

## Quality Gates

### Gate 1 — Smoke
**Runs on:** every push to any branch  
**Target duration:** < 2 minutes

Passes if:
- All Critical scenario tests pass
- `AuthorizationMatrixTests` passes
- No Critical scenario has `status: untested`

**Blocks:** merge to main

---

### Gate 2 — Regression
**Runs on:** merge to main, before any deploy  
**Target duration:** < 15 minutes

Passes if:
- Gate 1 passes
- All High scenario tests pass
- No High scenario has `status: untested`
- `./gradlew openApiValidate` passes (contract drift detection)
- JaCoCo line coverage >= 80% on Critical and High packages
- PIT data exists for all Critical/High domains and is not stale (< 25h old)

> **Note:** Integration smoke tests run as part of `./gradlew test` (Gate 2 depends on
> `tasks.test`). Contract test count enforcement is deferred to Phase 3 when the
> contract test suite exists. Mutation *floors* are enforced by Gate 3 (nightly) only,
> because PIT takes 30-60 minutes and cannot run inline on every merge; Gate 2 enforces
> data freshness instead.

**Blocks:** production deploy

---

### Gate 3 — Full Quality
**Runs on:** nightly  
**Target duration:** < 60 minutes

Passes if:
- Gate 2 passes
- All Medium scenario tests pass
- PIT mutation kill rate meets tier floors (Critical 75%, High 60%, Medium 40%)
- No Critical or High scenario has `status: untested` with `notes: null`

**Blocks:** nothing immediately. Three consecutive nightly failures tighten Gate 2 to
include the PIT check.

**Ratchet rule:** mutation thresholds in `build.gradle.kts` only increase. When a domain
exceeds its floor by 10+ points for 5 consecutive nightly runs, the floor is raised in a
one-line PR. The CI history is the justification.

---

## Execution Plan

### Phase 0 — Infrastructure (~1 day)
*You + agent. Unblocks everything else.*

- Create `tests/scenarios/` directory
- Write `scripts/sync-registry.sh`
- Write `scripts/check-gates.sh`
- Wire Gate 1 into CI (will immediately fail — correct)
- **Investigate `AuthService.isNonProductionProfile` survived mutation before any other work**
  (survived PIT mutant: `replaced boolean return with true` — if active in production,
  dev auth bypass is enabled)

---

### Phase 1 — Critical Scenarios (~3 days)
*You author scenario files. Agent implements.*

| File | Scenarios | Key PRD coverage |
|---|---|---|
| `tests/scenarios/auth.md` | ~15 | REQ-AUTH-01/02/03/05/09, ban check, circuit breaker |
| `tests/scenarios/booking.md` | ~20 | REQ-BOOK-04/05/06/11/12, disclaimer, state machine |
| `tests/scenarios/security.md` | ~10 | RBAC matrix, address/phone reveal, rate limit |

Agent constraint: domain-unit tests only. No Spring context. In-memory DAOs.

**Done when:** all Critical scenarios `status: covered`. Gate 1 passes.

---

### Phase 2 — High Scenarios (~3 days)
*You author scenario files. Agent implements.*

| File | Scenarios | Key PRD coverage |
|---|---|---|
| `tests/scenarios/task.md` | ~18 | REQ-TASK-00/01/03/07/09/10/11, pagination, privacy |
| `tests/scenarios/dispute.md` | ~8 | REQ-SAFE-03/10, evidence grace period |
| `tests/scenarios/review.md` | ~6 | REQ-SAFE-02/11, enforcement, hard lock |
| `tests/scenarios/category.md` | ~8 | REQ-ADMIN-05, schema activation, deactivation |

**Done when:** all High scenarios `status: covered`. JaCoCo >= 80% on Critical packages.
Gate 2 passes.

---

### Phase 3 — Contract Tests (~2 days)
*Agent implements from `docs/API.yaml`.*

One `@WebMvcTest` test per documented response code per API operation. Verifies: HTTP
status, error envelope shape (`code`, `message`, `trace_id`), auth enforcement. Lives in
`src/test/java/mn/tasky/contract/`.

**Done when:** `OpenApiSpringParityTests` confirms test count >= operation count in
`API.yaml`. Gate 2 checks this.

---

### Phase 4 — Integration Slim-down (~1 day)
*Agent implements.*

- Remove `@DirtiesContext` — replace with `@Transactional` rollback
- Delete integration tests that duplicate Phase 1/2 domain tests
- Keep one end-to-end flow per domain in `tests/scenarios/integration.md` as `SCN-SMOKE-*`
- Target: integration suite runs in < 5 minutes

---

### Phase 5 — Medium Scenarios + Nightly Gate (~2 days)
*You author. Agent implements.*

- `tests/scenarios/notification.md`, `tests/scenarios/messaging.md`,
  `tests/scenarios/analytics.md`
- Wire Gate 3 (nightly)
- Set initial PIT floors: Critical 75%, High 60%, Medium 40%
- Begin ratchet

---

## Agent Governance Rules

These replace the test rules in `AGENTS.md`.

### MUST

1. Check `tests/registry.yaml` before writing any test. If a scenario exists for the
   behavior, implement it. If no scenario exists, stop and report — do not invent one.

2. `@DisplayName` must be exactly: `"SCN-XXX-NNN: <title from scenario file>"`.
   CI rejects tests without a matching `SCN-*` ID in the registry.

3. Domain-unit tests must have zero Spring annotations.
   No `@SpringBootTest`, `@Autowired`, `@MockBean`. Use in-memory DAO implementations.

4. Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`,
   `S3StorageService`. Never mock a class in the same domain package as the class
   under test.

5. Run `scripts/sync-registry.sh` after implementing tests. Commit updated
   `registry.yaml` in the same PR as the tests.

### MUST NOT

6. Never modify files in `tests/scenarios/`. Raise a comment if a scenario seems wrong.

7. Never write a test without a `SCN-*` `@DisplayName`. Exception: `@Tag("http-mapping")`
   controller tests — these test HTTP status wiring only and carry no scenario ID.

8. Never use `@DirtiesContext`. Use `@Transactional` rollback or explicit fixture teardown.

9. Never assert only on mock invocation without asserting on observable output state.

10. Never write more than one scenario per test method.

### When assigned a PIT survived mutation

1. Find the mutant in `build/reports/pitest/index.html`
2. Identify which scenario file covers that behavior
3. If a scenario covers it: the test assertion is wrong — fix it
4. If no scenario covers it: a scenario is missing — report the gap, do not add a test
   without a scenario

---

## What This Replaces in the Existing Plan

The `docs/TEST_REFORM_PLAN.md` package-by-package phasing is superseded by this document.
Specific items that carry forward unchanged:

- PIT + Stryker tooling setup (already complete)
- `AuthorizationMatrixTests` extension (becomes part of `tests/scenarios/security.md`)
- `ApiContractTraceabilityTests` (extended in Phase 3)
- The `isNonProductionProfile` investigation (elevated to Phase 0 blocker)

Specific items that are dropped:

- Package-by-package mutation threshold targets (replaced by tier-based floors)
- "Reclassify controller unit tests" (replaced by `@Tag("http-mapping")` rule)
- Manual requirement traceability via `@DisplayName` REQ-* prefixes
  (replaced by `SCN-*` + registry)
