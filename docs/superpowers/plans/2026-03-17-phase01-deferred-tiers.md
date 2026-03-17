# Phase 0-1 Deferred Tiers Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all 16 deferred Phase 0-1 features — booking lifecycle (NO_SHOW, reschedule, timeline, rescue, repeat), trust enforcement (review gates, dispute evidence, reliability score, badges), information controls (phone leak detection), notifications pipeline (push/SMS stubs), and identity compliance (OAuth circuit breaker, audit logging, data lifecycle).

**Architecture:** V12 migration creates 7 new tables, then DAO/DTO alignment, then API.yaml update, then 5 parallel feature streams. Each stream is independent. Schedulers use `pg_try_advisory_lock` for overlap protection. All new services follow existing patterns (constructor injection, String IDs, `@RegisterConstructorMapper`).

**Tech Stack:** Java 21, Spring Boot 3.4, JDBI 3, PostgreSQL 16, Flyway, Testcontainers, JUnit 5

**Spec:** `docs/superpowers/specs/2026-03-17-phase01-deferred-tiers-design.md`

**Key References:**
- `docs/PRD.md` — REQ-BOOK-07/09/11/12/13, REQ-SAFE-02/04/06/08/09/10/11, REQ-LEAK-04, REQ-NOTIF-01/02, REQ-AUTH-09/10
- `docs/ARCHITECTURE.md` — §4.1 schema, §4.2 flows
- `docs/API.yaml` — endpoint contracts

---

## Chunk 1: Foundation (Migration + DAOs + API.yaml)

### Task 1: V12 Flyway Migration — 7 New Tables

**Files:**
- Create: `src/main/resources/db/migration/V12__deferred_tiers_tables.sql`

- [ ] **Step 1: Write the migration**

Create 7 tables with all columns, constraints, and indexes per spec Section 3. Tables: `booking_schedule_events`, `booking_timeline_events`, `task_rescue_events`, `dispute_evidence`, `review_enforcement_cases`, `tasker_reliability_scores`, `tasker_badges`. Include all indexes from spec.

CRITICAL conventions:
- All UUIDs use `DEFAULT gen_random_uuid()`
- All timestamps use `TIMESTAMPTZ NOT NULL DEFAULT now()` unless nullable
- Foreign keys reference `users(id)`, `bookings(id)`, `tasks(id)`, `disputes(id)`
- `tasker_badges` uses composite PK `(tasker_id, badge_type)` — no surrogate `id`
- `review_enforcement_cases.status` CHECK: `('PENDING', 'REMINDED_24H', 'REMINDED_72H', 'COMPLETED', 'EXPIRED')` — no HARD_LOCKED
- `review_enforcement_cases` must include `investigation_active BOOLEAN NOT NULL DEFAULT false` — used by hard lock query condition

- [ ] **Step 2: Verify migration**

```bash
./gradlew flywayMigrate --no-daemon
```

- [ ] **Step 3: Commit**

```
feat(db): V12 migration for deferred tiers — 7 new tables

booking_schedule_events, booking_timeline_events, task_rescue_events,
dispute_evidence, review_enforcement_cases, tasker_reliability_scores,
tasker_badges with indexes.

Ticket: TIERS-001
Spec: Phase 0-1 deferred tiers
Risk: medium
```

---

### Task 2: DAO/DTO Pairs for All 7 New Tables

**Files:**
- Create: `src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- Create: `src/main/java/mn/tasky/booking/dto/BookingScheduleEvent.java`
- Create: `src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- Create: `src/main/java/mn/tasky/booking/dto/BookingTimelineEvent.java`
- Create: `src/main/java/mn/tasky/task/dao/TaskRescueEventDao.java`
- Create: `src/main/java/mn/tasky/task/dto/TaskRescueEvent.java`
- Create: `src/main/java/mn/tasky/dispute/dao/DisputeEvidenceDao.java`
- Create: `src/main/java/mn/tasky/dispute/dto/DisputeEvidence.java`
- Create: `src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- Create: `src/main/java/mn/tasky/review/dto/ReviewEnforcementCase.java`
- Create: `src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- Create: `src/main/java/mn/tasky/auth/dto/ReliabilityScore.java`
- Create: `src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- Create: `src/main/java/mn/tasky/auth/dto/TaskerBadge.java`
- Modify: `src/main/java/mn/tasky/common/config/JdbiConfig.java`

- [ ] **Step 1: Create all DTOs**

All records use `String` for IDs, `Instant` for timestamps. Follow existing patterns.

- [ ] **Step 2: Create all DAOs**

All use `@RegisterConstructorMapper`, `CAST(:param AS uuid)` for UUID columns. Key methods per DAO:
- `BookingScheduleEventDao`: insert, findByBookingId, findLatestAccepted
- `BookingTimelineEventDao`: insert, findByBookingId
- `TaskRescueEventDao`: insert, existsByTaskId
- `DisputeEvidenceDao`: insertBatch, findByDisputeId, countByDisputeId
- `ReviewEnforcementCaseDao`: insert, findByUserId, findPendingByUser, updateStatus, findOpenByBookingAndUser, countConsecutiveExpired, setInvestigationFlag(caseId, boolean)
- `ReliabilityScoreDao`: upsert, findByTaskerId
- `BadgeDao`: upsert (assign), revoke, findActiveByTaskerId

- [ ] **Step 3: Register all DAOs in JdbiConfig**

- [ ] **Step 4: Compile check**

```bash
./gradlew compileJava --no-daemon
```

- [ ] **Step 5: Commit**

```
feat(dao): add DAOs for 7 deferred-tiers tables

