# Community 1

> 559 nodes

## Key Concepts

- **.findById()** (356 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.empty()** (204 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskQueryServiceTest.java`
- **.insert()** (135 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.findByUserId()** (121 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/LedgerEntryDao.java`
- **.resolve()** (88 connections) — `tooling/scripts/governance/validate-doc-claims.py`
- **.decrypt()** (54 connections) — `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`
- **.sendPush()** (43 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **.sendPushWithEventKey()** (31 connections) — `services/api/src/main/java/mn/tasky/notification/publicapi/NotificationCommandPort.java`
- **NotificationServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.findActiveByTaskerId()** (24 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- **.generateDownloadUrl()** (23 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **defaultState()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- **.findLatestByUserId()** (19 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- **.refreshToken()** (19 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.existsByEventKey()** (19 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **.findActive()** (16 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- **.consentDecisionAndStateChangesAuditable()** (16 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **VerificationService** (15 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.updateStats()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- **.updateStatusAndSuspensionEnd()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **.pendingUntilAdminResolution()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.makeUser()** (15 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **UserProfileService** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- **.thirdTaskerCancellationSuspendsTaskerForSevenDays()** (14 connections) — `services/api/src/test/java/mn/tasky/booking/BookingScenarioTests.java`
- **.revoke()** (13 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- _... and 534 more nodes in this community_

## Relationships

- [[Community 0]] (434 shared connections)
- [[Community 5]] (114 shared connections)
- [[Community 3]] (94 shared connections)
- [[Community 2]] (91 shared connections)
- [[Community 10]] (79 shared connections)
- [[Community 14]] (54 shared connections)
- [[Community 13]] (37 shared connections)
- [[Community 4]] (32 shared connections)
- [[Community 22]] (25 shared connections)
- [[Community 21]] (11 shared connections)
- [[Community 15]] (11 shared connections)
- [[Community 8]] (9 shared connections)

## Source Files

- `apps/mobile/src/features/tasks/screens/TaskPhotosScreen.tsx`
- `services/api/src/main/java/mn/tasky/admin/application/command/AdminAuditCommandHandler.java`
- `services/api/src/main/java/mn/tasky/auth/api/DevAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- `services/api/src/main/java/mn/tasky/auth/application/BadgeEvaluationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/DataRetentionService.java`
- `services/api/src/main/java/mn/tasky/auth/application/ModerationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserSearchService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserStatusResolver.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/SuspensionEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/BadgeRevocationScheduler.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`

## Audit Trail

- EXTRACTED: 1182 (32%)
- INFERRED: 2567 (68%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
