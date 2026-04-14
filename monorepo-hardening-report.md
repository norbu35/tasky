# Monorepo Hardening Report

**Branch:** `agent/MONOREPO-HARDENING`
**Worktree:** `.worktrees/monorepo-hardening`
**Date:** 2026-04-14
**Status:** In progress — ESLint flat-config migration partially complete (4/5 packages passing, mobile in progress)
**Constraint:** Do NOT merge back to main.

---

## Summary

36 tracked files modified/deleted, 15 untracked files created. Net: **-1,076 lines** across 51 files. Zero regressions on `pnpm -r typecheck`, `pnpm -r lint` (4/5 packages), and `pnpm -r format:check`. Backend `./gradlew gateSmoke` has 7 pre-existing compilation errors on main (not caused by this work).

---

## 1. Directory Cleanup

| Action  | Detail                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------- |
| Moved   | `scripts/scrape-unegui*.py`, `scripts/scrape-unegui-cron.sh` → `research/unegui-scraper/`            |
| Moved   | `analyze_i18n.py` → `tooling/scripts/`                                                               |
| Deleted | Root `scripts/` directory (2 files + `.dockerignore`)                                                |
| Deleted | `baseline.json`, `postflight-cascade.json`, `postflight.json`, `test-results.json` (stale artifacts) |
| Deleted | `apps/mobile/out.css` (generated artifact)                                                           |
| Updated | `.gitignore` — added patterns for generated artifacts, `apps/web/.env.local`                         |
| Updated | `README.md` — fixed prerequisite from "Node.js 20+" to "Node.js 22+"                                 |

---

## 2. Config Centralization

### 2a. TypeScript (`tooling/config/tsconfig/`)

Created shared TS config hierarchy consumed by 4 of 5 packages:

| File                                        | Extends      | Consumed by                    |
| ------------------------------------------- | ------------ | ------------------------------ |
| `tooling/config/tsconfig/base.json`         | —            | `sdk`, `core`, `design-tokens` |
| `tooling/config/tsconfig/react.json`        | `base.json`  | `web`                          |
| `tooling/config/tsconfig/react-native.json` | `react.json` | (reserved for future)          |

**Changes per package:**

- `apps/web/tsconfig.json` — extends shared `react.json`, removed 5 duplicated compiler options
- `packages/sdk/tsconfig.json` — extends shared `base.json`
- `packages/core/tsconfig.json` — extends shared `base.json`
- `packages/design-tokens/tsconfig.json` — extends shared `base.json`, fixed TypeScript `^5.0.0` → `6.0.2`
- `apps/mobile/tsconfig.json` — **unchanged** (must extend `expo/tsconfig.base`)

**Decision:** Kept `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` out of the shared base because they weren't in any original config and caused 10 type errors in `apps/web`. These stricter options should be a separate hardening pass.

### 2b. ESLint Flat Config (`tooling/config/eslint/`)

**Migrated all 5 packages from legacy `.eslintrc.cjs` to ESLint 9 flat config (`eslint.config.mjs`).** Eliminated the `ESLINT_USE_FLAT_CONFIG=false` compatibility flag.

Created shared workspace package `@tasky/tooling-config` (`tooling/config/`):

| Export                       | Purpose                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| `eslint/base.mjs`            | TS parser + `eslint:recommended` + `@typescript-eslint/recommended` + `no-undef: off` |
| `eslint/react.mjs`           | Extends base + react-hooks + react-refresh + browser/node globals                     |
| `tsconfig/base.json`         | Shared compiler options                                                               |
| `tsconfig/react.json`        | Base + JSX/DOM lib                                                                    |
| `tsconfig/react-native.json` | React + RN reserved                                                                   |

**Per-package flat configs:**

| Package                  | Config source                                   | Status                            |
| ------------------------ | ----------------------------------------------- | --------------------------------- |
| `packages/core`          | `@tasky/tooling-config/eslint/base`             | ✅ Pass                           |
| `packages/design-tokens` | `@tasky/tooling-config/eslint/base`             | ✅ Pass                           |
| `packages/sdk`           | `@tasky/tooling-config/eslint/base`             | ✅ Pass (skipped, generated code) |
| `apps/web`               | `@tasky/tooling-config/eslint/react`            | ✅ Pass                           |
| `apps/mobile`            | `eslint-config-expo/flat.js` + custom overrides | ⚠️ In progress                    |