BookingScheduleEvent, BookingTimelineEvent, TaskRescueEvent,
DisputeEvidence, ReviewEnforcementCase, ReliabilityScore, TaskerBadge.

Ticket: TIERS-002
Spec: Phase 0-1 deferred tiers
Risk: low
```

---

### Task 3: Update API.yaml + Regenerate Interfaces

**Files:**
- Modify: `docs/API.yaml`

- [ ] **Step 1: Add missing endpoints to API.yaml**

Add:
- `POST /bookings/{id}/rebook` — repeat booking endpoint. Request: empty or `{}`. Response: Task schema (new OPEN task).
- `GET /admin/messages/flagged` — admin endpoint to list phone-flagged messages. Response: paginated Message list with cursor.

Verify these already exist (they should from prior work):
- `POST /bookings/{id}/no-show/flag`
- `POST /bookings/{id}/reschedule`
- `POST /bookings/{id}/reschedule/{eventId}/respond`
- `GET /bookings/{id}/schedule-events`

- [ ] **Step 2: Regenerate OpenAPI interfaces**

```bash
./gradlew openApiGenerate --no-daemon
./gradlew compileJava --no-daemon
```

- [ ] **Step 3: Commit**

```
docs(api): add rebook and flagged-messages endpoints to API.yaml

POST /bookings/{id}/rebook for repeat booking.
GET /admin/messages/flagged for phone leak monitoring.

Ticket: TIERS-003
Spec: Phase 0-1 deferred tiers
Risk: low
```

---

### Task 4: Scheduler Infrastructure — Advisory Lock Utility

**Files:**
- Create: `src/main/java/mn/tasky/common/scheduling/AdvisoryLockRunner.java`

- [ ] **Step 1: Create advisory lock utility**

A reusable utility that all scheduled jobs use for distributed locking:

```java
package mn.tasky.common.scheduling;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AdvisoryLockRunner {
    private static final Logger log = LoggerFactory.getLogger(AdvisoryLockRunner.class);
    private final DataSource dataSource;

    public AdvisoryLockRunner(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /** Attempts to acquire advisory lock, runs task if acquired, releases in finally. */
    public void runWithLock(String jobName, Runnable task) {
        long lockId = jobName.hashCode();
        try (Connection conn = dataSource.getConnection()) {
            boolean acquired = false;
            try (PreparedStatement ps = conn.prepareStatement("SELECT pg_try_advisory_lock(?)")) {
                ps.setLong(1, lockId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) acquired = rs.getBoolean(1);
                }
            }
            if (!acquired) {
                log.debug("Skipping {} — lock not acquired", jobName);
                return;
            }
            try {
                task.run();
            } finally {
                try (PreparedStatement ps = conn.prepareStatement("SELECT pg_advisory_unlock(?)")) {
                    ps.setLong(1, lockId);
                    ps.execute();
                }
            }
        } catch (Exception e) {
            log.error("Error in scheduled job {}", jobName, e);
        }
    }
}
```

- [ ] **Step 2: Unit test**

Test that the lock utility calls the task when lock acquired. Mock DataSource.

- [ ] **Step 3: Commit**

```
feat(scheduling): advisory lock utility for distributed scheduler safety

pg_try_advisory_lock/unlock with job name hash. All @Scheduled
jobs use this to prevent overlap in multi-instance deployments.

Ticket: TIERS-004
Spec: Phase 0-1 deferred tiers
Risk: low
```

---

## Chunk 2: Stream 1 — Booking Lifecycle Completion

### Task 5: Booking Timeline Service (foundation for other booking features)

**Files:**
- Create: `src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- Test: `src/test/java/mn/tasky/booking/BookingTimelineIntegrationTests.java`

- [ ] **Step 1: Implement BookingTimelineService**

