# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start Here

- `AGENTS.md` — conventions, workflow, guardrails (read first)
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
```

### Task Management (Archived)
```bash
ls archive/legacy-task-system/tasks
cat archive/legacy-task-system/task.sh
```

## Project Overview

**Tasky** is a domestic services marketplace for Mongolia. Mobile-primary, trust-first.

### Structure
```
services/               Backend service zone (target: services/api)
src/                    Transitional backend source location
apps/web/               React + Vite + Tailwind web client
apps/mobile/            React Native (Expo) mobile client
packages/sdk/           TypeScript SDK (generated from docs/API.yaml)
packages/design-tokens/ Cross-platform design tokens
research/               Research datasets and analysis inputs
tooling/                Structural and verification tooling
archive/legacy-task-system/tasks/  Archived task files from greenfield phase
```

### Key Decisions
- **Persistence:** JDBI 3 (explicit SQL), not JPA. Migrations via Flyway.
- **Auth:** Facebook OAuth primary. SMS OTP feature-gated. Dev auth local-only.
- **Storage:** Presigned upload URLs (S3/MinIO). Private buckets.
- **Runtime DB user:** `tasky_app` (least-privilege). Flyway uses owner account.
