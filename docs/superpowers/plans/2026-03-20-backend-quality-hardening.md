# Backend Quality Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Tasky backend with security auditing, production hardening (ShedLock, global error handling, rate limiting, metrics), ArchUnit structural enforcement, and engineering process gates — building on the extensive quality tooling already in place.

**Architecture:** The project already has JaCoCo (80%), Checkstyle, Spotless, SpotBugs+FindSecBugs, PMD, ErrorProne, OWASP dependency-check, Micrometer Prometheus, Actuator, and a CI pipeline with Trivy. This plan adds only the missing pieces: Semgrep custom rules, authorization matrix tests, ArchUnit, ShedLock, global exception handling, rate limiting, custom metrics, and a pre-commit task.

**Tech Stack:** Java 21, Spring Boot 3.4, JDBI 3, PostgreSQL 16, Flyway, Testcontainers, JUnit 5, ArchUnit, ShedLock

**Spec:** `docs/superpowers/specs/2026-03-20-backend-quality-hardening-design.md`

**What already exists (DO NOT recreate):**
- `build.gradle.kts` — JaCoCo (80% line coverage), Checkstyle (v10.21.2), Spotless (Palantir), PMD (v7.9.0), SpotBugs (v4.8.6 + FindSecBugs), ErrorProne, Micrometer Prometheus registry
- OWASP dependency-check plugin (v12.1.0) — configured with CVSS 7.0 threshold and `config/owasp/suppressions.xml`
- `config/checkstyle/`, `config/pmd/`, `config/spotbugs/`, `config/owasp/` — all configured
- `.github/workflows/quality-gates.yml` — Trivy (filesystem + container), dependency review, self-verify, frontend quality
- `src/main/java/mn/tasky/auth/application/FacebookHealthIndicator.java` — exists
- Existing `rate_limit_counters` table (V7 migration) and `RateLimitCounterDao` for OTP rate limiting

---

## Chunk 1: Security Audit

### Task 1: Semgrep Scan + Custom Rules

**Files:**
- Create: `config/semgrep/tasky-rules.yaml`

- [ ] **Step 1: Run Semgrep with standard rulesets**

```bash
semgrep scan --config p/owasp-top-ten --config p/java src/main/java/mn/tasky/ --json > /tmp/semgrep-results.json
```

Review output. Triage findings into: FIX (code change needed), ACCEPT (false positive, document in ADR), IGNORE (not applicable).

- [ ] **Step 2: Fix all HIGH and MEDIUM findings**

Apply fixes per Semgrep output. Each fix is a targeted code change (e.g., add input validation, fix insecure pattern).

- [ ] **Step 3: Create custom Semgrep rules file**

```yaml
# config/semgrep/tasky-rules.yaml
rules:
  - id: admin-endpoint-requires-admin-role
    patterns:
      - pattern: |
          @RequestMapping("$PATH")
          ... class $CONTROLLER { ... }
      - metavariable-regex:
          metavariable: $PATH
          regex: ".*/admin/.*"
      - pattern-not-inside: |
          @RequestMapping("$PATH")
          ... class $CONTROLLER { ... }
    message: "Admin endpoint controller must be secured via SecurityConfig admin matchers"
    languages: [java]
    severity: WARNING

  - id: no-string-concat-in-sql
    pattern: |
      @SqlQuery("..." + $VAR + "...")
    message: "Use @Bind parameters instead of string concatenation in SQL"
    languages: [java]
    severity: ERROR

  - id: no-string-concat-in-sql-update
    pattern: |
      @SqlUpdate("..." + $VAR + "...")
    message: "Use @Bind parameters instead of string concatenation in SQL"
    languages: [java]
    severity: ERROR

  - id: freetext-requires-sanitizer
    patterns:
      - pattern: |
          $DAO.$METHOD(..., $INPUT, ...);
      - pattern-not-inside: |
          ... TextSanitizer.plainText($INPUT) ...
      - metavariable-regex:
          metavariable: $METHOD
          regex: "insert|update"
    message: "User-supplied freetext should be sanitized via TextSanitizer.plainText() before persistence"
    languages: [java]
    severity: WARNING
```