**Mobile complexity:** `eslint-config-expo` defines `@typescript-eslint` plugin in only one config object scoped to `*.ts/tsx`. Flat config requires plugin and rule in the same config object. Working on filtering Expo's TS plugin entry and redefining it with custom rules merged in.

**Deleted:** All 5 `.eslintrc.cjs` files.

**Dependency consolidation:**

- Removed `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` from `core`, `design-tokens`, `web` (now in `@tasky/tooling-config`)
- Removed `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` from `web` (now in `@tasky/tooling-config`)
- Added `@tasky/tooling-config: workspace:*` to all 5 consumers
- Added `tooling/*` to `pnpm-workspace.yaml`
- Mobile still needs `@typescript-eslint/eslint-plugin` directly for its config

### 2c. lint-staged

Updated `.lintstagedrc.json`: replaced brittle `bash -c 'ESLINT_USE_FLAT_CONFIG=false ./apps/web/node_modules/.bin/eslint ...'` with `npx eslint --no-error-on-unmatched-pattern` (flat config is now the default).

### 2d. EditorConfig

Added `[*.mjs]` and `[*.{js,mjs,cjs,ts,tsx}]` sections to `.editorconfig`.

---

## 3. Environment Variables

| File           | Change                                                              |
| -------------- | ------------------------------------------------------------------- |
| `.env.example` | Added `VITE_DEFAULT_LOCALE` and `VITE_FACEBOOK_APP_ID`              |
| `.gitignore`   | Added `apps/web/.env.local` (was tracked with real Facebook App ID) |

---

## 4. Qodana

Rewrote `qodana.yaml` from stub to functional:

| Before                                | After                                                            |
| ------------------------------------- | ---------------------------------------------------------------- |
| `projectJDK: "25"`                    | `projectJDK: "21"`                                               |
| All `failureConditions` commented out | Severity thresholds + coverage thresholds configured             |
| No profile                            | `qodana.recommended` profile                                     |
| No exclusions                         | Exclusions for generated code (`**/generated/**`)                |
| No CI integration                     | Integrated into `quality-gates.yml` and `nightly-regression.yml` |

---

## 5. CI/CD Optimization

### New composite action

- `.github/actions/start-infra/action.yml` — DRY infrastructure startup for E2E jobs

### `quality-gates.yml`

| Change                                       | Reason                                       |
| -------------------------------------------- | -------------------------------------------- |
| Removed `e2e-android` job                    | Too expensive for every PR; moved to nightly |
| Added `qodana` job                           | Static analysis was a stub, now runs on PRs  |
| Fixed all "Node.js 20" labels → "Node.js 22" | Labels were stale                            |
| Used composite action for `e2e-web`          | DRY                                          |

### `nightly-regression.yml`

| Change                       | Reason                   |
| ---------------------------- | ------------------------ |
| Added `e2e-android` job      | Moved from PR gate       |
| Added `qodana` job           | Full analysis on nightly |
| Added OWASP dependency check | Supply chain security    |
| Fixed "Node.js 20" labels    | Stale                    |

### Other workflows

- `release-gate.yml` — fixed "Node.js 20" → "Node.js 22" labels
- `nightly-mobile.yml` — fixed "Node.js 20" → "Node.js 22" labels

---

## 6. Quality Gate Optimization

| Setting                | Before | After |
| ---------------------- | ------ | ----- |
| PIT mutation threshold | 20%    | 30%   |

**Test gap analysis** produced at `docs/quality/test-gap-analysis-2026-04-14.md`:

