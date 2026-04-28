# Community 10

> 162 nodes

## Key Concepts

- **.success()** (106 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskMutationServiceTest.java`
- **CancelBooking** (34 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationServiceTests.java`
- **.findByIdForUpdate()** (30 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **FlagNoShow** (27 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationServiceTests.java`
- **GetTask** (25 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskQueryServiceTest.java`
- **.createCasesForBooking()** (23 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **BookingLifecycleServiceTest** (23 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.recordEvent()** (22 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- **NoShowServiceTest** (20 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **.flagNoShow_success_customerFlags_taskerNoShow()** (19 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **HasOpenDispute** (18 connections) — `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- **.cancelBooking()** (17 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- **.cancelBooking_taskerCancel_reopensTask()** (17 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.flagNoShow()** (16 connections) — `services/api/src/main/java/mn/tasky/booking/application/NoShowService.java`
- **.cancelBooking_taskerCancel_safetyReason_noStrike()** (16 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.cancelBooking_customerLateCancel_transitionsTaskToCancelled_andCreatesReviewDebt()** (16 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.cancelBooking_customerEarlyCancel_transitionsTaskToCancelled_withoutReviewDebt()** (16 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.flagNoShow_success_taskerFlags_customerNoShow_noStrikeForCustomer()** (16 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **BookingService** (15 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- **.findByTaskAndParticipants()** (15 connections) — `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- **AddStrike** (15 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.cancelBooking_taskerCancel_notifiesCustomerThatTaskIsOpenAgain()** (15 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.assignedBooking()** (14 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.completeBooking_success()** (14 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- **.validNoShowFlagTransitionsToNoShowAndRecordsAudit()** (13 connections) — `services/api/src/test/java/mn/tasky/booking/NoShowScenarioTests.java`
- _... and 137 more nodes in this community_

## Relationships

- [[Community 0]] (167 shared connections)
- [[Community 1]] (79 shared connections)
- [[Community 2]] (76 shared connections)
- [[Community 14]] (23 shared connections)
- [[Community 3]] (20 shared connections)
- [[Community 7]] (8 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 8]] (3 shared connections)
- [[Community 15]] (3 shared connections)
- [[Community 21]] (2 shared connections)
- [[Community 6]] (2 shared connections)
- [[Community 13]] (2 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- `services/api/src/main/java/mn/tasky/booking/application/NoShowService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/NoShowReminderScheduler.java`
- `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- `services/api/src/main/java/mn/tasky/messaging/dao/MessageDao.java`
- `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskCompositionService.java`
- `services/api/src/main/java/mn/tasky/trust/application/command/TrustCommandHandler.java`
- `services/api/src/main/java/mn/tasky/trust/publicapi/TrustCommandPort.java`
- `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- `services/api/src/test/java/mn/tasky/booking/BookingScenarioTests.java`
- `services/api/src/test/java/mn/tasky/booking/NoShowScenarioTests.java`
- `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- `services/api/src/test/java/mn/tasky/booking/application/BookingTimelineServiceTest.java`

## Audit Trail

- EXTRACTED: 450 (38%)
- INFERRED: 738 (62%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
