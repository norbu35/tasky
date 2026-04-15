# Monorepo Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the monorepo's structure, scaffolding, and configuration across 10 concerns — without changing application code (strict config flags are set, but code fixes are a separate task).

**Architecture:** Each task maps to one section of the spec at `docs/superpowers/specs/2026-04-14-monorepo-hardening-design.md`. Tasks are independent unless noted — tasks 1-2 are foundational and should run first; tasks 3-10 can be parallelized after them.

**Tech Stack:** pnpm 10, TypeScript 6, ESLint 9 (flat config), Vitest, Gradle 8.11 (Kotlin DSL), Docker, Husky 9

**Constraints:**

- Do NOT fix type errors or lint errors caused by stricter configs — that is a separate task.
- Do NOT change CI/CD pipeline YAML — that is a separate pass.
- Do NOT modify application source code.
- Commit after each task with conventional commit format: `type(scope): summary`.

---

## File Map

### Created (new files)

| File                                                 | Responsibility                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| `.gitattributes`                                     | Line ending normalization, binary markers, lockfile merge strategy |
| `.npmrc`                                             | Strict peer deps, engine enforcement                               |
| `tsconfig.json` (root)                               | Project references for IDE cross-workspace navigation              |
| `tooling/config/package.json`                        | `@tasky/tooling-config` workspace package manifest                 |
| `tooling/config/tsconfig/base.json`                  | Shared base TS compiler options (strict)                           |
| `tooling/config/tsconfig/react.json`                 | React-specific TS options extending base                           |
| `tooling/config/tsconfig/react-native.json`          | Reserved RN TS options extending react                             |
| `tooling/config/eslint/base.mjs`                     | Shared ESLint flat config (TS + import sorting + security)         |
| `tooling/config/eslint/react.mjs`                    | React ESLint flat config extending base                            |
| `tooling/config/eslint/react-native.mjs`             | React Native ESLint flat config                                    |
| `apps/web/eslint.config.mjs`                         | Web app ESLint flat config consuming shared react                  |
| `apps/mobile/eslint.config.mjs`                      | Mobile app ESLint flat config consuming shared RN                  |
| `packages/core/eslint.config.mjs`                    | Core package ESLint flat config consuming shared base              |
| `packages/design-tokens/eslint.config.mjs`           | Design tokens ESLint flat config consuming shared base             |
| `packages/sdk/eslint.config.mjs`                     | SDK ESLint flat config consuming shared base                       |
| `apps/mobile/vitest.config.ts`                       | Mobile Vitest configuration (replaces Jest)                        |
| `apps/mobile/vitest.setup.ts`                        | Mobile Vitest setup (ported from jest.setup.ts)                    |
| `packages/core/vitest.config.ts`                     | Core package Vitest configuration                                  |
| `packages/test-utils/package.json`                   | Shared test utilities package manifest                             |
| `packages/test-utils/src/index.ts`                   | Shared test utilities barrel export                                |
| `packages/test-utils/src/query-client.ts`            | Shared `createTestQueryClient()` factory                           |
| `packages/test-utils/src/render-helpers.tsx`         | Shared `renderWithProviders()`                                     |
| `packages/test-utils/src/mocks/index.ts`             | Mock barrel export                                                 |
| `packages/test-utils/src/mocks/reanimated.ts`        | Reanimated mock                                                    |
| `packages/test-utils/src/mocks/async-storage.ts`     | AsyncStorage mock                                                  |
| `packages/test-utils/src/mocks/safe-area-context.ts` | SafeAreaContext mock                                               |
| `packages/test-utils/tsconfig.json`                  | Test-utils TS config                                               |
| `gradle/libs.versions.toml`                          | Gradle version catalog                                             |
| `gradle.properties`                                  | Gradle daemon/JVM settings                                         |
| `apps/web/.dockerignore`                             | Docker build context exclusions for web                            |
| `.gitleaks.toml`                                     | Secret scanning configuration                                      |
| `.trivyignore`                                       | Container CVE suppressions with expiry                             |
| `.vscode/extensions.json`                            | Recommended VS Code extensions                                     |
| `.vscode/launch.json`                                | Debug configurations                                               |
| `research/unegui-scraper/scrape-unegui.py`           | Relocated scraper script                                           |
| `research/unegui-scraper/scrape-unegui-cron.sh`      | Relocated cron wrapper                                             |
| `tooling/scripts/analyze_i18n.py`                    | Relocated i18n analyzer                                            |

### Modified (existing files)