Simple append-only service. Constructor: `BookingTimelineEventDao`. Methods:
- `recordEvent(bookingId, eventType, actorUserId, metadataJson)` — inserts timeline event
- `getEvents(bookingId)` — returns list ordered by created_at DESC

Event types (constants): `NO_SHOW_REMINDER_SENT`, `NO_SHOW_CONFIRMED`, `RESCHEDULE_REQUESTED`, `RESCHEDULE_ACCEPTED`, `RESCHEDULE_DECLINED`, `RESCHEDULE_EXPIRED`, `BOOKING_CANCELLED`, `BOOKING_COMPLETED`

- [ ] **Step 2: Wire into existing booking complete/cancel flows**

In `BookingController.completeBooking()` and `cancelBooking()`: after status transition, call `timelineService.recordEvent(bookingId, BOOKING_COMPLETED/BOOKING_CANCELLED, userId, null)`.

- [ ] **Step 3: Integration test**

Verify timeline event is written on booking completion.

- [ ] **Step 4: Commit**

```
feat(booking): booking timeline service — immutable event log

Append-only event log for booking lifecycle. Wired into
complete and cancel flows. Foundation for NO_SHOW and reschedule.

Ticket: TIERS-005
Spec: REQ-BOOK-13
Risk: low
```

---

### Task 6: NO_SHOW Adjudication

**Files:**
- Create: `src/main/java/mn/tasky/booking/application/NoShowService.java`
- Create: `src/main/java/mn/tasky/booking/scheduling/NoShowReminderScheduler.java`
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java`
- Test: `src/test/java/mn/tasky/booking/NoShowIntegrationTests.java`

- [ ] **Step 1: Implement NoShowService**

Constructor: `BookingDao`, `BookingTimelineEventDao`, `MessageDao`, `BookingScheduleEventDao`, `TaskService`, `AuthService`, `NotificationService`, `AdvisoryLockRunner`.

Methods:
- `findBookingsNeedingReminder()` — ASSIGNED bookings where `confirmed_scheduled_at + 10min < now()` and no NO_SHOW_REMINDER_SENT timeline event exists
- `sendReminder(bookingId)` — writes timeline event, sends push notification to both parties
- `flagNoShow(bookingId, flaggingUserId)` — validates all conditions per spec:
  1. Booking is ASSIGNED
  2. `now() >= confirmed_scheduled_at + 15min`
  3. No message or timeline event from either party in trailing 30 minutes
  4. No ACCEPTED reschedule event with `proposed_scheduled_at > now()`
  5. On success: `@Transactional` — set `bookings.status=NO_SHOW`, `tasks.status=NO_SHOW`, write NO_SHOW_CONFIRMED timeline event with `{flagged_by, no_show_party}` metadata, write audit event
  6. Strike: if no-show party is tasker, call `authService.addStrike(taskerId)`
  7. Return booking or error code

- [ ] **Step 2: Implement NoShowReminderScheduler**

```java
@Scheduled(fixedDelay = 60000)
public void checkReminders() {
    advisoryLockRunner.runWithLock("noshow_reminder", () -> {
        noShowService.findBookingsNeedingReminder().forEach(noShowService::sendReminder);
    });
}
```

- [ ] **Step 3: Add flag endpoint to BookingController**

`POST /api/v1/bookings/{id}/no-show/flag` with Idempotency-Key header. Delegates to `noShowService.flagNoShow()`.

- [ ] **Step 4: Integration tests**

1. Flag eligible NO_SHOW → 200, both booking and task status = NO_SHOW
2. Flag too early (< 15min) → 409
3. Flag with recent activity → 409
4. Flag idempotent (duplicate call) → returns existing state
5. Verify tasker strike recorded on NO_SHOW

- [ ] **Step 5: Commit**

```
feat(booking): NO_SHOW adjudication with reminder scheduler

Reminder at +10m, flag eligibility at +15m, dual inactivity check
(30m), reschedule precedence. Atomic status transition with timeline
event and strike integration.

