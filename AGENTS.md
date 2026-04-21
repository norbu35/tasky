# Tasky Agent Operating Contract

This is the canonical repo-level instruction file for agents.

## Discovery Path

| Working area                       | Read next                                                      |
| ---------------------------------- | -------------------------------------------------------------- |
| Whole repo or shared contract work | `docs/architecture/AGENTS.md`                                  |
| `services/api/**`                  | `services/api/AGENTS.md`, then the affected module `AGENTS.md` |
| `apps/web/**`                      | `apps/web/AGENTS.md`                                           |
| `apps/mobile/**`                   | `apps/mobile/AGENTS.md`                                        |
| `tooling/agent/**`                 | `tooling/agent/AGENTS.md`                                      |

Pull in `docs/architecture/*.md` for system-wide context and `docs/API.yaml` when contracts change. On conflict, the more specific surface wins unless it contradicts this file.

## Code Navigation

### Serena (preferred when available)

When Serena is connected, use it for symbol search, references, declarations, implementations, type hierarchies, and safe refactors.

If Serena returns empty results or errors, fall back to grep/glob.

### Repomix (broad context only)

Use `repomix` when you need broad repository context and semantic tools are unavailable or too narrow.

```bash
npx repomix
npx repomix --include "services/api/**,docs/architecture/common.md,docs/API.yaml"
npx repomix --include "apps/web/**,docs/architecture/common.md,docs/architecture/web.md,apps/web/AGENTS.md"
npx repomix --include "apps/mobile/**,docs/architecture/common.md,docs/architecture/mobile.md,apps/mobile/AGENTS.md"
```

Do not use repomix for narrow symbol lookups that Serena can answer.

## Core Commands

Frontend tasks run through Turborepo via `pnpm <task>`. Backend tasks use `./gradlew` — never system `gradle`. The required pre-PR gate is `./gradlew gateSmoke`. See `package.json` scripts and `docs/architecture/common.md § 8` for the full set.

## Workflow Rules

- Read the smallest relevant architecture document before editing code.
- If the API changes, update `docs/API.yaml` first, then regenerate `@tasky/sdk`, then implement.
- Use the active issue or approved execution brief as the task source. Do not rely on archived plan directories.
- Keep changes vertical and reviewable.
- Update `CHANGELOG.md` when the repo convention requires it.

## Backend Testing Rules

Before writing any backend test: check `tests/registry.yaml` for an existing scenario. Read `tests/scenarios/<domain>.md`. If no scenario covers the behavior, stop and report the gap.

- `@DisplayName` must be `"SCN-XXX-NNN: <exact title from scenario file>"`
- Domain-unit tests: no `@SpringBootTest`, `@Autowired`, or `@MockBean`
- Mock only external boundaries: `FacebookGraphClient`, `FirebasePushProvider`, `S3StorageService`
- After writing tests: run `./services/api/scripts/sync-registry.sh` and commit updated `tests/registry.yaml`
- Never modify `tests/scenarios/` directly
- Never use `@DirtiesContext`
- PIT survived mutation: fix the assertion, not production code; if no scenario covers it, report the gap

| Gate       | Command                    | Blocks         |
| ---------- | -------------------------- | -------------- |
| Smoke      | `./gradlew gateSmoke`      | merge to main  |
| Regression | `./gradlew gateRegression` | deploy         |
| Full       | `./gradlew gateFull`       | nightly alerts |

Frontend: Web uses Vitest + RTL; Mobile uses Jest + RNTL. For auth, payments, wallet, migrations, or `SecurityConfig` changes, write positive and negative tests and call them out in the PR.

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

For any of these files: read the current body before editing, verify the relevant gate, and call the change out explicitly in the PR.
