# Backend Quality Hardening — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Author:** Product/Engineering Lead + AI Copilot
**Motivation:** Phase 0-1 PRD requirements are complete. Before launch, apply security auditing, structural enforcement, production hardening, and engineering process to eliminate blind spots.

---

## 1. Security Audit Pipeline

### 1.1 Automated SAST with Semgrep

Run Semgrep (v1.156.0, already installed) against `src/main/java/mn/tasky/` with:
- `p/owasp-top-ten` ruleset
- `p/java` ruleset (Spring Security, JDBC, deserialization)
- Custom rules stored in `config/semgrep/tasky-rules.yaml`:
  - All admin endpoints must require ADMIN role
  - All DAOs must use `@Bind` parameters (no string concatenation in SQL)
  - `TextSanitizer.plainText()` must be called on user-supplied freetext before persistence

Custom rules will be defined during implementation using Semgrep YAML pattern syntax. If a rule proves too complex for static analysis, it will be replaced by an ArchUnit test (Section 2.1).

Fix all HIGH and MEDIUM findings. Document ACCEPTED findings as ADRs.

### 1.2 Dependency Vulnerability Scanning

Add OWASP dependency-check Gradle plugin:

```groovy
plugins {
    id 'org.owasp.dependencycheck' version '12.1.0'  // matches current build.gradle.kts
}

dependencyCheck {
    failBuildOnCVSS = 7.0  // Fail on HIGH+ CVEs
    suppressionFile = 'config/dependency-check-suppression.xml'
}
```

Run as part of CI. Suppress false positives in the suppression file with justification comments.

### 1.3 Secrets Scanning

Run gitleaks against full git history:

```bash
gitleaks detect --source . --verbose
```

Verify zero findings. If any historical secrets are found, rotate them immediately and add a `.gitleaksignore` entry.

### 1.4 Authorization Matrix Verification

Build a test class `AuthorizationMatrixTests.java` that systematically verifies every endpoint:

| Endpoint Pattern | Unauthenticated | CUSTOMER | TASKER | ADMIN |
|---|---|---|---|---|
| `POST /api/v1/tasks` | 401 | 200 | 403 | 200 |
| `POST /api/v1/tasks/{id}/applications` | 401 | 403 | 200 | 200 |
| `GET /api/v1/admin/**` | 401 | 403 | 403 | 200 |

Each row is a parameterized test case. This catches accidentally unprotected endpoints.

### 1.5 Input Validation Completeness Audit

Systematically audit every request DTO for:
- `@NotBlank` / `@NotNull` on required fields
- `@Size(max = N)` on all string fields (prevent unbounded payloads)
- `@Pattern` on structured fields (phone numbers, UUIDs, enums)
- `@Valid` on nested objects and lists
- `@Positive` / `@Min` / `@Max` on numeric fields

Already fixed 4 DTOs in the remediation commit (RescheduleRequest, DisputeRequest.EvidenceItem, RejectVerificationRequest, RegisterDeviceRequest). This audit covers the remaining ~30 DTOs.

**Acceptance criteria:** 100% of request DTOs reachable from `@RequestBody` or `@RequestParam` must have `@Size` on every String field. Implementation will produce a validation audit checklist at `docs/quality/INPUT_VALIDATION_AUDIT.md`.

---

## 2. Structural Enforcement

### 2.1 ArchUnit Module Boundary Tests

Create `src/test/java/mn/tasky/architecture/ArchitectureTests.java`.

**Rollout strategy:** Rules are introduced in two phases. Phase A (immediate): all rules run as assertions — any violation fails the build. If existing code violates a rule, fix the violation first or document an exception with an ADR. Phase B (ongoing): new rules added as features are built. Approved exceptions use ArchUnit's `because()` annotation with an ADR reference.

**Transitive dependency handling:** All modules may import from `mn.tasky.common`. Cross-module imports through common DTOs are allowed; cross-module service imports must follow the dependency graph below.

**Module boundary rules:**
- `mn.tasky.booking` must not access `mn.tasky.admin`
- `mn.tasky.dispute` must not access `mn.tasky.task` directly (only via `mn.tasky.booking`)
- `mn.tasky.wallet` must not access any module except `mn.tasky.common`
- `mn.tasky.analytics` must not be accessed by any module (leaf node)

**Layer rules:**
- Classes in `*.dao` must not be injected into `*.api` classes (service layer only)
- Classes in `*.scheduling` must not import from `*.api`
- Classes in `*.dto` must not import from `*.dao` or `*.application`

