# Tooling Config Consolidation & Integration Pass

**Date:** 2026-04-15
**Branch target:** `fix/repo-hardening` (or new branch off main)

## Overview

Audit and overhaul of the monorepo's shared tooling configuration. Two goals:

1. **Consolidate** duplicated config (vitest thresholds, postcss format, prettier source-of-truth)
2. **Add missing integrations** (eslint-plugin-react, @tanstack/eslint-plugin-query, strict tsconfig flags for mobile)

All changes flow through `@tasky/tooling-config` (`tooling/config`) as the single source of truth.

---

## Section 1: ESLint additions

### What changes

**`tooling/config/eslint/react.mjs`** — add two new plugins:

- **`eslint-plugin-react`**: spread `react.configs.flat['jsx-runtime']` (not `recommended`, which requires `React` in scope). Add `settings: { react: { version: 'detect' } }`. Covers `react/jsx-key`, `react/no-danger`, `react/no-direct-mutation-state`, `react/self-closing-comp`, etc.
- **`@tanstack/eslint-plugin-query`**: spread `queryPlugin.configs['flat/recommended']`. Enforces query key factories, no deprecated options, exhaustive deps on queries.

**`tooling/config/eslint/react-native.mjs`** — currently `baseConfig` is a bare re-export of `base.mjs`. Change it to a composed array that includes the query plugin, so mobile gets it automatically when it spreads `...baseConfig`:

```mjs
import _baseConfig from './base.mjs';
import queryPlugin from '@tanstack/eslint-plugin-query';

export const baseConfig = [
  ..._baseConfig,
  ...queryPlugin.configs['flat/recommended'],
];
export const mobileOverrides = [...]; // unchanged
```

Mobile's `eslint.config.mjs` imports remain unchanged — it already spreads `...baseConfig`.

**`tooling/config/package.json`** — add to `dependencies`:

- `eslint-plugin-react` (regular dep, not optional — it's in the main react config)
- `@tanstack/eslint-plugin-query`

### What does NOT change

- `apps/web/eslint.config.mjs`, `apps/mobile/eslint.config.mjs` — both already extend the shared configs; new plugins propagate automatically
- `react-hooks` and `react-refresh` in `react.mjs` — unchanged
- Mobile's `expoWithoutTs` filter — unchanged; only filters `@typescript-eslint`, not the new plugins

---

## Section 2: TypeScript

### Problem

`tooling/config/tsconfig/react-native.json` extends `./react.json`, which adds `"lib": ["ES2022", "DOM", "DOM.Iterable"]`. DOM types are wrong for React Native. The file is therefore unused by mobile.

`apps/mobile/tsconfig.json` extends `expo/tsconfig.base` directly and manually declares `strict: true, skipLibCheck: true`, but is missing the tighter flags from `base.json`:

- `verbatimModuleSyntax`
- `noUnusedLocals`
- `noUnusedParameters`
- `noUncheckedIndexedAccess`
- `noFallthroughCasesInSwitch`
- `exactOptionalPropertyTypes`
- `forceConsistentCasingInFileNames`
- `esModuleInterop`
- `isolatedModules`

### What changes

**`tooling/config/tsconfig/react-native.json`** — change `extends` from `./react.json` to `./base.json`. No lib override (RN types come from `@types/react-native`, not DOM). Result: all strict flags from `base.json` apply without any DOM contamination.

**`apps/mobile/tsconfig.json`** — change `extends` from a single string to an array (TS 5.0+ feature):

```json
"extends": ["expo/tsconfig.base", "@tasky/tooling-config/tsconfig/react-native"]
```

The tasky config is last and wins on conflicts. `expo/tsconfig.base` sets `module: "preserve"`, `target: "ESNext"`, `lib: ["DOM", "ESNext"]`, `moduleResolution: "bundler"`, `jsx: "react-native"`. Our `base.json` overrides `module` → `ESNext`, `target` → `ES2022`, `moduleResolution` → `Bundler`. `jsx: "react-native"` and `lib` are untouched (expo's values are correct for RN).

Remove the now-redundant `strict: true` and `skipLibCheck: true` from mobile's inline `compilerOptions`. Keep `ignoreDeprecations: "6.0"`, `baseUrl`, `paths`, and `types` (app-specific).

**Migration note — strict flags that will surface errors:** Inheriting `base.json` introduces flags not previously applied to mobile:

| Flag                                    | Likely impact                                         | Action                                  |
| --------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `verbatimModuleSyntax`                  | Import-type errors on value imports used as types     | Fix with IDE auto-fix (`import type`)   |
| `noUnusedLocals` / `noUnusedParameters` | Unused variable errors                                | Remove or prefix with `_`               |
| `noFallthroughCasesInSwitch`            | Switch fallthrough errors                             | Likely none; easy fix                   |
| `noUncheckedIndexedAccess`              | Array/object indexing returns `T \| undefined`        | Requires null checks — scope is unknown |
| `exactOptionalPropertyTypes`            | Optional props can't be explicitly set to `undefined` | Most disruptive; scope is unknown       |

**Staged approach:** Apply the tsconfig change, then run `pnpm --filter @tasky/mobile typecheck` to measure error count. Fix `verbatimModuleSyntax`, `noUnusedLocals`, and `noFallthroughCasesInSwitch` inline (auto-fixable). If `noUncheckedIndexedAccess` or `exactOptionalPropertyTypes` produce more than ~20 errors, override them to `false` in mobile's own `compilerOptions` and track as a follow-on task.

---

## Section 3: Vitest shared preset

### Problem

Coverage thresholds (`lines:60, functions:55, branches:55, statements:60`), reporter (`['text', 'json']`), environment (`jsdom`), and `globals: true` are copy-pasted across:

- `apps/web/vitest.config.ts`
- `apps/mobile/vitest.config.ts`
- `packages/core/vitest.config.ts`

### What changes

**New file: `tooling/config/vitest/base.ts`** — exports a plain object (not `defineConfig`) so consumers can spread it:

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

**`tooling/config/package.json`** — add `"./vitest/base": "./vitest/base.ts"` to `exports`. Add `vitest` as an `optionalDependency` (for type resolution only).

**`apps/web/vitest.config.ts`** — spread `baseTestConfig`, keep local: `plugins: [react()]`, `setupFiles`, `include`, coverage `include`/`exclude`.

**`apps/mobile/vitest.config.ts`** — spread `baseTestConfig`, keep local: `setupFiles`, `include`, `deps.inline` (the RN module list), coverage `include`/`exclude`.

**`packages/core/vitest.config.ts`** — spread `baseTestConfig`, keep local: `include`, coverage `include`/`exclude`, threshold overrides (currently all 0 — stays local as an explicit override).

---

## Section 4: PostCSS normalization

### What changes

**`apps/web/postcss.config.cjs`** → **`apps/web/postcss.config.mjs`**

```mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

The web package has `"type": "module"` — `.mjs` is the correct format. Vite resolves PostCSS config by filename regardless of format. No changes to `vite.config.ts`.

`apps/mobile/postcss.config.mjs` is already `.mjs` and uses the TW v3 pattern (`tailwindcss: {}`) — no changes needed. The TW version split (web=v4, mobile=v3) is intentional and stays.

---

## Section 5: Prettier in tooling-config

### What changes

**New file: `tooling/config/prettier/index.mjs`** — exports the canonical prettier config:

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

**`tooling/config/package.json`** — add `"./prettier": "./prettier/index.mjs"` to `exports`.

**Root `.prettierrc`** → **`.prettierrc.mjs`** — re-exports from tooling-config:

```mjs
import config from '@tasky/tooling-config/prettier';
export default config;
```

**Root `package.json`** — add `"@tasky/tooling-config": "workspace:*"` to `devDependencies`. (Currently absent; root only has `eslint`, `husky`, `lint-staged`.)

Prettier discovers `.prettierrc.mjs` at root and propagates to all workspaces as before. Any workspace needing a custom override can now import and spread from `@tasky/tooling-config/prettier`.

**lint-staged safe:** `.lintstagedrc.json` calls `prettier --write` with no `--config` flag — config discovery finds `.prettierrc.mjs` at root automatically. No changes to `.lintstagedrc.json`.

---

## Files changed summary

| File                                        | Change                                                  |
| ------------------------------------------- | ------------------------------------------------------- |
| `tooling/config/eslint/react.mjs`           | Add eslint-plugin-react + @tanstack/eslint-plugin-query |
| `tooling/config/eslint/react-native.mjs`    | Add @tanstack/eslint-plugin-query                       |
| `tooling/config/tsconfig/react-native.json` | Extend base.json instead of react.json                  |
| `tooling/config/vitest/base.ts`             | New — shared vitest preset                              |
| `tooling/config/prettier/index.mjs`         | New — shared prettier config                            |
| `tooling/config/package.json`               | New deps + exports entries                              |
| `apps/web/vitest.config.ts`                 | Spread baseTestConfig                                   |
| `apps/web/postcss.config.cjs` → `.mjs`      | Rename + convert to ESM                                 |
| `apps/mobile/vitest.config.ts`              | Spread baseTestConfig                                   |
| `apps/mobile/tsconfig.json`                 | Multi-extends + remove redundant flags                  |
| `packages/core/vitest.config.ts`            | Spread baseTestConfig                                   |
| `package.json` (root)                       | Add @tasky/tooling-config to devDeps                    |
| `.prettierrc` → `.prettierrc.mjs`           | Convert to ESM re-export                                |

## Out of scope

- `eslint-plugin-jsx-a11y` (accessibility linting) — deferred by design
- Mobile's `eslint-plugin-react-hooks` devDep pin — leave as-is (expo requires it)
- TailwindCSS version split (web=v4, mobile=v3) — intentional, no change
