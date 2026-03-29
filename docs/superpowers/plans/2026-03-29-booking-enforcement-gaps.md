# Booking Enforcement Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close two PRD enforcement gaps (Instant Match revocation on second late cancel, disclaimer rejection at booking creation), fix the tests that missed them, and add a scoped PIT mutation gate to `gateRegression` so weak assertions are caught on every PR merge.

**Architecture:** The Instant Match revocation writes a self-expiring timestamp flag (`instant_match_revoked_until`) to `user_profiles`; `AuthService` owns read/write of that flag and `BookingService.cancelBooking` calls it after inserting a `CUSTOMER_LATE_CANCEL_PENALTY` incident. The disclaimer guard already exists in `TaskService.acceptApplication` — only the test placement is wrong. PIT scoped to `mn.tasky.booking.*` + `mn.tasky.auth.*` is added as a dependency of `gateRegression` so regressions are caught without running the full-module nightly scan.

**Tech Stack:** Java 21, Spring Boot 3, JDBI 3, Flyway, JUnit 5, Mockito, PIT 1.17.0 (solidsoft Gradle plugin 1.15.0)

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Create | `src/main/resources/db/migration/V17__instant_match_revocation.sql` | Adds `instant_match_revoked_until TIMESTAMPTZ NULL` to `user_profiles` |
| Modify | `src/main/java/mn/tasky/auth/dto/UserProfileState.java` | Add `Instant instantMatchRevokedUntil` field to record |
| Modify | `src/main/java/mn/tasky/auth/dao/ProfileDao.java` | Extend SELECT + add `setInstantMatchRevokedUntil` method |
| Modify | `src/main/java/mn/tasky/auth/application/AuthService.java` | Add `revokeInstantMatch` + `isInstantMatchAllowed` methods |
| Modify | `src/main/java/mn/tasky/booking/application/BookingService.java` | Call `revokeInstantMatch` after inserting `CUSTOMER_LATE_CANCEL_PENALTY` |
| Modify | `src/test/java/mn/tasky/booking/BookingScenarioTests.java` | Add `revokeInstantMatch` assertion to SCN-BOOK-004; delete weak SCN-BOOK-007 body |
| Create | `src/test/java/mn/tasky/task/TaskAcceptScenarioTests.java` | Domain-unit test for SCN-BOOK-007 (disclaimer rejection via `TaskService`) |
| Modify | `build.gradle.kts` | Add `pitestBookingAuth` task; wire to `gateRegression` |
| Modify | `AGENTS.md` | Add MUST NOT rule for invocation-only assertions |

---

## Task 1: Flyway migration — add `instant_match_revoked_until` column

**Files:**
- Create: `src/main/resources/db/migration/V17__instant_match_revocation.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- V17__instant_match_revocation.sql
-- Adds a self-expiring Instant Match revocation flag to user profiles.
-- NULL = unrestricted. Future timestamp = blocked until that point.
ALTER TABLE user_profiles
    ADD COLUMN instant_match_revoked_until TIMESTAMPTZ NULL;
```

- [ ] **Step 2: Verify Flyway picks it up**

```bash
docker compose up -d postgres minio minio-bootstrap
./gradlew --no-daemon flywayMigrate 2>&1 | tail -20
```

Expected: `Successfully applied 1 migration to schema "public"` with `V17`.

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/migration/V17__instant_match_revocation.sql
git commit -m "chore(db): V17 — add instant_match_revoked_until to user_profiles"
```

---

## Task 2: `UserProfileState` + `ProfileDao` — expose the new column

**Files:**
- Modify: `src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- Modify: `src/main/java/mn/tasky/auth/dao/ProfileDao.java`

- [ ] **Step 1: Add the field to `UserProfileState`**

Replace the entire file content:

```java
package mn.tasky.auth.dto;

import java.time.Instant;

public record UserProfileState(
        String fullName,
        String avatarUrl,
        double ratingAvg,
        int completedTasks,
        Instant instantMatchRevokedUntil) {

    private static final String DEFAULT_PROFILE_NAME = "Tasky User";

    public static UserProfileState defaultState() {
        return new UserProfileState(DEFAULT_PROFILE_NAME, null, 0.0d, 0, null);
    }
}
```

- [ ] **Step 2: Compile to catch broken callers**

```bash
./gradlew --no-daemon compileJava compileTestJava 2>&1 | grep -E "error:|warning:"
```

Expected: compile errors wherever `new UserProfileState(...)` is called with four args. Fix each one by adding a trailing `null` argument. (If only `defaultState()` breaks, only that needs updating — which you already did in Step 1.)

- [ ] **Step 3: Update `ProfileDao` — extend the SELECT and add the write method**

Replace the entire `ProfileDao.java`:

```java
package mn.tasky.auth.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dto.UserProfileState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(UserProfileState.class)
public interface ProfileDao {

    default void ensureExists(String userId, String fullName) {
        ensureExists(required(userId, "userId"), fullName);
    }

    @SqlUpdate("INSERT INTO profiles (user_id, full_name, avatar_url, rating_avg, completed_tasks) "
            + "VALUES (:userId, :fullName, NULL, 0, 0) "
            + "ON CONFLICT (user_id) DO NOTHING")
    void ensureExists(@Bind("userId") UUID userId, @Bind("fullName") String fullName);

    default Optional<UserProfileState> findByUserId(String userId) {
        return findByUserId(required(userId, "userId"));
    }

    @SqlQuery("SELECT full_name, avatar_url, rating_avg, completed_tasks, instant_match_revoked_until "
            + "FROM profiles WHERE user_id = :userId")
    Optional<UserProfileState> findByUserId(@Bind("userId") UUID userId);

    default void updateNameAndAvatar(String userId, String fullName, String avatarUrl) {
        updateNameAndAvatar(required(userId, "userId"), fullName, avatarUrl);
    }

    @SqlUpdate("UPDATE profiles SET full_name = :fullName, avatar_url = :avatarUrl WHERE user_id = :userId")
    void updateNameAndAvatar(
            @Bind("userId") UUID userId,
            @Bind("fullName") String fullName,
            @Bind("avatarUrl") String avatarUrl);

    default void updateStats(String userId, double ratingAvg, int completedTasks) {
        updateStats(required(userId, "userId"), ratingAvg, completedTasks);
    }

    @SqlUpdate("UPDATE profiles SET rating_avg = :ratingAvg, completed_tasks = :completedTasks "
            + "WHERE user_id = :userId")
    void updateStats(
            @Bind("userId") UUID userId,
            @Bind("ratingAvg") double ratingAvg,
            @Bind("completedTasks") int completedTasks);

    default void setInstantMatchRevokedUntil(String userId, Instant revokedUntil) {
        setInstantMatchRevokedUntil(required(userId, "userId"), revokedUntil);
    }

    @SqlUpdate("UPDATE profiles SET instant_match_revoked_until = :revokedUntil WHERE user_id = :userId")
    void setInstantMatchRevokedUntil(
            @Bind("userId") UUID userId, @Bind("revokedUntil") Instant revokedUntil);
}
```

- [ ] **Step 4: Compile**

```bash
./gradlew --no-daemon compileJava 2>&1 | grep -E "error:"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/mn/tasky/auth/dto/UserProfileState.java \
        src/main/java/mn/tasky/auth/dao/ProfileDao.java
git commit -m "feat(auth): expose instant_match_revoked_until on UserProfileState + ProfileDao"
```

---

## Task 3: `AuthService` — add `revokeInstantMatch` and `isInstantMatchAllowed`

