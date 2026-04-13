# Boundary Enforcement Delegation Plan

> **For delegate model:** Implement this plan task-by-task, in order. Do not skip tasks. Do not invent new architecture.

**Goal:** Close all runtime-composition → module-application leakage by routing through publicapi ports.
After this plan completes, zero `import mn.tasky.*.application.*` or `import mn.tasky.*.dao.*` will remain
in `mn.tasky.runtime.**` and the broadened ArchUnit test will enforce this permanently.

**Branch:** `feature/rewrite`

**Architecture:** This is a focused boundary enforcement pass — no behavior changes, no new features,
no restructuring of domain-internal application services.

---

## Canonical Inputs

Read before starting:

- `docs/ARCHITECTURE.md` — §2.3 Request-Path Shapes (the two allowed shapes)
- `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java` — existing rules
- `services/api/src/main/java/mn/tasky/notification/application/command/NotificationCommandHandler.java` — reference handler pattern
- `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java` — reference port pattern

## Program Rules

- Do not change any application service internals (the files under `*.application.*`).
- Do not modify controllers.
- Do not weaken or remove existing architecture tests.
- Every new port interface goes in `{module}/publicapi/`. Every new handler goes in `{module}/application/command/` or `{module}/application/query/`.
- Follow the `NotificationCommandHandler` pattern exactly: `@Service`, implements the port interface, constructor-injects the application service, delegates each method.
- All new port interfaces use `public interface` (no `@Service`, no Spring annotations on the interface).
- Use the same import style as existing ports: import DTOs from `{module}/dto/` packages.
- Do NOT use `allowEmptyShould(true)` on the broadened ArchUnit rule — violations should fail the build.
- Keep commits small and task-scoped. One commit per task.

## Delivery Order

### Task 1: Create `CategoryQueryPort` + handler

**New files:**

#### `services/api/src/main/java/mn/tasky/category/publicapi/CategoryQueryPort.java`

```java
package mn.tasky.category.publicapi;

import java.util.Optional;
import mn.tasky.category.dto.CategoryState;

public interface CategoryQueryPort {
    Optional<CategoryState> getCategory(String id);
}
```

#### `services/api/src/main/java/mn/tasky/category/application/query/CategoryQueryHandler.java`

```java
package mn.tasky.category.application.query;

import java.util.Optional;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import org.springframework.stereotype.Service;

@Service
public class CategoryQueryHandler implements CategoryQueryPort {

    private final CategoryService categoryService;

    public CategoryQueryHandler(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @Override
    public Optional<CategoryState> getCategory(String id) {
        return categoryService.getCategory(id);
    }
}
```

**Verification:** compile only — `./gradlew :services:api:compileJava`

**Commit:** `refactor(category): introduce CategoryQueryPort for runtime composition boundary`

---

### Task 2: Create `LocationQueryPort` + handler

**New files:**

#### `services/api/src/main/java/mn/tasky/location/publicapi/LocationQueryPort.java`

```java
package mn.tasky.location.publicapi;

import mn.tasky.location.dto.ReverseGeocodeResponse;

public interface LocationQueryPort {
    ReverseGeocodeResponse reverseGeocode(double lat, double lng);
}
```

#### `services/api/src/main/java/mn/tasky/location/publicapi/PackageMarker.java`

```java
package mn.tasky.location.publicapi;

public final class PackageMarker {
    private PackageMarker() {}
}
```

#### `services/api/src/main/java/mn/tasky/location/application/query/LocationQueryHandler.java`

```java
package mn.tasky.location.application.query;

import mn.tasky.location.application.LocationService;
import mn.tasky.location.dto.ReverseGeocodeResponse;
import mn.tasky.location.publicapi.LocationQueryPort;
import org.springframework.stereotype.Service;

@Service
public class LocationQueryHandler implements LocationQueryPort {

    private final LocationService locationService;

    public LocationQueryHandler(LocationService locationService) {
        this.locationService = locationService;
    }

    @Override
    public ReverseGeocodeResponse reverseGeocode(double lat, double lng) {
        return locationService.reverseGeocode(lat, lng);
    }
}
```

