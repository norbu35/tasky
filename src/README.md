# Tasky Backend

Spring Boot API server for the Tasky domestic services marketplace.

## Tech Stack

| Component | Version / Library |
|-----------|------------------|
| Language | Java 21 |
| Framework | Spring Boot 3.4.2 |
| Database | PostgreSQL (JDBI 3.47) |
| Migrations | Flyway |
| Auth | JWT (jjwt 0.12.6) |
| Object Storage | AWS S3 SDK (MinIO-compatible) |
| Push Notifications | Firebase Admin SDK |
| WebSocket | Spring WebSocket + STOMP |
| Metrics | Micrometer + Prometheus |
| Scheduling | ShedLock (distributed locks) |
| API Spec | OpenAPI 3.0 (code-gen via `openapi-generator`) |

## Domain Modules

Each domain follows a consistent package layout: `api/`, `application/`, `dao/`, `dto/`, and optionally `scheduling/`.

| Module | Package | Purpose |
|--------|---------|---------|
| Auth | `mn.tasky.auth` | Facebook OAuth (Phase 0-1), phone OTP migration path (Phase 2+), JWT sessions, dev login bypass |
| User | `mn.tasky.user` | User profiles, roles (customer/tasker/admin) |
| Task | `mn.tasky.task` | Task CRUD, lifecycle, assignment, status management |
| Booking | `mn.tasky.booking` | Booking creation, confirmation, safety checks |
| Category | `mn.tasky.category` | Service category taxonomy |
| Review | `mn.tasky.review` | Post-task ratings and reviews |
| Payment | `mn.tasky.payment` | Payment processing (post-MVP) |
| Wallet | `mn.tasky.wallet` | Tasker wallet/earnings (post-MVP) |
| Dispute | `mn.tasky.dispute` | Dispute resolution workflow |
| Messaging | `mn.tasky.messaging` | In-app chat (WebSocket/STOMP) |
| Notification | `mn.tasky.notification` | Push notifications (FCM), in-app alerts |
| Verification | `mn.tasky.verification` | Tasker identity/document verification |
| Analytics | `mn.tasky.analytics` | Event tracking, marketplace metrics |
| Admin | `mn.tasky.admin` | Admin dashboard APIs |
| Security | `mn.tasky.security` | Security endpoints (CSRF, session info) |
| Common | `mn.tasky.common` | Shared infrastructure: security config, audit, storage, outbox, idempotency, health checks, validation, observability, persistence, scheduling, feature flags |

## Package Structure

```
src/main/java/mn/tasky/
  {domain}/
    api/           REST controllers
    application/   Service layer / business logic
    dao/           Data access (JDBI queries)
    dto/           Request/response DTOs
    scheduling/    Scheduled jobs (where applicable)
  common/
    api/           Shared REST concerns (error handling)
    audit/         Audit logging
    config/        App-wide configuration beans
    feature/       Feature flag support
    health/        Custom health indicators
    idempotency/   Idempotency key support
    observability/ Metrics, tracing
    outbox/        Transactional outbox pattern
    persistence/   JDBI configuration, base DAO
    scheduling/    ShedLock configuration
    security/      SecurityConfig, JWT filter, auth utils
    storage/       S3/MinIO file storage
    validation/    Custom validators
```

## Configuration

Spring profiles:

| Profile | Usage |
|---------|-------|
| `dev` | Local development (default for `bootRun`) |
| `prod` | Production (fails startup if dev-auth is enabled) |

Key environment variables are defined in `.env` / `application-{profile}.yml`. See `src/main/resources/application.yml` for defaults.

## Database

PostgreSQL with Flyway migrations in `src/main/resources/db/migration/`.

Local setup:
```bash
docker compose up -d postgres
```

## API

The canonical API contract is `docs/API.yaml` (OpenAPI 3.0). Spring interfaces are generated at compile time via the `openApiGenerate` Gradle task into `mn.tasky.api.generated`.

## Static Analysis

| Tool | Purpose |
|------|---------|
| Checkstyle | Code style enforcement |
| Spotless (Palantir format) | Auto-formatting (4-space indent, 120-char limit) |
| PMD | Bug pattern detection |
| SpotBugs + FindSecBugs | Security-focused bug detection |
| ErrorProne | Compile-time bug checks |
| OWASP Dependency Check | CVE scanning (opt-in) |
| JaCoCo | Code coverage (80% line minimum on active packages) |

## Testing

```bash
./gradlew test                     # Run all tests
./gradlew jacocoTestReport         # Generate coverage report
./gradlew jacocoTestCoverageVerification  # Enforce 80% coverage
```

Tests use JUnit 5, Spring Boot Test, Spring Security Test, Testcontainers (PostgreSQL), and ArchUnit for architecture tests.

## Common Gradle Tasks

```bash
./gradlew bootRun          # Start dev server (port 8080)
./gradlew compileJava      # Compile (triggers OpenAPI codegen)
./gradlew check            # Full quality gate (tests + coverage + static analysis)
./gradlew precommit        # Quick pre-commit check (~20-30s)
./gradlew spotlessApply    # Auto-format code
./gradlew openApiValidate  # Validate API.yaml
```
