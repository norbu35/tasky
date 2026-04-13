# Agent Instructions

## Serena — LSP-First Navigation

Call `mcp__serena__initial_instructions` ONCE at session start. Use Serena for all code navigation — not grep_search, glob, or run_shell_command:

| Task | Tool |
|------|------|
| Symbol search | `mcp__serena__jet_brains_find_symbol` |
| File overview | `mcp__serena__jet_brains_get_symbols_overview` |
| References | `mcp__serena__jet_brains_find_referencing_symbols` |
| Declaration | `mcp__serena__jet_brains_find_declaration` |
| Implementations | `mcp__serena__jet_brains_find_implementations` |

grep_search / glob = fallback only when Serena returns empty.

## Commands

| Task | Command |
|------|---------|
| Backend test (domain) | `./gradlew test --tests "mn.tasky.DOMAIN.*"` |
| Backend test (class) | `./gradlew test --tests "mn.tasky.DOMAIN.ClassName"` |
| Gate (required pre-PR) | `./gradlew gateSmoke` |
| Validate API contract | `./gradlew openApiValidate` |
| Regen TypeScript SDK | `pnpm sdk:generate` |
| Typecheck all | `pnpm -r typecheck` |
| Frontend tests | `pnpm -r test` |

Always use `./gradlew`, never system `gradle`.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, JDBI 3 (explicit SQL — not JPA), PostgreSQL + PostGIS, Flyway
- **Web:** React 18 + TypeScript + Vite, Radix UI + Tailwind (shadcn conventions, no CLI)
- **Mobile:** React Native (Expo) + TypeScript + shared design tokens
- **API client:** consume `@tasky/sdk` (generated from `docs/API.yaml`) — never hand-write fetch types

## Workflow

- Read `docs/ARCHITECTURE.md` and `docs/API.yaml` for the relevant area before touching code
- Plans live in `docs/plans/` — pick the next tranche, implement as a vertical slice, open one PR
- **Endpoint changes:** update `docs/API.yaml` first → `pnpm sdk:generate` → implement backend + frontend
- Branch: `agent/TASK-{id}-{slug}` — update `CHANGELOG.md` before opening a PR

## Backend Testing

Before writing any test: check `tests/registry.yaml` for an existing scenario. Read `tests/scenarios/<domain>.md`. If no scenario covers the behavior → **STOP** and report; do not invent a test.

- `@DisplayName` must be `"SCN-XXX-NNN: <exact title from scenario file>"`
- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`
- After writing tests: run `./services/api/scripts/sync-registry.sh` and commit updated `tests/registry.yaml`
- Never modify `tests/scenarios/` — QA-authored; comment if wrong
- Never use `@DirtiesContext` — `IntegrationTestBase` handles truncation
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it → report gap

| Gate | Command | Blocks |
|------|---------|--------|
| Smoke | `./gradlew gateSmoke` | Merge to main |
| Regression | `./gradlew gateRegression` | Deploy |
| Full | `./gradlew gateFull` | Nightly alerts |

Frontend: Web uses Vitest + RTL; Mobile uses Jest + RNTL. For auth / payments / wallet / migrations / SecurityConfig changes: write positive and negative tests and call it out in the PR.

## Guard Rails

- **SecurityConfig.java** — do not simplify, remove filters, or restructure; subagents have broken this before
- **DB user** — runtime uses `APP_DB_USER`; never `POSTGRES_USER` (owner account)
- **PgBouncer** — never bypass for runtime connections
- **Component libraries** — Radix + Tailwind only; no MUI, Chakra, or Ant Design
- **Secrets** — environment variables only; never hardcode

## Commit Attribution

```
Co-Authored-By: <agent name and noreply address>
```

## Deferred Work

Mobile screens deferred from 2026-04-02 refresh: `docs/plans/deferred-mobile-screens.md`