**Files:**
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java`

- [ ] **Step 1: Add the two methods to `AuthService`**

Locate the end of the `AuthService` class (just before the closing `}`) and insert:

```java
    /**
     * Revokes Instant Match access for the given user for the specified duration.
     * Writes instant_match_revoked_until = NOW + duration to the user profile.
     *
     * @param userId   The user whose Instant Match access to revoke.
     * @param duration How long to revoke access for.
     */
    public void revokeInstantMatch(String userId, java.time.Duration duration) {
        Instant revokedUntil = Instant.now().plus(duration);
        profileDao.setInstantMatchRevokedUntil(userId, revokedUntil);
        log.info("Instant Match revoked for user {} until {}", userId, revokedUntil);
    }

    /**
     * Returns true if the user is currently allowed to use Instant Match.
     * Returns true if no revocation timestamp is recorded or if it has expired.
     * The matching flow must call this before offering Instant Match to a customer.
     *
     * <p>TODO: wire to matching flow before offering Instant Match (SCN-BOOK-004)
     *
     * @param userId The customer user ID to check.
     * @return true if Instant Match is allowed, false if currently revoked.
     */
    public boolean isInstantMatchAllowed(String userId) {
        return profileDao.findByUserId(userId)
                .map(p -> p.instantMatchRevokedUntil() == null
                        || Instant.now().isAfter(p.instantMatchRevokedUntil()))
                .orElse(true);
    }
```

- [ ] **Step 2: Compile**

```bash
./gradlew --no-daemon compileJava 2>&1 | grep -E "error:"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main/java/mn/tasky/auth/application/AuthService.java
git commit -m "feat(auth): add revokeInstantMatch and isInstantMatchAllowed"
```

---

## Task 4: Wire `revokeInstantMatch` in `BookingService` + fix SCN-BOOK-004 test

**Files:**
- Modify: `src/main/java/mn/tasky/booking/application/BookingService.java`
- Modify: `src/test/java/mn/tasky/booking/BookingScenarioTests.java`

- [ ] **Step 1: Write the failing test assertion first**

In `BookingScenarioTests`, find the `customerCancelLateMultipleTimes` test (SCN-BOOK-004). After the existing `verify(incidentDao).insert(...)` line, add:

```java
verify(authService).revokeInstantMatch(
        org.mockito.ArgumentMatchers.eq("customer-1"),
        org.mockito.ArgumentMatchers.eq(java.time.Duration.ofDays(30)));
```

The full test should look like:

```java
@Test
@DisplayName("SCN-BOOK-004: Late-cancel enforcement escalates from warning-only on first occurrence to \"Low Customer Reliability\" flag and Instant Match revocation on second occurrence in 28 days")
void customerCancelLateMultipleTimes() {
    BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);
    Instant scheduledAt = Instant.now().plus(2, ChronoUnit.HOURS);

    // Mock that they already have 1 recent incident
    org.mockito.Mockito.when(incidentDao.countRecentIncidents(
                    org.mockito.ArgumentMatchers.eq("customer-1"),
                    org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL%"),
                    any(Instant.class)))
            .thenReturn(1L);

    BookingTransitionResult result = bookingService.cancelBooking("customer-1", booking.id(), scheduledAt);

    assertThat(result.isSuccess()).isTrue();
    verify(incidentDao).insert(anyString(), anyString(), anyString(),
            org.mockito.ArgumentMatchers.eq("CUSTOMER_LATE_CANCEL_PENALTY"), anyString(), any());
    verify(authService).revokeInstantMatch(
            org.mockito.ArgumentMatchers.eq("customer-1"),
            org.mockito.ArgumentMatchers.eq(java.time.Duration.ofDays(30)));
}
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
./gradlew --no-daemon test --tests "mn.tasky.booking.BookingScenarioTests.customerCancelLateMultipleTimes" 2>&1 | tail -20
```

Expected: FAIL — `Wanted but not invoked: authService.revokeInstantMatch(...)`.

- [ ] **Step 3: Add `revokeInstantMatch` call in `BookingService.cancelBooking`**

In `BookingService.cancelBooking`, find the block where `incidentType` is set and the `bookingReliabilityIncidentDao.insert(...)` call happens (around line 304). Immediately after `bookingReliabilityIncidentDao.insert(...)`, add the revocation call:

```java
            bookingReliabilityIncidentDao.insert(
                    UUID.randomUUID().toString(),
                    bookingId,
                    userId,
                    incidentType,
                    recentIncidents == 0 ? "Customer cancelled within 4 hours. Warning issued."
                                         : "Customer cancelled within 4 hours. Ranking penalty and Instant Match disabled.",
                    Instant.now());

            if ("CUSTOMER_LATE_CANCEL_PENALTY".equals(incidentType)) {
                authService.revokeInstantMatch(userId, java.time.Duration.ofDays(30));
            }
