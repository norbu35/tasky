# Agent Instructions

## Code Navigation

### Serena (semantic, preferred when available)

When Serena is connected (requires JetBrains IDE running with the project open), use its semantic tools for all code navigation — symbol search, references, declarations, implementations, type hierarchies, and refactors (rename, move, inline, safe-delete). These understand the AST, types, and cross-file references.

If Serena returns empty results or errors, fall back to grep/glob.

Client-specific Serena setup and tool names are documented in each client's own instructions:

- **Claude Code** → `CLAUDE.md`
- **pi** → Serena tools are auto-discovered by the `.pi/extensions/serena` extension

### Repomix (full-context snapshot)

`repomix` packs the entire codebase into a single `repomix-output.xml` file. Use it when you need broad context that semantic tools can't efficiently provide — architecture overviews, cross-cutting concerns, or when the IDE/Serena isn't available.

```bash
npx repomix                                 # full codebase
npx repomix --include "services/api/**"      # backend only
npx repomix --include "apps/web/**"          # web only
```

Do **not** use repomix when Serena can answer your question with a targeted symbol or reference lookup. Repomix is expensive in tokens; Serena is surgical.

### Decision guide

| Situation                                           | Use                                          |
| --------------------------------------------------- | -------------------------------------------- |
| Find a symbol, navigate code, trace references      | Serena                                       |
| Rename / move / delete a symbol across the codebase | Serena refactoring tools                     |
| Get a file's top-level symbols                      | Serena `get_symbols_overview`                |
| Understand architecture you've never seen before    | Repomix (scoped), then Serena for drill-down |
| IDE not running / Serena unavailable                | Repomix or grep/glob                         |
| Quick grep for a string pattern                     | `bash` grep or Serena `search_for_pattern`   |
| Edit non-code files (YAML, Markdown, configs)       | Native file tools (edit/write)               |

## Commands

Frontend tasks use Turborepo (`pnpm <task>` delegates to `turbo`). Backend tasks use Gradle directly.

| Task                   | Command                                              |
| ---------------------- | ---------------------------------------------------- |
| Backend test (domain)  | `./gradlew test --tests "mn.tasky.DOMAIN.*"`         |
| Backend test (class)   | `./gradlew test --tests "mn.tasky.DOMAIN.ClassName"` |
| Gate (required pre-PR) | `./gradlew gateSmoke`                                |
| Validate API contract  | `./gradlew openApiValidate`                          |
| Regen TypeScript SDK   | `pnpm sdk:generate`                                  |
| Typecheck all          | `pnpm typecheck`                                     |
| Build all              | `pnpm build`                                         |
| Test all (frontend)    | `pnpm test`                                          |
| Lint all               | `pnpm lint`                                          |
| Format all             | `pnpm format`                                        |
| Check formatting       | `pnpm format:check`                                  |
| Coverage               | `pnpm test:coverage`                                 |
| Workspace boundaries   | `pnpm workspace:boundaries`                          |

Always use `./gradlew`, never system `gradle`.
Task graph and caching are configured in `turbo.json`.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, JDBI 3 (explicit SQL — not JPA), PostgreSQL + PostGIS, Flyway
- **Web:** React 19 + TypeScript + Vite 8, Radix UI + Tailwind 4 (shadcn conventions, no CLI)
- **Mobile:** React Native (Expo) + TypeScript + shared design tokens
- **API client:** consume `@tasky/sdk` (generated from `docs/API.yaml`) — never hand-write fetch types

### Module System

`apps/mobile` intentionally omits `"type": "module"` in its `package.json`. Expo's Metro bundler
and `babel-preset-expo` expect CommonJS module resolution. All other workspaces use ESM
(`"type": "module"`). Do not add `"type": "module"` to the mobile app without verifying
Metro/Expo compatibility.

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

| Gate       | Command                    | Blocks         |
| ---------- | -------------------------- | -------------- |
| Smoke      | `./gradlew gateSmoke`      | Merge to main  |
| Regression | `./gradlew gateRegression` | Deploy         |
| Full       | `./gradlew gateFull`       | Nightly alerts |

Frontend: Web uses Vitest + RTL; Mobile uses Jest + RNTL. For auth / payments / wallet / migrations / SecurityConfig changes: write positive and negative tests and call it out in the PR.

