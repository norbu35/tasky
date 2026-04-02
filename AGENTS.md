# Agent Instructions

## Workflow Overview

There are two agent roles. The same agent may play both in one session, or they may be separate sessions.

### 1. Planning: Requirement → Plan Tranches

The user describes what they want in plain language. The planning agent:

1. Reads `docs/PRD.md`, `docs/ARCHITECTURE.md`, and `docs/API.yaml` to understand what exists
2. Asks clarifying questions until the requirement is unambiguous
3. Writes/updates plan tranches in `docs/plans/`
4. Uses explicit entry/exit criteria per tranche
5. Captures dependencies and verification requirements in the plan docs

### 2. Implementation: Plan Tranche → Branch → PR

The implementation agent:

1. Selects the next tranche from the active plan in `docs/plans/`
2. Creates/uses a working branch for that tranche
3. Implements the scoped changes
4. Writes tests for every "Done When" criterion
5. Runs all checks locally (see "How to Submit Work")
6. Updates `CHANGELOG.md`, pushes, and opens a PR
7. The user reviews the PR and merges it

## Writing Good Tranches

A tranche should be a **vertical slice** deliverable in one PR. It touches one feature across the necessary layers (DB -> backend -> API spec -> frontend). If a feature is too large for one PR, split by user-facing capability, not by technical layer.

**Plan tranche format** (`docs/plans/*.md`):

```markdown
# Tranche: Short imperative title

**Status:** planned
**Priority:** high
**Depends on:** tranche-name (optional)

## Description
2-5 sentences: what the user wants, what needs to change, which layers are involved.
Reference specific endpoints, tables, or screens when possible.

## Done When
- Each criterion is concrete and testable
- Mention specific endpoints, validation rules, or UI behaviors
- Include contract updates (API.yaml, SDK regen) if endpoints change
- Bad: "search works well" — Good: "GET /api/v1/tasks?district=X returns tasks within 5km"
```

**Priority values:** `critical`, `high`, `medium`, `low`

**Dependencies:** list explicit plan-tranche dependencies and required verification gates.

## Before Starting Any Task

Read these files first:
- `docs/ARCHITECTURE.md` — system design, domain packages, persistence patterns
- `docs/API.yaml` — skim the OpenAPI spec for the area you're working in
- The relevant domain package under `src/main/java/mn/tasky/` — understand existing patterns before adding code

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, JDBI 3 (explicit SQL, not JPA), PostgreSQL + PostGIS, Flyway migrations
- **Web:** React 18, TypeScript, Vite, Radix UI + Tailwind (shadcn conventions, no CLI)
- **Mobile:** React Native (Expo), TypeScript
- **Monorepo:** runtime and shared code under `apps/`, `services/`, `packages/`; support zones under `tooling/`, `research/`, and `archive/`
- **API client:** Always consume `@tasky/sdk` (generated from `docs/API.yaml`), never hand-write fetch calls

## Code Conventions

- Follow existing patterns in the codebase
- TypeScript: strict mode, no `any`, no `as` casts without justification, prefer `const`
- Java: full type annotations, JDBI for persistence, Spring `@Transactional` for atomic operations
- Web components: Radix UI + Tailwind in `apps/web/src/components/ui/`. No MUI, Chakra, or Ant
- Mobile: platform-native components driven by shared design tokens. No Radix/shadcn on mobile
- Use `structlog` patterns for logging, never `System.out.println`

## API-First Development

For any endpoint change:
1. Update `docs/API.yaml` first
2. Run `pnpm sdk:generate` to regenerate the TypeScript SDK
3. Then implement the backend and frontend changes
4. Never hand-write request/response types that exist in the generated SDK

## Task Queue Status

The greenfield task queue is archived:
- `archive/legacy-task-system/tasks/`
- `archive/legacy-task-system/task.sh`

Do not use `scripts/task.sh` for active maintenance work.

## How to Submit Work

1. Ensure all checks pass locally:
   ```bash
   ./gradlew test
   ./gradlew openApiValidate
   pnpm -r typecheck
   pnpm -r test
   ```
2. Update `CHANGELOG.md` with a one-line summary of what you did
3. Push the branch and open a PR

## PR Description

Every PR must include:
- What the task asked for
- What you changed (files, endpoints, schemas)
- How you verified it (which tests you wrote/updated)
- Anything you're unsure about

## Backend Testing Rules

The backend uses a scenario-based test framework. Read this section fully before writing any test.

### Before writing a test

1. Check `tests/registry.yaml` for an existing scenario covering the behavior
2. Check `tests/scenarios/<domain>.md` for the full scenario spec
3. If no scenario exists for the behavior: **STOP** — report the gap, do not invent a test

### MUST

