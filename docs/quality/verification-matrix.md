# Verification Matrix

Last updated: 2026-04-02

## Local Canonical Commands

| Command | Scope | Owner | CI Blocking | Notes |
|---|---|---|---|---|
| `./gradlew --no-daemon test` | Backend unit/integration tests | Backend | Yes | Base backend correctness gate |
| `./gradlew --no-daemon openApiValidate` | OpenAPI contract validity | Backend/API | Yes | Must pass before SDK generation/merge |
| `./gradlew --no-daemon gateSmoke` | Critical scenario smoke gate | Backend/QA | Intended | wraps `test` + `scripts/check-gates.sh smoke` |
| `./gradlew --no-daemon gateRegression` | Regression + coverage + mutation subset | Backend/QA | Release-level | depends on `pitestBookingAuth` |
| `./gradlew --no-daemon gateFull` | Full mutation/nightly gate | Backend/QA | Nightly/alerts | highest cost |
| `pnpm -r typecheck` | Type safety across workspaces | Web+Mobile+Packages | Yes | includes apps and packages |
| `pnpm -r test` | Unit tests across workspaces | Web+Mobile+Packages | Yes | SDK/package tests currently low-signal |
| `pnpm -r lint` | Lint across workspaces | Web+Mobile+Packages | Yes | quality-gates workflow |
| `pnpm sdk:generate` | Regenerate TS SDK from OpenAPI | API/Frontend | No (direct) | drift control for client contract |

## Root Scripts

| Script | Expansion |
|---|---|
| `npm run build` | `pnpm -r build` |
| `npm run test` | `pnpm -r test` |
| `npm run lint` | `pnpm -r lint` |
| `npm run typecheck` | `pnpm -r typecheck` |
| `npm run sdk:generate` | `pnpm --filter @tasky/sdk generate` |

## Workspace Scripts (High Signal)

| Workspace | Script | Command |
|---|---|---|
| `@tasky/web` | `test:unit` | `vitest run --reporter verbose` |
| `@tasky/web` | `test:e2e` | `playwright test` (after build) |
| `@tasky/mobile` | `test:unit` | `jest --runInBand` |
| `@tasky/mobile` | `typecheck` | `tsc --noEmit` |
| `@tasky/sdk` | `generate` | `openapi-typescript ../../docs/API.yaml -o src/generated/api-types.ts` |

## CI Mapping

| Workflow | Job | Effective Gate |
|---|---|---|
| `quality-gates.yml` | `backend-quality` | `./gradlew test`, `./gradlew openApiValidate`, `python3 scripts/validate-migrations.py` |
| `quality-gates.yml` | `frontend-quality` | `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test` |
| `quality-gates.yml` | `security` | dependency-review, trivy fs/image, semgrep |
| `nightly-regression.yml` | `full-regression` | `pnpm -r typecheck`, `pnpm -r test`, `./gradlew check openApiValidate`, image scan |
| `release-gate.yml` | `migration-safety` | migration validation + flyway info |
| `release-gate.yml` | `performance-smoke` | `scripts/performance-smoke.sh` |
| `release-gate.yml` | `release-readiness-checklist` | artifact schema validation |

## Initial Trust Classification (Before Runtime Audit)

| Command | Initial Classification | Rationale |
|---|---|---|
| `./gradlew test` | Candidate trusted | Core backend signal but not yet rerun for determinism |
| `./gradlew openApiValidate` | Candidate trusted | deterministic contract parser, low flake risk |
| `./gradlew gateSmoke` | Candidate trusted | policy-critical, script-coupled and not yet validated locally |
| `pnpm -r typecheck` | Candidate trusted | deterministic compile-time gate |
| `pnpm -r test` | Unknown | high breadth but likely mixed-signal due package stubs |
| `pnpm -r lint` | Candidate trusted | deterministic static analysis |
| `gateRegression` / `gateFull` | Deferred for this tranche | expensive; will be sampled once cleanup gate is formalized |

## Runtime Audit Status (Task 2)

| Check | Result | Notes |
|---|---|---|
| `./gradlew --no-daemon test` | Pass | backend tests passed in Batch A |
| `./gradlew --no-daemon openApiValidate` | Pass | contract is valid |
| `./gradlew --no-daemon gateSmoke` | Pass (2/2 runs) | deterministic pass in Batch A and B |
| `pnpm -r typecheck` | Pass | workspace typecheck passed in Batch A |
| `pnpm -r test` | Fail (2/2 runs) | deterministic `@tasky/web` failures, see `test-trust-audit.md` |