**Verification:** compile only — `./gradlew :services:api:compileJava`

**Commit:** `refactor(location): introduce LocationQueryPort for runtime composition boundary`

---

### Task 3: Create `AnalyticsCommandPort` + handler

**New files:**

#### `services/api/src/main/java/mn/tasky/analytics/publicapi/AnalyticsCommandPort.java`

```java
package mn.tasky.analytics.publicapi;

import java.util.Map;

public interface AnalyticsCommandPort {
    void track(String eventName, String userId, Map<String, Object> properties);
}
```

#### `services/api/src/main/java/mn/tasky/analytics/application/command/AnalyticsCommandHandler.java`

```java
package mn.tasky.analytics.application.command;

import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsCommandHandler implements AnalyticsCommandPort {

    private final AnalyticsService analyticsService;

    public AnalyticsCommandHandler(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Override
    public void track(String eventName, String userId, Map<String, Object> properties) {
        analyticsService.track(eventName, userId, properties);
    }
}
```

**Note:** The composition service (`DisputeRaiseService`) also references the `AnalyticsService` constants
(`EVENT_DISPUTE_RAISED`, `PROPERTY_BOOKING_ID`, `PROPERTY_TASK_ID`). Move these constants to the port interface
so the composition service does not need to import `AnalyticsService` at all:

Add to `AnalyticsCommandPort`:

```java
    // Event name constants (mirrors AnalyticsService)
    String EVENT_DISPUTE_RAISED = "DISPUTE_RAISED";
    String PROPERTY_BOOKING_ID = "booking_id";
    String PROPERTY_TASK_ID = "task_id";
```

**Verification:** compile only — `./gradlew :services:api:compileJava`

**Commit:** `refactor(analytics): introduce AnalyticsCommandPort for runtime composition boundary`

---

### Task 4: Create `PaymentCommandPort` + handler

**New files:**

#### `services/api/src/main/java/mn/tasky/payment/publicapi/PaymentCommandPort.java`

```java
package mn.tasky.payment.publicapi;

import java.util.Optional;
import mn.tasky.payment.dto.PaymentIntent;

public interface PaymentCommandPort {
    PaymentIntent initiatePayment(String bookingId);
    Optional<PaymentIntent> findPaymentIntent(String paymentId);
}
```

#### `services/api/src/main/java/mn/tasky/payment/application/command/PaymentCommandHandler.java`

```java
package mn.tasky.payment.application.command;

import java.util.Optional;
import mn.tasky.payment.application.PaymentService;
import mn.tasky.payment.dto.PaymentIntent;
import mn.tasky.payment.publicapi.PaymentCommandPort;
import org.springframework.stereotype.Service;

@Service
public class PaymentCommandHandler implements PaymentCommandPort {

    private final PaymentService paymentService;

    public PaymentCommandHandler(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Override
    public PaymentIntent initiatePayment(String bookingId) {
        return paymentService.initiatePayment(bookingId);
    }

    @Override
    public Optional<PaymentIntent> findPaymentIntent(String paymentId) {
        return paymentService.findPaymentIntent(paymentId);
    }
}
```

**Verification:** compile only — `./gradlew :services:api:compileJava`

**Commit:** `refactor(payment): introduce PaymentCommandPort for runtime composition boundary`

---

### Task 5: Create `BookingIntentCommandPort` + handler

**New files:**

#### `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`

```java
package mn.tasky.booking.publicapi;

import mn.tasky.booking.application.BookingIntentService;

public interface BookingIntentCommandPort {
    BookingIntentService.ConfirmResult confirmIntent(
            String customerId, String intentId, boolean liabilityDisclaimerAccepted);
}
```

#### `services/api/src/main/java/mn/tasky/booking/application/command/BookingIntentCommandHandler.java`

```java
package mn.tasky.booking.application.command;

import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import org.springframework.stereotype.Service;

@Service
public class BookingIntentCommandHandler implements BookingIntentCommandPort {

    private final BookingIntentService bookingIntentService;

    public BookingIntentCommandHandler(BookingIntentService bookingIntentService) {
        this.bookingIntentService = bookingIntentService;
    }

    @Override
    public BookingIntentService.ConfirmResult confirmIntent(
            String customerId, String intentId, boolean liabilityDisclaimerAccepted) {
        return bookingIntentService.confirmIntent(customerId, intentId, liabilityDisclaimerAccepted);
    }
}
```

