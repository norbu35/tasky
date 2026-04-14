# Tooling Config Consolidation & Integration Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing ESLint plugins (eslint-plugin-react, @tanstack/eslint-plugin-query), fix the broken react-native tsconfig, introduce a shared vitest preset, normalize PostCSS format, and centralise the prettier config — all through `@tasky/tooling-config`.

**Architecture:** All shared tooling lives in `tooling/config` (`@tasky/tooling-config`). Workspace configs stay thin: they extend/import the shared preset and add only workspace-local overrides. New exports are added to `tooling/config/package.json` `exports` map. No new packages are created.

**Tech Stack:** ESLint 9 flat config, TypeScript 6, Vitest 4, TailwindCSS v4 (web) / v3 (mobile), Prettier 3, pnpm workspaces.

---

## File Map

| Action | Path                                        | Responsibility                                            |
| ------ | ------------------------------------------- | --------------------------------------------------------- |
| Modify | `tooling/config/eslint/react.mjs`           | Add eslint-plugin-react + @tanstack/eslint-plugin-query   |
| Modify | `tooling/config/eslint/react-native.mjs`    | Compose baseConfig + @tanstack/eslint-plugin-query        |
| Modify | `tooling/config/tsconfig/react-native.json` | Extend base.json (not react.json — removes DOM lib)       |
| Create | `tooling/config/vitest/base.ts`             | Shared vitest environment, coverage thresholds, reporters |
| Create | `tooling/config/prettier/index.mjs`         | Canonical prettier config object                          |
| Modify | `tooling/config/package.json`               | New deps + new exports entries                            |
| Modify | `apps/web/vitest.config.ts`                 | Spread shared preset, keep local overrides                |
| Modify | `apps/web/postcss.config.cjs` → `.mjs`      | Rename + convert to ESM                                   |
| Modify | `apps/mobile/vitest.config.ts`              | Spread shared preset, keep local overrides                |
| Modify | `apps/mobile/tsconfig.json`                 | Multi-extends array, remove redundant strict flags        |
| Modify | `packages/core/vitest.config.ts`            | Spread shared preset, keep local overrides                |
| Modify | `package.json` (root)                       | Add @tasky/tooling-config to devDeps                      |
| Delete | `.prettierrc`                               | Replaced by .prettierrc.mjs                               |
| Create | `.prettierrc.mjs`                           | Re-exports from @tasky/tooling-config/prettier            |

---

## Task 1: Add eslint-plugin-react and @tanstack/eslint-plugin-query

**Files:**

- Modify: `tooling/config/package.json`
- Modify: `tooling/config/eslint/react.mjs`
- Modify: `tooling/config/eslint/react-native.mjs`

- [ ] **Step 1: Install new ESLint plugins into tooling/config**

```bash
pnpm add --filter @tasky/tooling-config eslint-plugin-react @tanstack/eslint-plugin-query
```

Expected: both packages appear in `tooling/config/package.json` under `dependencies`.

- [ ] **Step 2: Rewrite `tooling/config/eslint/react.mjs`**

Replace the entire file with:

```mjs
import baseConfig from './base.mjs';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import queryPlugin from '@tanstack/eslint-plugin-query';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  ...baseConfig,
  ...reactPlugin.configs.flat['jsx-runtime'],
  { settings: { react: { version: 'detect' } } },
  ...queryPlugin.configs['flat/recommended'],
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
  prettierConfig, // must be last — disables all formatting rules
];
```

Notes:

- `reactPlugin.configs.flat['jsx-runtime']` targets React 17+ new JSX transform (no `React` in scope required). Do NOT use `configs.flat.recommended` — it requires `React` in scope.
- `queryPlugin.configs['flat/recommended']` enforces stable query keys, no deprecated options, exhaustive deps.
- `prettierConfig` is re-spread at the end because the new plugins may re-enable formatting rules that prettier must override. This is safe — `eslint-config-prettier` is idempotent.

- [ ] **Step 3: Rewrite `tooling/config/eslint/react-native.mjs`**

Replace the entire file with:

```mjs
import _baseConfig from './base.mjs';
import queryPlugin from '@tanstack/eslint-plugin-query';

// eslint-config-expo must be imported dynamically at the consumer level
// because it requires expo to be installed. This config provides the base rules
// and the mobile-specific overrides that get spread into the consumer's flat config.

export const baseConfig = [..._baseConfig, ...queryPlugin.configs['flat/recommended']];

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
```

Note: `baseConfig` is now a composed array (base + query plugin) rather than a bare re-export of `base.mjs`. The export name is unchanged so `apps/mobile/eslint.config.mjs` needs no edits.

- [ ] **Step 4: Verify web lint loads without error**

```bash
pnpm --filter @tasky/web lint 2>&1 | head -30
```

