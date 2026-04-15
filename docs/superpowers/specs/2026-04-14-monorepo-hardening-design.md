# Monorepo Hardening — Structure, Scaffolding & Config

**Date:** 2026-04-14
**Status:** Approved
**Scope:** Everything surrounding the codebase — config, scaffolding, tooling, DX. Excludes CI/CD pipeline wiring (separate spec) and code fixes from stricter rules (separate task).
**Organization:** By concern (horizontal slices). Each section is self-contained and independently implementable.

---

## 1. Directory & Git Hygiene

**Problem:** Stale artifacts at repo root, missing `.gitattributes`, `.gitignore` gaps, misplaced scripts.

| Item                        | Detail                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delete stale root artifacts | `baseline.json`, `postflight-cascade.json`, `postflight.json`, `test-results.json`, `apps/mobile/out.css` — generated files that shouldn't be tracked                      |
| Relocate misplaced scripts  | `scripts/scrape-unegui*.py`, `scripts/scrape-unegui-cron.sh` → `research/unegui-scraper/`; `analyze_i18n.py` → `tooling/scripts/`; delete empty `scripts/` dir             |
| Add `.gitattributes`        | Line ending normalization (`* text=auto`), binary markers for images/fonts, lockfile merge strategy (`pnpm-lock.yaml merge=binary`), linguist overrides for generated code |
| Tighten `.gitignore`        | Add patterns for: `apps/web/.env.local`, generated artifacts (`baseline.json`, `postflight*.json`, `test-results.json`, `apps/mobile/out.css`), `repomix-output.*`         |
| Fix README.md               | Node.js prerequisite: "20+" → "22+" to match `.nvmrc` and `engines`                                                                                                        |

---

## 2. Package Management & Workspace Hygiene

**Problem:** Version mismatches across workspaces, missing `.npmrc`, no `engines` on workspace packages, inconsistent module types, `pnpm-workspace.yaml` doesn't include `tooling/*`.

| Item                                    | Detail                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Create `.npmrc`                         | `strict-peer-dependencies=true`, `auto-install-peers=true`, `engine-strict=true` — enforces declared engines and peer deps at install time |
| Expand `pnpm-workspace.yaml`            | Add `tooling/*` to workspace list (needed once `@tasky/tooling-config` package exists)                                                     |
| Align React versions                    | `apps/mobile`: `19.2.0` → `19.2.5` to match `apps/web`                                                                                     |
| Align PostCSS versions                  | `apps/web`: `^8.5.6` → `^8.5.9`; `apps/mobile`: `8.4.49` → `^8.5.9` (matches root override)                                                |
| Fix TypeScript version in design-tokens | `^5.0.0` → `6.0.2` to match all other workspaces                                                                                           |
| Add `engines` to all workspace packages | `"engines": { "node": ">=22" }` in: `apps/web`, `apps/mobile`, `packages/core`, `packages/design-tokens`, `packages/sdk`                   |
| Document mobile CommonJS module type    | `apps/mobile` intentionally omits `"type": "module"` for Expo/Metro compatibility — document in `AGENTS.md`                                |

---

## 3. TypeScript Configuration

**Problem:** No shared tsconfig base, duplicated compiler options across 5 workspaces, no root tsconfig for IDE support, no strict flags beyond `strict: true`.

### Shared hierarchy (`tooling/config/tsconfig/`)

| File                | Extends      | Consumed by                    |
| ------------------- | ------------ | ------------------------------ |
| `base.json`         | —            | `sdk`, `core`, `design-tokens` |
| `react.json`        | `base.json`  | `web`                          |
| `react-native.json` | `react.json` | Reserved for future            |

### `base.json` compiler options

`target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`, `strict: true`, `skipLibCheck: true`, `declaration: true`, `forceConsistentCasingInFileNames: true`, `esModuleInterop: true`, `isolatedModules: true`, `verbatimModuleSyntax: true`.

Strict hardening flags (will cause type errors — fixing is a separate task):
`noUnusedLocals: true`, `noUnusedParameters: true`, `noUncheckedIndexedAccess: true`, `noFallthroughCasesInSwitch: true`, `exactOptionalPropertyTypes: true`.

### `react.json` additions