**Important:** The port interface imports `BookingIntentService.ConfirmResult` — this is a `record` declared
inside `BookingIntentService`. This is acceptable because the port still depends on a DTO-like result type,
not on the service class itself. The composition service's dependency will shift from `BookingIntentService`
(class) to `BookingIntentCommandPort` (interface) + `BookingIntentService.ConfirmResult` (result record).

If you want a stricter boundary, extract `ConfirmResult` to `booking/dto/BookingIntentConfirmResult.java`.
This is **optional** — the ArchUnit rule targets class-level dependencies on `.application.` service *classes*,
and the `ConfirmResult` nested record's import path (`mn.tasky.booking.application.BookingIntentService`)
will still trigger the ArchUnit rule. **Therefore, extract it:**

#### `services/api/src/main/java/mn/tasky/booking/dto/BookingIntentConfirmResult.java`

```java
package mn.tasky.booking.dto;

public record BookingIntentConfirmResult(BookingState booking, String errorCode, String errorMessage) {
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String DISCLAIMER_REQUIRED = "DISCLAIMER_REQUIRED";
    public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
    public static final String CONFLICT = "CONFLICT";
    public static final String DEFERRED = "DEFERRED";

    public static BookingIntentConfirmResult success(BookingState booking) {
        return new BookingIntentConfirmResult(booking, null, null);
    }

    public static BookingIntentConfirmResult error(String errorCode, String errorMessage) {
        return new BookingIntentConfirmResult(null, errorCode, errorMessage);
    }

    public boolean isSuccess() {
        return booking != null;
    }
}
```

Then update `BookingIntentService.confirmIntent()` to return `BookingIntentConfirmResult` instead of the inner
`ConfirmResult` record. Update all references in `BookingIntentService` itself. The inner `ConfirmResult` record
can be deleted from `BookingIntentService`.

Update the port interface:

```java
package mn.tasky.booking.publicapi;

import mn.tasky.booking.dto.BookingIntentConfirmResult;

public interface BookingIntentCommandPort {
    BookingIntentConfirmResult confirmIntent(
            String customerId, String intentId, boolean liabilityDisclaimerAccepted);
}
```

**Verification:** compile only — `./gradlew :services:api:compileJava`

**Commit:** `refactor(booking): extract BookingIntentConfirmResult and introduce BookingIntentCommandPort`

---

### Task 6: Extend `BookingCommandPort` + `BookingQueryPort` for schedule, no-show, repeat-booking

**Modify:** `services/api/src/main/java/mn/tasky/booking/publicapi/BookingCommandPort.java`

Add these methods:

```java
    // Schedule operations
    BookingScheduleEvent requestReschedule(
            String bookingId, String actorUserId, Instant proposedScheduledAt, String reason);

    BookingScheduleEvent respondToReschedule(
            String bookingId, String eventId, String actorUserId, String action);

    // No-show
    NoShowService.NoShowFlagResult flagNoShow(String bookingId, String flaggingUserId);

    // Repeat booking
    RepeatBookingService.RebookResult rebook(String bookingId, String customerId);
```

**Important:** Same extraction concern as Task 5. `NoShowService.NoShowFlagResult` and
`RepeatBookingService.RebookResult` are inner records. Extract them to DTOs:

- `services/api/src/main/java/mn/tasky/booking/dto/NoShowFlagResult.java` — copy the record from `NoShowService`, update `NoShowService` to use it
- `services/api/src/main/java/mn/tasky/booking/dto/RebookResult.java` — copy the record from `RepeatBookingService`, update `RepeatBookingService` to use it

Then the port signatures become:

```java
    NoShowFlagResult flagNoShow(String bookingId, String flaggingUserId);
    RebookResult rebook(String bookingId, String customerId);
```

**Modify:** `services/api/src/main/java/mn/tasky/booking/publicapi/BookingQueryPort.java`