| File                                           | Change summary                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.gitignore`                                   | Add patterns for stale artifacts, `.env.local`                                                       |
| `.editorconfig`                                | Add `*.mjs`, `*.cjs`, `Dockerfile*` sections                                                         |
| `pnpm-workspace.yaml`                          | Add `tooling/*`                                                                                      |
| `.prettierrc`                                  | Unchanged (verified correct)                                                                         |
| `.prettierignore`                              | Unchanged (verified correct)                                                                         |
| `.lintstagedrc.json`                           | Swap ESLint command, fix execution order                                                             |
| `.husky/pre-push`                              | Add path filtering for docs-only pushes, wire trivyignore expiry                                     |
| `.husky/post-checkout`                         | New hook — auto `pnpm install` on lockfile change                                                    |
| `README.md`                                    | Fix Node.js prerequisite "20+" → "22+"                                                               |
| `AGENTS.md`                                    | Document mobile CommonJS rationale, Vitest convention, testing infra                                 |
| `qodana.yaml`                                  | Rewrite from stub to functional config                                                               |
| `package.json` (root)                          | Add `test:coverage` script                                                                           |
| `apps/web/package.json`                        | Add `engines`, `@tasky/tooling-config` dep, align PostCSS, remove ESLint deps moved to shared        |
| `apps/mobile/package.json`                     | Add `engines`, align React/PostCSS, swap Jest→Vitest deps, add `@tasky/tooling-config` dep           |
| `packages/core/package.json`                   | Add `engines`, `@tasky/tooling-config` dep, `vitest` dep, `test` script, remove ESLint deps          |
| `packages/design-tokens/package.json`          | Add `engines`, `@tasky/tooling-config` dep, fix TS version, update `test` script, remove ESLint deps |
| `packages/sdk/package.json`                    | Add `engines`, `@tasky/tooling-config` dep, update `test` script                                     |
| `apps/web/tsconfig.json`                       | Extend shared react.json, remove duplicated options                                                  |
| `apps/mobile/tsconfig.json`                    | Update `types` from jest to vitest                                                                   |
| `packages/core/tsconfig.json`                  | Extend shared base.json, remove duplicated options                                                   |
| `packages/design-tokens/tsconfig.json`         | Extend shared base.json, remove duplicated options                                                   |
| `packages/sdk/tsconfig.json`                   | Extend shared base.json, remove duplicated options                                                   |
| `services/api/build.gradle.kts`                | Migrate to version catalog refs, wire JaCoCo into gateRegression, wire OWASP into gateFull           |
| `tooling/config/semgrep/tasky-rules.yaml`      | Add 4 new security rules                                                                             |
| `tooling/config/spotbugs/spotbugs-exclude.xml` | Tighten EI_EXPOSE_REP to per-package                                                                 |
| `Dockerfile`                                   | Pin base images by digest                                                                            |
| `apps/web/Dockerfile`                          | Fix Node version, add non-root user, pin digests                                                     |
| `docker-compose.yml`                           | Add health check to app service                                                                      |
| `.vscode/settings.json`                        | Add ESLint flat config, format-on-save, Prettier default formatter                                   |

### Deleted

| File                                                  | Reason                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `baseline.json`                                       | Stale generated artifact                                     |
| `postflight-cascade.json`                             | Stale generated artifact                                     |
| `postflight.json`                                     | Stale generated artifact (already in .gitignore but tracked) |
| `test-results.json`                                   | Stale generated artifact (already in .gitignore but tracked) |
| `apps/mobile/out.css`                                 | Generated NativeWind artifact                                |
| `scripts/scrape-unegui.py`                            | Relocated to `research/unegui-scraper/`                      |
| `scripts/scrape-unegui-cron.sh`                       | Relocated to `research/unegui-scraper/`                      |
| `scripts/.dockerignore`                               | Part of deleted `scripts/` dir                               |
| `analyze_i18n.py`                                     | Relocated to `tooling/scripts/`                              |
| `apps/web/.eslintrc.cjs`                              | Replaced by eslint.config.mjs                                |
| `apps/mobile/.eslintrc.cjs`                           | Replaced by eslint.config.mjs                                |
| `packages/core/.eslintrc.cjs`                         | Replaced by eslint.config.mjs                                |
| `packages/design-tokens/.eslintrc.cjs`                | Replaced by eslint.config.mjs                                |
| `packages/sdk/.eslintrc.cjs`                          | Replaced by eslint.config.mjs                                |
| `apps/mobile/jest.config.js`                          | Replaced by vitest.config.ts                                 |
| `apps/mobile/jest.setup.ts`                           | Replaced by vitest.setup.ts                                  |
| `apps/mobile/__tests__/test-utils/reanimated-mock.js` | Moved to packages/test-utils                                 |
| `apps/mobile/__tests__/test-utils/queryClient.ts`     | Moved to packages/test-utils                                 |
| `apps/mobile/__tests__/test-utils/mockI18n.ts`        | Moved to packages/test-utils                                 |

---

## Task 1: Directory & Git Hygiene

**Files:**

- Delete: `baseline.json`, `postflight-cascade.json`, `postflight.json`, `test-results.json`, `apps/mobile/out.css`
- Delete: `scripts/scrape-unegui.py`, `scripts/scrape-unegui-cron.sh`, `scripts/.dockerignore`
- Delete: `analyze_i18n.py`
- Create: `research/unegui-scraper/scrape-unegui.py`, `research/unegui-scraper/scrape-unegui-cron.sh`
- Create: `tooling/scripts/analyze_i18n.py`
- Create: `.gitattributes`
- Modify: `.gitignore`, `.editorconfig`, `README.md`

- [ ] **Step 1: Delete stale root artifacts**

```bash
git rm baseline.json postflight-cascade.json postflight.json test-results.json
git rm apps/mobile/out.css
```

If any file is untracked (already in .gitignore but present), use `rm` instead of `git rm`.

- [ ] **Step 2: Relocate misplaced scripts**

```bash
mkdir -p research/unegui-scraper
git mv scripts/scrape-unegui.py research/unegui-scraper/scrape-unegui.py
git mv scripts/scrape-unegui-cron.sh research/unegui-scraper/scrape-unegui-cron.sh
git rm scripts/.dockerignore
# scripts/ dir should now be empty — git will remove it automatically

git mv analyze_i18n.py tooling/scripts/analyze_i18n.py
```

- [ ] **Step 3: Create `.gitattributes`**

```gitattributes
# Auto-detect text files and normalize line endings
* text=auto

# Force LF on all text files
*.java text eol=lf
*.kt text eol=lf
*.kts text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.mjs text eol=lf
*.cjs text eol=lf
*.json text eol=lf
*.yaml text eol=lf
*.yml text eol=lf
*.md text eol=lf
*.xml text eol=lf
*.sql text eol=lf
*.sh text eol=lf
*.css text eol=lf
*.html text eol=lf

# Binary files — no diff, no merge, no LF conversion
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.webp binary
*.woff binary
*.woff2 binary
*.ttf binary
*.otf binary
*.eot binary
*.jar binary

# Lockfiles — treat as binary for merge (regenerate on conflict)
pnpm-lock.yaml merge=binary -diff
gradle/wrapper/gradle-wrapper.jar binary

# Linguist overrides — exclude generated code from language stats
packages/sdk/src/generated/** linguist-generated=true
**/build/generated-sources/** linguist-generated=true
```

- [ ] **Step 4: Tighten `.gitignore`**

Add these entries to the existing `.gitignore` (append after the "Local env overrides" section):

```gitignore
# Web app local env (may contain real Facebook App ID)
apps/web/.env.local

# Generated artifacts (stale session outputs)
baseline.json
postflight-cascade.json
postflight.json
apps/mobile/out.css
repomix-output.*
```

Note: `test-results.json` and `postflight.json` are already in `.gitignore`. Only add entries that are missing.

- [ ] **Step 5: Update `.editorconfig`**

Append these sections to the existing `.editorconfig`:

```editorconfig
# JavaScript modules (ESLint flat configs, build scripts)
[*.{js,mjs,cjs,ts,tsx}]
indent_style = space
indent_size = 2

# Dockerfiles
[Dockerfile*]
indent_style = tab
```

- [ ] **Step 6: Fix README.md prerequisite**

In `README.md` line 37, change:

```
- Node.js 20+ and pnpm 10+
```

to:

```
- Node.js 22+ and pnpm 10+
```

- [ ] **Step 7: Verify and commit**

```bash
# Verify no broken references
ls research/unegui-scraper/scrape-unegui.py
ls research/unegui-scraper/scrape-unegui-cron.sh
ls tooling/scripts/analyze_i18n.py
cat .gitattributes | head -5

git add -A
git commit -m "chore(repo): clean directory structure, add .gitattributes, tighten .gitignore"
```

---

## Task 2: Package Management & Workspace Hygiene

**Files:**

- Create: `.npmrc`
- Modify: `pnpm-workspace.yaml`, `apps/web/package.json`, `apps/mobile/package.json`, `packages/core/package.json`, `packages/design-tokens/package.json`, `packages/sdk/package.json`, `AGENTS.md`

- [ ] **Step 1: Create `.npmrc`**

```ini
strict-peer-dependencies=true
auto-install-peers=true
engine-strict=true
```

- [ ] **Step 2: Expand `pnpm-workspace.yaml`**

Replace the full file:

```yaml
packages:
  - apps/*
  - packages/*
  - tooling/*
```

- [ ] **Step 3: Align dependency versions across workspaces**

In `apps/mobile/package.json`:

- Change `"react": "19.2.0"` → `"react": "19.2.5"`
- Change `"react-test-renderer": "19.2.0"` → `"react-test-renderer": "19.2.5"` (if still present after Jest removal)
- Change `"postcss": "8.4.49"` → `"postcss": "^8.5.9"`

In `apps/web/package.json`:

- Change `"postcss": "^8.5.6"` → `"postcss": "^8.5.9"`

In `packages/design-tokens/package.json`:

- Change `"typescript": "^5.0.0"` → `"typescript": "6.0.2"`

- [ ] **Step 4: Add `engines` field to all workspace packages**

Add to each of `apps/web/package.json`, `apps/mobile/package.json`, `packages/core/package.json`, `packages/design-tokens/package.json`, `packages/sdk/package.json`:

```json
"engines": {
  "node": ">=22"
},
```

Place after the `"private": true` line in each file.

- [ ] **Step 5: Document mobile CommonJS rationale in AGENTS.md**

Append to the appropriate section of `AGENTS.md`:

```markdown
### Module System

`apps/mobile` intentionally omits `"type": "module"` in its `package.json`. Expo's Metro bundler
and `babel-preset-expo` expect CommonJS module resolution. All other workspaces use ESM
(`"type": "module"`). Do not add `"type": "module"` to the mobile app without verifying
Metro/Expo compatibility.
```

- [ ] **Step 6: Verify and commit**

```bash
pnpm install
# Expect: resolves without errors, lockfile updates

git add .npmrc pnpm-workspace.yaml pnpm-lock.yaml \
  apps/web/package.json apps/mobile/package.json \
  packages/core/package.json packages/design-tokens/package.json packages/sdk/package.json \
  AGENTS.md
git commit -m "chore(deps): align versions, add .npmrc, expand workspace config"
```

---

## Task 3: Shared TypeScript Configuration

**Files:**

- Create: `tooling/config/package.json`, `tooling/config/tsconfig/base.json`, `tooling/config/tsconfig/react.json`, `tooling/config/tsconfig/react-native.json`, `tsconfig.json` (root)
- Modify: `apps/web/tsconfig.json`, `packages/core/tsconfig.json`, `packages/design-tokens/tsconfig.json`, `packages/sdk/tsconfig.json`

**Note:** `apps/mobile/tsconfig.json` is NOT modified here — it must extend `expo/tsconfig.base`. It will be touched in Task 6 (testing) to swap `jest` → `vitest` types.

- [ ] **Step 1: Create `@tasky/tooling-config` package manifest**

Create `tooling/config/package.json`:

```json
{
  "name": "@tasky/tooling-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./tsconfig/base": "./tsconfig/base.json",
    "./tsconfig/react": "./tsconfig/react.json",
    "./tsconfig/react-native": "./tsconfig/react-native.json",
    "./eslint/base": "./eslint/base.mjs",
    "./eslint/react": "./eslint/react.mjs",
    "./eslint/react-native": "./eslint/react-native.mjs"
  }
}
```

- [ ] **Step 2: Create shared tsconfig hierarchy**

Create `tooling/config/tsconfig/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Create `tooling/config/tsconfig/react.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

Create `tooling/config/tsconfig/react-native.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./react.json",
  "compilerOptions": {}
}
```

- [ ] **Step 3: Update workspace tsconfigs to extend shared base**

Replace `packages/sdk/tsconfig.json`:

```json
{
  "extends": "@tasky/tooling-config/tsconfig/base",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

Replace `packages/core/tsconfig.json`:

```json
{
  "extends": "@tasky/tooling-config/tsconfig/base",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

Replace `packages/design-tokens/tsconfig.json`:

```json
{
  "extends": "@tasky/tooling-config/tsconfig/base",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Replace `apps/web/tsconfig.json`:

```json
{
  "extends": "@tasky/tooling-config/tsconfig/react",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals", "node", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests", "e2e", "playwright.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Create root `tsconfig.json` with project references**

Create `tsconfig.json` at monorepo root:

```json
{
  "files": [],
  "references": [
    { "path": "packages/sdk" },
    { "path": "packages/core" },
    { "path": "packages/design-tokens" },
    { "path": "apps/web" },
    { "path": "apps/mobile" }
  ]
}
```

- [ ] **Step 5: Add `@tasky/tooling-config` as devDependency to consuming packages**

In each of `apps/web/package.json`, `packages/core/package.json`, `packages/design-tokens/package.json`, `packages/sdk/package.json`, add to `devDependencies`:

```json
"@tasky/tooling-config": "workspace:*"
```

(Mobile gets this dependency too, but in Task 4 when ESLint config is set up.)

- [ ] **Step 6: Install and verify**

```bash
pnpm install

# Typecheck — expect errors from strict flags (noUnusedLocals, etc.)
# These are EXPECTED and will be fixed in a separate task.
# Verify the configs are resolving correctly:
pnpm --filter @tasky/sdk typecheck 2>&1 | head -5
pnpm --filter @tasky/web typecheck 2>&1 | head -5
```

Expected: TypeScript runs and finds the config. Errors from strict flags are expected and acceptable.

- [ ] **Step 7: Commit**

```bash
git add tooling/config/package.json \
  tooling/config/tsconfig/ \
  tsconfig.json \
  apps/web/tsconfig.json apps/web/package.json \
  packages/core/tsconfig.json packages/core/package.json \
  packages/design-tokens/tsconfig.json packages/design-tokens/package.json \
  packages/sdk/tsconfig.json packages/sdk/package.json \
  pnpm-lock.yaml
git commit -m "chore(ts): centralize tsconfig with strict hardening flags"
```

---

## Task 4: ESLint Flat Config Migration

**Files:**

- Create: `tooling/config/eslint/base.mjs`, `tooling/config/eslint/react.mjs`, `tooling/config/eslint/react-native.mjs`
- Create: `apps/web/eslint.config.mjs`, `apps/mobile/eslint.config.mjs`, `packages/core/eslint.config.mjs`, `packages/design-tokens/eslint.config.mjs`, `packages/sdk/eslint.config.mjs`
- Delete: all 5 `.eslintrc.cjs` files
- Modify: `tooling/config/package.json`, `.lintstagedrc.json`, all workspace `package.json` lint scripts

**Dependencies:** Task 2 (pnpm-workspace.yaml must include `tooling/*`), Task 3 (`@tasky/tooling-config` package must exist).

- [ ] **Step 1: Install shared ESLint dependencies in `@tasky/tooling-config`**

Add to `tooling/config/package.json`:

```json
"dependencies": {
  "eslint": "^9.39.0",
  "typescript-eslint": "^8.58.0",
  "@eslint/js": "^9.39.0",
  "eslint-plugin-import-x": "^4.6.0",
  "eslint-plugin-unused-imports": "^4.1.0",
  "eslint-config-prettier": "^10.1.0",
  "eslint-plugin-security": "^3.0.0",
  "eslint-plugin-no-secrets": "^1.1.0",
  "globals": "^16.0.0"
}
```

Also add React-specific deps:

```json
"optionalDependencies": {
  "eslint-plugin-react-hooks": "^7.0.0",
  "eslint-plugin-react-refresh": "^0.4.19"
}
```

- [ ] **Step 2: Create `tooling/config/eslint/base.mjs`**

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import security from 'eslint-plugin-security';
import noSecrets from 'eslint-plugin-no-secrets';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      'unused-imports': unusedImports,
      security,
      'no-secrets': noSecrets,
    },
    rules: {
      // Import sorting
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@tasky/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',

      // Unused imports — auto-fixable
      'unused-imports/no-unused-imports': 'warn',

      // Security
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'no-secrets/no-secrets': ['warn', { tolerance: 4.5 }],

      // TypeScript already handles this — disable base ESLint rule
      'no-undef': 'off',
    },
  },
  prettierConfig,
];
```

- [ ] **Step 3: Create `tooling/config/eslint/react.mjs`**

```javascript
import baseConfig from './base.mjs';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
];
```

- [ ] **Step 4: Create `tooling/config/eslint/react-native.mjs`**

```javascript
import baseConfig from './base.mjs';

// eslint-config-expo/flat must be imported dynamically at the consumer level
// because it requires expo to be installed. This config provides the base rules
// and the mobile-specific overrides that get spread into the consumer's flat config.

export const mobileOverrides = [
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'react-native',
              importNames: [
                'SafeAreaView',
                'TextInput',
                'TouchableOpacity',
                'TouchableHighlight',
                'TouchableWithoutFeedback',
                'Pressable',
              ],
              message:
                'Use shared primitives (ScreenContainer, Input, Button, Touchable, PressableCard) instead of raw RN components.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "CallExpression[callee.object.name='StyleSheet'][callee.property.name='create']",
          message: 'Screens must use NativeWind className instead of StyleSheet.create.',
        },
        {
          selector: "Property[key.name='fontSize'][value.type!='MemberExpression']",
          message:
            'Use typography classes (text-body, font-screen-card-title, etc.) instead of inline fontSize.',
        },
      ],
    },
  },
  {
    files: ['src/app/(tabs)/_layout.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/app/(auth)/otp.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
];

export { baseConfig };
```

- [ ] **Step 5: Create per-workspace `eslint.config.mjs` files**

Create `packages/core/eslint.config.mjs`:

```javascript
import baseConfig from '@tasky/tooling-config/eslint/base';

export default [...baseConfig, { ignores: ['dist/'] }];
```

Create `packages/design-tokens/eslint.config.mjs`:

```javascript
import baseConfig from '@tasky/tooling-config/eslint/base';

export default [...baseConfig, { ignores: ['dist/'] }];
```

Create `packages/sdk/eslint.config.mjs`:

```javascript
import baseConfig from '@tasky/tooling-config/eslint/base';

export default [...baseConfig, { ignores: ['dist/', 'src/generated/'] }];
```

Create `apps/web/eslint.config.mjs`:

```javascript
import reactConfig from '@tasky/tooling-config/eslint/react';

export default [
  ...reactConfig,
  { ignores: ['dist/', 'coverage/', 'playwright-report/', 'test-results/'] },
];
```

Create `apps/mobile/eslint.config.mjs`:

```javascript
import expoFlat from 'eslint-config-expo/flat';
import { baseConfig, mobileOverrides } from '@tasky/tooling-config/eslint/react-native';

export default [
  ...expoFlat,
  ...baseConfig,
  ...mobileOverrides,
  { ignores: ['.expo/', 'dist/', 'coverage/'] },
];
```

**Note:** The mobile config is the tricky one. `eslint-config-expo/flat` defines `@typescript-eslint` in a single config object scoped to `*.ts/tsx`. If there are plugin conflicts, the implementer should filter out Expo's TS config entry and merge our `baseConfig` rules into the same scoped object. Test with `pnpm --filter @tasky/mobile lint` and iterate.

- [ ] **Step 6: Delete legacy ESLint configs**

```bash
rm apps/web/.eslintrc.cjs
rm apps/mobile/.eslintrc.cjs
rm packages/core/.eslintrc.cjs
rm packages/design-tokens/.eslintrc.cjs
rm packages/sdk/.eslintrc.cjs
```

- [ ] **Step 7: Update lint scripts in all workspace `package.json` files**

In `apps/web/package.json`, change `lint` to:

```json
"lint": "eslint \"src/**/*.{ts,tsx}\" \"e2e/**/*.ts\" \"*.ts\""
```

In `apps/mobile/package.json`, change `lint` to:

```json
"lint": "eslint \"src/**/*.{ts,tsx}\""
```

In `packages/core/package.json`, change `lint` to:

```json
"lint": "eslint \"src/**/*.{ts,tsx}\""
```

In `packages/design-tokens/package.json`, change `lint` to:

```json
"lint": "eslint \"src/**/*.ts\""
```

SDK lint script stays as `"lint": "echo 'SDK is generated — lint skipped.'"`.

- [ ] **Step 8: Remove ESLint deps moved to shared config from individual workspaces**

From `apps/web/package.json` devDependencies, remove:

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

From `packages/core/package.json` devDependencies, remove:

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`