`jsx: react-jsx`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`.

### Per-workspace changes

- `packages/sdk`, `packages/core`, `packages/design-tokens` → extend `base.json`, remove duplicated options
- `apps/web` → extend `react.json`, remove duplicated options
- `apps/mobile` → stays on `expo/tsconfig.base` (Expo requirement, documented)
- Each workspace tsconfig retains only unique overrides: `outDir`, `rootDir`, `include`, workspace-specific `types`

### Root `tsconfig.json`

Project references pointing to all 5 workspaces. Provides IDE cross-workspace "go to definition". Not used for compilation directly.

### Deferred: `composite: true`

Enabling composite builds requires changes to the build pipeline to support project references and `tsc --build`. This is deferred to a future hardening pass once the shared tsconfig hierarchy is stable and all workspaces consume it.

---

## 4. ESLint Configuration

**Problem:** All 5 workspaces use legacy `.eslintrc.cjs` with `ESLINT_USE_FLAT_CONFIG=false`. No shared config. No import sorting. No unused import detection. `@typescript-eslint` version mismatch. lint-staged hardcoded to `apps/web`'s ESLint binary.

### `@tasky/tooling-config` workspace package

`tooling/config/package.json` with `name: "@tasky/tooling-config"`. Houses ESLint flat configs and tsconfigs. All workspaces add `@tasky/tooling-config: workspace:*` as devDependency.

### Shared ESLint flat configs (`tooling/config/eslint/`)

| File               | Extends                                               | Additions                                                                                                                            |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `base.mjs`         | `eslint/recommended`, `typescript-eslint/recommended` | `eslint-plugin-import` (sorting + no-unresolved + no-duplicates), `eslint-plugin-unused-imports`, `eslint-config-prettier` (last)    |
| `react.mjs`        | `base.mjs`                                            | `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, browser + Node globals                                                   |
| `react-native.mjs` | `eslint-config-expo/flat` + `base.mjs` rules          | Preserves mobile's existing custom overrides (restricted RN imports, restricted `StyleSheet.create()`, restricted inline `fontSize`) |

Import order in `base.mjs`: builtin → external → internal (`@tasky/*`) → parent → sibling → index.

### Per-workspace changes

- Each workspace gets `eslint.config.mjs` importing from `@tasky/tooling-config`
- Only workspace-specific overrides remain (e.g., mobile restricted-imports, web ignore patterns)
- Delete all 5 `.eslintrc.cjs` files
- Remove `ESLINT_USE_FLAT_CONFIG=false` from all `lint` scripts
- Consolidate `@typescript-eslint` into `@tasky/tooling-config`'s dependencies

### lint-staged update

Replace `bash -c 'ESLINT_USE_FLAT_CONFIG=false ./apps/web/node_modules/.bin/eslint ...'` with `npx eslint --no-error-on-unmatched-pattern`.

### Strictness note

Start with `typescript-eslint/recommended` (not `strict` or `stylistic`). Airbnb's ESLint config is unmaintained for flat config — we use the equivalent individual plugins directly.

**Known constraint:** `eslint-config-expo/flat` requires careful merging with custom `@typescript-eslint` rules in the same config object (plugin scoping issue in flat config).

---

## 5. Prettier & Formatting

**Problem:** No `eslint-config-prettier` to prevent ESLint/Prettier conflicts. lint-staged runs Prettier before ESLint (wrong order). EditorConfig missing entries for `.mjs`/`.cjs`.

| Item                                | Detail                                                                                                                                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add `eslint-config-prettier`        | Appended as last entry in every flat config's extends chain. Disables ESLint rules that conflict with Prettier.                                                                                                                                          |
| Fix lint-staged execution order     | ESLint `--fix` first (structural: unused imports, import sorting), then `prettier --write` (formatting last)                                                                                                                                             |
| No Prettier import sorting plugin   | ESLint owns import sorting exclusively (via `eslint-plugin-import` in Section 4). Adding a Prettier sorting plugin would conflict — both tools rewriting import order on the same file causes lint-staged oscillation. Prettier handles formatting only. |
| Update `.editorconfig`              | Add sections for `*.mjs`, `*.cjs` (2-space indent, LF, final newline), `[Dockerfile*]` (tab indent per Docker convention)                                                                                                                                |
| `.prettierrc` and `.prettierignore` | Unchanged — current settings are reasonable and already adopted                                                                                                                                                                                          |

---

## 6. Testing Infrastructure

**Problem:** Framework split (Vitest for web, Jest for mobile). No coverage config for mobile. Packages have no test setup. No shared test utilities.

### Vitest as single test framework