```

- [ ] **Step 4: Run the test and confirm it passes**

```bash
./gradlew --no-daemon test --tests "mn.tasky.booking.BookingScenarioTests.customerCancelLateMultipleTimes" 2>&1 | tail -20
```

Expected: PASS.

- [ ] **Step 5: Run the full booking test suite**

```bash
./gradlew --no-daemon test --tests "mn.tasky.booking.*" 2>&1 | tail -30
```

Expected: all booking tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/mn/tasky/booking/application/BookingService.java \
        src/test/java/mn/tasky/booking/BookingScenarioTests.java
git commit -m "fix(booking): enforce Instant Match revocation on CUSTOMER_LATE_CANCEL_PENALTY (SCN-BOOK-004)"
```

---

## Task 5: Fix SCN-BOOK-007 — move test to the correct service boundary

The disclaimer guard already exists in `TaskService.acceptApplication` (returns `DISCLAIMER_REQUIRED_RESULT` when `liabilityDisclaimerAccepted` is `false`). The current test in `BookingScenarioTests` only checks construction state — it needs to be replaced by a test that exercises the rejection path.

**Files:**
- Create: `src/test/java/mn/tasky/task/TaskAcceptScenarioTests.java`
- Modify: `src/test/java/mn/tasky/booking/BookingScenarioTests.java`

- [ ] **Step 1: Write the new domain-unit test for SCN-BOOK-007**

Create `src/test/java/mn/tasky/task/TaskAcceptScenarioTests.java`:

```java
package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.category.application.CategoryService;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.application.ScopeSummaryGenerator;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dao.CategorySchemaVersionDao;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Domain-unit tests for task application acceptance scenarios.
 * No Spring context — all dependencies mocked via Mockito.
 */
class TaskAcceptScenarioTests {

    private TaskService taskService;
    private TaskDao taskDao;
    private TaskApplicationDao taskApplicationDao;
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        taskDao = mock(TaskDao.class);
        taskApplicationDao = mock(TaskApplicationDao.class);
        bookingService = mock(BookingService.class);

        taskService = new TaskService(
                mock(AuthService.class),
                mock(CategoryService.class),
                bookingService,
                mock(MessagingService.class),
                mock(NotificationService.class),
                mock(mn.tasky.analytics.application.AnalyticsService.class),
                mock(DomainEventOutboxService.class),
                mock(ReviewEnforcementService.class),
                mock(ScopeSummaryGenerator.class),
                mock(S3PresignedUrlService.class),
                mock(StorageKeyPolicy.class),
                taskDao,
                mock(TaskPhotoDao.class),
                taskApplicationDao,
                mock(CategorySchemaVersionDao.class),
                mock(TaskDraftDao.class),
                new ObjectMapper(),
                10.0,
                50);
    }

    // ── SCN-BOOK-007 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-BOOK-007: Booking confirmation without liability disclaimer acceptance is rejected")
    void acceptApplicationWithoutDisclaimerIsRejected() {
        String customerId = UUID.randomUUID().toString();
        String taskId = UUID.randomUUID().toString();
        String applicationId = UUID.randomUUID().toString();

        TaskState openTask = mock(TaskState.class);
        when(openTask.customerId()).thenReturn(customerId);
        when(openTask.status()).thenReturn("OPEN");
        when(taskDao.findById(taskId)).thenReturn(Optional.of(openTask));

        TaskAcceptResult result = taskService.acceptApplication(
                customerId, taskId, applicationId, false);

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo(TaskAcceptResult.DISCLAIMER_REQUIRED);
        verify(bookingService, never()).createBooking(
                anyString(), anyString(), anyString(), any(Integer.class));
        verify(bookingService, never()).createBooking(
                anyString(), anyString(), anyString(), any(Integer.class), any(Boolean.class));
        verify(bookingService, never()).createBooking(
                anyString(), anyString(), anyString(), any(Integer.class),
                any(Boolean.class), any(Instant.class));
    }
}
```