Note: The `freetext-requires-sanitizer` rule is best-effort — it may produce false positives on non-freetext fields. If too noisy, convert to an ArchUnit test or manual code review checklist and document in an ADR.

- [ ] **Step 4: Run Semgrep with custom rules**

```bash
semgrep scan --config config/semgrep/tasky-rules.yaml src/main/java/mn/tasky/
```

Expected: zero findings (existing code already uses @Bind everywhere).

- [ ] **Step 5: Commit**

```
chore(security): add Semgrep custom rules and fix scan findings
```

---

### Task 2: Secrets Scanning

- [ ] **Step 1: Install and run gitleaks**

```bash
brew install gitleaks  # if not installed
gitleaks detect --source . --verbose --report-path /tmp/gitleaks-report.json
```

Expected: zero findings. All secrets use environment variables (`TASKY_JWT_SECRET`, etc.).

- [ ] **Step 2: If findings exist, rotate affected secrets and add .gitleaksignore**

- [ ] **Step 3: Commit .gitleaksignore if created**

---

### Task 3: Authorization Matrix Tests

**Files:**
- Create: `src/test/java/mn/tasky/security/AuthorizationMatrixTests.java`

- [ ] **Step 1: Create parameterized authorization test**

Test every endpoint pattern with 4 authentication states (unauthenticated, CUSTOMER, TASKER, ADMIN). Use `TestRestTemplate` with JWT tokens for each role. Structure as `@ParameterizedTest` with `@MethodSource`.

Key endpoints to verify:
- `POST /api/v1/tasks` → CUSTOMER only
- `POST /api/v1/tasks/{id}/applications` → TASKER only
- `GET /api/v1/admin/**` → ADMIN only
- `GET /api/v1/tasks` → any authenticated user
- `POST /api/v1/auth/facebook` → unauthenticated allowed

Extend `IntegrationTestBase` for Testcontainers PostgreSQL.

- [ ] **Step 2: Run tests**

```bash
./gradlew test --tests "mn.tasky.security.AuthorizationMatrixTests" --no-daemon
```

Expected: all assertions pass (existing SecurityConfig correctly gates routes).

- [ ] **Step 3: Fix any failing assertions**

If an endpoint allows wrong-role access, fix the route matcher in `SecurityConfig.java`.

- [ ] **Step 4: Commit**

```
test(security): authorization matrix for all endpoints
```

---

### Task 4: Input Validation Completeness Audit

**Files:**
- Modify: ~30 DTO files under `src/main/java/mn/tasky/*/dto/`
- Create: `docs/quality/INPUT_VALIDATION_AUDIT.md`

- [ ] **Step 1: Audit all request DTOs**

Find all record types used as `@RequestBody`:

```bash
grep -rn "@RequestBody" src/main/java/mn/tasky/ | grep -oP '\w+Request'
```

For each DTO, verify every `String` field has `@Size(max = N)`. Document in `docs/quality/INPUT_VALIDATION_AUDIT.md`.

- [ ] **Step 2: Add missing @Size annotations**

Apply `@Size` constraints to any String field lacking them. Use these defaults:
- Freetext content: `@Size(max = 2000)`
- Keys/tokens: `@Size(max = 512)`
- Names: `@Size(max = 200)`
- Descriptions: `@Size(max = 5000)`