Expected: either clean output or lint warnings/errors about code violations — NOT "Cannot find module" or "Plugin conflict" errors. If you see a module resolution error, run `pnpm install` and retry.

- [ ] **Step 5: Verify mobile lint loads without error**

```bash
pnpm --filter @tasky/mobile lint 2>&1 | head -30
```

Same expectation as Step 4.

- [ ] **Step 6: Fix any new rule violations**

New rules may flag existing code. The most common new violations:

**`react/jsx-key`** — JSX elements inside `.map()` missing a `key` prop:

```tsx
// Before (flagged):
items.map((item) => <ItemCard item={item} />);

// After (fixed):
items.map((item) => <ItemCard key={item.id} item={item} />);
```

**`@tanstack/query/exhaustive-deps`** — queryFn references a variable not in `queryKey`:

```tsx
// Before (flagged):
useQuery({ queryKey: ['tasks'], queryFn: () => api.getTasks(userId) });

// After (fixed):
useQuery({ queryKey: ['tasks', userId], queryFn: () => api.getTasks(userId) });
```

Run lint for each workspace and fix all errors (warnings are acceptable to leave):

```bash
pnpm --filter @tasky/web lint
pnpm --filter @tasky/mobile lint
```

- [ ] **Step 7: Run full lint suite to confirm clean**

```bash
pnpm -r lint
```

Expected: exits 0 (or only warnings, no errors).

- [ ] **Step 8: Commit**

```bash
git add tooling/config/eslint/react.mjs tooling/config/eslint/react-native.mjs tooling/config/package.json pnpm-lock.yaml
# Also add any source files fixed in Step 6
git add -p
git commit -m "feat(tooling): add eslint-plugin-react and tanstack/query to shared ESLint configs"
```

---

## Task 2: Fix TypeScript — react-native.json and mobile tsconfig

**Files:**

- Modify: `tooling/config/tsconfig/react-native.json`
- Modify: `apps/mobile/tsconfig.json`

- [ ] **Step 1: Fix `tooling/config/tsconfig/react-native.json`**

Replace the entire file with:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {}
}
```

Change is: `"extends": "./react.json"` → `"extends": "./base.json"`. This removes the DOM lib (`"lib": ["ES2022", "DOM", "DOM.Iterable"]`) that `react.json` adds. React Native has no DOM; its types come from `@types/react-native`.

- [ ] **Step 2: Update `apps/mobile/tsconfig.json` to multi-extends**

Replace the entire file with:

```json
{
  "extends": ["expo/tsconfig.base", "@tasky/tooling-config/tsconfig/react-native"],
  "compilerOptions": {
    "baseUrl": ".",
    "ignoreDeprecations": "6.0",
    "paths": {
      "@tasky/core": ["../../packages/core/src/index.ts"]
    },
    "types": ["vitest/globals", "node"]
  },
  "include": [
    "nativewind-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "__tests__/**/*.ts",
    "__tests__/**/*.tsx"
  ]
}
```

Changes from the original:

- `"extends"` becomes an array: expo base first, tasky config second (tasky wins on conflicts)
- `"strict": true` removed (inherited from `base.json`)
- `"skipLibCheck": true` removed (inherited from `base.json`)

`expo/tsconfig.base` sets `module: "preserve"`, `target: "ESNext"`, `lib: ["DOM", "ESNext"]`, `jsx: "react-native"`. Our `base.json` overrides `module` → `ESNext`, `target` → `ES2022`, `moduleResolution` → `Bundler`. The `jsx: "react-native"` and `lib` values from expo are retained (they're correct for RN and base.json doesn't set them).

- [ ] **Step 3: Run mobile typecheck and count errors by category**

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | tee /tmp/mobile-ts-errors.txt
grep -c "error TS" /tmp/mobile-ts-errors.txt || echo "0 errors"
```

Then count errors per new strict flag:

```bash
grep "verbatimModuleSyntax\|'import type'" /tmp/mobile-ts-errors.txt | wc -l
grep "declared but its value is never read\|declared but never used" /tmp/mobile-ts-errors.txt | wc -l
grep "noUncheckedIndexedAccess\|possibly 'undefined'" /tmp/mobile-ts-errors.txt | wc -l
grep "exactOptionalPropertyTypes" /tmp/mobile-ts-errors.txt | wc -l
```

- [ ] **Step 4: Fix verbatimModuleSyntax and noUnusedLocals errors**

These are auto-fixable. For every error of the form:

```
error TS1484: 'Foo' is a type and must be imported using a type-only import
```

Change `import { Foo }` to `import { type Foo }` or `import type { Foo }` in that file.

For every error of the form:

```
error TS6133: 'foo' is declared but its value is never read.
```

Either remove the unused variable or prefix it with `_` (e.g., `_foo`) to suppress the error.

Fix all such errors in `apps/mobile/src/` and `apps/mobile/__tests__/`.

