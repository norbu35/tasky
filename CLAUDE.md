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