From `packages/design-tokens/package.json` devDependencies, remove:

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`

Add `"@tasky/tooling-config": "workspace:*"` to devDependencies of: `apps/mobile/package.json` (other workspaces got this in Task 3).

Ensure `"eslint": "9.39.2"` remains in each workspace's devDependencies (needed for the CLI binary).

- [ ] **Step 9: Update `.lintstagedrc.json`**

Replace the full file:

```json
{
  "*.{ts,tsx}": ["eslint --fix --no-error-on-unmatched-pattern", "prettier --write"],
  "*.{json,yaml,yml,md,css}": ["prettier --write"],
  "*.java": ["bash -c 'cd \"$(git rev-parse --show-toplevel)\" && ./gradlew spotlessApply -x test'"]
}
```

Note the order: ESLint first (structural fixes: import sorting, unused imports), then Prettier (formatting).

- [ ] **Step 10: Install and verify**

```bash
pnpm install

# Test lint on each workspace (expect warnings from new rules, not errors from config)
pnpm --filter @tasky/core lint 2>&1 | tail -3
pnpm --filter @tasky/design-tokens lint 2>&1 | tail -3
pnpm --filter @tasky/web lint 2>&1 | tail -3
# Mobile may fail — see note in Step 5 about Expo flat config merging
pnpm --filter @tasky/mobile lint 2>&1 | tail -3
```

Expected: Configs resolve. New warnings from import sorting / unused imports are expected and acceptable.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore(lint): migrate ESLint to flat config with shared @tasky/tooling-config"
```

