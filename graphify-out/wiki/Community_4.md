# Community 4

> 292 nodes

## Key Concepts

- **.insert()** (135 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.updateStatus()** (72 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.sendPush()** (43 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **.sendPushWithEventKey()** (31 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **NotificationServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **ReviewEnforcementServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.createCasesForBooking()** (23 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.existsByEventKey()** (19 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **.makeCase()** (16 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **VerificationService** (15 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.findByBookingAndUser()** (15 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **WalletService** (15 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.makeUser()** (15 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.resolveCase()** (12 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.findOpenByUser()** (12 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.findPending()** (12 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.customerSilenceTriggersTimeoutAutoComplete()** (12 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.submitReview()** (11 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewService.java`
- **.sendPushWithSmsFallback_sendsPushAndSms()** (11 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **RegisterDevice** (11 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/NotificationCompositionServiceTests.java`
- **.resolveVerification()** (10 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.setUp()** (10 connections) — `services/api/src/test/java/mn/tasky/notification/NotificationScenarioTests.java`
- **.sendPushWithEventKey_noTokens_criticalType_triggersSmsFallback()** (10 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.sendPushWithEventKey_smsFallback_smsFails_logsFailedStatus()** (10 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.respondToReschedule()** (9 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- _... and 267 more nodes in this community_

## Relationships

- [[Community 3]] (102 shared connections)
- [[Community 2]] (91 shared connections)
- [[Community 0]] (72 shared connections)
- [[Community 1]] (65 shared connections)
- [[Community 5]] (39 shared connections)
- [[Community 6]] (26 shared connections)
- [[Community 12]] (13 shared connections)
- [[Community 7]] (8 shared connections)
- [[Community 13]] (6 shared connections)
- [[Community 20]] (5 shared connections)
- [[Community 19]] (5 shared connections)
- [[Community 27]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/application/command/AdminAuditCommandHandler.java`
- `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- `services/api/src/main/java/mn/tasky/booking/application/CompletionTimeoutService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/CompletionTimeoutScheduler.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/RescheduleExpiryScheduler.java`
- `services/api/src/main/java/mn/tasky/dispute/application/DisputeService.java`
- `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- `services/api/src/main/java/mn/tasky/notification/application/command/NotificationCommandHandler.java`
- `services/api/src/main/java/mn/tasky/notification/dao/DistrictDao.java`
- `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- `services/api/src/main/java/mn/tasky/notification/dao/TaskerServiceAreaDao.java`
- `services/api/src/main/java/mn/tasky/notification/provider/SmsNotificationProvider.java`
- `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminDisputeQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`

## Audit Trail

- EXTRACTED: 602 (39%)
- INFERRED: 940 (61%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
