# Tasky Monorepo

Tasky is a trust-first domestic services marketplace for Mongolia.

## Start Here

| Need                                  | Read                           |
| ------------------------------------- | ------------------------------ |
| Repo-wide agent and contributor rules | `AGENTS.md`                    |
| Architecture router                   | `docs/architecture/AGENTS.md`  |
| Shared system architecture            | `docs/architecture/common.md`  |
| Web architecture                      | `docs/architecture/web.md`     |
| Mobile architecture                   | `docs/architecture/mobile.md`  |
| API contract                          | `docs/API.yaml`                |
| Product scope                         | `docs/PRD.md`                  |
| Design system                         | `docs/design/DESIGN_SYSTEM.md` |
| Maintenance and readiness             | `docs/maintenance/`            |

## Repository Layout

| Path                     | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `services/api`           | Spring Boot backend service                   |
| `apps/web`               | React + Vite web client                       |
| `apps/mobile`            | Expo / React Native mobile client             |
| `packages/sdk`           | generated TypeScript SDK from `docs/API.yaml` |
| `packages/design-tokens` | shared cross-platform tokens                  |
| `docs/architecture/`     | split architecture surfaces                   |
| `docs/maintenance/`      | runbooks and readiness docs                   |
| `tooling/agent`          | contributor-agent assets                      |
| `tooling/config`         | shared static-analysis and security config    |
| `tooling/scripts`        | repo-level verification and automation        |
| `archive/`               | superseded historical material                |

## Prerequisites

- Java 21
- Docker + Docker Compose
- Python 3.10+
- Node.js 22+ and pnpm 10+

## Quick Start

```bash
cp .env.example .env
docker compose up -d postgres minio minio-bootstrap
./gradlew --no-daemon bootRun
curl http://127.0.0.1:8080/actuator/health
```

## Frontend

```bash
pnpm install
pnpm sdk:generate
pnpm --filter @tasky/web dev
pnpm --filter @tasky/mobile start
```

## Verification

```bash
./gradlew openApiValidate
tooling/scripts/check-cleanup-gate.sh
pnpm typecheck
pnpm test
pnpm workspace:boundaries
```

## Maintenance Mode

Active work should come from the issue tracker or an approved execution brief.
Historical greenfield plans and superseded specs live under `archive/`.

## Private VPS Sandbox

```bash
cp .env.private-staging.example .env.private-staging
tooling/scripts/push-private-staging.sh <ssh-user@vps-host> /srv/tasky-private-staging .env.private-staging
```

See `docs/maintenance/STAGING_RUNBOOK.md` for tunnel workflow, admin bootstrap, and limitations.
