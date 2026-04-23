# Tasky Agent Operating Contract

This is the canonical repo-level instruction file for agents.

**Status:** Canonical

## Default Discovery Path

For non-trivial work, read in this order unless a more specific local `AGENTS.md` narrows the surface:

1. `docs/PRD.md`
2. `docs/STRATEGY.md`
3. relevant `docs/maintenance/*.md` policy docs
4. the smallest relevant derived architecture doc routed by `docs/architecture/AGENTS.md`
5. `docs/openapi/AGENTS.md` + `docs/openapi/openapi.yaml` only for request/response contract work
6. design docs only as derived UX or copy detail

Higher documents govern lower documents. Architecture describes implementation design; it does not silently rewrite
product intent. `archive/**` is historical only.

## Discovery Path By Working Area

| Working area                       | Read next after PRD / Strategy / maintenance policy            |
| ---------------------------------- | -------------------------------------------------------------- |
| Whole repo or shared contract work | `docs/architecture/AGENTS.md`                                  |
| `docs/openapi/**`                  | `docs/openapi/AGENTS.md`                                       |
| `services/api/**`                  | `services/api/AGENTS.md`, then the affected module `AGENTS.md` |
| `apps/web/**`                      | `apps/web/AGENTS.md`                                           |
| `apps/mobile/**`                   | `apps/mobile/AGENTS.md`                                        |
| `packages/core/**`                 | `packages/core/AGENTS.md`                                      |
| `packages/design-tokens/**`        | `packages/design-tokens/AGENTS.md`                             |
| `packages/sdk/**`                  | `packages/sdk/AGENTS.md`                                       |
| `packages/test-utils/**`           | `packages/test-utils/AGENTS.md`                                |
| `tooling/skills/**`                | `tooling/skills/AGENTS.md`                                     |
| `tooling/**`                       | `tooling/AGENTS.md`                                            |

Read the nearest local `AGENTS.md` first when you are already inside a surfaced area. On conflict, the more specific
surface wins unless it contradicts this file or a higher governing doc.

## Code Navigation

### Serena (preferred when available)

When Serena is connected, use it for symbol search, references, declarations, implementations, type hierarchies, and
safe refactors.

If Serena returns empty results or errors, fall back to grep/glob.

### Repomix (broad context only)

Use `repomix` when you need broad repository context and semantic tools are unavailable or too narrow.

```bash
npx repomix
npx repomix --include "services/api/**,docs/openapi/**,docs/API.yaml,docs/architecture/common.md,docs/architecture/api.md"
npx repomix --include "apps/web/**,packages/core/**,packages/design-tokens/**,packages/sdk/**,packages/test-utils/**,docs/openapi/**,docs/API.yaml,docs/architecture/common.md,docs/architecture/web.md,docs/architecture/shared-frontend.md,apps/web/AGENTS.md,packages/core/AGENTS.md,packages/design-tokens/AGENTS.md,packages/sdk/AGENTS.md,packages/test-utils/AGENTS.md"
npx repomix --include "apps/mobile/**,packages/core/**,packages/design-tokens/**,packages/sdk/**,packages/test-utils/**,docs/openapi/**,docs/API.yaml,docs/architecture/common.md,docs/architecture/mobile.md,docs/architecture/shared-frontend.md,apps/mobile/AGENTS.md,packages/core/AGENTS.md,packages/design-tokens/AGENTS.md,packages/sdk/AGENTS.md,packages/test-utils/AGENTS.md"
```

Do not use repomix for narrow symbol lookups that Serena can answer.

## Core Commands

Frontend tasks run through Turborepo via `pnpm <task>`. Backend tasks use `./gradlew` and never system `gradle`.

## Repo Skills

Reusable repo-owned agent workflows live under `tooling/skills/**`.

- Skills must remain harness-agnostic. Any harness should be able to use them by reading the nearest `SKILL.md` and running bundled scripts directly.
- For doc-surface drift or `validate-doc-claims.py` failures, use `tooling/skills/doc-claims-remediation/SKILL.md`.

## Workflow Rules

- Read the smallest relevant governing and architecture surfaces before editing code.
- Follow the branch flow: `feature/*` -> `staging` -> `main`.
- Merge to `staging` for integration feedback; promote `staging` to `main` only after full local verification passes.
- Do not use `--no-verify` (or equivalent hook bypass) for pushes that target `staging` or `main`.
- If the API changes, update `docs/openapi/**` first, regenerate `docs/API.yaml`, then regenerate `@tasky/sdk`, then implement.
- If a Flyway migration adds, drops, or renames a column or table, run `python3 tooling/scripts/governance/validate-schema-parity.py --update-expected` and commit the updated `tooling/config/expected-schema.json`.
- Use the active issue or approved execution brief as the task source. Do not rely on archived plan directories.
- Keep changes vertical and reviewable.
- Update `CHANGELOG.md` when the repo convention requires it.

