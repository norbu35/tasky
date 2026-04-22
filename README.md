# Tasky Monorepo

Tasky is a trust-first domestic services marketplace for Mongolia.

## Start Here

| Need                                                | Read                                            |
| --------------------------------------------------- | ----------------------------------------------- |
| Product truth and launch rules                      | `docs/PRD.md`                                   |
| Market and pilot strategy                           | `docs/STRATEGY.md`                              |
| Repo-wide agent and contributor rules               | `AGENTS.md`                                     |
| Documentation and operating policy                  | `docs/maintenance/`                             |
| Architecture router (derived implementation design) | `docs/architecture/AGENTS.md`                   |
| Active API contract                                 | `docs/openapi/openapi.yaml`                     |
| Generated API compatibility bundle                  | `docs/API.yaml`                                 |
| Brand and design detail (derived)                   | `docs/BRAND.md`, `docs/design/DESIGN_SYSTEM.md` |

Read product and strategy before architecture or design for non-trivial work. `docs/API.yaml` is a generated
compatibility artifact only; the active contract source lives in `docs/openapi/**`.

## Repository Layout

| Path                     | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `services/api`           | Spring Boot backend service                   |
| `apps/web`               | React + Vite web client                       |
| `apps/mobile`            | Expo / React Native mobile client             |
| `packages/core`          | shared platform-agnostic core logic           |
| `packages/sdk`           | generated TypeScript SDK from `docs/API.yaml` |
| `packages/design-tokens` | shared cross-platform tokens                  |
| `packages/test-utils`    | shared testing helpers                        |
| `docs/maintenance/`      | governance, readiness, and operating policy   |
| `docs/architecture/`     | derived implementation design surfaces        |
| `docs/design/`           | derived UX and copy detail                    |
| `tooling/config`         | shared static-analysis and security config    |
| `tooling/scripts`        | repo-level verification and automation        |
| `archive/`               | historical material only                      |

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

Local baseline:

```bash
tooling/scripts/gates/check-cleanup-gate.sh
./gradlew --no-daemon :services:api:test :services:api:openApiValidate
pnpm -r typecheck
pnpm -r test
```

Additional boundary and drift checks:

```bash
./gradlew --no-daemon :services:api:architectureTest
pnpm repo:workspace:boundaries
pnpm contract:sdk:drift
python3 tooling/scripts/governance/validate-schema-parity.py
```

See `AGENTS.md` and `docs/maintenance/OPERATING_MODEL.md` for CI, release, and nightly gate expectations.

## Maintenance Mode

Active work should come from the issue tracker or an approved execution brief.
Historical plans and superseded specs live under `archive/`.

## Private VPS Sandbox

```bash
cp .env.private-staging.example .env.private-staging
tooling/scripts/deploy/push-private-staging.sh <ssh-user@vps-host> /srv/tasky-private-staging .env.private-staging
```

See `docs/maintenance/STAGING_RUNBOOK.md` for tunnel workflow, admin bootstrap, and limitations.