**Naming rules:**
- Controllers must be annotated with `@RestController`
- Services must be annotated with `@Service`
- DAOs must be interfaces extending no concrete class

### 2.2 JaCoCo Coverage Thresholds

```groovy
jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.70  // 70% line coverage
            }
        }
        rule {
            limit {
                counter = 'BRANCH'
                minimum = 0.60  // 60% branch coverage
            }
        }
    }
}

check.dependsOn jacocoTestCoverageVerification
```

Coverage report generated on every `./gradlew check`. Build fails if thresholds are not met.

### 2.3 SpotBugs + PMD

**SpotBugs:**
```groovy
plugins {
    id 'com.github.spotbugs' version '6.0.7'
}

spotbugs {
    effort = 'max'
    reportLevel = 'medium'
    excludeFilter = file('config/spotbugs-exclude.xml')
}
```

Exclude filter suppresses known false positives (e.g., Spring-managed nullability).

**PMD:**
```groovy
pmd {
    ruleSetFiles = files('config/pmd-rules.xml')
    consoleOutput = true
}
```

Rules: unused variables, empty catch blocks, god classes (>500 lines), cyclomatic complexity >15.

### 2.4 Checkstyle

Formalize existing formatting. The project already uses Checkstyle v10.21.2 with a config at `config/checkstyle/checkstyle.xml`. Extend the existing config to also enforce:
- No star imports
- Max line length: 120 characters
- Opening brace on same line
- Import ordering: java, jakarta, org, mn.tasky
- No trailing whitespace

```groovy
checkstyle {
    configFile = file('config/checkstyle.xml')
    maxWarnings = 0
}
```

---

## 3. Production Hardening

### 3.1 Distributed Scheduler Locks (ShedLock)

**Dependency:**
```groovy
implementation 'net.javacrumbs.shedlock:shedlock-spring:5.16.0'
implementation 'net.javacrumbs.shedlock:shedlock-provider-jdbc-template:5.16.0'
```

**Migration** (V13):
```sql
CREATE TABLE IF NOT EXISTS shedlock (
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMP    NOT NULL,
    locked_at  TIMESTAMP    NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
```

**Configuration:**
```java
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class ShedLockConfig {
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(dataSource);
    }
}
```

**Scheduler migration:** Replace `SchedulerLockRunner.runWithLock()` calls with `@SchedulerLock` annotations on all 8 schedulers:

| Scheduler | Lock Name | lockAtMostFor | lockAtLeastFor |
|---|---|---|---|
| NoShowReminderScheduler | no_show_reminder | 5m | 30s |
| RescheduleExpiryScheduler | reschedule_expiry | 5m | 30s |
| ReviewReminderScheduler | review_reminder | 5m | 30s |
| ReviewEnforcementExpiryScheduler | review_enforcement_expiry | 5m | 30s |
| DisputeEvidenceGraceScheduler | dispute_evidence_grace | 5m | 30s |
| BadgeRevocationScheduler | badge_revocation | 10m | 1m |
| DataRetentionScheduler | data_retention | 10m | 1m |
| FacebookCircuitBreakerProbe | facebook_probe | 50s | 10s |

After migration, `SchedulerLockRunner` can be deprecated (keep for tests, remove from production path).

### 3.2 Health Check Endpoints

Configure Spring Boot Actuator:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
      group:
        readiness:
          include: db,facebookAuth
        liveness:
          include: ping
  health:
    db:
      enabled: true
```

Custom health indicators:
- `FacebookHealthIndicator` — already exists
- `OutboxHealthIndicator` — DOWN if oldest unprocessed event > 5 minutes
  - Query: `SELECT MIN(created_at) FROM domain_outbox_events WHERE status IN ('PENDING', 'PROCESSING') AND available_at <= now()`
  - If result is NULL (no pending events), report UP
  - If `now() - result > 5 minutes`, report DOWN with detail `{"lag_seconds": N}`

### 3.3 Global Exception Handler

Create `mn.tasky.common.api.GlobalExceptionHandler`:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(...) { ... }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(...) { ... }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(...) { ... }
}
```

Every response includes `code`, `message`, and `trace_id` from MDC. No stack traces in responses.

### 3.4 API Rate Limiting Filter

Create `mn.tasky.common.security.RateLimitFilter` as a Spring `OncePerRequestFilter`, registered in `SecurityConfig` after JWT authentication but before controller dispatch.