All workspaces standardize on Vitest. Mobile migrates from Jest — config and setup files created in this pass, existing Jest tests dropped and rewritten in a separate task.

| Item                                                       | Detail                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile Vitest config                                       | New `vitest.config.ts` in `apps/mobile`. Environment: `jsdom`. RN module transforms via `deps.inline`. Coverage thresholds: 60/55/55/60 (matching web). Setup file ported from `jest.setup.ts` semantics (TanStack Query scheduler, Reanimated mock, AsyncStorage mock, SafeAreaContext mock). |
| Remove Jest from mobile                                    | Delete `jest.config.js`, `jest.setup.ts`, `__tests__/test-utils/`. Remove `jest`, `jest-expo`, `@testing-library/jest-native`, `@types/jest` from devDependencies.                                                                                                                             |
| Add Vitest config to `packages/core`                       | `jsdom` environment, `@testing-library/react`. Coverage thresholds start at 0% (no tests yet).                                                                                                                                                                                                 |
| Type-check for `packages/design-tokens` and `packages/sdk` | Replace `echo` stubs with `tsc --noEmit` so `pnpm -r test` doesn't silently skip them.                                                                                                                                                                                                         |
| Create `packages/test-utils`                               | New workspace `@tasky/test-utils`: `createTestQueryClient()` factory, common mocks (AsyncStorage, SafeAreaContext, Reanimated), `renderWithProviders()` helper. Web and mobile import from here.                                                                                               |
| Unify coverage reporting                                   | All workspaces: Vitest `v8` provider, same thresholds, `text` + `json` reporters. Root `test:coverage` script runs across all workspaces.                                                                                                                                                      |
| Document in `AGENTS.md`                                    | Testing conventions: Vitest everywhere, `packages/test-utils` for shared infrastructure, coverage floors enforced.                                                                                                                                                                             |

---

## 7. Gradle & Backend Configuration

**Problem:** No version catalog. No `gradle.properties`. JaCoCo coverage rule not enforced in gates. No `@ConfigurationProperties` validation. OWASP dependency check opt-in only.

| Item                                      | Detail                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create Gradle version catalog             | `gradle/libs.versions.toml` centralizing all dependency versions. `[versions]`, `[libraries]`, `[plugins]` sections. Refactor `services/api/build.gradle.kts` to use `libs.*` references.                                                                                                                                                                                                           |
| Create `gradle.properties`                | `org.gradle.daemon=false`, `org.gradle.parallel=true`, `org.gradle.workers.max=4`, `org.gradle.jvmargs=-Xmx2g`, `org.gradle.caching=true`                                                                                                                                                                                                                                                           |
| Enforce JaCoCo in gates                   | Wire `jacocoTestCoverageVerification` into `gateRegression`. 80% line coverage floor blocks deploys.                                                                                                                                                                                                                                                                                                |
| Add `@ConfigurationProperties` validation | `@Validated @ConfigurationProperties(prefix = "tasky")` classes for the custom config namespace. Spring validates required properties at startup.                                                                                                                                                                                                                                                   |
| Wire OWASP into `gateFull`                | Move from opt-in to nightly gate. CVSS 7.0 threshold unchanged.                                                                                                                                                                                                                                                                                                                                     |
| Document test seed data                   | `V19__seed_test_data.sql` stays in migration chain (Flyway checksum). Add comment noting it's dev/test seed data.                                                                                                                                                                                                                                                                                   |
| Rewrite `qodana.yaml`                     | Current config is a stub: `qodana.starter` profile, `projectJDK: "25"` (wrong — project uses 21), all failure conditions commented out. Rewrite to: `projectJDK: "21"`, `profile: qodana.recommended`, severity thresholds configured (e.g., critical: 5, any: 15), coverage thresholds (total: 50, fresh: 70), exclusions for generated code (`**/generated/**`, `**/build/generated-sources/**`). |

---

## 8. Docker Configuration

**Problem:** Web Dockerfile uses Node 20 (stale). No health check on app service. Web Dockerfile runs as root. Missing `.dockerignore` in `apps/web/`. Base images pinned by tag only.