Ticket: TIERS-006
Spec: REQ-BOOK-11, REQ-TASK-02
Risk: high
```

---

### Task 7: Reschedule Flow

**Files:**
- Create: `src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- Create: `src/main/java/mn/tasky/booking/scheduling/RescheduleExpiryScheduler.java`
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java`
- Test: `src/test/java/mn/tasky/booking/RescheduleIntegrationTests.java`

- [ ] **Step 1: Implement BookingScheduleService**

Constructor: `BookingScheduleEventDao`, `BookingDao`, `BookingTimelineService`, `NotificationService`.

Methods:
- `requestReschedule(bookingId, actorUserId, proposedScheduledAt, reason)` — validates booking ASSIGNED, proposed time in future, creates REQUESTED event, writes timeline event, sends notification
- `respondToReschedule(bookingId, eventId, actorUserId, action)` — ACCEPT: updates `bookings.confirmed_scheduled_at`, writes ACCEPTED event + timeline event. DECLINE: writes DECLINED event + timeline event.
- `listScheduleEvents(bookingId)` — returns events list
- `expireStaleRequests()` — finds REQUESTED events where `MIN(created_at + 24h, booking.confirmed_scheduled_at) < now()`, sets to EXPIRED

- [ ] **Step 2: Implement RescheduleExpiryScheduler**

```java
@Scheduled(fixedDelay = 300000) // 5 min
public void expireStaleRequests() {
    advisoryLockRunner.runWithLock("reschedule_expiry", scheduleService::expireStaleRequests);
}
```

- [ ] **Step 3: Add endpoints to BookingController**

- `POST /api/v1/bookings/{id}/reschedule` with Idempotency-Key
- `POST /api/v1/bookings/{id}/reschedule/{eventId}/respond` with Idempotency-Key
- `GET /api/v1/bookings/{id}/schedule-events`

- [ ] **Step 4: Integration tests**

1. Request reschedule → 201, REQUESTED event created
2. Accept reschedule → 200, `confirmed_scheduled_at` updated
3. Decline reschedule → 200, original schedule preserved
4. Request on non-ASSIGNED booking → 409
5. Auto-expiry: create REQUESTED event, manipulate timestamps so `MIN(created_at + 24h, booking.confirmed_scheduled_at) < now()`, run expiry scheduler, verify event status = EXPIRED

- [ ] **Step 5: Commit**

```
feat(booking): reschedule request/accept/decline flow

Counterparty accept/decline with canonical schedule update.
Auto-expiry at MIN(24h, scheduled_start_time).

Ticket: TIERS-007
Spec: REQ-BOOK-12, REQ-BOOK-13
Risk: medium
```

---

### Task 8: Repeat Booking + Rescue Flow

**Files:**
- Create: `src/main/java/mn/tasky/booking/application/RepeatBookingService.java`
- Create: `src/main/java/mn/tasky/task/scheduling/RescueScheduler.java`
- Modify: `src/main/java/mn/tasky/booking/api/BookingController.java`
- Test: `src/test/java/mn/tasky/booking/RepeatBookingIntegrationTests.java`
- Test: `src/test/java/mn/tasky/task/RescueFlowIntegrationTests.java`

- [ ] **Step 1: Implement RepeatBookingService**

Constructor: `BookingService`, `TaskService`, `TaskDao`.

Method: `rebook(bookingId, customerId)` — validates booking COMPLETED and user is customer, creates new task prefilled from original (category, description, location, budget, intake answers, intake schema version). Returns new task in OPEN status.

- [ ] **Step 2: Add rebook endpoint to BookingController**

`POST /api/v1/bookings/{id}/rebook` — delegates to `repeatBookingService.rebook()`, returns 201 with new Task.

- [ ] **Step 3: Implement RescueScheduler**

Constructor: `TaskDao`, `TaskApplicationDao`, `TaskRescueEventDao`, `NotificationService`, `AdvisoryLockRunner`.

Logic:
- `@Scheduled(fixedDelay = 300000)` every 5min
- Find OPEN tasks where `created_at + 120min < now()` AND zero applications AND no existing rescue event AND current hour in 08:00-22:00 Asia/Ulaanbaatar
- For each: write `task_rescue_events` with 3 actions in `actions_json`, send customer notification (budget/schedule prompt), send broadened push to nearby taskers, send admin notification (concierge flag)

- [ ] **Step 4: Integration tests**

1. Rebook completed booking → 201, new OPEN task with same category/location/budget
2. Rebook non-completed booking → 409
3. Rescue scheduler test: create old task with zero applications, verify rescue event created

- [ ] **Step 5: Commit**

```
feat(booking): repeat booking shortcut and no-applicant rescue flow

Rebook from completed bookings with prefill. Rescue scheduler
detects zero-applicant tasks at 120min during 08:00-22:00.

Ticket: TIERS-008
Spec: REQ-BOOK-07, REQ-BOOK-09
Risk: medium
```

---

## Chunk 3: Streams 2+3 — Trust & Safety + Information Controls

### Task 9: Review Enforcement — Soft Gates + Hard Locks

**Files:**
- Create: `src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- Create: `src/main/java/mn/tasky/review/scheduling/ReviewReminderScheduler.java`
- Create: `src/main/java/mn/tasky/review/scheduling/ReviewEnforcementExpiryScheduler.java`
- Modify: `src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`
- Modify: `src/main/java/mn/tasky/task/application/TaskService.java`
- Test: `src/test/java/mn/tasky/review/ReviewEnforcementIntegrationTests.java`

- [ ] **Step 1: Implement ReviewEnforcementService**

