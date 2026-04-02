# Tasky Monorepo

Tasky is a trust-first domestic services marketplace for Mongolia.

## Repository Layout

| Path                         | Purpose                                                             |
|------------------------------|---------------------------------------------------------------------|
| `AGENTS.md`                  | Agent instructions — conventions, workflow, guardrails              |
| `docs/PRD.md`                | Product requirements and scope                                      |
| `docs/ARCHITECTURE.md`       | Technical architecture, data model, API guidelines, frontend system |
| `docs/ARCHITECTURE_INDEX.md` | Architecture reading router (topic → canonical source)              |
| `docs/METRICS.md`            | Marketplace KPIs, funnel metrics, and event tracking schema         |
| `docs/STRATEGY.md`           | Business model and go-to-market plan                                |
| `docs/adr/`                  | Architecture Decision Records                                       |
| `docs/API.yaml`              | OpenAPI 3.0 contract (source of truth for all clients)              |
| `services/`                  | Deployable backend service zone (target: `services/api`)            |
| `src/`                       | Transitional backend source location (to be moved under `services/`)|
| `apps/web`                   | React web client                                                    |
| `apps/mobile`                | React Native (Expo) mobile client                                   |
| `packages/sdk`               | Shared TypeScript SDK (generated from OpenAPI)                      |
| `packages/design-tokens`     | Shared cross-platform design token source                           |
| `research/`                  | Research datasets and analysis inputs                               |
| `tooling/`                   | Structural/verification tooling and repo automation                 |
| `archive/legacy-task-system/`| Archived greenfield task queue (`tasks/` + `scripts/task.sh`)       |
| `scripts/`                   | Transitional script location (to be partitioned by ownership)       |

## Prerequisites

- Java 21
- Docker + Docker Compose
- Python 3.10+
- Node.js 20+ and pnpm 10+

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
```

## Local Auth Bypass (Testing)

For local testing, dev auth is only allowed in the `local` or `test` Spring profiles.

- Backend dev auth requires `SPRING_PROFILES_ACTIVE=local` (or `test`) plus `TASKY_DEV_AUTH_ENABLED=true`.
- Web login shows `Developer quick login` buttons only when `VITE_DEV_AUTH_ENABLED=true`.
- Mobile login shows the same buttons only when `EXPO_PUBLIC_DEV_AUTH_ENABLED=true`.
- Buttons call `POST /api/v1/auth/dev/login` and issue a normal JWT session without SMS OTP.
- Production safety gate: app startup fails outside `local`/`test` if dev auth is enabled.

## Task Management

```bash
# Legacy queue archived
ls archive/legacy-task-system/tasks
cat archive/legacy-task-system/task.sh
```

The repo-native task queue is archived and no longer the live maintenance workflow.

## Frontend

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

## Testing

### Backend
```bash
./gradlew test                              # all tests
./gradlew test --tests "mn.tasky.auth.*"    # specific tests
./gradlew openApiValidate                   # API contract validation
python3 scripts/validate-migrations.py      # migration safety
```

### Frontend
```bash
pnpm --filter @tasky/web test:unit          # web unit tests
pnpm --filter @tasky/web test:e2e:smoke     # web E2E (Playwright)
pnpm --filter @tasky/mobile test:unit       # mobile unit tests
pnpm -r typecheck                           # typecheck all workspaces
pnpm -r lint                                # lint all workspaces
```

## Web Container

Use the generic web overlay to build and run the Tasky web container:

```bash
docker compose -f docker-compose.yml -f docker-compose.web.yml build web
docker compose -f docker-compose.yml -f docker-compose.web.yml up -d web
```

The overlay builds `apps/web/Dockerfile` and publishes the Caddy-served web app on `WEB_PORT` (default `8081`).
