# Changelog

## 2026-04-09
- **Repository hardening**: Archived stale superpowers docs, removed tracked test-results.json, archived 6 non-canonical Maestro flows, fixed stale references in ARCHITECTURE.md and quality docs.
- **CI and verification gates**: Removed dead self-verify pipeline from release-gate.yml, made mobile E2E scripts require Maestro (no silent Jest fallback), aligned verification matrix with actual repo state.
- **Backend test trust**: Closed all 13 untested scenarios across analytics, messaging, notification, and booking domains (104/104 scenarios now covered). Synced registry.
- **Web contract and E2E**: Fixed CursorPage type to match API contract (added has_more, removed prev), added Playwright auth-guard, customer, and tasker E2E suites (15 tests). Fixed all 272 web unit tests.
- **Mobile routing**: Fixed customer post-auth routing to land in tabs layout (restores bottom navigation).
- **Mobile UI**: Converted SplitCard header from fixed height to minHeight for text overflow safety.
- **Mobile auth onboarding routing**: Restored first-login post-auth routing so new mobile sessions enter onboarding before landing in customer/tasker home, with focused auth routing regressions.

## 2026-04-04
- **Mobile NativeWind foundation + token/shell consolidation**: Completed architecture-first mobile styling migration to shared NativeWind/token boundaries, moved route-level shell ownership to shared containers/action bars, removed most route-local raw input primitives, added lint guardrails for route primitive imports (with OTP exception), stabilized auth/env test behavior, and re-verified mobile suites (`typecheck`, `lint`, full `test`).

## 2026-04-03
- **Infrastructure & Mobile Navigation**: Remediated Docker Compose environment variables for PgBouncer/Flyway connectivity and standardized mobile application navigation by migrating customer/tasker screen headers to a native Expo Router stack-based configuration.

## 2026-04-02
- **Booking confirmation sources**: Added API-first booking intents for rebook confirmation (`REBOOK`) with phase-gated instant-match deferment, wired web/mobile source-aware confirmation flows, and updated SDK/test coverage.
- **Maintenance-mode realignment**: Enforced monorepo architecture boundaries, rehabilitated cleanup-critical deterministic tests, archived superseded greenfield superpowers plans/specs, and ratified the maintenance operating model plus trusted verification gates.

## 2026-03-28
- **Scaffolding restructure**: Replaced greenfield multi-agent scaffolding with lean maintenance-mode structure. Deleted ~6,000 lines of ticket specs, self-verify pipeline, and agent coordination scripts. Added simple task management (`scripts/task.sh`), rewrote AGENTS.md and CLAUDE.md, simplified CI to 3 parallel jobs.