Add these methods:

```java
    List<BookingScheduleEvent> listScheduleEvents(String bookingId, String requestingUserId);
    Optional<BookingScheduleEvent> getScheduleEvent(String eventId);
```

**Modify:** `services/api/src/main/java/mn/tasky/booking/application/command/BookingCommandHandler.java`

Add implementations that delegate to `BookingScheduleService`, `NoShowService`, `RepeatBookingService`.
The handler can inject all three services:

```java
    // Constructor adds:
    private final BookingScheduleService bookingScheduleService;
    private final NoShowService noShowService;
    private final RepeatBookingService repeatBookingService;

    // Implementations delegate directly:
    @Override
    public BookingScheduleEvent requestReschedule(...) {
        return bookingScheduleService.requestReschedule(...);
    }
    // etc.
```

**Modify:** `services/api/src/main/java/mn/tasky/booking/application/query/BookingQueryHandler.java`

Add implementations for the two new query methods:

```java
    private final BookingScheduleService bookingScheduleService;

    @Override
    public List<BookingScheduleEvent> listScheduleEvents(String bookingId, String requestingUserId) {
        return bookingScheduleService.listScheduleEvents(bookingId, requestingUserId);
    }

    @Override
    public Optional<BookingScheduleEvent> getScheduleEvent(String eventId) {
        return bookingScheduleService.getScheduleEvent(eventId);
    }
```

**Verification:** compile only — `./gradlew :services:api:compileJava`

**Commit:** `refactor(booking): extend public ports for schedule, no-show, and repeat-booking ops`

---

### Task 7: Rewire all 6 runtime composition services

For each file below, replace the `.application.` import with the corresponding publicapi port import,
update the field type and constructor parameter, and replace all call sites.

#### 7a. `PublicTaskCompositionService.java`

```diff
-import mn.tasky.category.application.CategoryService;
+import mn.tasky.category.publicapi.CategoryQueryPort;
-import mn.tasky.location.application.LocationService;
+import mn.tasky.location.publicapi.LocationQueryPort;

-    private final CategoryService categoryService;
+    private final CategoryQueryPort categoryQueryPort;
-    private final LocationService locationService;
+    private final LocationQueryPort locationQueryPort;
```

Replace all `categoryService.` → `categoryQueryPort.` and `locationService.` → `locationQueryPort.`

#### 7b. `DisputeRaiseService.java`

```diff
-import mn.tasky.analytics.application.AnalyticsService;
+import mn.tasky.analytics.publicapi.AnalyticsCommandPort;

-    private final AnalyticsService analyticsService;
+    private final AnalyticsCommandPort analyticsCommandPort;
```

Replace `analyticsService.track(` → `analyticsCommandPort.track(`
Replace `AnalyticsService.EVENT_DISPUTE_RAISED` → `AnalyticsCommandPort.EVENT_DISPUTE_RAISED`
Replace `AnalyticsService.PROPERTY_BOOKING_ID` → `AnalyticsCommandPort.PROPERTY_BOOKING_ID`
Replace `AnalyticsService.PROPERTY_TASK_ID` → `AnalyticsCommandPort.PROPERTY_TASK_ID`

#### 7c. `PaymentInitiationService.java`

```diff
-import mn.tasky.payment.application.PaymentService;
+import mn.tasky.payment.publicapi.PaymentCommandPort;

-    private final PaymentService paymentService;
+    private final PaymentCommandPort paymentCommandPort;
```

Replace `paymentService.` → `paymentCommandPort.`

#### 7d. `BookingIntentConfirmationService.java`

```diff
-import mn.tasky.booking.application.BookingIntentService;
+import mn.tasky.booking.publicapi.BookingIntentCommandPort;
+import mn.tasky.booking.dto.BookingIntentConfirmResult;

-    private final BookingIntentService bookingIntentService;
+    private final BookingIntentCommandPort bookingIntentCommandPort;
```

Replace `bookingIntentService.` → `bookingIntentCommandPort.`
Replace `BookingIntentService.ConfirmResult` → `BookingIntentConfirmResult` throughout