| Item                                             | Detail                                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Fix Node version in web Dockerfile               | `node:20-bookworm` → `node:22-bookworm`                                                                        |
| Add non-root user to web Dockerfile              | Create `caddy` user, `USER caddy` directive                                                                    |
| Add `.dockerignore` to `apps/web/`               | Exclude `node_modules`, `dist`, `coverage`, `playwright-report`, `test-results`, `.env*`, `*.md`               |
| Add health check to app service                  | `docker-compose.yml`: curl Spring Actuator liveness endpoint                                                   |
| Document private staging profile                 | Inline comment in `docker-compose.private-staging.yml` explaining `SPRING_PROFILES_ACTIVE=local` is deliberate |
| Pin base image digests in production Dockerfiles | SHA digest pinning for reproducible builds. Dev compose keeps tags.                                            |

---

## 9. Security Scanning Configuration

**Problem:** No secret scanning. Semgrep rules minimal. No trivy config. Broad SpotBugs exclusions. No frontend security linting.

| Item                            | Detail                                                                                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Create `.gitleaks.toml`         | Pre-commit secret detection via husky. Allow-list: `.env.example`, `.env.private-staging.example`, `application-test.yml`.                     |
| Create `.trivyignore`           | Placeholder with documented structure (CVE, expiry, justification). Wire existing `check-trivyignore-expiry.sh` into pre-push hook.            |
| Expand Semgrep rules            | Add: `no-hardcoded-secrets`, `no-raw-sql-string-concat` (broader), `spring-csrf-disabled`, `no-system-out`. Keep curated and project-specific. |
| Add `eslint-plugin-security`    | To shared `base.mjs`. Catches `eval()`, unsanitized `exec()`, RegExp DoS, non-literal `require()`.                                             |
| Add `eslint-plugin-no-secrets`  | To shared `base.mjs`. Catches hardcoded secrets in TS/JS source. Complements gitleaks with IDE-time feedback.                                  |
| Tighten SpotBugs exclude filter | Replace blanket `EI_EXPOSE_REP` exclusion with per-package exclusions. Only exclude for genuinely immutable record patterns.                   |

---

## 10. Developer Experience

**Problem:** No recommended VS Code extensions. No debug launch configs. No post-checkout hook. Pre-push hook slow for docs-only changes.

| Item                                  | Detail                                                                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create `.vscode/extensions.json`      | Recommended: `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `vscjava.vscode-java-pack`, `ms-azuretools.vscode-docker`, `bradlc.vscode-tailwindcss`, `mikestead.dotenv`  |
| Create `.vscode/launch.json`          | Debug configs: Spring Boot remote debug (port 5005), Vite dev server (Chrome), Vitest current file                                                                           |
| Create `.vscode/settings.json`        | `eslint.useFlatConfig: true`, `editor.formatOnSave: true`, `editor.defaultFormatter: esbenp.prettier-vscode`, `editor.codeActionsOnSave: { source.fixAll.eslint: explicit }` |
| Add post-checkout hook                | Via husky: `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` differs between old and new HEAD. Skips if lockfile unchanged.                                             |
| Optimize pre-push with path filtering | If only `*.md`, `docs/**`, or `research/**` changed, skip typecheck/lint/test — only run format check. Saves ~50s on docs-only pushes.                                       |
| Update `.editorconfig`                | Add `[*.mjs]`, `[*.cjs]` sections, `[Dockerfile*]` section (tab indent)                                                                                                      |

---

## Deferred Work

### → "Code Fixes" task (strict configs applied, code updated to pass)

- Fix type errors from stricter tsconfig flags (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Fix lint errors from new ESLint rules (import sorting, unused imports, 121 existing mobile warnings)
- Reformat all files after Prettier plugin changes
- Write unit tests for `packages/core`
- Rewrite mobile tests in Vitest (replacing dropped Jest tests)
- Raise coverage thresholds after test gaps are filled

### → "CI/CD" pass

- Semgrep, gitleaks, trivy running in CI pipelines
- SAST/DAST pipeline
- Re-enable Dependabot
- Workspace boundary validation in CI
- NVD API key provisioning for OWASP checks
- Container image signing (cosign)
- Remote build cache (Gradle Enterprise or similar)

### → Future hardening passes

- `composite: true` in tsconfig for incremental builds (requires build pipeline changes to support project references and `tsc --build`)
- Multi-module Gradle project
- Raising PIT mutation threshold beyond 30%
- License compliance scanning
- Multi-arch Docker builds
- Docker Compose profiles for selective service startup
- Dev containers / codespaces configuration
- IntelliJ run configurations
- Makefile/Justfile task runner
- SpotBugs custom detectors
- Expanding Semgrep to full registry
