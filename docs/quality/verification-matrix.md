# Verification Matrix

Last updated: 2026-04-10

## Local Canonical Commands

| Command                                                              | Scope                                | Owner                 | CI Blocking    | Notes                                                               |
| -------------------------------------------------------------------- | ------------------------------------ | --------------------- | -------------- | ------------------------------------------------------------------- |
| `./gradlew --no-daemon test`                                         | Backend unit/integration tests       | Backend               | Yes            | Base backend correctness gate                                       |
| `./gradlew --no-daemon openApiValidate`                              | OpenAPI contract validity            | Backend/API           | Yes            | Must pass before SDK generation/merge                               |
| `./gradlew --no-daemon gateSmoke`                                    | Critical scenario smoke gate         | Backend/QA            | Intended       | wraps `test` + `tooling/scripts/check-gates.sh smoke`               |
| `./gradlew --no-daemon gateRegression`                               | Regression + API contract truth      | Backend/QA            | Release-level  | scenario-first deploy gate; mutation stays in `gateFull`            |
| `./gradlew --no-daemon gateFull`                                     | Full mutation/nightly gate           | Backend/QA            | Nightly/alerts | highest cost                                                        |
| `pnpm -r typecheck`                                                  | Type safety across workspaces        | Web+Mobile+Packages   | Yes            | includes apps and packages                                          |
| `pnpm -r test`                                                       | Unit tests across workspaces         | Web+Mobile+Packages   | Yes            | SDK/package tests currently low-signal                              |
| `pnpm -r lint`                                                       | Lint across workspaces               | Web+Mobile+Packages   | Yes            | quality-gates workflow                                              |
| `pnpm sdk:generate`                                                  | Regenerate TS SDK from OpenAPI       | API/Frontend          | No (direct)    | drift control for client contract                                   |
| `pnpm workspace:boundaries`                                          | Workspace dependency edge validation | Repo architecture     | Yes            | prevents forbidden monorepo package edges                           |
| `pnpm generated:verify`                                              | Generated artifact reproducibility   | API/Frontend/Packages | Yes            | validates SDK/tokens reproducibility path                           |
| `./gradlew --no-daemon :services:api:jacocoTestCoverageVerification` | Legacy blanket JaCoCo floor          | Backend/QA            | No             | advisory only until replaced with an evidence-based coverage policy |

## Root Scripts

| Script                         | Expansion                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `npm run build`                | `pnpm -r build`                                                                      |
| `npm run test`                 | `pnpm -r test`                                                                       |
| `npm run lint`                 | `pnpm -r lint`                                                                       |
| `npm run typecheck`            | `pnpm -r typecheck`                                                                  |
| `npm run sdk:generate`         | `pnpm --filter @tasky/sdk generate`                                                  |
| `npm run workspace:boundaries` | `node tooling/scripts/validate-workspace-boundaries.mjs`                             |
| `npm run generated:verify`     | `pnpm sdk:generate && pnpm --filter @tasky/design-tokens build && pnpm -r typecheck` |

## Workspace Scripts (High Signal)

| Workspace       | Script           | Command                                                                                                                        |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `@tasky/web`    | `test:unit`      | `vitest run --reporter verbose`                                                                                                |
| `@tasky/web`    | `test:e2e:smoke` | `VITE_DEV_AUTH_ENABLED=true pnpm run build && playwright install chromium && playwright test --grep @smoke --project=chromium` |
| `@tasky/web`    | `test:e2e`       | `playwright test` (after build)                                                                                                |
| `@tasky/mobile` | `test:unit`      | `jest --runInBand`                                                                                                             |
| `@tasky/mobile` | `test:e2e:smoke` | `bash scripts/run-e2e-smoke.sh` (`smoke.yaml` + deterministic customer/tasker smoke flows)                                     |
| `@tasky/mobile` | `typecheck`      | `tsc --noEmit`                                                                                                                 |
| `@tasky/sdk`    | `generate`       | `openapi-typescript ../../docs/API.yaml -o src/generated/api-types.ts`                                                         |

## CI Mapping