- `@DisplayName` must start with the scenario ID: `"SCN-XXX-NNN: <exact title from scenario file>"`
- Domain-unit tests: zero Spring annotations (`@SpringBootTest`, `@Autowired`, `@MockBean` forbidden)
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`
- Run `./scripts/sync-registry.sh` after writing tests — commit updated `tests/registry.yaml` in the same PR
- Run `./gradlew gateSmoke` before opening a PR — it must pass

### MUST NOT

- Never modify files in `tests/scenarios/` — those are QA-authored specs; raise a comment if wrong
- Never use `@DirtiesContext` — use `IntegrationTestBase` (already handles truncation per test)
- Never assert only on mock invocation (`verify(dao).someMethod(...)`) without also asserting on observable output state
- Never assert only on a mock invocation for a 'Then' clause that describes enforcement or state change — also assert on the observable effect (the downstream call, state, or error) that the clause requires. Invocation proves the code ran; the effect proves it did the right thing. The `pitestBookingAuth` gate enforces this mechanically; this rule explains why.
- Never put more than one scenario in one test method
- Never write a test without a `SCN-*` `@DisplayName` — the gate rejects untraceable tests

### When a PIT survived mutation is assigned to you

1. Find it in `build/reports/pitest/index.html`
2. Identify which scenario file covers that behavior in `tests/scenarios/`
3. If a scenario covers it: the test assertion is wrong — fix it, not the production code
4. If no scenario covers it: report the gap — do not add a test without a scenario

### Quality gates

| Gate | Command | Blocks |
|---|---|---|
| Smoke | `./gradlew gateSmoke` | Merge to main — all Critical scenarios must be covered |
| Regression | `./gradlew gateRegression` | Deploy — all High scenarios + JaCoCo 80% + API contract valid |
| Full (nightly) | `./gradlew gateFull` | Alerts on mutation floor violations |

### Frontend testing

- Web: Vitest + React Testing Library
- Mobile: Jest + React Native Testing Library
- For changes touching **auth, payments, wallet, migrations, or SecurityConfig**: write both positive and negative tests and call it out in the PR description

## What Not to Do

- Don't gut or simplify `SecurityConfig.java` — subagents have broken it before
- Don't use the Postgres owner account (`POSTGRES_USER`) for runtime connections — use `APP_DB_USER`
- Don't add component libraries (MUI, Chakra, Ant Design) — the design system is Radix + Tailwind
- Don't hardcode secrets — use environment variables
- Don't bypass PgBouncer for runtime database connections
- Don't hand-write API types that should come from `@tasky/sdk`

## Branch Naming

```
agent/TASK-{id}-{slug}
```

## Commit Messages

```
type(scope): imperative summary
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`

AI commits must include:
```
Co-Authored-By: Pi <noreply@pi.dev>
```

---

## Deferred Mobile Screens

The following screens were deliberately excluded from the 2026-04-02 mobile design refresh
(`docs/superpowers/specs/2026-04-02-mobile-design-refresh-design.md`) to keep the initial
scope focused on primary user flows. A future agent should implement these as a follow-up.

**Figma file key:** `IljfnTQPkq7vpkmK1NN1NC`

### Tasker Verification & KYC (SCR-TASK-003–010)

| SCR-ID | Screen name | Figma node |
|---|---|---|
| SCR-TASK-003 | Verification Gate | 2:48043 |
| SCR-TASK-004 | Verification — Consent | 2:48173 |
| SCR-TASK-005 | Verification — ID Upload | 2:48121 |
| SCR-TASK-006 | Verification — DAN Fast-Path | 2:48235 |
| SCR-TASK-007 | Verification — Pending | 2:48291 |
| SCR-TASK-008 | Verification — Approved | 2:48725 |
| SCR-TASK-009 | Verification — Rejected | 2:48378 |
| SCR-TASK-010 | Verification Submitted — Success | 2:48440 |

### Credits & Payments — Phase 2 (SCR-P2-001–005)

| SCR-ID | Screen name | Figma node |
|---|---|---|
| SCR-P2-001 | Credits — Balance & Purchase | 2:47102 |
| SCR-P2-002 | Credits — QPay Payment | 2:47256 |
| SCR-P2-003 | Credits — Transaction History | 2:47304 |
| SCR-P2-004 | Credits — Low Balance Alert | 2:47446 |
| SCR-P2-005 | Referral — My Code & Stats | 2:47511 |

### Wallet, Escrow & Pro — Phase 3 (SCR-P3-001–005)

| SCR-ID | Screen name | Figma node |
|---|---|---|
| SCR-P3-001 | Wallet — Balance & Payouts | 2:47635 |
| SCR-P3-002 | Wallet — Request Payout | 2:47760 |
| SCR-P3-003 | Escrow — Payment Flow | 2:47831 |
| SCR-P3-004 | Subscription — Tasker Pro | 2:47888 |
| SCR-P3-005 | Instant Match — Tasker | 2:47950 |

### Not Yet Spec'd (specs must be written before implementation)

| SCR-ID | Screen name | Figma node |
|---|---|---|
| SCR-CUST-028 | Task Boost Options | 2:49248 |
| SCR-CUST-029 | Task Boost Payment | 2:49373 |
| SCR-TASK-019 | AI Profile Polish | 2:49423 |
| SCR-B2B-001 | Business Accounts List | 2:49485 |
| SCR-B2B-002 | Business Account Editor | 2:49562 |
| SCR-B2B-003 | Business Location Editor | 2:49723 |
| SCR-B2B-004 | Business Members | 2:49805 |
| SCR-B2B-005 | Post Task as Business | 2:50052 |
| SCR-B2B-006 | Business Tasks | 2:49919 |
| SCR-B2B-007 | Business Subscription Billing | 2:50106 |

To pick up this work: read the design spec, review each SCR-*.yaml in `docs/design/screen-specs/`,
and follow the three-source workflow described in the spec. B2B and unspec'd screens need
`docs/design/screen-specs/` entries written first (see `docs/design/prompts/generation-tracker.md`).