- Authenticated users: 100 req/min sliding window (keyed by user ID from JWT principal)
- Unauthenticated IPs: 30 req/min sliding window (keyed by `X-Forwarded-For` first hop if present, else `request.getRemoteAddr()` — configurable trusted proxy list via `tasky.security.trusted-proxies`)
- Algorithm: sliding window counter using existing `rate_limit_counters` table (V7), same pattern as `OtpRateLimitService`
- Excluded paths: `/actuator/**`, `/ws/**`
- Returns 429 with `Retry-After` header (seconds until window resets)
- WebSocket upgrade requests (`/ws`) are excluded; WebSocket message-level rate limiting is out of scope for this spec

### 3.5 Micrometer Metrics

Add Micrometer + Prometheus registry:

```groovy
implementation 'io.micrometer:micrometer-registry-prometheus'
```

Custom metrics:

| Metric | Type | Tags |
|---|---|---|
| `tasky.booking.transitions` | Counter | `from`, `to` |
| `tasky.outbox.lag_seconds` | Gauge | — |
| `tasky.scheduler.duration` | Timer | `job_name`, `status` |
| `tasky.circuit_breaker.state_changes` | Counter | `from`, `to` (single breaker; no `breaker` tag until Phase 2+) |
| `tasky.auth.login_attempts` | Counter | `method`, `result` |

**Cardinality bounds:** `job_name` has 8 values (see scheduler table in 3.1). Booking transition `from`/`to` are bounded by the 4-state enum (ASSIGNED, COMPLETED, CANCELLED, NO_SHOW). `method` is bounded by auth types (facebook, otp, dev). All tag sets are finite and small.

**Emission locations:** Booking transitions emitted in `BookingService.transition()`. Outbox lag emitted in `OutboxHealthIndicator`. Scheduler duration emitted in `ShedLockConfig` or individual schedulers. Circuit breaker emitted in `FacebookCircuitBreaker`. Login attempts emitted in `AuthService`.

---

## 4. Engineering Process

### 4.1 CI Pipeline (GitHub Actions)

File: `.github/workflows/ci.yml`

```yaml
jobs:
  build:
    steps:
      - checkout
      - setup-java (21, temurin)
      - ./gradlew build -x test          # compile + checkstyle

  static-analysis:
    needs: build
    steps:
      - ./gradlew spotbugsMain pmdMain

  test:
    needs: build
    services:
      postgres: postgres:16-alpine
    steps:
      - ./gradlew test jacocoTestReport jacocoTestCoverageVerification

  security:
    needs: build
    steps:
      - semgrep scan --config p/owasp-top-ten --config p/java
      - ./gradlew dependencyCheckAnalyze
```

Target: full pipeline < 5 minutes.

### 4.2 Pre-Commit Quality Gate

Add a Gradle task:

```groovy
tasks.register('precommit') {
    dependsOn 'spotlessCheck', 'checkstyleMain', 'compileJava', 'compileTestJava'
    description 'Quick local quality check before committing'
}
```

Run: `./gradlew precommit` — completes in ~15 seconds.

### 4.3 Branch Protection

On `main`:
- Require pull request (no direct push)
- Required status checks: `build`, `test`, `security` (all three must pass)
- Dismiss stale reviews when new commits are pushed
- Auto-delete head branches after merge
- No admin bypass — use urgent PR process for hotfixes (fast-track review, not skip)

### 4.4 ADR Discipline

Any change touching auth, payment, data lifecycle, or module boundaries that affects >3 files or introduces a new dependency gets an ADR in `docs/adr/` (template: `docs/adr/README.md`):

```markdown
# NNNN — Title

**Status:** Accepted
**Date:** YYYY-MM-DD

## Context
What prompted the decision.

## Decision
What we decided and why.

## Consequences
What changes as a result.
```

---

## Implementation Order

The streams are ordered by risk reduction per unit of effort:

1. **Security Audit** (Stream 1) — highest-impact, surfaces unknown risks
2. **Production Hardening** (Stream 3) — fixes known architectural risks (ShedLock, error handling)
3. **Structural Enforcement** (Stream 2) — prevents future regressions
4. **Engineering Process** (Stream 4) — sustains quality over time

Within each stream, items are independent and can be parallelized via subagents.

---

## Out of Scope

- Frontend (React Native) quality — separate effort
- Performance/load testing — Phase 2 concern
- Kubernetes/deployment infrastructure — separate from code quality
- Microservices decomposition — post-Phase 4 per architecture doc
