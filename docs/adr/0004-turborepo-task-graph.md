# ADR 0004: Turborepo for Frontend Task Graph and Caching

## Status

accepted

## Date

2026-04-21

## Context

The monorepo uses pnpm workspaces with four frontend packages (`apps/web`,
`apps/mobile`, `packages/sdk`, `packages/design-tokens`). Before this change,
all cross-workspace commands used `pnpm -r <task>`, which runs every workspace
in parallel with no awareness of build dependencies. This caused two problems:

1. **No dependency ordering** — `test` and `typecheck` ran before dependent
   packages finished building. Race conditions required re-runs.
2. **No caching** — every `pnpm build` rebuilt all packages from scratch, even
   when nothing changed. CI time grew linearly with workspace count.

The backend (Gradle) already has an incremental build cache. Frontend lacked an
equivalent.

## Decision

Adopt Turborepo (`turbo@2.9.x`) as the frontend task orchestrator.

- `turbo.json` declares task dependencies (e.g. `test` depends on `^build` and
  `typecheck`), so Turborepo runs tasks in topological order.
- Local caching (`.turbo/`, gitignored) skips unchanged workspaces. Second runs
  hit cache for 6/7 tasks.
- Root `package.json` scripts delegate to `turbo` (`"build": "turbo build"`,
  `"test": "turbo test"`, etc.). Workspace-level scripts remain unchanged.
- Backend commands (`./gradlew`) are unaffected — Turborepo only manages
  pnpm-workspace tasks.

Configured tasks and their dependency chains:

| Task            | Depends on            | Outputs                             |
| --------------- | --------------------- | ----------------------------------- |
| `build`         | `^build`              | `dist/**`, `.output/**`, `build/**` |
| `typecheck`     | `^build`              | —                                   |
| `test`          | `^build`, `typecheck` | —                                   |
| `test:unit`     | `^build`, `typecheck` | —                                   |
| `test:coverage` | `^build`, `typecheck` | `coverage/**`                       |
| `lint`          | `^build`              | —                                   |
| `format`        | —                     | —                                   |
| `format:check`  | —                     | —                                   |
| `sdk:generate`  | —                     | `src/generated/**`                  |

## Consequences

Positive:

1. Correct build ordering — `packages/sdk` builds before `apps/web` typechecks.
2. Local caching — unchanged workspaces skip in <1s. Developers see immediate
   feedback on repeat runs.
3. Foundation for remote caching — when CI is set up, `--token` enables shared
   cache across machines.
4. No workspace-level changes required — Turborepo reads existing `package.json`
   scripts.

Negative:

1. Additional dependency (`turbo` in root `devDependencies`).
2. Cache directory `.turbo/` must be gitignored.
3. `dev` scripts are intentionally excluded (long-running, not cacheable).

## Alternatives Considered

1. **Nx** — more features (affected-project detection, code generation), but
   heavier config and unnecessary for a 4-workspace frontend. Turborepo is
   simpler and purpose-built for pnpm monorepos.

2. **Lerna** — legacy tool, mostly subsumed by Nx. No compelling reason to
   adopt over Turborepo.

3. **Keep `pnpm -r`** — rejected due to missing dependency ordering and zero
   caching. Every CI run rebuilt everything from scratch.

## References

- `turbo.json` — task graph configuration
- `package.json` — root scripts delegating to `turbo`