Constructor: `ReviewEnforcementCaseDao`, `NotificationService`, `DisputeDao`.

Methods:
- `createCasesForBooking(bookingId, customerId, taskerId)` — creates PENDING case for each party, sends immediate review prompt notification
- `resolveCase(bookingId, userId)` — finds matching open case, sets COMPLETED
- `isUserLocked(userId)` — returns true if user has open case AND (open dispute OR 2+ consecutive EXPIRED cases OR any case with `investigation_active=true`)
- `sendReminders()` — finds PENDING cases at +24h → REMINDED_24H, REMINDED_24H at +72h → REMINDED_72H
- `expireOldCases()` — PENDING/REMINDED cases where `triggered_at + 7 days < now()` → EXPIRED

- [ ] **Step 2: Wire into outbox processor**

In `DomainEventOutboxProcessor.handleBookingCompleted()`: after wallet credit, call `reviewEnforcementService.createCasesForBooking()`.

- [ ] **Step 3: Wire into review submission**

In `ReviewService.submitReview()`: after insert, call `reviewEnforcementService.resolveCase(bookingId, authorId)`.

- [ ] **Step 4: Wire hard lock into task creation and application**

In `TaskService.createTask()` and `applyToTask()`: check `reviewEnforcementService.isUserLocked(userId)`. If locked, return error `REVIEW_LOCK_ACTIVE`.

- [ ] **Step 5: Implement schedulers**

`ReviewReminderScheduler` — hourly, calls `sendReminders()` with advisory lock.
`ReviewEnforcementExpiryScheduler` — hourly, calls `expireOldCases()` with advisory lock.

- [ ] **Step 6: Integration tests**

1. Booking completion creates enforcement cases for both parties
2. Review submission resolves the case
3. Hard lock blocks task creation when conditions met
4. Hard lock does NOT block when case exists but no risk flag

- [ ] **Step 7: Commit**

```
feat(review): enforcement soft gates and hard locks

Immediate prompt + 24h/72h reminders. Hard lock on task
creation when open dispute or 2+ consecutive expired cases.
7-day auto-expiry prevents permanent locks.

Ticket: TIERS-009
Spec: REQ-SAFE-02, REQ-SAFE-11
Risk: high
```

---

### Task 10: Dispute Evidence + 24h Auto-Close

**Files:**
- Modify: `src/main/java/mn/tasky/dispute/application/DisputeService.java`
- Create: `src/main/java/mn/tasky/dispute/scheduling/DisputeEvidenceGraceScheduler.java`
- Test: `src/test/java/mn/tasky/dispute/DisputeEvidenceIntegrationTests.java`

- [ ] **Step 1: Update DisputeService.raiseDispute()**

Accept evidence list in raiseDispute parameters. For each evidence item, insert into `dispute_evidence` table via `DisputeEvidenceDao`. PHOTO type → `storage_key`, CHAT_EXCERPT/WRITTEN_TIMELINE → `text_payload`.

- [ ] **Step 2: Implement DisputeEvidenceGraceScheduler**

Hourly, with advisory lock. Find OPEN disputes where `created_at + 24h < now()` AND `dispute_evidence` count = 0. Auto-close as `CLOSED_INSUFFICIENT_EVIDENCE`.

- [ ] **Step 3: Integration tests**

1. Raise dispute with evidence → evidence persisted
2. Raise dispute with zero evidence, wait (or manipulate timestamps) → auto-closed after 24h

- [ ] **Step 4: Commit**

```
feat(dispute): evidence persistence and 24h auto-close grace period

Dispute evidence stored in dispute_evidence table. Disputes with
zero evidence auto-close after 24h grace period.

Ticket: TIERS-010
Spec: REQ-SAFE-10
Risk: medium
```

---

### Task 11: Reliability Score + Persistent Pro Badge