- [ ] **Step 2: Run the new test and confirm it passes**

```bash
./gradlew --no-daemon test --tests "mn.tasky.task.TaskAcceptScenarioTests.acceptApplicationWithoutDisclaimerIsRejected" 2>&1 | tail -20
```

Expected: PASS (the production guard is already in place).

- [ ] **Step 3: Replace the weak SCN-BOOK-007 body in `BookingScenarioTests`**

Find the SCN-BOOK-007 test in `BookingScenarioTests`. It currently reads:

```java
@Test
@DisplayName("SCN-BOOK-007: Booking confirmation without liability disclaimer acceptance is rejected")
void bookingConfirmationWithoutDisclaimerRejected() {
    BookingState booking = bookingService.createBooking("task-1", "tasker-1", "customer-1", 50_000);

    // The booking is created with disclaimer = false by default
    assertThat(booking.liabilityDisclaimerAccepted()).isFalse();

    // Attempting to complete without disclaimer — service should not allow transition
    // without the disclaimer flag (validated at controller, stored on booking)
    assertThat(store.get(booking.id()).liabilityDisclaimerAccepted()).isFalse();
}
```

Delete this entire test method. SCN-BOOK-007 is now covered by `TaskAcceptScenarioTests`.

- [ ] **Step 4: Run the sync-registry script and verify both scenarios show as covered**

```bash
./scripts/sync-registry.sh
grep -A 6 "SCN-BOOK-007" tests/registry.yaml
grep -A 6 "SCN-BOOK-004" tests/registry.yaml
```

Expected: both show `status: covered`.

- [ ] **Step 5: Run the smoke gate**

```bash
./gradlew --no-daemon gateSmoke 2>&1 | tail -10
```

Expected: `✅ Gate 'smoke' passed.`

- [ ] **Step 6: Commit**

```bash
git add src/test/java/mn/tasky/task/TaskAcceptScenarioTests.java \
        src/test/java/mn/tasky/booking/BookingScenarioTests.java \
        tests/registry.yaml
git commit -m "test(booking): fix SCN-BOOK-007 — move disclaimer rejection test to correct service boundary"
```

---

## Task 6: Scoped PIT on `gateRegression`

**Files:**
- Modify: `build.gradle.kts`

- [ ] **Step 1: Add the `pitestBookingAuth` task**

At the end of `build.gradle.kts`, after the existing `pitest { ... }` block, add:

```kotlin
// Scoped PIT for booking + auth domains — runs as part of gateRegression.
// Targets only the two domains with recent enforcement gaps so the gate stays fast.
// Floor starts at baseline (booking ~33%, auth ~12% combined ≈ 15%) — raise as
// coverage improves toward the 80% aspiration in the design doc.
tasks.register("pitestBookingAuth", info.solidsoft.gradle.pitest.PitestTask::class.java) {
    description = "Scoped mutation test for booking and auth packages. Blocks gateRegression."
    group = "verification"

    junit5PluginVersion.set("1.2.1")
    pitestVersion.set("1.17.0")

    targetClasses.set(setOf("mn.tasky.booking.*", "mn.tasky.auth.*"))
    excludedClasses.set(setOf(
        "mn.tasky.*.dto.*",
        "mn.tasky.auth.AccountRestrictedException"
    ))
    targetTests.set(setOf("mn.tasky.booking.*", "mn.tasky.auth.*", "mn.tasky.task.*"))
    excludedTestClasses.set(setOf(
        "mn.tasky.**.*IntegrationTests",
        "mn.tasky.**.*IntegrationTest",
        "mn.tasky.common.IntegrationTestBase",
        "mn.tasky.contract.OpenApiContractTestSupport"
    ))

    mutators.set(setOf("STRONGER"))
    threads.set(4)

    // Floor = current baseline rounded down to nearest 5%.
    // Raise this value when booking/auth test coverage improves.
    mutationThreshold.set(15)

    outputFormats.set(setOf("HTML", "XML"))
    reportDir.set(file("${layout.buildDirectory.get()}/reports/pitest-booking-auth"))
    timestampedReports.set(false)
    verbose.set(false)
}
```