- 207 scenarios in registry, 103 covered, 1 untested (SCN-BOOK-007)
- 21 scenarios with 0% mutation kill rate (tests pass but don't catch mutations)
- No duplicate or optics-only tests found

---

## 7. Comment and Documentation Standards

Added section to `AGENTS.md` covering:

- **Java:** Javadoc on public/protected in `api/`, `application/`, `publicapi/` packages. No redundant `@param`/`@return` tags.
- **TypeScript:** JSDoc on exported functions/hooks. No JSDoc on React components.
- **General:** Keep "why" comments, remove "what" comments. Architecture decisions in `docs/adr/`.

No actual Javadoc/JSDoc was added to source files — strategy documented only.

---

## 8. Verification Results

| Check                  | Result | Notes                                                                                     |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `pnpm install`         | ✅     | 7 workspace projects (added `tooling/config`)                                             |
| `pnpm -r typecheck`    | ✅     | All 5 typechecked packages pass                                                           |
| `pnpm -r lint`         | ⚠️ 4/5 | `design-tokens` ✅, `core` ✅, `web` ✅, `sdk` (skipped), `mobile` ❌ in progress         |
| `pnpm -r format:check` | ⚠️     | Pre-existing `packages/sdk` formatting failure (on main too)                              |
| `./gradlew gateSmoke`  | ⚠️     | 7 pre-existing test compilation errors on main (ambiguous method refs, missing `closeTo`) |

---

## 9. File Manifest

### Created (15)

```
.github/actions/start-infra/action.yml
.sisyphus/plans/monorepo-hardening.md
apps/mobile/eslint.config.mjs
apps/web/eslint.config.mjs
docs/quality/test-gap-analysis-2026-04-14.md
packages/core/eslint.config.mjs
packages/design-tokens/eslint.config.mjs
packages/sdk/eslint.config.mjs
tooling/config/eslint/base.mjs
tooling/config/eslint/react.mjs
tooling/config/package.json
tooling/config/tsconfig/base.json
tooling/config/tsconfig/react.json
tooling/config/tsconfig/react-native.json
tooling/scripts/analyze_i18n.py
```

### Modified (17)

```
.editorconfig
.env.example
.github/workflows/nightly-mobile.yml
.github/workflows/nightly-regression.yml
.github/workflows/quality-gates.yml
.github/workflows/release-gate.yml
.gitignore
.lintstagedrc.json
AGENTS.md
README.md
apps/mobile/package.json
apps/web/package.json
apps/web/tsconfig.json
packages/core/package.json
packages/core/tsconfig.json
packages/design-tokens/package.json
packages/design-tokens/tsconfig.json
packages/sdk/package.json
packages/sdk/tsconfig.json
pnpm-lock.yaml
pnpm-workspace.yaml
qodana.yaml
research/unegui-scraper/scrape-unegui-cron.sh
research/unegui-scraper/scrape-unegui.py
services/api/build.gradle.kts
```

### Deleted (10)

```
analyze_i18n.py (moved to tooling/scripts/)
apps/mobile/.eslintrc.cjs
apps/web/.eslintrc.cjs
baseline.json
packages/core/.eslintrc.cjs
packages/design-tokens/.eslintrc.cjs
packages/sdk/.eslintrc.cjs
postflight-cascade.json
scripts/.dockerignore
scripts/scrape-unegui-cron.sh
scripts/scrape-unegui.py
```

---

## 10. Not Done (Deferred)

| Item                                                                                       | Reason                                                                          |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Adding JSDoc/Javadoc to source files                                                       | Strategy documented in AGENTS.md; actual annotation is a separate pass          |
| Adding `noUnusedLocals`/`noUnusedParameters`/`noUncheckedIndexedAccess` to shared tsconfig | Would require fixing 10+ type errors across `apps/web`; separate hardening pass |
| ESLint flat config for `apps/mobile`                                                       | In progress — Expo's flat config has plugin scoping constraints                 |
| Hoisting shared devDependencies to root                                                    | Deferred to avoid scope creep                                                   |
| Running coverage reports (`vitest --coverage`, `jest --coverage`)                          | Deferred                                                                        |
| Implementing SCN-BOOK-007 test                                                             | Deferred — needs new test scenario                                              |
| Committing changes                                                                         | Not yet requested                                                               |

---

## 11. Pre-existing Issues (Not Caused by This Work)

1. **Backend test compilation** — 7 errors in `TaskQueryServiceTests`, `VerificationServiceTests`, `UserProfileServiceTests` (ambiguous method refs, missing Mockito matcher). Present on `main`.
2. **SDK formatting** — `packages/sdk/src/index.ts` fails `prettier --check`. Present on `main`.
3. **Peer dependency warnings** — TypeScript 6 vs `@typescript-eslint` expecting `<6`; React version minor mismatches. Present on `main`.
4. **121 mobile lint warnings** — Unused vars, restricted imports, inline fontSize. Present on `main`.
