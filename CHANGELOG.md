# Changelog

## 2026-04-09
- **Verification selfie + ₮20,000 minimum alignment**: Realigned PRD/API/backend/mobile/web boundaries to require selfie-based verification submission, raised the authoritative task budget minimum to ₮20,000 across validation layers, regenerated the SDK, and added boundary regression coverage.

## 2026-04-04
- **Mobile NativeWind foundation + token/shell consolidation**: Completed architecture-first mobile styling migration to shared NativeWind/token boundaries, moved route-level shell ownership to shared containers/action bars, removed most route-local raw input primitives, added lint guardrails for route primitive imports (with OTP exception), stabilized auth/env test behavior, and re-verified mobile suites (`typecheck`, `lint`, full `test`).

## 2026-04-03
- **Infrastructure & Mobile Navigation**: Remediated Docker Compose environment variables for PgBouncer/Flyway connectivity and standardized mobile application navigation by migrating customer/tasker screen headers to a native Expo Router stack-based configuration.

## 2026-04-02
- **Booking confirmation sources**: Added API-first booking intents for rebook confirmation (`REBOOK`) with phase-gated instant-match deferment, wired web/mobile source-aware confirmation flows, and updated SDK/test coverage.
- **Maintenance-mode realignment**: Enforced monorepo architecture boundaries, rehabilitated cleanup-critical deterministic tests, archived superseded greenfield superpowers plans/specs, and ratified the maintenance operating model plus trusted verification gates.

## 2026-03-28
- **Scaffolding restructure**: Replaced greenfield multi-agent scaffolding with lean maintenance-mode structure. Deleted ~6,000 lines of ticket specs, self-verify pipeline, and agent coordination scripts. Added simple task management (`scripts/task.sh`), rewrote AGENTS.md and CLAUDE.md, simplified CI to 3 parallel jobs.