---

## Task 5: Prettier & Formatting

**Files:**

- Modify: `.editorconfig` (already done in Task 1 — verify)

No file changes needed beyond what Task 1 and Task 4 already cover:

- `eslint-config-prettier` is already in `base.mjs` (Task 4)
- lint-staged order is already fixed (Task 4)
- `.editorconfig` `*.mjs`/`*.cjs` sections are already added (Task 1)

- [ ] **Step 1: Verify Prettier + ESLint don't conflict**

```bash
# Run Prettier then ESLint on a TS file — should produce no diff
echo 'import { foo } from "bar"; export const x = foo;' > /tmp/test-prettier-eslint.ts
prettier --write /tmp/test-prettier-eslint.ts
npx eslint --fix /tmp/test-prettier-eslint.ts 2>/dev/null
prettier --check /tmp/test-prettier-eslint.ts
rm /tmp/test-prettier-eslint.ts
```

Expected: `prettier --check` passes (no conflict between ESLint fix and Prettier).

- [ ] **Step 2: Verify `.editorconfig` has all required sections**

Confirm `.editorconfig` includes `[*.{js,mjs,cjs,ts,tsx}]` and `[Dockerfile*]` sections (added in Task 1). No additional changes needed.

- [ ] **Step 3: Commit (only if there were fixes)**

If any corrections were needed:

```bash
git add .editorconfig .prettierrc
git commit -m "chore(format): verify Prettier/ESLint non-conflict"
```

---

## Task 6: Testing Infrastructure — Vitest Unification

**Files:**

- Create: `packages/test-utils/package.json`, `packages/test-utils/tsconfig.json`, `packages/test-utils/src/index.ts`, `packages/test-utils/src/query-client.ts`, `packages/test-utils/src/render-helpers.tsx`, `packages/test-utils/src/mocks/index.ts`, `packages/test-utils/src/mocks/reanimated.ts`, `packages/test-utils/src/mocks/async-storage.ts`, `packages/test-utils/src/mocks/safe-area-context.ts`
- Create: `apps/mobile/vitest.config.ts`, `apps/mobile/vitest.setup.ts`
- Create: `packages/core/vitest.config.ts`
- Delete: `apps/mobile/jest.config.js`, `apps/mobile/jest.setup.ts`, `apps/mobile/__tests__/test-utils/reanimated-mock.js`, `apps/mobile/__tests__/test-utils/queryClient.ts`, `apps/mobile/__tests__/test-utils/mockI18n.ts`
- Modify: `apps/mobile/package.json`, `apps/mobile/tsconfig.json`, `packages/core/package.json`, `packages/design-tokens/package.json`, `packages/sdk/package.json`, `package.json` (root), `AGENTS.md`

- [ ] **Step 1: Create `packages/test-utils` package**

Create `packages/test-utils/package.json`:

```json
{
  "name": "@tasky/test-utils",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./mocks": "./src/mocks/index.ts"
  },
  "engines": {
    "node": ">=22"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "vitest": "^4.0.0"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.28.0",
    "@testing-library/react": "^16.3.0"
  },
  "devDependencies": {
    "@tasky/tooling-config": "workspace:*",
    "@types/react": "^19.0.0",
    "react": "19.2.5",
    "typescript": "6.0.2",
    "vitest": "4.1.4"
  }
}
```

Create `packages/test-utils/tsconfig.json`:

```json
{
  "extends": "@tasky/tooling-config/tsconfig/react",
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Create shared test utilities**

Create `packages/test-utils/src/query-client.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
```

Create `packages/test-utils/src/render-helpers.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

import { createTestQueryClient } from './query-client';

interface WrapperOptions {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & WrapperOptions,
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options ?? {};

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}
```

Create `packages/test-utils/src/mocks/reanimated.ts`:

```typescript
// Reanimated mock for Vitest — replaces apps/mobile/__tests__/test-utils/reanimated-mock.js
export const withTiming = (value: number) => value;
export const withSpring = (value: number) => value;
export const withSequence = (...values: number[]) => values[values.length - 1];
export const withDelay = (_delay: number, value: number) => value;
export const useSharedValue = (initial: number) => ({ value: initial });
export const useAnimatedStyle = (fn: () => object) => fn();
export const useAnimatedScrollHandler = () => ({});
export const useDerivedValue = (fn: () => number) => ({ value: fn() });
export const useAnimatedGestureHandler = () => ({});
export const runOnJS = (fn: Function) => fn;
export const runOnUI = (fn: Function) => fn;
export const Easing = {
  linear: (x: number) => x,
  ease: (x: number) => x,
  bezier: () => (x: number) => x,
  in: (fn: Function) => fn,
  out: (fn: Function) => fn,
  inOut: (fn: Function) => fn,
};

