# Community 5

> 257 nodes

## Key Concepts

- **.insert()** (135 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.findByUserId()** (121 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/LedgerEntryDao.java`
- **.sendPush()** (43 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **.sendPushWithEventKey()** (31 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **NotificationServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.existsByEventKey()** (19 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **.upsert()** (16 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- **.updateStats()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- **WalletService** (15 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.makeUser()** (15 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.recompute()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- **UserProfileService** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- **.revoke()** (13 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- **UpdateUserStats** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserProfileServiceTest.java`
- **.customerSilenceTriggersTimeoutAutoComplete()** (12 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **NotificationService** (11 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- **.sendPushWithEventKey()** (11 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- **.sendPushWithSmsFallback_sendsPushAndSms()** (11 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **RegisterDevice** (11 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/NotificationCompositionServiceTests.java`
- **.countByTaskerAndStatusSince()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **.sendSmsFallback()** (10 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- **.setUp()** (10 connections) — `services/api/src/test/java/mn/tasky/notification/NotificationScenarioTests.java`
- **.sendPushWithEventKey_noTokens_criticalType_triggersSmsFallback()** (10 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.sendPushWithEventKey_smsFallback_smsFails_logsFailedStatus()** (10 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.anonymize()** (9 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- _... and 232 more nodes in this community_

## Relationships

- [[Community 0]] (175 shared connections)
- [[Community 1]] (55 shared connections)
- [[Community 2]] (55 shared connections)
- [[Community 11]] (35 shared connections)
- [[Community 3]] (25 shared connections)
- [[Community 6]] (18 shared connections)
- [[Community 14]] (13 shared connections)
- [[Community 16]] (9 shared connections)
- [[Community 10]] (6 shared connections)
- [[Community 19]] (5 shared connections)
- [[Community 22]] (5 shared connections)
- [[Community 13]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/application/command/AdminAuditCommandHandler.java`
- `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- `services/api/src/main/java/mn/tasky/auth/application/BadgeEvaluationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/DataRetentionService.java`
- `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/BadgeRevocationScheduler.java`
- `services/api/src/main/java/mn/tasky/booking/application/CompletionTimeoutService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/CompletionTimeoutScheduler.java`
- `services/api/src/main/java/mn/tasky/common/storage/S3StorageService.java`
- `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- `services/api/src/main/java/mn/tasky/notification/application/command/NotificationCommandHandler.java`
- `services/api/src/main/java/mn/tasky/notification/dao/DistrictDao.java`
- `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`

## Audit Trail

- EXTRACTED: 520 (35%)
- INFERRED: 955 (65%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