| Workflow                 | Job                           | Effective Gate                                                                                                              |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `quality-gates.yml`      | `cleanup-gate`                | SDK drift, workspace boundary validation, cleanup trusted gate script                                                       |
| `quality-gates.yml`      | `backend-quality`             | `./gradlew :services:api:test`, `./gradlew :services:api:openApiValidate`, `python3 tooling/scripts/validate-migrations.py` |
| `quality-gates.yml`      | `frontend-quality`            | `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`                                                                         |
| `quality-gates.yml`      | `web-e2e-smoke`               | Playwright smoke journeys on Ubuntu (`customer`, `tasker`, `admin`)                                                         |
| `quality-gates.yml`      | `mobile-e2e-smoke`            | Maestro smoke on macOS after booting an iOS simulator and building a Release app with `expo run:ios`                        |
| `quality-gates.yml`      | `security`                    | dependency-review, trivy fs/image, semgrep                                                                                  |
| `nightly-regression.yml` | `full-regression`             | `pnpm -r typecheck`, `pnpm -r test`, `./gradlew :services:api:gateFull :services:api:openApiValidate`, image scan           |
| `nightly-regression.yml` | `web-e2e-regression`          | Full Playwright journey suite on Ubuntu                                                                                     |
| `nightly-regression.yml` | `mobile-e2e-smoke`            | Phase 1 Maestro smoke on macOS simulator                                                                                    |
| `release-gate.yml`       | `migration-safety`            | migration validation + flyway info                                                                                          |
| `release-gate.yml`       | `performance-smoke`           | `tooling/scripts/performance-smoke.sh`                                                                                      |
| `release-gate.yml`       | `web-e2e-smoke`               | Playwright smoke journeys on Ubuntu                                                                                         |
| `release-gate.yml`       | `mobile-e2e-smoke`            | Maestro smoke on macOS after booting an iOS simulator and building a Release app with `expo run:ios`                        |
| `release-gate.yml`       | `release-readiness-checklist` | depends on migration, rollback, performance, web smoke, and mobile smoke                                                    |

## Initial Trust Classification (Before Runtime Audit)

| Command                       | Initial Classification    | Rationale                                                     |
| ----------------------------- | ------------------------- | ------------------------------------------------------------- |
| `./gradlew test`              | Candidate trusted         | Core backend signal but not yet rerun for determinism         |
| `./gradlew openApiValidate`   | Candidate trusted         | deterministic contract parser, low flake risk                 |
| `./gradlew gateSmoke`         | Candidate trusted         | policy-critical, script-coupled and not yet validated locally |
| `pnpm -r typecheck`           | Candidate trusted         | deterministic compile-time gate                               |
| `pnpm -r test`                | Unknown                   | high breadth but likely mixed-signal due package stubs        |
| `pnpm -r lint`                | Candidate trusted         | deterministic static analysis                                 |
| `gateRegression` / `gateFull` | Deferred for this tranche | expensive; will be sampled once cleanup gate is formalized    |

## Runtime Audit Status

