# Phase 0-1 Deferred Tiers Completion — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Goal:** Complete all deferred Phase 0-1 backend features (Tiers 1-3 from LAUNCH_ROADMAP.md) so the product launches with full spec compliance and zero founder manual workarounds.

---

## 1. Context

The Phase 0-1 launch minimum shipped the core booking flow, structured intake, granular reviews, feature toggles, and consent tracking. 16 items were intentionally deferred across 3 tiers with founder-manual workarounds. This spec completes all of them before first user.

Note: The LAUNCH_ROADMAP.md listed 18 items. Two have since been resolved: (1) Concierge dispatch endpoint was implemented in the prior phase (`AdminTaskController`). (2) Task rescue events persistence is absorbed into item 5 (rescue flow) below.

## 2. Scope

### In Scope (16 items across 5 streams)

**Stream 1: Booking Lifecycle Completion**
1. NO_SHOW status + adjudication (REQ-BOOK-11, REQ-TASK-02)
2. Reschedule request/accept/decline flow (REQ-BOOK-12, REQ-BOOK-13)
3. Booking timeline events — immutable audit (REQ-BOOK-13)
4. Repeat booking shortcut (REQ-BOOK-07)
5. No-applicant rescue flow (REQ-BOOK-09)

**Stream 2: Trust & Safety Enforcement**
6. Review enforcement soft gates — reminders (REQ-SAFE-02, REQ-SAFE-11)
7. Review enforcement hard locks (REQ-SAFE-02)
8. Dispute evidence upload + 24h auto-close (REQ-SAFE-10)
9. Reliability score computation (REQ-SAFE-06)
10. Persistent Pro badge table (REQ-SAFE-04)

**Stream 3: Information Controls**
11. Phone leak detection in messages (REQ-LEAK-04)

**Stream 4: Notifications Pipeline**
12. FCM/APNs push integration — provider-ready stub (REQ-NOTIF-01)
13. SMS fallback integration — provider-ready stub (REQ-NOTIF-02)

**Stream 5: Identity & Compliance**
14. Facebook OAuth circuit breaker (REQ-AUTH-09, REQ-AUTH-10)
15. Verification access audit logging (REQ-SAFE-08)
16. Identity data lifecycle / deletion (REQ-SAFE-09)

### Out of Scope
- Actual FCM/SMS provider accounts (stubs only)
- Frontend UI changes
- Phase 2+ features (OTP, credits, lead-unlock, escrow)

## 3. Execution Strategy

Migration-first, then parallel streams.

### Layer 1: V12 Migration

Single Flyway migration creating 7 new tables.

#### New Tables

