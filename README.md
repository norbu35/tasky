# Tasky Monorepo

Tasky is a trust-first domestic services marketplace for Mongolia.

## Repository Layout

| Path                           | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| `AGENTS.md`                    | Agent instructions — conventions, workflow, guardrails              |
| `docs/PRD.md`                  | Product requirements and scope                                      |
| `docs/ARCHITECTURE.md`         | Technical architecture, data model, API guidelines, frontend system |
| `docs/ARCHITECTURE_INDEX.md`   | Architecture reading router (topic → canonical source)              |
| `docs/maintenance/`            | Maintenance workflow, staging runbooks, and operator guidance       |
| `docs/METRICS.md`              | Marketplace KPIs, funnel metrics, and event tracking schema         |
| `docs/STRATEGY.md`             | Business model and go-to-market plan                                |
| `docs/adr/`                    | Architecture Decision Records                                       |
| `docs/API.yaml`                | OpenAPI 3.0 contract (source of truth for all clients)              |
| `.env.private-staging.example` | Template env for the private VPS integration sandbox                |
| `services/api`                 | Spring Boot backend service module                                  |
| `apps/web`                     | React web client                                                    |
| `apps/mobile`                  | React Native (Expo) mobile client                                   |
| `packages/sdk`                 | Shared TypeScript SDK (generated from OpenAPI)                      |
| `packages/design-tokens`       | Shared cross-platform design token source                           |
| `research/`                    | Research datasets and analysis inputs                               |
| `tooling/agent`                | Curated contributor-agent assets and workflows                      |
| `tooling/config`               | Shared static-analysis and security tool configuration              |
| `tooling/scripts`              | Repository-level verification and automation scripts                |
| `archive/legacy-task-system/`  | Archived greenfield task queue (`tasks/` + `scripts/task.sh`)       |
| `archive/greenfield-docs/`     | Archived superseded planning/spec artifacts                         |
| `services/api/scripts`         | Backend-service-specific operational scripts                        |

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

## Local Dev Auth

Dev auth is enabled by default in the `local` profile and issues real JWT sessions via the backend.

- Backend: `TASKY_DEV_AUTH_ENABLED` defaults to `true` in `application-local.yml` and `docker-compose.yml`.
- Web/mobile quick-login buttons call `POST /api/v1/auth/dev/login` against the real backend.
- Seeded personas (see `V19__seed_test_data.sql`) are loginable by phone: customer `+97692000001`, tasker `+97693000001`, admin `+97694000001`.
- Production safety gate: app startup fails outside `local`/`test` if dev auth is enabled.

## Maintenance Mode

```bash
cat docs/maintenance/OPERATING_MODEL.md
ls docs/maintenance
ls docs/plans
```

The greenfield queue and superpowers plan/spec surfaces are archived under `archive/`.

## Private VPS Sandbox

The repo includes a private, SSH-tunneled VPS sandbox for deploy and integration testing:

```bash
cp .env.private-staging.example .env.private-staging
tooling/scripts/push-private-staging.sh <ssh-user@vps-host> /srv/tasky-private-staging .env.private-staging
```

The push script syncs the repo, bootstraps Docker on a Debian/Ubuntu VPS, deploys the private sandbox, and runs the
repo smoke script remotely.

See `docs/maintenance/STAGING_RUNBOOK.md` for the tunnel workflow, admin bootstrap, and current limitations.

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
python3 tooling/scripts/validate-migrations.py # migration safety
```

### Frontend

```bash
pnpm --filter @tasky/web test:unit          # web unit tests
pnpm --filter @tasky/web test:e2e:smoke     # web E2E (Playwright)
pnpm --filter @tasky/mobile test:unit       # mobile unit tests
pnpm -r typecheck                           # typecheck all workspaces
pnpm -r lint                                # lint all workspaces
pnpm workspace:boundaries                   # monorepo dependency boundaries
```

## Web Container

Use the generic web overlay to build and run the Tasky web container:

```bash
docker compose -f docker-compose.yml -f docker-compose.web.yml build web
docker compose -f docker-compose.yml -f docker-compose.web.yml up -d web
```

The overlay builds `apps/web/Dockerfile` and publishes the Caddy-served web app on `WEB_PORT` (default `8081`).