## Verification Model

Use the right gate for the claim you are making.

| Level                         | Command / source                                                                                                                                                  | Meaning                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Local baseline                | `pnpm verify:cleanup`, `:services:api:test`, `:services:api:openApiValidate`, `pnpm -r typecheck`, `pnpm -r test`                                                 | Minimum local confidence before claiming completion      |
| Local boundary / drift checks | `:services:api:architectureTest`, `pnpm repo:workspace:boundaries`, `pnpm contract:sdk:drift`, `python3 tooling/scripts/governance/validate-schema-parity.py`     | Use when the change touches those surfaces               |
| Local push gate (`main`)      | `.husky/pre-push` runs `pnpm verify:cleanup`, `pnpm verify:ops`, `pnpm verify:backend`, `pnpm verify:frontend`, `pnpm verify:scenario:smoke`, `pnpm verify:drift` | Required before any push to `main`                       |
| Local push gate (non-`main`)  | `.husky/pre-push` lightweight path; optional `RUN_LIGHT_PREPUSH_ON_NON_MAIN=1` for cleanup+ops                                                                    | Fast iteration on `feature/*` and `staging`              |
| Merge CI gate                 | `quality-gates.yml`                                                                                                                                               | Required merge-branch verification on `main` / `staging` |
| Release gate                  | `release-gate.yml`                                                                                                                                                | Deploy-time enforcement                                  |
| Nightly regression            | `./gradlew gateRegression`, `./gradlew gateFull`                                                                                                                  | Broader or scheduled confidence, not the default PR gate |

Do not describe `./gradlew gateSmoke` as the singular pre-merge source of truth. It remains a useful local smoke gate,
but CI and release workflows are the governing enforcement surfaces.

## Backend Testing Rules

Before writing any backend test: check `tests/registry.yaml` for an existing scenario. Read `tests/scenarios/<domain>.md`.
If no scenario covers the behavior, stop and report the gap unless you are the designated scenario curator for the current execution brief.

- `@DisplayName` must be `"SCN-XXX-NNN: <exact title from scenario file>"`
- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`
- Scenario curation is single-owner work. Only the designated scenario curator for the current execution brief may edit `tests/scenarios/**`; all implementation agents must otherwise treat it as read-only.
- Scenario curation must reconcile the active baseline from `docs/PRD.md`, `docs/STRATEGY.md`, `docs/ROLLOUT_PHASES.md`, active `docs/openapi/**`, and active `docs/design/**` before test-writing slices begin.
- Obsolete tests tied to removed or future-phase behavior may be deleted once the active scenario set no longer covers that behavior.
- After scenario curation or writing tests: run `./services/api/scripts/sync-registry.sh` and commit updated `tests/registry.yaml`
- Never use `@DirtiesContext`
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it, report the gap

| Gate       | Command                    | Blocks                        |
| ---------- | -------------------------- | ----------------------------- |
| Smoke      | `./gradlew gateSmoke`      | fast local confidence         |
| Regression | `./gradlew gateRegression` | nightly / extended validation |
| Full       | `./gradlew gateFull`       | full suite / mutation testing |

Frontend: Web uses Vitest + RTL; Mobile uses Jest + RNTL. For auth, payments, wallet, migrations, or
`SecurityConfig` changes, write positive and negative tests and call them out in the PR.

## Guard Rails

- `SecurityConfig.java` is security-critical. Do not simplify, remove filters, or restructure it casually.
- Runtime DB uses `APP_DB_USER`, not `POSTGRES_USER`.
- Do not bypass PgBouncer for runtime connections.
- Web primitives remain Radix + Tailwind only.
- Mobile primitives remain native and token-driven.
- Secrets belong in environment variables only.

## Security-Critical Files

| File                             | Risk if changed carelessly                             |
| -------------------------------- | ------------------------------------------------------ |
| `SecurityConfig.java`            | filter-chain order, role enforcement, public path list |
| `JwtAuthenticationFilter.java`   | token validation and blacklist order                   |
| `JwtTokenService.java`           | signing, validation, jti stamping                      |
| `TokenBlacklistService.java`     | revocation TTL and logic                               |
| `StompRateLimitInterceptor.java` | websocket DoS protection                               |
| `ChannelInterceptorConfig.java`  | STOMP auth and subscription authorization              |
| `apps/web/Caddyfile.production`  | CSP widening can open XSS vectors                      |

For any of these files: read the current body before editing, verify the relevant gate, and call the change out
explicitly in the PR.