export default {
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedGestureHandler,
  runOnJS,
  runOnUI,
  Easing,
  createAnimatedComponent: (component: unknown) => component,
};
```

Create `packages/test-utils/src/mocks/async-storage.ts`:

```typescript
const store: Record<string, string> = {};

export default {
  getItem: async (key: string) => store[key] ?? null,
  setItem: async (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: async (key: string) => {
    delete store[key];
  },
  clear: async () => {
    Object.keys(store).forEach((key) => delete store[key]);
  },
  getAllKeys: async () => Object.keys(store),
  multiGet: async (keys: string[]) =>
    keys.map((key) => [key, store[key] ?? null] as [string, string | null]),
  multiSet: async (entries: [string, string][]) => {
    entries.forEach(([key, value]) => {
      store[key] = value;
    });
  },
  multiRemove: async (keys: string[]) => {
    keys.forEach((key) => delete store[key]);
  },
};
```

Create `packages/test-utils/src/mocks/safe-area-context.ts`:

```typescript
import type { ReactNode } from 'react';

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 375, height: 812 };

export const SafeAreaProvider = ({ children }: { children: ReactNode }) => children;
export const SafeAreaView = ({ children }: { children: ReactNode }) => children;
export const useSafeAreaInsets = () => insets;
export const useSafeAreaFrame = () => frame;
export const SafeAreaInsetsContext = {
  Consumer: ({ children }: { children: (value: typeof insets) => ReactNode }) => children(insets),
};
```

Create `packages/test-utils/src/mocks/index.ts`:

```typescript
export { default as AsyncStorageMock } from './async-storage';
export { default as ReanimatedMock } from './reanimated';
export * as SafeAreaContextMock from './safe-area-context';
```

Create `packages/test-utils/src/index.ts`:

```typescript
export { createTestQueryClient } from './query-client';
export { renderWithProviders } from './render-helpers';
```

- [ ] **Step 3: Create mobile Vitest config**

Create `apps/mobile/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    deps: {
      inline: [
        /react-native/,
        /@react-native/,
        /expo/,
        /@expo/,
        /nativewind/,
        /react-native-reanimated/,
        /react-native-worklets/,
      ],
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 60,
        functions: 55,
        branches: 55,
        statements: 60,
      },
      reporter: ['text', 'json'],
    },
  },
});
```

Create `apps/mobile/vitest.setup.ts`:

```typescript
import { vi } from 'vitest';
import { notifyManager } from '@tanstack/react-query';

// Force synchronous TanStack Query notifications to avoid act() warnings
notifyManager.setScheduler((cb) => cb());

// Set timezone for consistent date handling
process.env.TZ = 'Asia/Ulaanbaatar';

// Mock react-native-reanimated
vi.mock('react-native-reanimated', async () => {
  const { ReanimatedMock } = await import('@tasky/test-utils/mocks');
  return ReanimatedMock;
});

// Mock react-native-worklets
vi.mock('react-native-worklets', () => ({
  createWorklet: vi.fn(),
  useWorklet: vi.fn(),
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', async () => {
  const { SafeAreaContextMock } = await import('@tasky/test-utils/mocks');
  return SafeAreaContextMock;
});

// Mock @react-native-async-storage/async-storage
vi.mock('@react-native-async-storage/async-storage', async () => {
  const { AsyncStorageMock } = await import('@tasky/test-utils/mocks');
  return { default: AsyncStorageMock };
});

// Mock expo/virtual/env
vi.mock('expo/virtual/env', () => ({}));
```

- [ ] **Step 4: Create core Vitest config**

Create `packages/core/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
      reporter: ['text', 'json'],
    },
  },
});
```

- [ ] **Step 5: Update mobile `package.json` — swap Jest for Vitest**

In `apps/mobile/package.json`:

Remove from `devDependencies`:

- `"@react-native/jest-preset"`
- `"@testing-library/jest-native"`
- `"@types/jest"`
- `"jest"`
- `"jest-expo"`
- `"react-test-renderer"`

Add to `devDependencies`:

- `"vitest": "4.1.4"`
- `"@vitest/coverage-v8": "4.1.4"`
- `"jsdom": "29.0.2"`
- `"@tasky/test-utils": "workspace:*"`

Change scripts:

- `"test:unit"`: `"jest --runInBand"` → `"vitest run --reporter verbose"`
- `"test:coverage"`: add `"vitest run --reporter verbose --coverage"`

- [ ] **Step 6: Update mobile `tsconfig.json` — swap Jest types for Vitest**

In `apps/mobile/tsconfig.json`, change:

```json
"types": ["jest", "node"]
```

to:

```json
"types": ["vitest/globals", "node"]
```

- [ ] **Step 7: Delete old Jest files**

```bash
rm apps/mobile/jest.config.js
rm apps/mobile/jest.setup.ts
rm apps/mobile/__tests__/test-utils/reanimated-mock.js
rm apps/mobile/__tests__/test-utils/queryClient.ts
rm apps/mobile/__tests__/test-utils/mockI18n.ts
```

If `__tests__/test-utils/` is now empty, remove the directory.

- [ ] **Step 8: Update packages/core and packages/sdk test scripts**

In `packages/core/package.json`, add to `devDependencies`:

- `"vitest": "4.1.4"`
- `"@vitest/coverage-v8": "4.1.4"`
- `"jsdom": "29.0.2"`
- `"@testing-library/react": "16.3.2"`
- `"@tasky/test-utils": "workspace:*"`

Add script:

- `"test"`: `"vitest run --reporter verbose"`

In `packages/design-tokens/package.json`, change script:

- `"test"`: `"echo 'No tests'..."` → `"tsc --noEmit"`

In `packages/sdk/package.json`, change script:

- `"test"`: `"echo 'No SDK tests...'"` → `"tsc --noEmit"`

- [ ] **Step 9: Add root `test:coverage` script**

In root `package.json`, add to `scripts`:

```json
"test:coverage": "pnpm -r test:coverage"
```

- [ ] **Step 10: Document testing conventions in AGENTS.md**

Append to `AGENTS.md`:

```markdown
### Testing

- **Framework:** Vitest everywhere (web, mobile, packages). Do not introduce Jest.
- **Shared test utilities:** `@tasky/test-utils` provides `createTestQueryClient()`,
  `renderWithProviders()`, and common mocks (Reanimated, AsyncStorage, SafeAreaContext).
  Import from `@tasky/test-utils` or `@tasky/test-utils/mocks` — do not duplicate mocks.
- **Coverage floors:** 60% lines, 55% functions/branches, 60% statements (enforced per-workspace).
  `packages/core` starts at 0% until tests are written.
- **Generated packages** (`sdk`, `design-tokens`): Use `tsc --noEmit` as test script.
  Unit tests are not needed for generated/static code.
```

- [ ] **Step 11: Install and verify**

```bash
pnpm install

# Verify Vitest resolves in mobile
pnpm --filter @tasky/mobile vitest --version

# Verify core Vitest config
pnpm --filter @tasky/core vitest --version

# Verify test scripts work (will have 0 tests in mobile/core, that's expected)
pnpm --filter @tasky/sdk test
pnpm --filter @tasky/design-tokens test
```

Expected: No Jest references remain. Vitest CLI resolves in all workspaces.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "test(infra): unify on Vitest, create shared test-utils package"
```

---

## Task 7: Gradle & Backend Configuration

**Files:**

- Create: `gradle/libs.versions.toml`, `gradle.properties`
- Modify: `services/api/build.gradle.kts`, `qodana.yaml`

- [ ] **Step 1: Create Gradle version catalog**

Create `gradle/libs.versions.toml`:

```toml
[versions]
spring-boot = "3.5.13"
spring-dependency-management = "1.1.7"
openapi-generator = "7.21.0"
spotbugs-gradle = "6.1.11"
errorprone-gradle = "4.1.0"
owasp = "12.1.0"
spotless = "6.25.0"
pitest-gradle = "1.15.0"

jdbi = "3.52.1"
testcontainers = "1.21.4"
jjwt = "0.13.0"
aws-sdk = "2.29.46"
firebase-admin = "9.4.2"
logstash-logback = "8.0"
jsoup = "1.18.3"
shedlock = "7.7.0"
archunit = "1.4.1"
swagger-validator = "2.46.1"
checkstyle = "10.21.2"
spotbugs = "4.8.6"
errorprone-core = "2.36.0"
findsecbugs = "1.13.0"
palantir-java-format = "2.47.0"
pitest = "1.17.0"
pitest-junit5 = "1.2.1"
jacoco = "0.8.12"

[libraries]
# JDBI
jdbi-core = { module = "org.jdbi:jdbi3-core", version.ref = "jdbi" }
jdbi-sqlobject = { module = "org.jdbi:jdbi3-sqlobject", version.ref = "jdbi" }
jdbi-postgres = { module = "org.jdbi:jdbi3-postgres", version.ref = "jdbi" }
jdbi-jackson2 = { module = "org.jdbi:jdbi3-jackson2", version.ref = "jdbi" }
jdbi-spring5 = { module = "org.jdbi:jdbi3-spring5", version.ref = "jdbi" }

# ShedLock
shedlock-spring = { module = "net.javacrumbs.shedlock:shedlock-spring", version.ref = "shedlock" }
shedlock-jdbc = { module = "net.javacrumbs.shedlock:shedlock-provider-jdbc-template", version.ref = "shedlock" }

# JWT
jjwt-api = { module = "io.jsonwebtoken:jjwt-api", version.ref = "jjwt" }
jjwt-impl = { module = "io.jsonwebtoken:jjwt-impl", version.ref = "jjwt" }
jjwt-jackson = { module = "io.jsonwebtoken:jjwt-jackson", version.ref = "jjwt" }

# AWS
aws-s3 = { module = "software.amazon.awssdk:s3", version.ref = "aws-sdk" }

# Logging
logstash-logback = { module = "net.logstash.logback:logstash-logback-encoder", version.ref = "logstash-logback" }

# Misc
jsoup = { module = "org.jsoup:jsoup", version.ref = "jsoup" }
firebase-admin = { module = "com.google.firebase:firebase-admin", version.ref = "firebase-admin" }

# Test
testcontainers-bom = { module = "org.testcontainers:testcontainers-bom", version.ref = "testcontainers" }
testcontainers-core = { module = "org.testcontainers:testcontainers", version.ref = "testcontainers" }
testcontainers-junit = { module = "org.testcontainers:junit-jupiter", version.ref = "testcontainers" }
testcontainers-jdbc = { module = "org.testcontainers:jdbc", version.ref = "testcontainers" }
testcontainers-db-commons = { module = "org.testcontainers:database-commons", version.ref = "testcontainers" }
testcontainers-postgres = { module = "org.testcontainers:postgresql", version.ref = "testcontainers" }
archunit = { module = "com.tngtech.archunit:archunit-junit5", version.ref = "archunit" }
swagger-validator = { module = "com.atlassian.oai:swagger-request-validator-mockmvc", version.ref = "swagger-validator" }

# Static analysis
errorprone-core = { module = "com.google.errorprone:error_prone_core", version.ref = "errorprone-core" }
findsecbugs = { module = "com.h3xstream.findsecbugs:findsecbugs-plugin", version.ref = "findsecbugs" }
spotbugs-annotations = { module = "com.github.spotbugs:spotbugs-annotations", version.ref = "spotbugs" }

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spring-dependency-management = { id = "io.spring.dependency-management", version.ref = "spring-dependency-management" }
openapi-generator = { id = "org.openapi.generator", version.ref = "openapi-generator" }
spotbugs = { id = "com.github.spotbugs", version.ref = "spotbugs-gradle" }
errorprone = { id = "net.ltgt.errorprone", version.ref = "errorprone-gradle" }
owasp = { id = "org.owasp.dependencycheck", version.ref = "owasp" }
spotless = { id = "com.diffplug.spotless", version.ref = "spotless" }
pitest = { id = "info.solidsoft.pitest", version.ref = "pitest-gradle" }
```

- [ ] **Step 2: Migrate `services/api/build.gradle.kts` to use version catalog**

Replace the plugins block:

```kotlin
plugins {
    java
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.openapi.generator)
    jacoco
    checkstyle
    pmd
    alias(libs.plugins.spotbugs)
    alias(libs.plugins.errorprone)
    alias(libs.plugins.owasp)
    alias(libs.plugins.spotless)
    alias(libs.plugins.pitest)
}
```

Remove the local version variables:

```kotlin
// DELETE these lines:
// val jdbiVersion = "3.52.1"
// val testcontainersVersion = "1.21.4"
// val jjwtVersion = "0.13.0"
```

Replace all dependency declarations with catalog references. For example:

```kotlin
dependencies {
    // Spring Boot (managed by BOM — no version needed)
    implementation("org.springframework.boot:spring-boot-starter-web")
    // ... other Spring starters unchanged ...

    // JDBI
    implementation(libs.jdbi.core)
    implementation(libs.jdbi.sqlobject)
    implementation(libs.jdbi.postgres)
    implementation(libs.jdbi.jackson2)
    implementation(libs.jdbi.spring5)

    // ShedLock
    implementation(libs.shedlock.spring)
    implementation(libs.shedlock.jdbc)

    // JWT
    implementation(libs.jjwt.api)
    runtimeOnly(libs.jjwt.impl)
    runtimeOnly(libs.jjwt.jackson)

    // AWS S3 / MinIO
    implementation(libs.aws.s3)

    // Logging
    implementation(libs.logstash.logback)

    // Jackson (managed by BOM)
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")
    implementation(libs.jsoup)

    // Firebase
    implementation(libs.firebase.admin)

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation(libs.testcontainers.core)
    testImplementation(libs.testcontainers.junit)
    testImplementation(libs.testcontainers.jdbc)
    testImplementation(libs.testcontainers.db.commons)
    testImplementation(libs.testcontainers.postgres)
    testImplementation(libs.archunit)
    testImplementation(libs.swagger.validator)

    // Static analysis
    errorprone(libs.errorprone.core)
    spotbugsPlugins(libs.findsecbugs)
    compileOnly(libs.spotbugs.annotations)
    testCompileOnly(libs.spotbugs.annotations)
}
```

Update version references in tool configs:

```kotlin
checkstyle {
    toolVersion = libs.versions.checkstyle.get()
    // ...
}

spotbugs {
    toolVersion = libs.versions.spotbugs.get()
    // ...
}

jacoco {
    toolVersion = libs.versions.jacoco.get()
}

pitest {
    pitestVersion.set(libs.versions.pitest.get())
    junit5PluginVersion.set(libs.versions.pitest.junit5.get())
    // ...
}

spotless {
    java {
        palantirJavaFormat(libs.versions.palantir.java.format.get()).style("PALANTIR")
        // ...
    }
}

pmd {
    toolVersion = libs.versions.pmd.get()  // Note: add pmd version to catalog if not already
    // ...
}
```

**Note:** PMD version `7.9.0` is not yet in the catalog. Add it:

In `gradle/libs.versions.toml` `[versions]` section, add: `pmd = "7.9.0"`

- [ ] **Step 3: Wire JaCoCo into `gateRegression`**

In `services/api/build.gradle.kts`, find the `gateRegression` task and add `jacocoTestCoverageVerification`:

```kotlin
tasks.register<Exec>("gateRegression") {
    description = "Gate 2: all Critical + High scenarios covered and API contract valid. Blocks deploy."
    group = "verification"
    dependsOn(
        tasks.test,
        tasks.jacocoTestReport,
        "jacocoTestCoverageVerification",  // ADD THIS LINE
        "openApiValidate",
    )
    // ... rest unchanged ...
}
```

- [ ] **Step 4: Wire OWASP into `gateFull`**

In `services/api/build.gradle.kts`, find the `gateFull` task and add `dependencyCheckAnalyze`:

```kotlin
tasks.register<Exec>("gateFull") {
    description = "Gate 3: all scenarios + PIT floors. Runs nightly."
    group = "verification"
    dependsOn(tasks.test, tasks.jacocoTestReport, "pitest", "dependencyCheckAnalyze")  // ADD dependencyCheckAnalyze
    // ... rest unchanged ...
}
```