**Files:**
- Create: `src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- Create: `src/main/java/mn/tasky/auth/application/BadgeEvaluationService.java`
- Create: `src/main/java/mn/tasky/auth/scheduling/BadgeRevocationScheduler.java`
- Modify: `src/main/java/mn/tasky/auth/application/AuthService.java` (toProfile reads from badge table)
- Test: `src/test/java/mn/tasky/auth/ReliabilityScoreTests.java`
- Test: `src/test/java/mn/tasky/auth/BadgeEvaluationTests.java`

- [ ] **Step 1: Implement ReliabilityScoreService**

Constructor: `BookingDao`, `ReviewDao`, `ReliabilityScoreDao`.

Method: `recompute(taskerId)` — over trailing 90-day window:
- Count completed, cancelled, no_show bookings (minimum 5 total or return without computing)
- `completion_rate` = completed / total
- `punctuality_rate` = avg punctuality rating / 5.0
- `cancellation_rate` = 1 - (cancelled / total)
- `review_avg` = avg of all review averages / 5.0
- `score` = 0.4 * completion_rate + 0.2 * punctuality_rate + 0.2 * cancellation_rate + 0.2 * review_avg
- Upsert into `tasker_reliability_scores`

- [ ] **Step 2: Implement BadgeEvaluationService**

Constructor: `BadgeDao`, `ProfileDao`.

Methods:
- `evaluate(taskerId)` — check `completed_tasks >= 15 && rating_avg >= 4.5` → assign PRO. Check `rating_avg < 4.0` → revoke PRO (hysteresis).
- `sweepAllBadges()` — for daily revocation scan: find all active PRO badges, check if holder still qualifies.

- [ ] **Step 3: Wire into booking completion and review submission**

In `DomainEventOutboxProcessor.handleBookingCompleted()`: call `reliabilityScoreService.recompute(taskerId)` then `badgeEvaluationService.evaluate(taskerId)`.
In `ReviewService.submitReview()`: after stats update, call `badgeEvaluationService.evaluate(revieweeId)`.

- [ ] **Step 4: Update AuthService.toProfile()**

Read from `badgeDao.findActiveByTaskerId(userId)` instead of computing `isPro` on-the-fly.

- [ ] **Step 5: Implement BadgeRevocationScheduler**

Daily at 4am, with advisory lock. Calls `badgeEvaluationService.sweepAllBadges()`.

- [ ] **Step 6: Tests**

Unit tests: reliability formula with various inputs, cold-start (< 5 bookings → no score). Badge assign/revoke/hysteresis.

- [ ] **Step 7: Commit**

```
feat(trust): reliability score computation and persistent Pro badge

Weighted composite score (completion 40%, punctuality 20%,
cancellation 20%, review 20%). Minimum 5 bookings. Pro badge
persistent with 4.0 revocation hysteresis. Daily sweep.

Ticket: TIERS-011
Spec: REQ-SAFE-06, REQ-SAFE-04
Risk: medium
```

---

### Task 12: Phone Leak Detection in Messages

**Files:**
- Create: `src/main/java/mn/tasky/messaging/application/PhoneLeakDetector.java`
- Modify: `src/main/java/mn/tasky/messaging/application/MessagingService.java`
- Create: `src/main/java/mn/tasky/admin/api/AdminMessageController.java`
- Test: `src/test/java/mn/tasky/messaging/PhoneLeakDetectorTests.java`

- [ ] **Step 1: Implement PhoneLeakDetector**

Spring `@Component`. Method: `boolean containsPhoneNumber(String content)`.

Regex patterns:
- `\+?976\s?\d{4}\s?\d{4}` — Mongolian international format
- `\b\d{8}\b` — 8-digit local with word boundaries
- Case-insensitive text: `nine\s*seven\s*six` — common obfuscation

Returns true if any pattern matches.

- [ ] **Step 2: Wire into MessagingService.sendMessage()**

After content hash computation, before insert: call `phoneLeakDetector.containsPhoneNumber(content)`. Pass result as `phoneNumberFlagged` to `MessageDao.insert()`. If flagged, emit analytics event `message_phone_number_flagged`.

- [ ] **Step 3: Admin flagged messages endpoint**

`GET /api/v1/admin/messages/flagged` — queries messages where `phone_number_flagged = true`, paginated. Create `AdminMessageController` in admin package.

- [ ] **Step 4: Unit tests for detector**

Test each regex pattern: Mongolian format, 8-digit, obfuscation. Test non-matches (prices, short numbers, 7-digit).

- [ ] **Step 5: Commit**

```
feat(messaging): phone number leak detection in messages

Advisory-only scanning with Mongolian phone patterns. Flagged
messages queryable by admin. Analytics event on detection.

Ticket: TIERS-012
Spec: REQ-LEAK-04
Risk: low
```

---

## Chunk 4: Streams 4+5 — Notifications + Identity/Compliance

### Task 13: Push Notification Provider-Ready Stub

**Files:**
- Create: `src/main/java/mn/tasky/notification/provider/PushNotificationProvider.java` (interface)
- Create: `src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java`
- Create: `src/main/java/mn/tasky/notification/provider/FcmPushProvider.java` (placeholder)
- Modify: `src/main/java/mn/tasky/notification/application/NotificationService.java`
- Test: `src/test/java/mn/tasky/notification/NotificationPipelineIntegrationTests.java`

- [ ] **Step 1: Create PushNotificationProvider interface**

```java
public interface PushNotificationProvider {
    NotificationResult sendPush(String deviceToken, String platform, String title, String body, Map<String,String> data);
}
public record NotificationResult(boolean success, String providerMessageId, String errorCode) {}
```

- [ ] **Step 2: Implement LoggingPushProvider**

Logs payload, returns success with `providerMessageId = "LOG-" + UUID`.

- [ ] **Step 3: Create FcmPushProvider placeholder**

Reads `TASKY_FCM_CREDENTIALS` env var. If not configured, throws on construction. Actual send method has `// TODO: Firebase Admin SDK call` and delegates to LoggingPushProvider for now.