Already fixed: `RescheduleRequest`, `DisputeRequest.EvidenceItem`, `RejectVerificationRequest`, `RegisterDeviceRequest`.

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
./gradlew test --no-daemon
```

- [ ] **Step 4: Commit**

```
fix(validation): complete input validation audit across all DTOs
```

---

## Chunk 2: Production Hardening

### Task 5: ShedLock Distributed Scheduler Locks

**Files:**
- Modify: `build.gradle.kts` (add ShedLock dependency)
- Create: `src/main/resources/db/migration/V13__shedlock_table.sql`
- Create: `src/main/java/mn/tasky/common/config/ShedLockConfig.java`
- Modify: `src/main/java/mn/tasky/booking/scheduling/NoShowReminderScheduler.java`
- Modify: `src/main/java/mn/tasky/booking/scheduling/RescheduleExpiryScheduler.java`
- Modify: `src/main/java/mn/tasky/review/scheduling/ReviewReminderScheduler.java`
- Modify: `src/main/java/mn/tasky/review/scheduling/ReviewEnforcementExpiryScheduler.java`
- Modify: `src/main/java/mn/tasky/dispute/scheduling/DisputeEvidenceGraceScheduler.java`
- Modify: `src/main/java/mn/tasky/auth/scheduling/BadgeRevocationScheduler.java`
- Modify: `src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`
- Modify: `src/main/java/mn/tasky/common/scheduling/DataRetentionScheduler.java` (or wherever it lives)

- [ ] **Step 1: Add ShedLock dependencies to build.gradle.kts**

Add after the JDBI dependencies block:

```kotlin
// ShedLock — distributed scheduler locks
implementation("net.javacrumbs.shedlock:shedlock-spring:5.16.0")
implementation("net.javacrumbs.shedlock:shedlock-provider-jdbc-template:5.16.0")
```

- [ ] **Step 2: Create V13 Flyway migration**

```sql
-- V13__shedlock_table.sql
-- Distributed scheduler lock table for ShedLock.
-- Prevents duplicate scheduler executions in multi-instance deployments.
CREATE TABLE IF NOT EXISTS shedlock (
    name       VARCHAR(64)  NOT NULL,
    lock_until TIMESTAMP    NOT NULL,
    locked_at  TIMESTAMP    NOT NULL,
    locked_by  VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
);
```

- [ ] **Step 3: Create ShedLockConfig**

```java
package mn.tasky.common.config;

import javax.sql.DataSource;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "10m")
public class ShedLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new org.springframework.jdbc.core.JdbcTemplate(dataSource))
                        .usingDbTime()
                        .build());
    }
}
```

- [ ] **Step 4: Migrate all 8 schedulers**

For each scheduler, replace the `lockRunner.runWithLock(...)` pattern with `@SchedulerLock`. Example for `NoShowReminderScheduler`:

Before:
```java
@Scheduled(fixedDelay = 60_000)
public void checkReminders() {
    lockRunner.runWithLock("no_show_reminder", this::doCheckReminders);
}
```

After:
```java
@Scheduled(fixedDelay = 60_000)
@SchedulerLock(name = "no_show_reminder", lockAtMostFor = "5m", lockAtLeastFor = "30s")
public void checkReminders() {
    doCheckReminders();
}
```

Apply same pattern to all 8 schedulers per the lock table in the spec (Section 3.1).

- [ ] **Step 5: Run tests**

```bash
./gradlew test --no-daemon
```

- [ ] **Step 6: Commit**

```
feat(infra): ShedLock distributed scheduler locks for all 8 schedulers
```

---

### Task 6: Outbox Health Indicator

**Files:**
- Create: `src/main/java/mn/tasky/common/health/OutboxHealthIndicator.java`

- [ ] **Step 1: Create OutboxHealthIndicator**

```java
package mn.tasky.common.health;

import org.jdbi.v3.core.Jdbi;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Component
public class OutboxHealthIndicator implements HealthIndicator {

    private static final Duration MAX_LAG = Duration.ofMinutes(5);
    private final Jdbi jdbi;