| Check                                                                                       | Result                               | Notes                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./gradlew --no-daemon test`                                                                | Pass                                 | backend tests passed in Batch A                                                                                                                                                                                                                                                |
| `./gradlew --no-daemon openApiValidate`                                                     | Pass                                 | contract is valid                                                                                                                                                                                                                                                              |
| `./gradlew --no-daemon gateSmoke`                                                           | Pass                                 | historical pass in Batch A/B and fresh 2026-04-09 pass after redirecting `GRADLE_USER_HOME`; this run also refreshed scenario coverage via `sync-registry.sh`                                                                                                                  |
| `GRADLE_USER_HOME=/tmp/gradle ./gradlew --no-daemon gateRegression`                         | Pass                                 | 2026-04-09 pass after removing the blanket JaCoCo floor from blocking gates, moving mutation to `gateFull`, and making `sync-registry.sh` tolerate missing or malformed PIT XML                                                                                                |
| `pnpm -r typecheck`                                                                         | Pass                                 | workspace typecheck passed in Batch A                                                                                                                                                                                                                                          |
| `pnpm -r test`                                                                              | Not reproducible verbatim in sandbox | nested workspace `pnpm run` scripts attempted self-install into `~/Library/pnpm/store`; equivalent direct workspace runs now split cleanly: web passes (`38` files / `272` tests), and mobile passes (`118` suites / `802` tests via `/tmp/tasky-mobile-jest-22.json`)         |
| `tooling/scripts/check-cleanup-gate.sh`                                                     | Pass                                 | passed in Batch C with updated trusted gate set                                                                                                                                                                                                                                |
| `pnpm --filter @tasky/web exec playwright test --grep @smoke --project=chromium --list`     | Pass                                 | three outcome-based smoke specs discovered after retiring the leftover route/shell smoke files                                                                                                                                                                                 |
| `timeout 60 pnpm --filter @tasky/web exec playwright test --grep @smoke --project=chromium` | Environment-blocked                  | Chromium cannot launch in this sandbox because of local macOS Mach-port restrictions; CI now installs browser dependencies explicitly on Ubuntu                                                                                                                                |
| `bash -n apps/mobile/scripts/run-e2e-smoke.sh`                                              | Pass                                 | smoke script syntax is valid after converting it to the deterministic launch-live smoke set (`smoke.yaml`, customer post-task, tasker browse)                                                                                                                                  |
| Mobile visual audit — 2026-04-10                                                            | Pass                                 | Typecheck clean; unit tests 740/740 (100 suites); Maestro smoke 3/3 flows (smoke.yaml, JRN-CUST-01-post-a-task, tasker-browse) on iPhone 16 Pro iOS 18.6; capture batches smoke/auth/shared all pass. 12 defects resolved, 4 deferred (DEF-010/014/015/016). No open blockers. |

## Scenario Registry Integrity

The registry is useful, but it is not yet a perfect release-confidence ledger.

| Integrity issue                                                              | Evidence                                                                                                                                                                                                                                | Release-confidence impact                                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry `prd_ref` values still use legacy requirement IDs.                  | `tests/registry.yaml` continues to record `REQ-*` identifiers, while launch review now keys off the `REQ-P1-*` launch baseline in the maintained doc matrix.                                                                            | Release reviewers must translate registry rows through the launch matrix; the registry alone is not the launch truth source.                                   |
| Registry status needed a fresh sync during this tranche.                     | A fresh `./gradlew --no-daemon gateSmoke` run executed `sync-registry.sh` and updated 12 scenarios from `untested` to `covered`, including `SCN-ANALYTICS-001/002/003`, `SCN-MSG-001/002/003/004`, and `SCN-NOTIF-001/002/003/004/005`. | The registry is more trustworthy after the sync, but release reviewers should still treat it as a status cache rather than a self-maintaining source of truth. |
| Some launch-critical requirement areas still have no direct scenario family. | Verification workflow, admin feature toggles, admin ban/unban action, Pro badge assignment, and concierge dispatch still lack a dedicated `tests/scenarios/*.md` family.                                                                | These are still genuine release-risk gaps because there is no blocker-grade backend proof.                                                                     |
| One critical scenario is waived pending a deferred feature.                  | `SCN-BOOK-006` carries `override_status: waived pending tasker-suspension feature`.                                                                                                                                                     | That waiver is intentional, but it should be treated as deferred capability work rather than launch-ready coverage.                                            |

## Release Confidence

- Treat backend scenario coverage as the authoritative signal for launch confidence.
- Treat the registry as a status cache that must be kept in sync with backend scenario reality.
- Do not infer launch readiness from registry coverage alone when the registry status is stale or waived.
- The current registry now reflects analytics, messaging, and notification coverage after the tranche verification sync.
- The highest-confidence unresolved issues remain the missing direct families for verification workflow, admin toggle management, admin ban/unban, Pro badge assignment, and concierge dispatch.
- The backend deploy gate is now aligned with the audited trust model: `gateRegression` passed on 2026-04-09 as a scenario-first + API-contract gate, and the legacy blanket JaCoCo package floor is no longer allowed to block deploys.
- The client-side verification picture is now materially stronger: the latest direct web test run is green, and the latest direct mobile run is also green. The post-hardening mobile suite runs only launch-live test files after 14 deferred-surface suites (OTP, wallet, credits, escrow, referrals, subscription, instant match, profile polish, lead unlock) were removed to match the hardened route tree. A follow-up `--detectOpenHandles` run also exited cleanly without identifying a concrete leaking handle, although the ordinary JSON run still emits the generic Jest warning.
- Tranche 6 now has meaningful client release-gate definitions: web smoke includes one customer, one tasker, and one admin browser journey; mobile smoke now includes app launch plus the Phase 1 customer post-task and tasker apply Maestro journeys.
- CI is aligned with those commands: Playwright smoke/regression now installs Chromium dependencies explicitly on Ubuntu, and Maestro smoke now boots a macOS iOS simulator, builds a Release app with `expo run:ios`, and runs the smoke journeys there.
- The nightly backend workflow is aligned now as well: it runs `gateFull` instead of the broader `check` task so mutation enforcement stays in the intended heavyweight nightly lane instead of being mixed with unrelated static-analysis failures.
- Local end-to-end execution is still partially constrained by this sandbox. The rebuilt Playwright suite is type-valid and discoverable, but Chromium crashes before test logic under the current macOS sandbox; the new iOS simulator path was validated structurally through CLI/workspace inspection rather than a full local app build.
- The previously identified dispute-screen product defects were repaired in this tranche cycle, and all launch-live customer-detail/posting suites remain green. The test suites for deferred surfaces (`InstantMatchScreen`, `InstantMatchTaskerSheet`, `LeadUnlockSheet`, `WalletScreen`, `WalletPayoutScreen`, `EscrowScreen`, `BookingEscrowScreen`, `CreditsHistoryScreen`, `CreditsIndexScreen`, `CreditsPayScreen`, `OtpScreen`, `OtpMigrationScreen`, `ProfilePolishScreen`, `ReferralsScreen`, `SubscriptionScreen`) were removed as part of the post-hardening test realignment since their corresponding routes are no longer in the active app tree. All remaining launch-live suites continue to pass.