### Testing

- **Framework:** Vitest for web and packages; Jest (via jest-expo) for mobile. Do not mix frameworks within a workspace.
- **Shared test utilities:** `@tasky/test-utils` provides `createTestQueryClient()`,
  `renderWithProviders()`, and common mocks (Reanimated, AsyncStorage, SafeAreaContext).
  Import from `@tasky/test-utils` or `@tasky/test-utils/mocks` — do not duplicate mocks.
- **Coverage floors:** 60% lines, 55% functions/branches, 60% statements (enforced per-workspace).
  `packages/core` starts at 0% until tests are written.
- **Generated packages** (`sdk`, `design-tokens`): Use `tsc --noEmit` as test script.
  Unit tests are not needed for generated/static code.

## Guard Rails

- **SecurityConfig.java** — do not simplify, remove filters, or restructure; subagents have broken this before
- **DB user** — runtime uses `APP_DB_USER`; never `POSTGRES_USER` (owner account)
- **PgBouncer** — never bypass for runtime connections
- **Component libraries** — Radix + Tailwind only; no MUI, Chakra, or Ant Design
- **Secrets** — environment variables only; never hardcode

## Security Compliance

### Security-critical files — do not restructure without a security review

| File                             | Risk if changed carelessly                                 |
| -------------------------------- | ---------------------------------------------------------- |
| `SecurityConfig.java`            | Filter chain order, role enforcement, public path list     |
| `JwtAuthenticationFilter.java`   | Token validation, blacklist check, ban enforcement order   |
| `JwtTokenService.java`           | Token signing, iss/aud validation, jti stamping            |
| `TokenBlacklistService.java`     | Revocation logic; eviction TTL must match access token TTL |
| `StompRateLimitInterceptor.java` | WebSocket rate limit; removing breaks DoS protection       |
| `ChannelInterceptorConfig.java`  | STOMP auth, subscription authorization, interceptor order  |
| `Caddyfile.production`           | CSP header; editing `script-src` can open XSS vectors      |

For any of these files: **read the current body before editing**, verify the compile gate, and call it out explicitly in the PR.

### Token revocation

To revoke an access token explicitly (e.g., on user ban, admin logout, or compromise):

```java
// Inject TokenBlacklistService and call:
tokenBlacklistService.revoke(principal.jti());
```

The jti is available from `JwtPrincipal.jti()` on any authenticated request. The blacklist entry auto-expires after 15 minutes (matching the access token TTL). There is no persistence across restarts — if the server restarts, previously-revoked tokens resume working until their natural expiry. For persistent revocation across restarts, use the existing `userDao.updateStatusAndSuspensionEnd(..., "BANNED", ...)` path, which is checked per-request via the Caffeine-cached `currentUserStatus`.

### CSP maintenance

The `Content-Security-Policy` header lives in `apps/web/Caddyfile.production`. When adding a new external script or stylesheet:

1. Add the origin to the appropriate directive (`script-src`, `style-src`, `connect-src`, etc.)
2. If loading a **static asset** (pinnable hash): compute `sha256-<base64>` and add it to `script-src` instead of trusting the whole domain
3. For inline scripts in `apps/web/index.html`: recompute the hash after any change:
   ```bash
   python3 -c "
   import hashlib, base64
   with open('apps/web/index.html') as f: content = f.read()
   start = content.index('<script>') + len('<script>')
   end = content.index('</script>')
   print('sha256-' + base64.b64encode(hashlib.sha256(content[start:end].encode()).digest()).decode())
   "
   ```
4. Never add `'unsafe-eval'` or widen `default-src`

### Security testing requirements

For changes to auth, payments, wallet, SecurityConfig, or any file in the security-critical list above: write **both positive and negative tests** and include them in the PR. Specifically:

- **Role enforcement**: test that the wrong role gets 403, not just that the right role gets 200
- **Token blacklist**: test that a revoked jti is rejected with `TOKEN_REVOKED`
- **WebSocket rate limit**: test that the 31st message in a window is rejected

Frontend: SecurityConfig and auth flow changes require `test:e2e:smoke` to pass before merge.

## Commit Attribution

```
Co-Authored-By: <agent name and noreply address>
```

## Deferred Work

Mobile screens deferred from 2026-04-02 refresh: see `docs/plans/` (archived).