- [ ] **Step 4: Refactor NotificationService**

Inject `PushNotificationProvider` instead of directly logging. Update `sendPush()` to iterate device tokens, call provider, record `notification_log` with `event_key`, `provider_message_id`, `error_code` from result.

- [ ] **Step 5: Integration test**

Verify event → notification → log pipeline with event_key idempotency.

- [ ] **Step 6: Commit**

```
feat(notification): push notification provider-ready stub

PushNotificationProvider interface with LoggingPushProvider default.
FcmPushProvider placeholder for Firebase integration. Full pipeline
with event_key idempotency in notification_log.

Ticket: TIERS-013
Spec: REQ-NOTIF-01
Risk: low
```

---

### Task 14: SMS Fallback Provider-Ready Stub

**Files:**
- Create: `src/main/java/mn/tasky/notification/provider/SmsNotificationProvider.java` (interface)
- Create: `src/main/java/mn/tasky/notification/provider/LoggingSmsNotificationProvider.java`
- Create: `src/main/java/mn/tasky/notification/provider/TwilioSmsProvider.java` (placeholder)
- Modify: `src/main/java/mn/tasky/notification/application/NotificationService.java`
- Modify: `src/main/java/mn/tasky/common/outbox/DomainEventOutboxProcessor.java`

- [ ] **Step 1: Create SmsNotificationProvider interface + LoggingSmsNotificationProvider**

Same pattern as push. Wraps existing `LoggingSmsService` behavior.

- [ ] **Step 2: Update NotificationService SMS fallback**

For HIRED and BOOKING_CONFIRMED events, when user has zero registered devices, trigger SMS fallback via `SmsNotificationProvider`. Record in `notification_log` with channel=SMS and `event_key` idempotency.

- [ ] **Step 3: Integration test for SMS fallback**

Test: user with zero registered devices receives HIRED notification → verify SMS fallback triggered, `notification_log` entry written with `channel=SMS` and `event_key` populated. Verify duplicate event_key does not create second SMS.

- [ ] **Step 4: Wire notification trigger points in outbox handlers**

In `DomainEventOutboxProcessor`:
- `handleTaskApplicationAccepted` → send HIRED notification (already exists, ensure event_key)
- `handleBookingCompleted` → send BOOKING_COMPLETED notification (already exists, ensure event_key)
- Add event_key construction: `type + "_" + bookingId` for idempotent delivery

- [ ] **Step 5: Commit**

```
feat(notification): SMS fallback provider-ready stub with trigger wiring

SmsNotificationProvider interface with logging default. SMS fallback
triggers for HIRED/BOOKING_CONFIRMED when zero devices. Event_key
idempotency on all notification paths.

Ticket: TIERS-014
Spec: REQ-NOTIF-02
Risk: low
```

---

### Task 15: Facebook OAuth Circuit Breaker

**Files:**
- Create: `src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- Create: `src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`
- Modify: `src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- Modify: `src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- Test: `src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`

- [ ] **Step 1: Implement FacebookCircuitBreaker**

Thread-safe state machine: CLOSED → OPEN → HALF_OPEN → CLOSED.

```java
@Component
public class FacebookCircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private volatile State state = State.CLOSED;
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private volatile Instant lastFailure = Instant.MIN;

    public boolean isOpen() { return state != State.CLOSED; }

    public void recordSuccess() {
        state = State.CLOSED;
        failureCount.set(0);
    }

    public void recordFailure() {
        lastFailure = Instant.now();
        if (failureCount.incrementAndGet() >= 3
            && Duration.between(lastFailure, Instant.now()).getSeconds() < 60) {
            state = State.OPEN;
        }
    }

    public void tryHalfOpen() { if (state == State.OPEN) state = State.HALF_OPEN; }
}
```

- [ ] **Step 2: Wire into FacebookGraphClient**

Wrap `debugToken()` and `fetchProfile()`: if circuit open, throw `FacebookAuthException` with `AUTH_PROVIDER_UNAVAILABLE`. On success, `recordSuccess()`. On failure, `recordFailure()`.

- [ ] **Step 3: Implement probe scheduler**

`@Scheduled(fixedDelay=60000)` with `AdvisoryLockRunner` — if state OPEN/HALF_OPEN, call Facebook `/app` endpoint with app access token. On success → CLOSED.

- [ ] **Step 4: Health indicator**

Add to actuator health: `facebookAuth: UP/DOWN` based on circuit state.

- [ ] **Step 5: Unit tests**

State transitions: 3 failures → OPEN, probe success → CLOSED, concurrent access safety.

- [ ] **Step 6: Commit**

```
feat(auth): Facebook OAuth circuit breaker