- [ ] **Step 5: Override disruptive flags if error count is high**

After fixing Step 4 errors, run typecheck again:

```bash
pnpm --filter @tasky/mobile typecheck 2>&1 | grep -c "error TS"
```

If there are **more than 20 remaining errors** caused by `noUncheckedIndexedAccess` or `exactOptionalPropertyTypes`, add these overrides to `apps/mobile/tsconfig.json`'s `compilerOptions`:

```json
"noUncheckedIndexedAccess": false,
"exactOptionalPropertyTypes": false
```

These can be re-enabled in a follow-on task once the codebase is ready. If the error count is 20 or fewer, fix them instead of overriding.

- [ ] **Step 6: Confirm typecheck passes**

```bash
pnpm --filter @tasky/mobile typecheck
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add tooling/config/tsconfig/react-native.json apps/mobile/tsconfig.json
# Add any src files fixed in Steps 4-5
git add -p
git commit -m "feat(tooling): fix react-native tsconfig and align mobile strict flags with base"
```

---

## Task 3: Add shared vitest preset to tooling-config

**Files:**

- Create: `tooling/config/vitest/base.ts`
- Modify: `tooling/config/package.json`
- Modify: `apps/web/vitest.config.ts`
- Modify: `apps/mobile/vitest.config.ts`
- Modify: `packages/core/vitest.config.ts`

- [ ] **Step 1: Create `tooling/config/vitest/base.ts`**

```ts
export const baseTestConfig = {
  environment: 'jsdom' as const,
  globals: true,
  coverage: {
    provider: 'v8' as const,
    thresholds: { lines: 60, functions: 55, branches: 55, statements: 60 },
    reporter: ['text', 'json'] as const,
  },
};
```

This is a plain object export, not a `defineConfig` call. Consumers spread it into their own `defineConfig({ test: { ...baseTestConfig, ... } })`. The `as const` assertions preserve the literal types that vitest's config type requires.

- [ ] **Step 2: Edit `tooling/config/package.json` — add exports and vitest optional dep**

`pnpm add` in Task 1 already wrote the `eslint-plugin-react` and `@tanstack/eslint-plugin-query` version entries into `dependencies`. You only need to add three things to this file:

1. `"./vitest/base": "./vitest/base.ts"` to the `exports` map
2. `"./prettier": "./prettier/index.mjs"` to the `exports` map (the file is created in Task 5 — adding the export entry now is safe)
3. `"vitest": "^4.0.0"` to a new `optionalDependencies` section

The final `exports` block should be:

```json
"exports": {
  "./tsconfig/base": "./tsconfig/base.json",
  "./tsconfig/react": "./tsconfig/react.json",
  "./tsconfig/react-native": "./tsconfig/react-native.json",
  "./eslint/base": "./eslint/base.mjs",
  "./eslint/react": "./eslint/react.mjs",
  "./eslint/react-native": "./eslint/react-native.mjs",
  "./vitest/base": "./vitest/base.ts",
  "./prettier": "./prettier/index.mjs"
}
```

And add after `optionalDependencies` (keeping the existing react-hooks and react-refresh entries):

```json
"optionalDependencies": {
  "eslint-plugin-react-hooks": "^7.0.0",
  "eslint-plugin-react-refresh": "^0.4.19",
  "vitest": "^4.0.0"
}
```

- [ ] **Step 3: Rewrite `apps/web/vitest.config.ts`**

Replace the entire file with:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  plugins: [react()],
  test: {
    ...baseTestConfig,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/lib/apiTypes.ts'],
    },
  },
});
```

- [ ] **Step 4: Run web tests to verify**

```bash
pnpm --filter @tasky/web test:unit
```

Expected: same pass/fail result as before this change. The config change must not alter test behaviour.

- [ ] **Step 5: Rewrite `apps/mobile/vitest.config.ts`**

Replace the entire file with:

```ts
import { defineConfig } from 'vitest/config';
import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  test: {
    ...baseTestConfig,
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
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts'],
    },
  },
});
```

Note: `deps.inline` stays — it's mobile-specific (forces Vitest to bundle RN modules through its transformer). `coverage.thresholds` and `coverage.reporter` come from the shared preset.

- [ ] **Step 6: Run mobile tests to verify**

```bash
pnpm --filter @tasky/mobile test:unit
```

Expected: same pass/fail result as before.

- [ ] **Step 7: Rewrite `packages/core/vitest.config.ts`**

Replace the entire file with:

```ts
import { defineConfig } from 'vitest/config';
import { baseTestConfig } from '@tasky/tooling-config/vitest/base';