- [ ] **Step 5: Create `gradle.properties`**

Create `gradle.properties` at monorepo root:

```properties
# Disable daemon in CI — stateless containers don't benefit from persistent daemon.
# Matches existing --no-daemon usage in CI workflows.
org.gradle.daemon=false

# Parallel project execution (safe — single module, but future-proofs multi-module)
org.gradle.parallel=true

# Worker thread limit
org.gradle.workers.max=4

# JVM memory for Gradle process
org.gradle.jvmargs=-Xmx2g

# Enable local build cache
org.gradle.caching=true
```

- [ ] **Step 6: Rewrite `qodana.yaml`**

Replace the full file:

```yaml
version: '1.0'

profile:
  name: qodana.recommended

projectJDK: '21'

exclude:
  - name: All
    paths:
      - '**/build/generated-sources/**'
      - '**/generated/**'

failureConditions:
  severityThresholds:
    any: 15
    critical: 5
  testCoverageThresholds:
    fresh: 70
    total: 50

linter: jetbrains/qodana-jvm:2025.3
```

- [ ] **Step 7: Add comment to test seed data migration**

In `services/api/src/main/resources/db/migration/V19__seed_test_data.sql`, add a comment block at the top (or update existing header):

```sql
-- DEV/TEST SEED DATA
-- This migration inserts test personas used by the local dev-auth flow.
-- It runs in all environments (Flyway's checksum chain requires it to stay).
-- Production safety: seeded phone numbers (+97692/93/94...) are test-only ranges.
-- Future consideration: guard with a runtime check or Spring profile conditional.
```

- [ ] **Step 8: Note — `@ConfigurationProperties` validation deferred**

The spec calls for `@Validated @ConfigurationProperties(prefix = "tasky")` classes.
This requires creating new Java source files in `services/api/src/main/java/` — which is
application source code, not scaffolding/config. **Deferred to the "Code Fixes" task.**

- [ ] **Step 9: Verify Gradle build still works**

```bash
./gradlew --no-daemon :services:api:compileJava 2>&1 | tail -5
./gradlew --no-daemon :services:api:checkstyleMain 2>&1 | tail -3
```

Expected: Compilation succeeds. Version catalog references resolve correctly.

- [ ] **Step 10: Commit**

```bash
git add gradle/libs.versions.toml gradle.properties qodana.yaml \
  services/api/build.gradle.kts
git commit -m "chore(gradle): add version catalog, gradle.properties, wire quality gates"
```

---

## Task 8: Docker Configuration

**Files:**

- Create: `apps/web/.dockerignore`
- Modify: `Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`

- [ ] **Step 1: Fix Node version and add non-root user to web Dockerfile**

In `apps/web/Dockerfile`, change line 1:

```dockerfile
FROM node:22-bookworm AS build
```

After the `COPY --from=build` line and before `EXPOSE`, add non-root user:

```dockerfile
RUN addgroup --system caddy && adduser --system --ingroup caddy caddy
USER caddy
```

- [ ] **Step 2: Pin base image digests in production Dockerfiles**

Look up the current SHA digests:

```bash
docker pull eclipse-temurin:21-jdk --quiet 2>/dev/null
docker inspect --format='{{index .RepoDigests 0}}' eclipse-temurin:21-jdk 2>/dev/null || echo "Pull images to get digests"
```

In `Dockerfile`, change the FROM lines to include digest pins. Example format (actual digests will vary):

```dockerfile
# Pin digests for reproducible builds. Update digests when upgrading base images.
FROM eclipse-temurin:21-jdk@sha256:<ACTUAL_DIGEST> AS build
# ...
FROM eclipse-temurin:21-jre@sha256:<ACTUAL_DIGEST>
```

Do the same for `apps/web/Dockerfile`:

```dockerfile
FROM node:22-bookworm@sha256:<ACTUAL_DIGEST> AS build
# ...
FROM caddy:2.9-alpine@sha256:<ACTUAL_DIGEST>
```

**Note:** The implementer must pull images and capture the actual digests. The `@sha256:` suffix is appended to the existing tag.

- [ ] **Step 3: Create `apps/web/.dockerignore`**

```dockerignore
node_modules
dist
coverage
playwright-report
test-results
.env*
*.md
.eslintrc.*
eslint.config.*
vitest.config.*
tsconfig.json
```

- [ ] **Step 4: Add health check to app service in `docker-compose.yml`**

In `docker-compose.yml`, add to the `app` service (after `restart: unless-stopped`):

```yaml
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:8080/actuator/health/liveness']
  interval: 10s
  timeout: 5s
  retries: 6
```

- [ ] **Step 5: Add inline comment to private staging compose**

In `docker-compose.private-staging.yml`, add a comment above the `SPRING_PROFILES_ACTIVE` line:

```yaml
# Intentionally 'local' (not 'prod') — keeps dev auth enabled for sandbox testing.
# This is NOT a mistake. See docs/maintenance/STAGING_RUNBOOK.md.
SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-local}
```

- [ ] **Step 6: Verify and commit**

```bash
docker compose config --quiet  # Validate compose syntax
cat apps/web/.dockerignore

git add Dockerfile apps/web/Dockerfile apps/web/.dockerignore \
  docker-compose.yml docker-compose.private-staging.yml
git commit -m "chore(docker): fix Node version, add health check, pin digests, harden web image"
```

---

## Task 9: Security Scanning Configuration

**Files:**

- Create: `.gitleaks.toml`, `.trivyignore`
- Modify: `tooling/config/semgrep/tasky-rules.yaml`, `tooling/config/spotbugs/spotbugs-exclude.xml`, `.husky/pre-push`

**Note:** `eslint-plugin-security` and `eslint-plugin-no-secrets` are already installed in Task 4 (they're in `@tasky/tooling-config`'s dependencies and configured in `base.mjs`).

- [ ] **Step 1: Create `.gitleaks.toml`**

```toml
title = "Tasky gitleaks config"

[allowlist]
  description = "Allow test/example files with placeholder secrets"
  paths = [
    '''.env\.example$''',
    '''.env\.private-staging\.example$''',
    '''application-test\.yml$''',
    '''jest\.setup\.ts$''',
    '''vitest\.setup\.ts$''',
  ]
```

- [ ] **Step 2: Create `.trivyignore`**

```
# Trivy CVE suppressions — each entry must have an expiry date and justification.
# Run: tooling/scripts/check-trivyignore-expiry.sh to verify no expired entries.
#
# Format:
#   CVE-YYYY-NNNNN  # expires: YYYY-MM-DD  reason: <short justification>
#
# No suppressions yet — add as needed when trivy is integrated.
```

- [ ] **Step 3: Expand Semgrep rules**

Append to `tooling/config/semgrep/tasky-rules.yaml`:

```yaml

  - id: no-hardcoded-secrets
    patterns:
      - pattern-regex: "(password|secret|api_key|apikey|token|private_key)\s*=\s*\"[^\"]{8,}\""
    paths:
      exclude:
        - "**/test/**"
        - "**/application-test.yml"
        - "**/.env.example"
    message: "Potential hardcoded secret detected. Use environment variables or a secrets manager."
    languages: [java]
    severity: ERROR

  - id: no-string-format-in-sql
    pattern: |
      String.format("..." + $SQL + "...", ...)
    message: "Use @Bind parameters instead of String.format in SQL queries"
    languages: [java]
    severity: ERROR

  - id: spring-csrf-disabled
    pattern: |
      $HTTP.csrf(csrf -> csrf.disable())
    paths:
      exclude:
        - "**/test/**"
    message: "CSRF protection is disabled. Ensure this is intentional and documented."
    languages: [java]
    severity: WARNING

  - id: no-system-out
    patterns:
      - pattern-either:
          - pattern: System.out.$METHOD(...)
          - pattern: System.err.$METHOD(...)
    paths:
      exclude:
        - "**/test/**"
    message: "Use SLF4J logger instead of System.out/err"
    languages: [java]
    severity: WARNING
```