CLOSED → OPEN after 3 failures in 60s. Probe every 60s tests
/app endpoint. Existing JWTs survive outage. Health indicator
exposed on actuator.

Ticket: TIERS-015
Spec: REQ-AUTH-09, REQ-AUTH-10
Risk: medium
```

---

### Task 16: Verification Access Audit Logging

**Files:**
- Modify: `src/main/java/mn/tasky/admin/api/AdminVerificationController.java`
- Test: `src/test/java/mn/tasky/admin/AdminVerificationAuditTests.java`

- [ ] **Step 1: Add audit logging to presigned URL generation**

In `AdminVerificationController`, when returning presigned GET URLs for ID card images, write audit events:
```java
auditEventDao.insert(adminUserId, "VERIFICATION_MEDIA_VIEWED", "VERIFICATION",
    verificationId, "{\"field\":\"id_card_front\"}");
```

Do this for both front and back card URLs.

- [ ] **Step 2: Integration test**

Verify audit event is written when admin views verification detail.

- [ ] **Step 3: Commit**

```
feat(admin): verification media access audit logging

Every admin view of ID card images writes immutable audit event
with viewer ID, timestamp, and field accessed.

Ticket: TIERS-016
Spec: REQ-SAFE-08
Risk: low
```

---

### Task 17: Identity Data Lifecycle / Deletion

**Files:**
- Create: `src/main/java/mn/tasky/auth/application/DataRetentionService.java`
- Create: `src/main/java/mn/tasky/auth/scheduling/DataRetentionScheduler.java`
- Modify: `src/main/java/mn/tasky/user/api/UserProfileController.java`
- Test: `src/test/java/mn/tasky/auth/DataRetentionTests.java`

- [ ] **Step 1: Implement DataRetentionService**

Constructor: `UserDao`, `VerificationDao`, `AuditEventDao`, `FeatureToggleService`.

Methods:
- `findUsersEligibleForDeletion()` — status BANNED, `updated_at + 90 days < now()`, have verification records with non-null storage keys
- `deleteIdentityData(userId)` — if feature toggle `data_retention_dry_run` is enabled (default): log what would be deleted, don't delete. If disabled: null out `id_card_front_key`, `id_card_back_key`, `dan_reference` on verification, write `IDENTITY_DATA_DELETED` audit event. (S3 deletion deferred to when real S3 is wired up.)
- `processRetention()` — finds eligible users, calls deleteIdentityData for each

- [ ] **Step 2: Implement DataRetentionScheduler**

`@Scheduled(cron="0 0 3 * * *")` — daily at 3am with advisory lock. Calls `processRetention()`.

- [ ] **Step 3: Add self-deletion endpoint**

`DELETE /api/v1/users/me` — sets `users.status = 'BANNED'`, writes audit event with `{reason: "USER_SELF_DELETE_REQUEST"}`. Data deletion happens after 90-day retention via scheduler.

- [ ] **Step 4: Seed feature toggle**

Add to V12 migration (Task 1) — append this to the end of the migration file:
```sql
INSERT INTO feature_toggles (feature_name, is_enabled) VALUES ('data_retention_dry_run', true) ON CONFLICT DO NOTHING;
```

- [ ] **Step 5: Unit tests**

Test eligibility query (banned + 90 days), dry-run mode (no deletion), active mode (verification anonymized).

- [ ] **Step 6: Commit**

```
feat(compliance): identity data lifecycle and self-deletion

90-day retention after ban/deactivation. Daily scheduler with
dry-run mode (default). DELETE /users/me for self-deletion.
Verification records anonymized, audit events logged.

Ticket: TIERS-017
Spec: REQ-SAFE-09
Risk: high
```

---

### Task 18: Fix All Tests + Final Verification

**Files:** Various test files

- [ ] **Step 1: Run full test suite**

```bash
./gradlew test --no-daemon
```

Fix any failures from service constructor changes, new dependencies, or outbox handler updates.

- [ ] **Step 2: Run full build with all checks**

```bash
./gradlew spotlessApply --no-daemon
./gradlew test jacocoTestCoverageVerification checkstyleMain checkstyleTest --no-daemon
```

Fix any coverage, checkstyle, or formatting issues.

- [ ] **Step 3: Commit fixes**

```
fix: resolve test failures and quality gate issues for deferred tiers

Ticket: TIERS-018
Risk: low
```

- [ ] **Step 4: Final verification summary**

Report: total tests, all quality gates passing, new feature count.