export default defineConfig({
  test: {
    ...baseTestConfig,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      ...baseTestConfig.coverage,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
      thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
    },
  },
});
```

Note: `thresholds` is overridden to all-zero at the workspace level. This is intentional — core's thresholds are not yet set. The override takes precedence over `baseTestConfig.coverage.thresholds`.

- [ ] **Step 8: Run core tests to verify**

```bash
pnpm --filter @tasky/core test
```

Expected: same pass/fail result as before.

- [ ] **Step 9: Commit**

```bash
git add tooling/config/vitest/base.ts tooling/config/package.json \
  apps/web/vitest.config.ts apps/mobile/vitest.config.ts packages/core/vitest.config.ts
git commit -m "feat(tooling): add shared vitest preset; workspaces spread baseTestConfig"
```

---

## Task 4: PostCSS normalization — rename web config to .mjs

**Files:**

- Delete: `apps/web/postcss.config.cjs`
- Create: `apps/web/postcss.config.mjs`

- [ ] **Step 1: Delete the old .cjs file**

```bash
git rm apps/web/postcss.config.cjs
```

- [ ] **Step 2: Create `apps/web/postcss.config.mjs`**

```mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

This is identical in behaviour to the old `.cjs` file — only the module format changes. The plugin (`@tailwindcss/postcss`) is unchanged. `apps/web` has `"type": "module"` in its `package.json`, making `.mjs` the natural format.

Do NOT change `apps/mobile/postcss.config.mjs` — it uses `tailwindcss: {}` (TailwindCSS v3 pattern) which is correct for NativeWind v4. The split is intentional.

- [ ] **Step 3: Verify the web build picks up the new config**

```bash
pnpm --filter @tasky/web build 2>&1 | tail -10
```

Expected: build succeeds (Vite finds `postcss.config.mjs` automatically). If the build fails with a PostCSS error, check that `@tailwindcss/postcss` is still listed in `apps/web/package.json` devDependencies.

- [ ] **Step 4: Commit**

```bash
git add apps/web/postcss.config.mjs
git commit -m "chore(web): convert postcss config from .cjs to .mjs"
```

---

## Task 5: Prettier in tooling-config

**Files:**

- Create: `tooling/config/prettier/index.mjs`
- Modify: `tooling/config/package.json` (already has `"./prettier"` export from Task 3 — verify it's there)
- Modify: `package.json` (root)
- Delete: `.prettierrc`
- Create: `.prettierrc.mjs`

- [ ] **Step 1: Create `tooling/config/prettier/index.mjs`**

```mjs
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  bracketSpacing: true,
};
```

These values are copied exactly from the current root `.prettierrc`. Do not change any value.

- [ ] **Step 2: Verify the `"./prettier"` export is in `tooling/config/package.json`**

Open `tooling/config/package.json` and confirm the `exports` map contains:

```json
"./prettier": "./prettier/index.mjs"
```

This was added in Task 3 Step 2. If it's missing, add it now.

- [ ] **Step 3: Add `@tasky/tooling-config` to root devDependencies**

Open the root `package.json` (at the repo root, not any workspace). Change `devDependencies` to:

```json
"devDependencies": {
  "@tasky/tooling-config": "workspace:*",
  "eslint": "9.39.2",
  "husky": "^9.1.7",
  "lint-staged": "^16.4.0"
}
```

- [ ] **Step 4: Run pnpm install to link the workspace dep**

```bash
pnpm install
```

Expected: `@tasky/tooling-config` is now resolvable from the repo root.

- [ ] **Step 5: Delete `.prettierrc` and create `.prettierrc.mjs`**

```bash
git rm .prettierrc
```

Then create `.prettierrc.mjs` at the repo root:

```mjs
import config from '@tasky/tooling-config/prettier';
export default config;
```

- [ ] **Step 6: Verify prettier finds the new config and formats correctly**

```bash
pnpm -r format:check
```

Expected: exits 0. If any files are reported as unformatted, run `pnpm -r format` and check the diff — the config values are identical so no files should actually change.

- [ ] **Step 7: Confirm lint-staged still works**

```bash
cat .lintstagedrc.json
```

Confirm it contains `prettier --write` with no `--config` flag. Config discovery will find `.prettierrc.mjs` at the repo root automatically. No changes needed.

- [ ] **Step 8: Commit**

```bash
git add tooling/config/prettier/index.mjs .prettierrc.mjs package.json pnpm-lock.yaml
git commit -m "feat(tooling): centralise prettier config in tooling-config; root re-exports it"
```

---

## Final verification

- [ ] **Run the full test suite**

```bash
pnpm -r test
```

Expected: same pass/fail ratio as before. No regressions.

- [ ] **Run full lint**

```bash
pnpm -r lint
```

Expected: exits 0 (or only warnings).

- [ ] **Run full typecheck**

```bash
pnpm -r typecheck
```

Expected: exits 0.

- [ ] **Run format check**

```bash
pnpm -r format:check
```

Expected: exits 0.
