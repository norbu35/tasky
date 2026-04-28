# Community 12

> 133 nodes

## Key Concepts

- **.updateStatus()** (72 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **ReviewEnforcementServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.createCasesForBooking()** (23 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.makeCase()** (16 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.findByBookingAndUser()** (15 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.resolveCase()** (12 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.findOpenByUser()** (12 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **ReviewEnforcementCaseDao** (11 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.respondToReschedule()** (9 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- **ReviewEnforcementService** (9 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.findPendingOlderThan()** (9 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.findReminded24hOlderThan()** (9 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.acceptedRescheduleUpdatesCanonicalSchedule()** (9 connections) — `services/api/src/test/java/mn/tasky/booking/BookingScheduleScenarioTests.java`
- **ReviewScenarioTests** (9 connections) — `services/api/src/test/java/mn/tasky/review/ReviewScenarioTests.java`
- **BookingScheduleService** (8 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- **.sendReminders()** (8 connections) — `services/api/src/main/java/mn/tasky/review/scheduling/ReviewReminderScheduler.java`
- **.rescheduleRequestCreatesRequestedEvent()** (8 connections) — `services/api/src/test/java/mn/tasky/booking/BookingScheduleScenarioTests.java`
- **.declinedReschedulePreservesOriginalSchedule()** (8 connections) — `services/api/src/test/java/mn/tasky/booking/BookingScheduleScenarioTests.java`
- **.pendingCaseOlderThan24hGetsFirstReminder()** (8 connections) — `services/api/src/test/java/mn/tasky/review/ReviewScenarioTests.java`
- **.sendReminders_sends24hReminder_forPendingCases()** (8 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.sendReminders_sends72hReminder_forReminded24hCases()** (8 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.sendReminders_handlesBoth24hAnd72hSimultaneously()** (8 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.sendReminders_sendsMultiple24hReminders()** (8 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.requestReschedule()** (7 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- **.updateConfirmedSchedule()** (7 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- _... and 108 more nodes in this community_

## Relationships

- [[Community 0]] (100 shared connections)
- [[Community 6]] (23 shared connections)
- [[Community 3]] (20 shared connections)
- [[Community 1]] (10 shared connections)
- [[Community 11]] (8 shared connections)
- [[Community 19]] (6 shared connections)
- [[Community 17]] (6 shared connections)
- [[Community 4]] (5 shared connections)
- [[Community 5]] (4 shared connections)
- [[Community 2]] (3 shared connections)
- [[Community 10]] (3 shared connections)
- [[Community 14]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/RescheduleExpiryScheduler.java`
- `services/api/src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- `services/api/src/main/java/mn/tasky/review/publicapi/ReviewQueryPort.java`
- `services/api/src/main/java/mn/tasky/review/scheduling/ReviewEnforcementExpiryScheduler.java`
- `services/api/src/main/java/mn/tasky/review/scheduling/ReviewReminderScheduler.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskMutationService.java`
- `services/api/src/main/java/mn/tasky/trust/application/command/TrustCommandHandler.java`
- `services/api/src/main/java/mn/tasky/trust/publicapi/TrustCommandPort.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- `services/api/src/test/java/mn/tasky/booking/BookingScheduleScenarioTests.java`
- `services/api/src/test/java/mn/tasky/notification/ReviewPromptScenarioTests.java`
- `services/api/src/test/java/mn/tasky/review/ReviewScenarioTests.java`
- `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 282 (43%)
- INFERRED: 379 (57%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
