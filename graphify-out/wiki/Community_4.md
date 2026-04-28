# Community 4

> 272 nodes

## Key Concepts

- **.required()** (156 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **.optional()** (25 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **BookingDao** (21 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **TaskApplicationDao** (18 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- **BookingService** (15 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- **.confirmIntent()** (15 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.customerSilenceTriggersTimeoutAutoComplete()** (12 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **BookingIntentService** (11 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.findByBookingId()** (11 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- **DisputeDao** (11 connections) — `services/api/src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- **ConversationDao** (11 connections) — `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- **ReviewEnforcementCaseDao** (11 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **VerificationDao** (10 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- **.declineIntent()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.findByTaskerId()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **BookingIntentDao** (9 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- **CategorySchemaVersionDao** (9 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- **.expireStaleSelections()** (9 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskApplicationService.java`
- **.findByTaskId()** (9 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- **.setUp()** (9 connections) — `services/api/src/test/java/mn/tasky/booking/BookingScenarioTests.java`
- **.transition()** (8 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- **.cancelBooking()** (8 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- **BookingScheduleEventDao** (8 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- **.findByRevieweeId()** (8 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewDao.java`
- **.markBookingDone_success()** (8 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingServiceTest.java`
- _... and 247 more nodes in this community_

## Relationships

- [[Community 0]] (119 shared connections)
- [[Community 1]] (56 shared connections)
- [[Community 3]] (41 shared connections)
- [[Community 2]] (9 shared connections)
- [[Community 19]] (9 shared connections)
- [[Community 15]] (7 shared connections)
- [[Community 27]] (5 shared connections)
- [[Community 7]] (5 shared connections)
- [[Community 20]] (5 shared connections)
- [[Community 6]] (4 shared connections)
- [[Community 5]] (4 shared connections)
- [[Community 9]] (2 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/analytics/dao/AnalyticsEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/StrikeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/SuspensionEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- `services/api/src/main/java/mn/tasky/booking/application/CompletionTimeoutService.java`
- `services/api/src/main/java/mn/tasky/booking/application/NoShowService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingReliabilityIncidentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/CompletionTimeoutScheduler.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/NoShowReminderScheduler.java`

## Audit Trail

- EXTRACTED: 578 (52%)
- INFERRED: 524 (48%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