#### 7e. `BookingPublicCompositionService.java`

```diff
-import mn.tasky.booking.application.BookingScheduleService;
```

Remove the `BookingScheduleService` field. Use `BookingQueryPort` instead:
- `bookingScheduleService.listScheduleEvents(...)` → `bookingQueryPort.listScheduleEvents(...)`
- `bookingScheduleService.getScheduleEvent(...)` → `bookingQueryPort.getScheduleEvent(...)`

#### 7f. `BookingPublicOperationService.java`

```diff
-import mn.tasky.booking.application.BookingScheduleService;
-import mn.tasky.booking.application.NoShowService;
-import mn.tasky.booking.application.RepeatBookingService;
+import mn.tasky.booking.dto.NoShowFlagResult;
+import mn.tasky.booking.dto.RebookResult;
```

Remove the `BookingScheduleService`, `NoShowService`, `RepeatBookingService` fields.
Use `BookingCommandPort` and `BookingQueryPort` instead:
- `bookingScheduleService.requestReschedule(...)` → `bookingCommandPort.requestReschedule(...)`
- `bookingScheduleService.respondToReschedule(...)` → `bookingCommandPort.respondToReschedule(...)`
- `bookingScheduleService.getScheduleEvent(...)` → `bookingQueryPort.getScheduleEvent(...)`
- `noShowService.flagNoShow(...)` → `bookingCommandPort.flagNoShow(...)`
- `repeatBookingService.rebook(...)` → `bookingCommandPort.rebook(...)`
- `NoShowService.NoShowFlagResult` → `NoShowFlagResult`
- `RepeatBookingService.RebookResult` → `RebookResult`

**Verification:** `./gradlew :services:api:compileJava`

Then verify no `.application.` imports remain:

```bash
grep -r "import mn\.tasky\.\w\+\.application\." services/api/src/main/java/mn/tasky/runtime/ | grep -v "^Binary"
```

Expected: **zero results**

**Commit:** `refactor(runtime): rewire composition services to use publicapi ports`

---

### Task 8: Route admin composition audit through `AdminAuditCommandPort`

**Modify:** `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`

```diff
-import mn.tasky.common.audit.AuditEventDao;
+import mn.tasky.admin.publicapi.AdminAuditCommandPort;

-    private final AuditEventDao auditEventDao;
+    private final AdminAuditCommandPort adminAuditCommandPort;
```

Replace `auditEventDao.insert(adminUserId, ...)` → `adminAuditCommandPort.recordAdminAction(adminUserId, ...)`

The method signature is: `recordAdminAction(String adminId, String actionType, String entityType, String entityId, String metadataJson)`
The existing calls use: `auditEventDao.insert(adminUserId, "VERIFICATION_MEDIA_VIEWED", "VERIFICATION", detail.id(), "{...}")`
These map directly.

**Modify:** `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`

```diff
-import mn.tasky.common.audit.AuditEventDao;
+import mn.tasky.admin.publicapi.AdminAuditCommandPort;

-    private final AuditEventDao auditEventDao;
+    private final AdminAuditCommandPort adminAuditCommandPort;
```

Replace `auditEventDao.insert(adminUserId, ...)` → `adminAuditCommandPort.recordAdminAction(adminUserId, ...)`

**Verification:**

```bash
grep -r "import mn\.tasky\.common\.audit\." services/api/src/main/java/mn/tasky/runtime/ | grep -v "^Binary"
```

Expected: **zero results**

```bash
./gradlew :services:api:compileJava
```

**Commit:** `refactor(admin): route admin composition audit through AdminAuditCommandPort`

---

### Task 9: Broaden ArchUnit enforcement

**Modify:** `services/api/src/test/java/mn/tasky/architecture/BackendArchitectureTest.java`

Replace the narrow `notificationCompositionMustUsePublicPorts` rule with a comprehensive rule:

```java
    /**
     * Runtime composition services must depend on module publicapi ports, not on
     * feature-module application services directly.
     * This enforces the two allowed request-path shapes from the finalization design.
     */
    @ArchTest
    static final ArchRule runtimeCompositionMustUsePublicPorts = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.runtime.publicapi.composition..",
                    "mn.tasky.runtime.adminapi.composition..",
                    "mn.tasky.runtime.user.composition..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.analytics.application..",
                    "mn.tasky.auth.application..",
                    "mn.tasky.booking.application..",
                    "mn.tasky.category.application..",
                    "mn.tasky.dispute.application..",
                    "mn.tasky.location.application..",
                    "mn.tasky.messaging.application..",
                    "mn.tasky.notification.application..",
                    "mn.tasky.payment.application..",
                    "mn.tasky.review.application..",
                    "mn.tasky.task.application..",
                    "mn.tasky.user.application..",
                    "mn.tasky.verification.application..",
                    "mn.tasky.wallet.application..")
            .because("runtime composition must use publicapi ports, not feature-module application services");
```

**Also verify the existing DAO rule:** The `runtimeCompositionMustNotDependOnDaos` rule matches
`mn.tasky..dao..` — this should cover `mn.tasky.common.audit.AuditEventDao` because the class
resides in `mn.tasky.common.audit`, NOT in a `..dao..` package. Check: does `AuditEventDao` live
in `mn.tasky.common.audit` or `mn.tasky.common.dao`?

It lives in `mn.tasky.common.audit.AuditEventDao` — **the existing DAO rule does NOT catch it**.
This is why the admin composition services passed the DAO rule despite using `AuditEventDao` directly.

Since Task 8 already removes the `AuditEventDao` imports from runtime composition, this is moot.
But add a targeted rule to prevent regression:

```java
    /**
     * Runtime composition must not depend on common.audit internals.
     * Use AdminAuditCommandPort instead.
     */
    @ArchTest
    static final ArchRule runtimeCompositionMustNotDependOnAuditDao = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.runtime.publicapi.composition..",
                    "mn.tasky.runtime.adminapi.composition..",
                    "mn.tasky.runtime.user.composition..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.common.audit..")
            .because("runtime composition must use AdminAuditCommandPort, not AuditEventDao");
```

**Verification:**

```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.BackendArchitectureTest"
```

Expected: **PASS** (all violations have been resolved in Tasks 1-8)

If it fails, check the error output for which class still has an illegal import, and fix it.

**Commit:** `test(arch): broaden runtime composition boundary enforcement to all modules`

---

### Task 10: Final verification gate

Run in order:

```bash
./gradlew :services:api:test --tests "mn.tasky.architecture.*"
./gradlew :services:api:test --tests "mn.tasky.architecture.AudienceCompositionBoundaryTest"
./gradlew openApiValidate
./gradlew gateSmoke
```

All must PASS.

**Commit:** none (verification only)

---

### Task 11: Sync documentation

**Modify only if all tests from Task 10 pass:**

#### `CHANGELOG.md`

Under the current `[Unreleased]` section, add:

```markdown
### Changed
- Runtime composition services now route through publicapi ports instead of depending on feature-module
  application services directly. New ports: CategoryQueryPort, LocationQueryPort, AnalyticsCommandPort,
  PaymentCommandPort, BookingIntentCommandPort. Extended: BookingCommandPort, BookingQueryPort.
- Admin composition services (verification, moderation) now use AdminAuditCommandPort instead of AuditEventDao.
- ArchUnit boundary enforcement broadened from notification-only to all feature modules.
```

#### `docs/ARCHITECTURE.md`

In §2.3, update the note about enforcement status. Replace any reference to "notification-only enforcement"
or "incremental adoption" with a statement that the ArchUnit rule now comprehensively enforces the boundary
for all feature modules.

**Commit:** `docs: sync boundary enforcement status after hardening pass`

---

## Completion Criteria

This plan is complete only when:

1. `grep -r "import mn\.tasky\.\w\+\.application\." services/api/src/main/java/mn/tasky/runtime/` returns zero results
2. `grep -r "import mn\.tasky\.common\.audit\." services/api/src/main/java/mn/tasky/runtime/` returns zero results
3. `./gradlew :services:api:test --tests "mn.tasky.architecture.*"` passes
4. `./gradlew openApiValidate` passes
5. `./gradlew gateSmoke` passes
