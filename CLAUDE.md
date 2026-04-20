# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Serena — Claude Code MCP Setup

Serena is configured as an MCP server. Call `mcp__serena__initial_instructions` ONCE at session start, then use the `mcp__serena__`-prefixed tools for all code navigation:

| Task            | Tool                                               |
| --------------- | -------------------------------------------------- |
| Symbol search   | `mcp__serena__jet_brains_find_symbol`              |
| File overview   | `mcp__serena__jet_brains_get_symbols_overview`     |
| References      | `mcp__serena__jet_brains_find_referencing_symbols` |
| Declaration     | `mcp__serena__jet_brains_find_declaration`         |
| Implementations | `mcp__serena__jet_brains_find_implementations`     |

Requires the JetBrains IDE running with this project open and the Serena plugin installed. If Serena returns errors, fall back to grep/glob.

## Start Here

- `AGENTS.md` — conventions, workflow, guardrails (read first)
- `docs/maintenance/OPERATING_MODEL.md` — maintenance execution model and trusted gates
- `docs/ARCHITECTURE.md` — system design and domain structure
- `docs/API.yaml` — OpenAPI contract (source of truth for all clients)
- `docs/design/DESIGN_SYSTEM.md` — canonical design system spec (Тэнгэр palette, typography, motion)
- `docs/BRAND.md` — brand identity, voice, color roles, and logo principles

## Design System

The **Тэнгэр (Sky)** design system governs all UI across mobile and web.

| Resource                          | Location                                     |
| --------------------------------- | -------------------------------------------- |
| Canonical spec                    | `docs/design/DESIGN_SYSTEM.md`               |
| CSS custom properties (reference) | `packages/design-tokens/colors_and_type.css` |
| Token source (web runtime)        | `packages/design-tokens/tokens.css`          |
| Mobile tailwind config            | `apps/mobile/tailwind.config.ts`             |
| Web tailwind config               | `apps/web/tailwind.config.ts`                |
| SVG assets                        | `apps/mobile/assets/` · `apps/web/public/`   |
| UI kit reference                  | `docs/design/ui_kits/mobile/`                |

**Token naming — three-tier system (web):**

| Tier          | Prefix       | Example                                 | Defined in                          |
| ------------- | ------------ | --------------------------------------- | ----------------------------------- |
| Primitive     | `--tenger-*` | `--tenger-ink`, `--tenger-shadow-nav`   | `packages/design-tokens/tokens.css` |
| Semantic      | `--color-*`  | `--color-primary`, `--color-background` | `packages/design-tokens/tokens.css` |
| shadcn bridge | unprefixed   | `--primary`, `--background`             | `apps/web/src/styles.css`           |

- Tailwind utilities resolve through `--color-*` → Tailwind config → generated classes
- Components use Tailwind classes (`bg-primary`, `text-foreground`) — never reference `--tenger-*` primitives directly
- Shadows: `--shadow-*` aliases in `styles.css` bridge `--tenger-shadow-*` primitives; components use `var(--shadow-card)` etc.
- Motion: `--duration-*` and `--easing-*` (no namespace prefix)
- Mobile: NativeWind classes backed by `@tasky/design-tokens` native outputs (hex values, not HSL)

## Common Commands

### Backend

```bash
docker compose up -d postgres minio minio-bootstrap  # start dependencies
./gradlew --no-daemon bootRun                         # run backend
./gradlew test                                        # run all tests
./gradlew test --tests "mn.tasky.auth.*"              # run specific tests
./gradlew openApiValidate                             # validate API contract
python3 tooling/scripts/validate-migrations.py        # migration safety
```

Always use `./gradlew`, never system `gradle`.

### Frontend

```bash
pnpm install                        # install dependencies
pnpm sdk:generate                   # regenerate SDK from API.yaml
pnpm --filter @tasky/web dev        # web dev server
pnpm --filter @tasky/mobile start   # mobile dev server
pnpm -r typecheck                   # typecheck all workspaces
pnpm -r test                        # test all workspaces
pnpm -r lint                        # lint all workspaces
pnpm workspace:boundaries           # validate monorepo dependency boundaries
```