    public OutboxHealthIndicator(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @Override
    public Health health() {
        Optional<Instant> oldest = jdbi.withHandle(handle ->
                handle.createQuery(
                        "SELECT MIN(created_at) FROM domain_outbox_events "
                        + "WHERE status IN ('PENDING', 'PROCESSING') AND available_at <= now()")
                .mapTo(Instant.class)
                .findOne());

        if (oldest.isEmpty()) {
            return Health.up().withDetail("lag_seconds", 0).build();
        }

        long lagSeconds = Duration.between(oldest.get(), Instant.now()).getSeconds();
        if (lagSeconds > MAX_LAG.getSeconds()) {
            return Health.down()
                    .withDetail("lag_seconds", lagSeconds)
                    .withDetail("oldest_pending", oldest.get().toString())
                    .build();
        }
        return Health.up().withDetail("lag_seconds", lagSeconds).build();
    }
}
```

- [ ] **Step 2: Update application.yml health groups**

Check `src/main/resources/application.yml` for existing `management.endpoint.health` config. If health groups already exist, add `outbox` to the readiness include list. If no health groups are configured, add the full block:

```yaml
management:
  endpoint:
    health:
      show-details: when-authorized
      group:
        readiness:
          include: db,facebookAuth,outbox
        liveness:
          include: ping
```

- [ ] **Step 3: Run tests**

```bash
./gradlew test --no-daemon
```

- [ ] **Step 4: Commit**

```
feat(health): outbox lag health indicator for readiness checks
```

---

### Task 7: Global Exception Handler

**Files:**
- Create: `src/main/java/mn/tasky/common/api/GlobalExceptionHandler.java`
- Create: `src/main/java/mn/tasky/common/api/ErrorResponse.java`
- Create: `src/test/java/mn/tasky/common/GlobalExceptionHandlerTests.java`

- [ ] **Step 1: Create ErrorResponse record**

```java
package mn.tasky.common.api;

public record ErrorResponse(String code, String message, String traceId) {}
```

- [ ] **Step 2: Create GlobalExceptionHandler**

```java
package mn.tasky.common.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String field = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Validation failed");
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("VALIDATION_ERROR", field, traceId()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("FORBIDDEN", "Access denied", traceId()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", ex.getMessage(), traceId()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", traceId()));
    }

    private String traceId() {
        String id = MDC.get("correlationId");
        return id != null ? id : "unknown";
    }
}
```

- [ ] **Step 3: Write test**

Test that validation errors return structured ErrorResponse with trace_id. Test that unexpected exceptions return 500 without stack trace.

- [ ] **Step 4: Run tests**

```bash
./gradlew test --no-daemon
```

- [ ] **Step 5: Commit**

```
feat(api): global exception handler with structured error responses
```

---

### Task 8: API Rate Limiting Filter

**Files:**
- Create: `src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- Modify: `src/main/java/mn/tasky/common/config/SecurityConfig.java` (register filter)
- Create: `src/test/java/mn/tasky/common/RateLimitFilterTests.java`

- [ ] **Step 1: Create RateLimitFilter**

Implement as a `OncePerRequestFilter`. For authenticated requests, key by user ID from `SecurityContextHolder`. For unauthenticated, key by IP (using `X-Forwarded-For` first hop if configured, else `getRemoteAddr()`). Use the existing `rate_limit_counters` table via inline `Jdbi.withHandle()` queries (same sliding window pattern as `OtpRateLimitService` but with configurable limits). Return 429 with `Retry-After` header when limit exceeded.

Configurable via `application.yml`:
```yaml
tasky:
  rate-limit:
    authenticated-rpm: 100
    unauthenticated-rpm: 30
    trusted-proxies: []
```

Exclude `/actuator/**` and `/ws/**` paths.

- [ ] **Step 2: Register in SecurityConfig**

Add the filter after `JwtAuthenticationFilter` in the Spring Security filter chain.

- [ ] **Step 3: Write test**

Test: send 31 requests from unauthenticated IP → 31st returns 429. Test: authenticated user can send 100 within a minute. Test: `/actuator/health` is excluded.

- [ ] **Step 4: Run tests**

```bash
./gradlew test --no-daemon
```

- [ ] **Step 5: Commit**

```
feat(security): API rate limiting filter with sliding window
```

---

### Task 9: Custom Business Metrics

**Files:**
- Modify: `src/main/java/mn/tasky/booking/application/BookingService.java` (booking transition counter)
- Modify: `src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java` (state change counter)
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java` (login attempt counter)
- Modify: `src/main/java/mn/tasky/common/health/OutboxHealthIndicator.java` (add gauge — created in Task 6; Task 6 must be completed first)

- [ ] **Step 1: Add MeterRegistry injection to services**

In each service, inject `io.micrometer.core.instrument.MeterRegistry` and register counters/gauges:

**BookingService** — `transition()` method:
```java
meterRegistry.counter("tasky.booking.transitions", "from", oldStatus, "to", newStatus).increment();
```

**FacebookCircuitBreaker** — state transition methods:
```java
meterRegistry.counter("tasky.circuit_breaker.state_changes", "from", oldState.name(), "to", newState.name()).increment();
```

**AuthService** — login methods:
```java
meterRegistry.counter("tasky.auth.login_attempts", "method", "facebook", "result", "success").increment();
```

**OutboxHealthIndicator** — register gauge in constructor:
```java
Gauge.builder("tasky.outbox.lag_seconds", this, indicator -> indicator.computeLagSeconds())
    .register(meterRegistry);