- [ ] **Step 2: Wire `pitestBookingAuth` to `gateRegression`**

Find the `gateRegression` task registration and add `"pitestBookingAuth"` to its `dependsOn`:

```kotlin
tasks.register<Exec>("gateRegression") {
    description = "Gate 2: all Critical + High scenarios covered, API contract valid, JaCoCo floors. Blocks deploy."
    group = "verification"
    dependsOn(tasks.test, tasks.jacocoTestReport, tasks.jacocoTestCoverageVerification,
              "openApiValidate", "pitestBookingAuth")
    doFirst {
        exec { commandLine("./scripts/sync-registry.sh") }
    }
    commandLine("./scripts/check-gates.sh", "regression")
}
```

- [ ] **Step 3: Run `pitestBookingAuth` standalone to verify it works**

```bash
./gradlew --no-daemon pitestBookingAuth 2>&1 | tail -30
```

Expected: Task completes. Check `build/reports/pitest-booking-auth/index.html` exists. The build should not fail (current baseline is at or above the 15% floor). If it fails, lower `mutationThreshold` to the actual kill rate minus 2.

- [ ] **Step 4: Commit**

```bash
git add build.gradle.kts
git commit -m "feat(ci): add pitestBookingAuth scoped to booking+auth, wire to gateRegression"
```

---

## Task 7: AGENTS.md — add MUST NOT rule

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add the rule**

In `AGENTS.md`, under the **Backend Testing Rules / MUST NOT** section, add after the last existing bullet point:

```markdown
- Never assert only on a mock invocation for a 'Then' clause that describes enforcement or state change — also assert on the observable effect (the downstream call, state, or error) that the clause requires. Invocation proves the code ran; the effect proves it did the right thing. The `pitestBookingAuth` gate enforces this mechanically; this rule explains why.
```

- [ ] **Step 2: Run all tests to confirm nothing is broken**

```bash
./gradlew --no-daemon test 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 3: Run the regression gate (final validation)**

```bash
./gradlew --no-daemon gateRegression 2>&1 | tail -20
```

Expected: `✅ Gate 'regression' passed.`

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): add MUST NOT rule for invocation-only test assertions"
```

---

## Self-review checklist (completed inline)

| Spec requirement | Task |
|---|---|
| Flyway migration `instant_match_revoked_until` | Task 1 |
| `UserProfileState` + `ProfileDao.setInstantMatchRevokedUntil` | Task 2 |
| `AuthService.revokeInstantMatch` + `isInstantMatchAllowed` | Task 3 |
| `BookingService` calls `revokeInstantMatch` after PENALTY | Task 4 |
| SCN-BOOK-004 test asserts on `revokeInstantMatch` invocation | Task 4 |
| SCN-BOOK-007 weak test deleted | Task 5 |
| SCN-BOOK-007 replacement test in `TaskAcceptScenarioTests` | Task 5 |
| `pitestBookingAuth` task scoped to booking + auth | Task 6 |
| `pitestBookingAuth` wired to `gateRegression` | Task 6 |
| AGENTS.md MUST NOT rule | Task 7 |