- [ ] **Step 4: Tighten SpotBugs EI_EXPOSE_REP exclusion**

Replace the blanket `EI_EXPOSE_REP` / `EI_EXPOSE_REP2` matches in `tooling/config/spotbugs/spotbugs-exclude.xml` with scoped exclusions:

Replace:

```xml
    <!--
        DTO and API records are immutable transfer shapes in this codebase.
        SpotBugs reports EI_EXPOSE_REP* on record accessors that intentionally expose
        already-owned values.
    -->
    <Match>
        <Bug pattern="EI_EXPOSE_REP"/>
    </Match>
    <Match>
        <Bug pattern="EI_EXPOSE_REP2"/>
    </Match>
```

With:

```xml
    <!--
        DTO and API records are immutable transfer shapes.
        EI_EXPOSE_REP* on record accessors that return String, primitives, or
        other immutable types are false positives. Scoped to DTO/response packages.
    -->
    <Match>
        <Bug pattern="EI_EXPOSE_REP"/>
        <Or>
            <Class name="~mn\.tasky\..*\.dto\..*"/>
            <Class name="~mn\.tasky\..*\.response\..*"/>
            <Class name="~mn\.tasky\.api\.generated\.model\..*"/>
        </Or>
    </Match>
    <Match>
        <Bug pattern="EI_EXPOSE_REP2"/>
        <Or>
            <Class name="~mn\.tasky\..*\.dto\..*"/>
            <Class name="~mn\.tasky\..*\.response\..*"/>
            <Class name="~mn\.tasky\.api\.generated\.model\..*"/>
        </Or>
    </Match>
```

- [ ] **Step 5: Wire gitleaks into pre-commit and trivyignore expiry into pre-push**

In `.husky/pre-commit`, add before the lint-staged line:

```bash
# Secret scanning on staged files (requires gitleaks installed)
if command -v gitleaks &> /dev/null; then
  gitleaks git --pre-commit --staged --config .gitleaks.toml
fi
```

In `.husky/pre-push`, add after the migration validation line:

```bash
bash tooling/scripts/check-trivyignore-expiry.sh || exit 1
```

- [ ] **Step 6: Verify and commit**

```bash
# Verify Semgrep YAML is valid
python3 -c "import yaml; yaml.safe_load(open('tooling/config/semgrep/tasky-rules.yaml'))"

# Verify SpotBugs XML is valid
xmllint --noout tooling/config/spotbugs/spotbugs-exclude.xml 2>/dev/null || echo "xmllint not available — manual review"

git add .gitleaks.toml .trivyignore \
  tooling/config/semgrep/tasky-rules.yaml \
  tooling/config/spotbugs/spotbugs-exclude.xml \
  .husky/pre-commit .husky/pre-push
git commit -m "security(config): add gitleaks, expand semgrep, tighten spotbugs"
```

---

## Task 10: Developer Experience

**Files:**

- Create: `.vscode/extensions.json`, `.vscode/launch.json`
- Modify: `.vscode/settings.json`, `.husky/pre-push`, `.editorconfig`
- Create: `.husky/post-checkout`

- [ ] **Step 1: Create `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vscjava.vscode-java-pack",
    "ms-azuretools.vscode-docker",
    "bradlc.vscode-tailwindcss",
    "mikestead.dotenv"
  ]
}
```

- [ ] **Step 2: Create `.vscode/launch.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Attach to Spring Boot (port 5005)",
      "request": "attach",
      "hostName": "localhost",
      "port": 5005
    },
    {
      "type": "chrome",
      "name": "Launch Vite Dev Server",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/web/src"
    },
    {
      "type": "node",
      "name": "Debug Current Vitest File",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "--reporter", "verbose", "${relativeFile}"],
      "console": "integratedTerminal",
      "cwd": "${fileDirname}"
    }
  ]
}
```

- [ ] **Step 3: Update `.vscode/settings.json`**

Replace the full file:

```json
{
  "java.compile.nullAnalysis.mode": "automatic",
  "java.configuration.updateBuildConfiguration": "automatic",
  "eslint.useFlatConfig": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "[java]": {
    "editor.defaultFormatter": "redhat.java"
  }
}
```

- [ ] **Step 4: Add post-checkout hook**

Create `.husky/post-checkout`:

```bash
#!/usr/bin/env bash
# Auto-install dependencies when pnpm-lock.yaml changes between branches

PREV_HEAD=$1
POST_HEAD=$2
IS_BRANCH_CHECKOUT=$3

# Only run on branch checkout (not file checkout)
if [ "$IS_BRANCH_CHECKOUT" != "1" ]; then
  exit 0
fi

# Check if lockfile changed between old and new HEAD
if ! git diff --quiet "$PREV_HEAD" "$POST_HEAD" -- pnpm-lock.yaml 2>/dev/null; then
  echo "pnpm-lock.yaml changed — running pnpm install..."
  pnpm install --frozen-lockfile
fi
```

```bash
chmod +x .husky/post-checkout
```

- [ ] **Step 5: Add path filtering to pre-push hook**

Replace the content of `.husky/pre-push` with:

```bash
#!/usr/bin/env bash
echo "Running pre-push checks..."

# Detect docs-only changes — skip heavy checks
CHANGED_FILES=$(git diff --name-only @{push}.. 2>/dev/null || git diff --name-only HEAD~1)
NON_DOC_FILES=$(echo "$CHANGED_FILES" | grep -v -E '^\.(md|txt)$|^docs/|^research/|^README' || true)

if [ -z "$NON_DOC_FILES" ]; then
  echo "Docs-only change detected — running format check only."
  pnpm -r format:check || exit 1
  echo "All pre-push checks passed (docs-only fast path)."
  exit 0
fi

# === Structural checks (~15s) ===

pnpm -r typecheck || exit 1

pnpm workspace:boundaries || exit 1

python3 tooling/scripts/validate-migrations.py || exit 1

./gradlew openApiValidate -q || exit 1

bash tooling/scripts/check-trivyignore-expiry.sh || exit 1

# === Lint + SDK drift (~13s) ===

pnpm -r lint || exit 1

pnpm sdk:drift || exit 1

# === Frontend unit tests (~23s) ===

pnpm --filter @tasky/web test:unit || exit 1

pnpm --filter @tasky/mobile test:unit || exit 1

echo "All pre-push checks passed."
```

- [ ] **Step 6: Update `.gitignore` for VS Code files**

The current `.gitignore` has `.vscode/` which ignores everything. Since we now want to track specific VS Code config files, change:

```
.vscode/
```

to:

```
# VS Code — track workspace settings, ignore user-specific state
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
```

- [ ] **Step 7: Verify and commit**

```bash
ls .vscode/extensions.json .vscode/launch.json .vscode/settings.json
cat .husky/post-checkout | head -3

git add .vscode/ .husky/post-checkout .husky/pre-push .gitignore
git commit -m "chore(dx): add VS Code config, post-checkout hook, optimize pre-push"
```

---

## Final Verification

After all tasks are complete:

- [ ] **Step 1: Full install**

```bash
pnpm install
```

- [ ] **Step 2: Run typecheck (expect strict-flag errors)**

```bash
pnpm -r typecheck 2>&1 | tail -10
```

Expected: Errors from `noUnusedLocals`, `noUnusedParameters`, etc. These are expected and will be fixed in the "Code Fixes" task.

- [ ] **Step 3: Run lint (expect import-order/unused-import warnings)**

```bash
pnpm -r lint 2>&1 | tail -10
```

Expected: Warnings from new rules. These are expected and will be fixed in the "Code Fixes" task.

- [ ] **Step 4: Run format check**

```bash
pnpm -r format:check
```

Expected: Should pass (Prettier config unchanged).

- [ ] **Step 5: Verify Gradle compiles**

```bash
./gradlew --no-daemon :services:api:compileJava 2>&1 | tail -5
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: Verify workspace boundaries**

```bash
pnpm workspace:boundaries
```

Expected: No violations (new packages follow the rules).

- [ ] **Step 7: Final commit (if any straggling changes)**

```bash
git status
# If clean: done
# If changes: stage and commit with appropriate message
```