### Legacy Greenfield References (Archived)

```bash
ls archive/legacy-task-system/tasks
ls archive/greenfield-docs/docs/superpowers
```

## Project Overview

**Tasky** is a domestic services marketplace for Mongolia. Mobile-primary, trust-first.

### Structure

```
services/               Backend service zone (target: services/api)
services/api/           Spring Boot backend service module
apps/web/               React + Vite + Tailwind web client
apps/mobile/            React Native (Expo) mobile client
packages/sdk/           TypeScript SDK (generated from docs/API.yaml)
packages/design-tokens/ Cross-platform design tokens
research/               Research datasets and analysis inputs
tooling/agent/          Curated contributor-agent assets
tooling/config/         Shared static-analysis and security config
tooling/scripts/        Repository verification and automation scripts
services/api/scripts/   Backend service operational scripts
archive/legacy-task-system/tasks/  Archived task files from greenfield phase
```

### Key Decisions

- **Persistence:** JDBI 3 (explicit SQL), not JPA. Migrations via Flyway.
- **Auth:** Facebook OAuth primary. SMS OTP feature-gated. Dev auth local-only.
- **Storage:** Presigned upload URLs (S3/MinIO). Private buckets.
- **Runtime DB user:** `tasky_app` (least-privilege). Flyway uses owner account.

## Structural Contract Quick Reference (§7.7)

> AI-agent-facing cheat sheet. The normative source is `docs/ARCHITECTURE.md` §7.7. Rebuilt when §7.7 changes.

### Screen-family layout (§7.7.5.\*)

| Rule ID   | Rule                                                                                           | Violation example                         |
| --------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| §7.7.5.1  | Only composition, orchestration hook, model, section, and index files allowed under `screens/` | `features/tasks/screens/utils.ts`         |
| §7.7.5.2  | ≥4 sections, ≥6 files, or ≥600 lines → must use folder form                                    | Flat `CustomerTaskDetail*` with 12 files  |
| §7.7.5.3  | Sections are screen-private; no cross-screen or cross-feature imports                          | `ScreenA` importing `ScreenB.Section.tsx` |
| §7.7.5.4  | No `screens/index.ts` barrel at directory root                                                 | `features/tasks/screens/index.ts`         |
| §7.7.5.7  | Orchestration hooks must end `Screen.ts` (`use<Screen>Screen.ts`)                              | `useTaskIntake.ts` under `screens/`       |
| §7.7.5.8  | Section filenames: `<PascalScreen>.<PascalSection>.tsx` — both PascalCase                      | `BookingReschedule.datePicker.tsx`        |
| §7.7.5.9  | `.model.ts` must be pure — no react, react-native, react-query, api, store imports             | `*.model.ts` importing `react`            |
| §7.7.5.10 | Domain hooks (`hooks/`) must NOT end in `Screen.ts`                                            | `useFooScreen.ts` under `hooks/`          |

### Cross-module boundary (§7.7.2.\*)

| Rule ID  | Rule                                                             | Violation example                           |
| -------- | ---------------------------------------------------------------- | ------------------------------------------- |
| §7.7.2.1 | Feature-to-feature imports go through `features/B/index.ts` only | `features/A/` importing `features/B/api.ts` |
| §7.7.2.2 | `hooks/**` may not import `screens/**`                           | Hook importing a screen section             |
| §7.7.2.3 | Route files import the Screen component only                     | Route importing a screen section or model   |
| §7.7.2.4 | No cross-screen imports within the same feature                  | `ScreenA` importing `ScreenB.*`             |

### File budgets and imports (§7.7.6.\*)

| Rule ID  | Limit                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------ |
| §7.7.6.1 | Screen warn >220, fail >280 lines; Section warn >260, fail >340; Model/Hook warn >180, fail >240 |
| §7.7.6.2 | Max 8 sections per screen family                                                                 |
| §7.7.6.3 | No `../../` or deeper relative imports in `src/**` — use `@/…` aliases                           |

Run `pnpm --filter @tasky/mobile structure:check` after any mobile structural change.
