# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- COMPATIBILITY_ONLY -->

## Governing Documents

**Read these before coding anything non-trivial:**

- `AGENTS.md` — binding doctrine, quality gates, security baseline, commit message contract
- `docs/agent/RUNBOOK.md` — agent workflow via `scripts/agent-flow.sh`
- `docs/ARCHITECTURE.md` + `docs/ARCHITECTURE_INDEX.md` — technical baseline
- `docs/API.yaml` — OpenAPI contract (source of truth for all clients)
- `docs/quality/SELF_VERIFY_CONTRACT.md` — self-verification requirements

## Common Commands

### Backend (Spring Boot / Gradle)

```bash
# Start dependencies (always required first)
docker compose up -d postgres minio minio-bootstrap

# Run backend
./gradlew --no-daemon bootRun

# Run all backend tests
./gradlew test

# Run a single test class
./gradlew test --tests "mn.tasky.auth.FacebookAuthServiceTest"

# Lint / static analysis
./gradlew checkstyleMain spotbugsMain pmdMain

# Build (includes compile + test)
./gradlew build

# Health check
curl http://127.0.0.1:8080/actuator/health
```

Always use `./gradlew`, never system `gradle`.

### Frontend (pnpm monorepo)

```bash
# Install all JS dependencies
pnpm install

# Generate TypeScript SDK from OpenAPI
pnpm sdk:generate

# Web dev server
pnpm --filter @tasky/web dev

# Mobile dev server
pnpm --filter @tasky/mobile start

# Web unit tests (Vitest)
pnpm --filter @tasky/web test:unit

# Web E2E smoke (Playwright)
pnpm --filter @tasky/web test:e2e:smoke

# Mobile unit tests (Jest / jest-expo)
pnpm --filter @tasky/mobile test:unit

# Mobile E2E smoke (Maestro; requires TASKY_RUN_MAESTRO=true)
pnpm --filter @tasky/mobile test:e2e:smoke

# Typecheck all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint
```

### Agent Workflow Scripts

```bash
scripts/agent-flow.sh status                              # view ticket queue
scripts/agent-flow.sh start --agent <name> --ticket TASK-020 --slug <slug>
scripts/agent-flow.sh verify --ticket TASK-020
scripts/agent-flow.sh finish --ticket TASK-020            # verify + complete
scripts/agent-flow.sh merge --ticket TASK-020
```

### Self-Verification

```bash
scripts/self-verify.sh \
  --ticket TASK-123 \
  --risk medium \
  --req REQ-AUTH-01,NFR-API-01 \
  --out artifacts/self-verify.json
```

## Architecture Overview

**Tasky** is a domestic services marketplace for Mongolia (trust-first, mobile-primary).

### Repository Structure

```
src/                    Spring Boot backend (modular monolith)
apps/web/               React 18 + Vite + Tailwind web client
apps/mobile/            React Native (Expo) mobile client
packages/sdk/           TypeScript SDK (generated from docs/API.yaml)
packages/core/          Shared business logic and types
packages/design-tokens/ Cross-platform design token source
tickets/                Machine-readable specs (TASK-*.json) + STATUS.json
scripts/                Agent workflow and verification tooling
```

### Backend Domain Packages (`mn.tasky.<package>`)

| Domain | Packages | Core responsibility |
|---|---|---|
| identity | `auth`, `user`, `security`, `verification` | Facebook OAuth, JWT, profiles, KYC |
| marketplace | `task`, `category`, `booking` | Task posting, intake schemas, booking state machine |
| wallet | `wallet`, `payment` | Credit ledger (Phase 2+), QPay integration (Phase 2+) |
| communication | `messaging`, `notification` | WebSocket in-app messaging, FCM push |
| support | `dispute`, `review`, `admin`, `analytics` | Disputes, reviews, admin, event tracking |
| common | `common` | Security filters, pagination, error handling, outbox |

Cross-domain calls are **Java method calls only** — never HTTP between packages.

### Key Technical Decisions

- **Persistence**: JDBI 3 (explicit SQL), not JPA. Migrations via Flyway.
- **Auth**: Facebook OAuth is primary. SMS OTP is feature-gated (disabled by default; Phase 2+). Dev auth bypass (`POST /api/v1/auth/dev/login`) is enabled locally and blocked in prod profiles.
- **Push**: Firebase Cloud Messaging via Firebase Admin SDK. `@react-native-firebase/messaging` on mobile. Expo push relay is not used.
- **File storage**: Presigned upload URLs (S3/MinIO). Buckets are private. Never store public URLs.
- **Geospatial**: PostGIS + `ST_DWithin`. GiST index on `tasks.location_point` is mandatory.
- **Async**: Spring `@Async` + `ApplicationEventPublisher`. Critical tasks use `domain_outbox_events` for at-least-once delivery.

### Frontend Design System

- **Web**: Radix UI + Tailwind, shadcn file conventions. Components in `apps/web/src/components/ui/`. shadcn CLI is not used. No MUI/Chakra/Ant.
- **Mobile**: Platform-native components driven by shared design tokens. Radix/shadcn not used on mobile.
- **Tokens**: Canonical source in `packages/design-tokens`. Web via Tailwind variables. Mobile via React Native adapter.
- **API client**: Always consume `@tasky/sdk` (generated from `docs/API.yaml`), never hand-write fetch calls.

### Commit Message Contract

```
<type>(<scope>): <imperative summary>

Ticket: <id>
Spec: <REQ-IDs>
API: <endpoints changed or "no API change">
Tests: <what was added/updated>
Risk: <low|medium|high>
```

Allowed types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `security`.

LLM agent branches must follow: `agent/<TICKET-ID>-<slug>`.

### SecurityConfig Warning

Subagents have previously gutted `SecurityConfig.java` when debugging auth/403 issues. Always verify `SecurityConfig.java` is unchanged after any subagent work on controller or auth tasks.
