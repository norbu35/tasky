# Tasky Monorepo

Tasky is a trust-first domestic services marketplace for Mongolia.

## Repository Layout

| Path                                   | Purpose                                                             |
|----------------------------------------|---------------------------------------------------------------------|
| `AGENTS.md`                            | Governing policy — doctrine, quality gates, security baseline       |
| `docs/PRD.md`                          | Product requirements and scope                                      |
| `docs/ARCHITECTURE.md`                 | Technical architecture, data model, API guidelines, frontend system |
| `docs/ARCHITECTURE_INDEX.md`           | Architecture reading router (topic -> canonical source, non-dup)    |
| `docs/METRICS.md`                      | Marketplace KPIs, funnel metrics, and event tracking schema         |
| `docs/STRATEGY.md`                     | Business model and go-to-market plan                                |
| `docs/adr/`                            | Architecture Decision Records                                       |
| `docs/quality/SELF_VERIFY_CONTRACT.md` | Self-verification script and artifact contract                      |
| `docs/agent/RUNBOOK.md`                | Canonical agent operational workflow                                |
| `docs/agent/WORK_LOG.md`               | Append-only agent execution audit trail                             |
| `docs/API.yaml`                        | OpenAPI 3.0 contract (source of truth for all clients)              |
| `src/`                                 | Spring Boot backend source                                          |
| `apps/web`                             | React web client scaffold                                           |
| `apps/mobile`                          | React Native (Expo) mobile scaffold                                 |
| `packages/sdk`                         | Shared TypeScript SDK scaffold (generated from OpenAPI)             |
| `packages/design-tokens`               | Shared cross-platform design token source                           |
| `scripts/`                             | Verification and workflow tooling                                   |
| `tickets/`                             | Canonical delivery plan: machine-readable ticket specs and `STATUS.json` |

`tickets/` is the planning source of truth. The legacy markdown backlog document is intentionally not restored.

## Prerequisites

- Java 21
- Docker + Docker Compose
- Python 3.10+
- Node.js 20+ and pnpm 10+
- `jq`, `git`, `rg`, `curl`
- `semgrep` for high-risk verification

## Quick Start

1. Start local infrastructure:

```bash
cp .env.example .env
docker compose up -d postgres minio minio-bootstrap
```

2. Run backend:

```bash
./gradlew --no-daemon bootRun
```

3. Verify backend health:

```bash
curl http://127.0.0.1:8080/actuator/health
curl http://127.0.0.1:8080/api/v1/system/version
```

## Local Auth Bypass (Testing)

For local testing, dev auth is enabled by default (`tasky.dev-auth.enabled=true`).

- Web login page shows `Developer quick login` buttons in dev mode.
- Buttons call `POST /api/v1/auth/dev/login` and issue a normal JWT session without SMS OTP.
- Disable it by setting `TASKY_DEV_AUTH_ENABLED=false`.
- Production safety gate: app startup fails in `prod`/`production` profile if dev auth is enabled.

## Verification Workflow

Agent entrypoint (recommended):

```bash
scripts/agent-flow.sh status
scripts/agent-flow.sh start --agent my-agent --slug bootstrap
scripts/agent-flow.sh verify --ticket TASK-001
scripts/agent-flow.sh complete --ticket TASK-001
scripts/agent-flow.sh merge --ticket TASK-001
```

Generate local verification artifact:

```bash
scripts/self-verify.sh \
  --ticket TASK-123 \
  --risk medium \
  --req REQ-AUTH-01,NFR-API-01 \
  --out artifacts/self-verify.json
```

Validate requirement coverage before sprint planning:

```bash
scripts/validate-traceability.py
scripts/validate-backlog.py
scripts/validate-ticket-specs.py
```

High-risk verification runs:

- SAST (`semgrep`)
- migration checks
- performance smoke (`scripts/performance-smoke.sh`)

If `PERF_TARGET_URL` is unset, performance smoke auto-starts local backend via `./gradlew bootRun`.

## Frontend/SDK Scaffold

Install JS dependencies:

```bash
pnpm install
```

Generate SDK types from OpenAPI:

```bash
pnpm sdk:generate
```

Run web app:

```bash
pnpm --filter @tasky/web dev
```

Run mobile app:

```bash
pnpm --filter @tasky/mobile start
```

## Frontend Testing Stack

- Web unit/component: Vitest + React Testing Library
- Web E2E: Playwright
- Mobile unit/component: Jest (jest-expo) + React Native Testing Library
- Mobile E2E: Maestro flows (enabled when `TASKY_RUN_MAESTRO=true`; otherwise component-test fallback is used)

Run web tests:

```bash
pnpm --filter @tasky/web test:unit
pnpm --filter @tasky/web test:e2e:smoke
```

Run mobile tests:

```bash
pnpm --filter @tasky/mobile test:unit
pnpm --filter @tasky/mobile test:e2e:smoke
```
