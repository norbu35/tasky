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
| `tooling/skills`         | repo-owned harness-agnostic agent workflows   |
| `tooling/scripts`        | repo-level verification and automation        |
| `archive/`               | historical material only                      |

## Key Architectural Decisions & Patterns

Tasky's codebase is architected for maximum reliability, clean separation of concerns, and ease of deployment. Key design choices include:

### 1. Modular Monolith with ArchUnit Enforcement

- **Decision:** Keep the backend as a single deployable unit (`tasky-server`) but partition it by clean business domains (e.g. `booking`, `task`, `trust`).
- **Why:** Avoids microservices overhead (network latency, distributed transaction complexity) while preventing spaghetti code.
- **Enforcement:** Code boundaries are strictly locked down by ArchUnit tests. Domains cannot directly import other domains' internals or DAOs; cross-domain communication is limited to public API interfaces.

### 2. Audience Composition & Hexagonal Core

- **Decision:** Implement a composition layer (`runtime.publicapi.composition`) separate from individual business domains.
- **Why:** Controllers never execute cross-domain orchestration. Instead, they call composition services that interact only with public command/query ports (`BookingCommandPort`, `TaskQueryPort`). This keeps the business core decoupled and highly testable.

### 3. JDBI & PostGIS over Heavy ORMs

- **Decision:** Use JDBI for database persistence instead of a heavy JPA/Hibernate implementation. Use PostgreSQL 16 + PostGIS for spatial operations.
- **Why:** Heavy ORMs introduce hidden query-generation performance issues and lazy loading bugs. JDBI gives explicit, developer-controlled raw SQL execution with type safety. PostGIS handles fast geospatial queries (e.g. radius-based task matching via GiST indexes).

### 4. Domain Event Outbox Pattern

- **Decision:** Persist critical side effects (notifications, reminders, analytics) inside a `domain_outbox_events` table before publishing them to RabbitMQ.
- **Why:** Ensures at-least-once delivery. If the message broker goes down, the transaction succeeds locally and the ShedLock-guarded `OutboxRelayScheduler` automatically retries publishing with exponential backoff.

### 5. Swappable Provider (Strategy) Pattern

- **Decision:** Wrap all external dependencies (Facebook OAuth, FCM Push, AWS S3/MinIO, Geocoding) behind abstract provider interfaces.
- **Why:** Decoupled interfaces configured via `@ConditionalOnProperty` allow running a mocked/logging implementation in local tests and lightweight environments, but swap seamlessly to Firebase and AWS S3 in production.

### 6. OpenAPI & Contract-First Monorepo

- **Decision:** Maintain a single source of truth for the API contract in `docs/openapi/openapi.yaml`. Compile a generated TypeScript SDK (`@tasky/sdk`) directly from it.
- **Why:** Completely eliminates client-server integration mismatches. The web and mobile apps consume the strongly-typed SDK, raising compilation errors if the backend and frontend drift apart.

### 7. Unified Design Tokens

- **Decision:** Manage the design system tokens in a single shared package (`packages/design-tokens`).
- **Why:** Syncs theme variables to CSS variables for React Web (Tailwind) and NativeWind for React Native Mobile, ensuring absolute visual parity without manual copy-pasting.

### 8. Production-Grade Hardening

- **Decision:** Secure Caddy proxy routing, private S3 buckets with short-lived presigned upload URLs, and least-privilege database accounts.
- **Why:** Reduces backend exposure. Sensitive Actuator routes are blocked at Caddy; the app runs with a separate DB user (`APP_DB_USER`) having no schema alteration rights; and `TASKY_RATE_LIMIT_TRUSTED_PROXY_DEPTH=1` ensures robust rate-limiting behind reverse proxies.

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

Fresh databases run a schema-only Flyway baseline. Before posting-flow smoke tests, create launch categories and intake
schemas through the admin/setup path. If your local Postgres volume ran the old pre-baseline migration chain, recreate it:

```bash
docker compose down
docker volume rm "$(basename "$PWD")_postgres_data"
```

## Frontend

```bash
pnpm install
pnpm contract:sdk:generate
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
pnpm repo:docs:claims:triage
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