```

- [ ] **Step 2: Run tests**

```bash
./gradlew test --no-daemon
```

- [ ] **Step 3: Verify metrics endpoint**

```bash
curl localhost:8080/actuator/prometheus | grep tasky
```

Expected: `tasky_booking_transitions_total`, `tasky_outbox_lag_seconds`, etc.

- [ ] **Step 4: Commit**

```
feat(observability): custom business metrics for bookings, auth, outbox, circuit breaker
```

---

## Chunk 3: Structural Enforcement

### Task 10: ArchUnit Module Boundary Tests

**Files:**
- Modify: `build.gradle.kts` (add ArchUnit dependency)
- Create: `src/test/java/mn/tasky/architecture/ArchitectureTests.java`

- [ ] **Step 1: Add ArchUnit dependency**

```kotlin
testImplementation("com.tngtech.archunit:archunit-junit5:1.3.0")
```

- [ ] **Step 2: Create ArchitectureTests**

```java
package mn.tasky.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = "mn.tasky", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTests {

    // Module boundary rules
    @ArchTest
    static final ArchRule booking_should_not_access_admin =
            noClasses().that().resideInAPackage("..booking..")
                    .should().accessClassesThat().resideInAPackage("..admin..");

    @ArchTest
    static final ArchRule wallet_only_accesses_common =
            noClasses().that().resideInAPackage("..wallet..")
                    .should().accessClassesThat().resideInAnyPackage(
                            "..task..", "..booking..", "..dispute..", "..review..",
                            "..messaging..", "..notification..", "..admin..", "..category..");

    @ArchTest
    static final ArchRule analytics_is_leaf_node =
            noClasses().that().resideOutsideOfPackage("..analytics..")
                    .should().accessClassesThat().resideInAPackage("..analytics.application..")
                    .because("analytics is a leaf node — other modules should not depend on its services");

    // Layer rules
    @ArchTest
    static final ArchRule daos_not_in_controllers =
            noClasses().that().resideInAPackage("..api..")
                    .should().dependOnClassesThat().resideInAPackage("..dao..")
                    .because("controllers must use services, not DAOs directly");

    @ArchTest
    static final ArchRule scheduling_does_not_import_api =
            noClasses().that().resideInAPackage("..scheduling..")
                    .should().dependOnClassesThat().resideInAPackage("..api..");

    @ArchTest
    static final ArchRule dtos_do_not_import_services =
            noClasses().that().resideInAPackage("..dto..")
                    .should().dependOnClassesThat().resideInAnyPackage("..dao..", "..application..");

    // Naming rules
    @ArchTest
    static final ArchRule controllers_annotated =
            classes().that().haveSimpleNameEndingWith("Controller")
                    .should().beAnnotatedWith(org.springframework.web.bind.annotation.RestController.class);

    @ArchTest
    static final ArchRule services_annotated =
            classes().that().haveSimpleNameEndingWith("Service")
                    .and().resideInAPackage("..application..")
                    .should().beAnnotatedWith(org.springframework.stereotype.Service.class);
}
```

- [ ] **Step 3: Run architecture tests and identify violations**

```bash
./gradlew test --tests "mn.tasky.architecture.ArchitectureTests" --no-daemon 2>&1 | tee /tmp/archunit-results.txt
```

Review output. Expected: most rules pass. Likely violations:
- `daos_not_in_controllers` may flag `DomainEventOutboxProcessor` (it's a service, not a controller — rule should pass)
- `analytics_is_leaf_node` may flag `DomainEventOutboxProcessor` importing `AnalyticsService` — this is intentional (outbox dispatches analytics events). If flagged, exclude with `.ignoreDependency(DomainEventOutboxProcessor.class, AnalyticsService.class)`.

Document violation count in PR body.

- [ ] **Step 4: Fix violations or add documented exceptions (~5 min per violation)**

For each violation:
- If the violation is a real boundary breach: refactor the import (move through service layer)
- If intentional: add an ArchUnit `.because()` exception with ADR reference

- [ ] **Step 5: Re-run tests to verify all pass**

```bash
./gradlew test --tests "mn.tasky.architecture.ArchitectureTests" --no-daemon
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```
test(arch): ArchUnit module boundary and layer enforcement
```

