# Community 3

> 292 nodes

## Key Concepts

- **.insert()** (135 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.findByUserId()** (121 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/LedgerEntryDao.java`
- **.sendPush()** (43 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **.sendPushWithEventKey()** (31 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **NotificationServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **ReviewEnforcementServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.createCasesForBooking()** (23 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.existsByEventKey()** (19 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **.upsert()** (16 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- **.makeCase()** (16 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.updateStats()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- **.findByBookingAndUser()** (15 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.makeUser()** (15 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.recompute()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- **.revoke()** (13 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- **UpdateUserStats** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.resolveCase()** (12 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.findOpenByUser()** (12 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **NotificationService** (11 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- **.sendPushWithEventKey()** (11 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- **.submitReview()** (11 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewService.java`
- **.sendPushWithSmsFallback_sendsPushAndSms()** (11 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **RegisterDevice** (11 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/NotificationCompositionServiceTests.java`
- **.countByTaskerAndStatusSince()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **.sendSmsFallback()** (10 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- _... and 267 more nodes in this community_

## Relationships

- [[Community 0]] (222 shared connections)
- [[Community 1]] (57 shared connections)
- [[Community 4]] (41 shared connections)
- [[Community 2]] (39 shared connections)
- [[Community 5]] (25 shared connections)
- [[Community 10]] (13 shared connections)
- [[Community 19]] (13 shared connections)
- [[Community 9]] (7 shared connections)
- [[Community 20]] (5 shared connections)
- [[Community 22]] (5 shared connections)
- [[Community 7]] (4 shared connections)
- [[Community 13]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/application/command/AdminAuditCommandHandler.java`
- `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/BadgeEvaluationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/DataRetentionService.java`
- `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/BadgeRevocationScheduler.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- `services/api/src/main/java/mn/tasky/notification/application/command/NotificationCommandHandler.java`
- `services/api/src/main/java/mn/tasky/notification/dao/DistrictDao.java`
- `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- `services/api/src/main/java/mn/tasky/notification/dao/TaskerServiceAreaDao.java`
- `services/api/src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java`
- `services/api/src/main/java/mn/tasky/notification/provider/SmsNotificationProvider.java`

## Audit Trail

- EXTRACTED: 602 (35%)
- INFERRED: 1104 (65%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