| Table | Columns |
|---|---|
| `booking_schedule_events` | `id UUID PK DEFAULT gen_random_uuid()`, `booking_id UUID NOT NULL FK→bookings`, `actor_user_id UUID NOT NULL FK→users`, `event_type TEXT NOT NULL CHECK (event_type IN ('REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED'))`, `proposed_scheduled_at TIMESTAMPTZ`, `reason TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `booking_timeline_events` | `id UUID PK DEFAULT gen_random_uuid()`, `booking_id UUID NOT NULL FK→bookings`, `event_type TEXT NOT NULL`, `actor_user_id UUID FK→users`, `metadata_json JSONB`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `task_rescue_events` | `id UUID PK DEFAULT gen_random_uuid()`, `task_id UUID NOT NULL FK→tasks`, `triggered_at TIMESTAMPTZ NOT NULL`, `trigger_window TEXT NOT NULL CHECK (trigger_window IN ('DAYTIME', 'OFF_HOURS'))`, `actions_json JSONB`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `dispute_evidence` | `id UUID PK DEFAULT gen_random_uuid()`, `dispute_id UUID NOT NULL FK→disputes`, `type TEXT NOT NULL CHECK (type IN ('CHAT_EXCERPT', 'PHOTO', 'WRITTEN_TIMELINE'))`, `storage_key TEXT`, `text_payload TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `review_enforcement_cases` | `id UUID PK DEFAULT gen_random_uuid()`, `booking_id UUID NOT NULL FK→bookings`, `user_id UUID NOT NULL FK→users`, `reason_code TEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REMINDED_24H', 'REMINDED_72H', 'COMPLETED', 'EXPIRED'))`, `triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `resolved_at TIMESTAMPTZ`. Note: hard lock is a query-time gate (open case + risk conditions), not a stored status. |
| `tasker_reliability_scores` | `tasker_id UUID PK FK→users`, `score DOUBLE PRECISION NOT NULL DEFAULT 0`, `completion_rate DOUBLE PRECISION`, `punctuality_rate DOUBLE PRECISION`, `cancellation_rate DOUBLE PRECISION`, `review_avg DOUBLE PRECISION`, `window_days INT NOT NULL DEFAULT 90`, `computed_at TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `tasker_badges` | `tasker_id UUID NOT NULL FK→users`, `badge_type TEXT NOT NULL CHECK (badge_type IN ('PRO'))`, `assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `revoked_at TIMESTAMPTZ`, `PRIMARY KEY (tasker_id, badge_type)`. Matches Architecture §4.1 — composite PK since only PRO type exists. |

#### Indexes
- `idx_booking_schedule_events_booking` ON `booking_schedule_events (booking_id, created_at DESC)`
- `idx_booking_timeline_events_booking` ON `booking_timeline_events (booking_id, created_at DESC)`
- `idx_task_rescue_events_task` ON `task_rescue_events (task_id)`
- `idx_dispute_evidence_dispute` ON `dispute_evidence (dispute_id)`
- `idx_review_enforcement_cases_user_status` ON `review_enforcement_cases (user_id, status)` WHERE `status != 'COMPLETED'`
- `idx_tasker_badges_tasker` ON `tasker_badges (tasker_id)` WHERE `revoked_at IS NULL`

### Layer 2: DAO/DTO Alignment
Create DAO/DTO pairs for all 7 new tables. Register in JdbiConfig. Follow existing String ID + `@RegisterConstructorMapper` patterns.

### Layer 3: Parallel Feature Streams

**Stream 1: Booking Lifecycle Completion**

1. **NO_SHOW Adjudication**
   - `NoShowReminderScheduler` — `@Scheduled(fixedDelay=60000)` polls ASSIGNED bookings past `confirmed_scheduled_at + 10m`, emits NO_SHOW_REMINDER_SENT notification + timeline event
   - `POST /bookings/{id}/no-show/flag` — validates: booking ASSIGNED, time >= schedule +15m, no activity in trailing 30m (check `booking_timeline_events` and `messages` for recent entries), no accepted reschedule supersedes schedule. On success: atomic transaction sets `bookings.status=NO_SHOW`, `tasks.status=NO_SHOW`, writes timeline event NO_SHOW_CONFIRMED + audit event. Idempotent via Idempotency-Key.
   - Strike integration: if tasker is flagged party, insert into `tasker_strikes`. Check strike count in rolling window against moderation policy for auto-suspension.

2. **Reschedule Flow**
   - `BookingScheduleService` — manages reschedule lifecycle
   - `POST /bookings/{id}/reschedule` — creates REQUESTED event in `booking_schedule_events`. Validates booking is ASSIGNED, proposed time is in future. Sends notification to counterparty.
   - `POST /bookings/{id}/reschedule/{eventId}/respond` — ACCEPT updates `bookings.confirmed_scheduled_at`, writes ACCEPTED event, resets timers. DECLINE preserves original, writes DECLINED event.
   - `RescheduleExpiryScheduler` — `@Scheduled` checks REQUESTED events where `MIN(created_at + 24h, booking.confirmed_scheduled_at) < now()` → auto-EXPIRED. This ensures reschedule requests expire before the booking starts, not just after 24h.
   - `GET /bookings/{id}/schedule-events` — returns immutable event list (already in API.yaml)

3. **Booking Timeline Events**
   - `BookingTimelineService` — append-only event log
   - Events written by: no-show flow, reschedule flow, cancellation, completion
   - Event types: NO_SHOW_REMINDER_SENT, NO_SHOW_CONFIRMED, RESCHEDULE_REQUESTED, RESCHEDULE_ACCEPTED, RESCHEDULE_DECLINED, RESCHEDULE_EXPIRED, BOOKING_CANCELLED, BOOKING_COMPLETED

4. **Repeat Booking**
   - `POST /bookings/{id}/rebook` — validates booking is COMPLETED, creates new task prefilled from original (same category, description, location, budget, intake answers). Returns new task in OPEN status.

5. **No-Applicant Rescue Flow**
   - `RescueScheduler` — `@Scheduled(fixedDelay=300000)` (every 5min) checks OPEN tasks with zero applications, `created_at` >= 120min ago, current time in 08:00-22:00 local (Asia/Ulaanbaatar)
   - On trigger: writes `task_rescue_events` with `actions_json` documenting all 3 actions per REQ-BOOK-09: (a) send notification to customer prompting budget/schedule adjustment, (b) emit broadened push notification to nearby taskers (wider radius), (c) add task to concierge queue (flag task for admin attention via admin notification). Logs analytics event `task_rescue_triggered`.
   - One rescue per task (idempotent check on `task_rescue_events`)

**Stream 2: Trust & Safety Enforcement**

6. **Review Enforcement Soft Gates**
   - On BOOKING_COMPLETED outbox event → create `review_enforcement_cases` for both customer and tasker (status: PENDING), AND immediately send review prompt notification to both parties (this is the "immediate" prompt per REQ-SAFE-11 cadence: immediate + 24h + 72h)
   - `ReviewReminderScheduler` — `@Scheduled(fixedDelay=3600000)` (hourly) checks cases:
     - PENDING + triggered_at > 24h ago → send reminder, update to REMINDED_24H
     - REMINDED_24H + triggered_at > 72h ago → send reminder, update to REMINDED_72H
   - On review submission → resolve matching enforcement case (status: COMPLETED)

7. **Review Enforcement Hard Locks**
   - Before task creation (`TaskService.createTask()`) and application (`TaskService.applyToTask()`): check `review_enforcement_cases` for the user
   - Hard lock triggers: user has open enforcement case AND (has open dispute OR 2+ consecutive EXPIRED cases OR active investigation flag)
   - If locked: return `403 REVIEW_LOCK_ACTIVE`
   - Cases auto-expire after 7 days if no review submitted (status: EXPIRED)

8. **Dispute Evidence**
   - Update `DisputeService.raiseDispute()` to persist evidence array to `dispute_evidence` table
   - If zero evidence provided at dispute creation: set grace period flag, `@Scheduled` checks disputes with no evidence after 24h → auto-close as `CLOSED_INSUFFICIENT_EVIDENCE`
   - Evidence storage: PHOTO type uses storage_key (presigned URL pattern), CHAT_EXCERPT and WRITTEN_TIMELINE use text_payload

9. **Reliability Score**
   - `ReliabilityScoreService` — recomputes on: booking completion, cancellation, no-show
   - Formula over trailing 90-day window:
     - `completion_rate` = completed / (completed + cancelled + no_show)
     - `punctuality_rate` = average punctuality rating from reviews
     - `cancellation_rate` = cancellations / total bookings (inverted: 1 - rate)
     - `review_avg` = average of all review averages
     - `score` = 0.4 * completion_rate + 0.2 * (punctuality_rate / 5.0) + 0.2 * (1 - cancellation_rate) + 0.2 * (review_avg / 5.0)
     - All components normalized to 0-1 range before weighting
   - Upserts into `tasker_reliability_scores`
   - Consumed by future Phase 2 applicant ranking

10. **Persistent Pro Badge**
    - `BadgeEvaluationService` — called after review submission and on reliability score recompute
    - PRO badge assigned when: `completed_tasks >= 15` AND `rating_avg >= 4.5`
    - PRO badge revoked when: `completed_tasks` stays >= 15 but `rating_avg` drops below 4.0 (hysteresis to prevent flapping)
    - Writes to `tasker_badges` (assign_at / revoked_at)
    - `Profile` response reads from `tasker_badges` instead of computing on-the-fly

**Stream 3: Information Controls**

11. **Phone Leak Detection**
    - In `MessagingService.sendMessage()`, after content hash computation:
      - Run regex patterns: `\+?976\s?\d{4}\s?\d{4}`, `\d{8}` (8 consecutive digits), common obfuscation (`nine seven six`)
      - If match: set `phone_number_flagged=true` on message, emit analytics event `message_phone_number_flagged`
      - Phase 0-1: advisory only — message still sends, admin can query flagged messages
    - `GET /admin/messages/flagged` — admin endpoint to list flagged messages (new)

**Stream 4: Notifications Pipeline**

12. **Push Notification Stub**
    - `PushNotificationProvider` interface: `sendPush(String deviceToken, String platform, String title, String body, Map<String,String> data)`
    - `LoggingPushProvider` implementation — logs the full payload, records in `notification_log` with status LOGGED
    - `FcmPushProvider` (placeholder class) — reads `TASKY_FCM_CREDENTIALS` env var, throws if not configured. Actual Firebase Admin SDK call stubbed with TODO comment.
    - Update `NotificationService` to use `PushNotificationProvider` interface. Iterate over user's device tokens, call provider for each. Record results in `notification_log` with `event_key` for idempotency.

13. **SMS Fallback Stub**
    - `SmsNotificationProvider` interface: `sendSms(String phoneNumber, String message)`
    - `LoggingSmsProvider` wraps existing `LoggingSmsService` behavior
    - `TwilioSmsProvider` (placeholder class) — reads `TASKY_SMS_*` env vars, stubbed with TODO
    - Update `NotificationService`: for HIRED and BOOKING_CONFIRMED events, if user has zero registered devices → trigger SMS fallback. Note: "zero devices" is a conservative approximation of "app not open" per REQ-NOTIF-02. Real push delivery failure detection (app uninstalled, token stale) requires actual FCM integration and will be refined when the real provider is wired up. Record with `event_key` idempotency in `notification_log`.
    - Wire trigger points in outbox event handlers (TASK_APPLICATION_ACCEPTED, BOOKING_COMPLETED, etc.)

**Stream 5: Identity & Compliance**

14. **OAuth Circuit Breaker**
    - `FacebookCircuitBreaker` — simple state machine (CLOSED/OPEN/HALF_OPEN) with configurable thresholds
    - CLOSED → OPEN: 3 consecutive Facebook API failures within 60s
    - OPEN: `FacebookAuthController` returns `503 AUTH_PROVIDER_UNAVAILABLE`. Existing valid JWTs continue working (no change to `JwtAuthenticationFilter`).
    - HALF_OPEN: `@Scheduled(fixedDelay=30000)` probe calls Facebook debug_token with a test token → on success, transition to CLOSED
    - Health indicator: expose circuit breaker state on `/actuator/health` as `facebookAuth: UP/DOWN`

15. **Verification Access Audit**
    - In `AdminVerificationController`: before returning presigned GET URLs for ID card images, write `audit_events` entry with action `VERIFICATION_MEDIA_VIEWED`, resource_type `VERIFICATION`, resource_id = verification ID, metadata = `{field: "id_card_front"}` or `id_card_back`
    - Every admin view or download of verification media is logged immutably

16. **Identity Data Lifecycle**
    - `DataRetentionService` — `@Scheduled(cron="0 0 3 * * *")` daily at 3am
    - Find users with status BANNED or deactivation-requested where `updated_at + 90 days < now()`. Clarification: identity data for active, non-banned users is retained indefinitely. The 90-day deletion applies only after account deactivation or ban.
    - For each: delete S3 objects (ID card front/back via storage keys), anonymize verification records (null out `id_card_front_key`, `id_card_back_key`, set `dan_reference=null`), write audit event `IDENTITY_DATA_DELETED`
    - `DELETE /users/me` endpoint — marks account for deletion (sets status to a new `DEACTIVATION_REQUESTED` value or uses existing `BANNED`). Actual deletion happens after 90-day retention period via the scheduled job.

## 4. Scheduler Summary

All `@Scheduled` jobs in one place:

| Job | Interval | Purpose |
|---|---|---|
| `NoShowReminderScheduler` | Every 60s | Check ASSIGNED bookings past schedule +10m, send reminder |
| `RescheduleExpiryScheduler` | Every 5min | Expire REQUESTED reschedules older than 24h |
| `RescueScheduler` | Every 5min | Detect OPEN tasks with 0 applications at 120min |
| `ReviewReminderScheduler` | Every 1h | Send +24h and +72h review reminders |
| `DisputeEvidenceGraceScheduler` | Every 1h | Auto-close disputes with no evidence after 24h |
| `FacebookCircuitBreakerProbe` | Every 30s | Test Facebook API in OPEN/HALF_OPEN state |
| `DataRetentionScheduler` | Daily 3am | Delete expired identity data |
| `ReviewEnforcementExpiryScheduler` | Every 1h | Expire enforcement cases after 7 days |

## 5. Test Strategy

- NO_SHOW adjudication: integration tests for flag endpoint (eligible/not eligible/idempotent), unit test for scheduler
- Reschedule: integration tests for request/accept/decline/expire flow
- Review enforcement: integration tests for soft gate creation on completion, hard lock on task creation
- Dispute evidence: integration test for evidence persistence, auto-close after grace
- Reliability score: unit test for formula, integration test for recompute trigger
- Phone leak detection: unit tests for regex patterns, integration test for flagging
- Notification pipeline: integration test for event → notification → log flow
- Circuit breaker: unit test for state transitions
- Data lifecycle: unit test for retention logic

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| `@Scheduled` jobs overlap or run long | Medium | Each job acquires a simple DB advisory lock before processing. Short-circuit if lock not acquired. |
| NO_SHOW dual inactivity check is too aggressive | Medium | 30-minute window is configurable. Start generous, tighten with data. |
| Phone regex false positives | Low | Advisory only in Phase 0-1. Track false positive rate via analytics before escalation. |
| Data retention job deletes wrong files | High | Dry-run mode by default (log what would be deleted). Enable actual deletion via feature toggle. |
| Review hard lock blocks legitimate users | Medium | 7-day auto-expiry prevents permanent lock. Admin can manually resolve cases. |