---

## Chunk 4: Engineering Process

### Task 11: Pre-Commit Gradle Task

**Files:**
- Modify: `build.gradle.kts`

- [ ] **Step 1: Add precommit task**

At the end of `build.gradle.kts`:

```kotlin
tasks.register("precommit") {
    description = "Quick local quality check before committing (~15s)"
    group = "verification"
    dependsOn("spotlessCheck", "checkstyleMain", "compileJava", "compileTestJava")
}
```

- [ ] **Step 2: Test it**

```bash
./gradlew precommit --no-daemon
```

Expected: completes in ~20-30 seconds with BUILD SUCCESSFUL.

- [ ] **Step 3: Commit**

```
chore(build): add precommit Gradle task for local quality checks
```

---

### Task 12: Add Semgrep to CI Pipeline

**Files:**
- Modify: `.github/workflows/quality-gates.yml`

- [ ] **Step 1: Add Semgrep job to quality-gates.yml**

Add after the `dependency-security` job:

```yaml
  semgrep-sast:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    container:
      image: semgrep/semgrep
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Semgrep (OWASP + Java + custom rules)
        run: |
          semgrep scan \
            --config p/owasp-top-ten \
            --config p/java \
            --config config/semgrep/tasky-rules.yaml \
            --error \
            src/main/java/mn/tasky/
```

- [ ] **Step 2: Commit**

```
ci: add Semgrep SAST scan to quality-gates pipeline
```

---

### Task 13: Branch Protection Rules

**Depends on:** Task 12 must be committed and pushed first — the `semgrep-sast` job must exist in the CI pipeline before branch protection can reference it as a required check.

- [ ] **Step 1: Configure branch protection on main via GitHub UI or gh CLI**

```bash
gh api repos/{owner}/{repo}/branches/main/protection -X PUT -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=self-verify' \
  -f 'required_status_checks[contexts][]=dependency-security' \
  -f 'required_status_checks[contexts][]=semgrep-sast' \
  -f 'enforce_admins=true' \
  -f 'required_pull_request_reviews[dismiss_stale_reviews]=true' \
  -f 'required_pull_request_reviews[required_approving_review_count]=0' \
  -f 'restrictions=null' \
  -f 'allow_force_pushes=false' \
  -f 'allow_deletions=false'
```

Note: `required_approving_review_count=0` is appropriate for solo dev — CI is the reviewer. Increase when team grows.

- [ ] **Step 2: Verify protection**

```bash
gh api repos/{owner}/{repo}/branches/main/protection | jq '.required_status_checks'
```

---

## Execution Order

Tasks are ordered by risk reduction:

| Priority | Task | Stream | Risk Addressed |
|---|---|---|---|
| 1 | Task 1: Semgrep scan | Security | Unknown SAST vulnerabilities |
| 2 | Task 2: Secrets scan | Security | Leaked credentials |
| 3 | Task 5: ShedLock | Hardening | Duplicate scheduler execution |
| 4 | Task 7: Global exception handler | Hardening | Information disclosure in errors |
| 5 | Task 3: Auth matrix tests | Security | Broken access control |
| 6 | Task 8: Rate limiting filter | Hardening | DoS/abuse |
| 7 | Task 10: ArchUnit tests | Structure | Coupling drift |
| 8 | Task 4: Input validation audit | Security | Unbounded payloads |
| 9 | Task 6: Outbox health indicator | Hardening | Silent processing failures |
| 10 | Task 9: Custom metrics | Hardening | Observability gaps |
| 11 | Task 11: Precommit task | Process | Dev feedback loop |
| 12 | Task 12: Semgrep CI | Process | Automated security scanning |
| 13 | Task 13: Branch protection | Process | Accidental push to main |

**Parallelization:** Tasks 1-4 (security audit) are independent. Tasks 5-9 (hardening) are independent. Tasks 10-13 (structure/process) are independent. Within each chunk, all tasks can run as parallel subagents.
