# Community 3

> 325 nodes

## Key Concepts

- **.required()** (156 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **.update()** (29 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskDraftDao.java`
- **.optional()** (25 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **BookingDao** (21 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **CategoryScenarioTests** (17 connections) — `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`
- **WalletService** (15 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **CategorySchemaVersionService** (13 connections) — `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- **.createVersion()** (13 connections) — `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- **.findActiveByCategoryId()** (13 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- **.ensureExists()** (13 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- **.rollbackRestoresLastKnownGoodSchemaVersion()** (13 connections) — `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`
- **.activate()** (12 connections) — `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- **CategoryDao** (12 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- **IdentityQueryHandler** (12 connections) — `services/api/src/main/java/mn/tasky/identity/application/query/IdentityQueryHandler.java`
- **.canaryActivationPublishesNewSchemaVersionWithoutRebindingExistingDrafts()** (12 connections) — `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`
- **.findByBookingId()** (11 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- **DisputeDao** (11 connections) — `services/api/src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- **ConversationDao** (11 connections) — `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- **.submitReview()** (11 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewService.java`
- **VerificationDao** (10 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- **.findByTaskerId()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **BookingIntentDao** (9 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- **.activateSchemaVersion()** (9 connections) — `services/api/src/main/java/mn/tasky/category/api/CategoryController.java`
- **CategoryService** (9 connections) — `services/api/src/main/java/mn/tasky/category/application/CategoryService.java`
- **CategorySchemaVersionDao** (9 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- _... and 300 more nodes in this community_

## Relationships

- [[Community 0]] (106 shared connections)
- [[Community 6]] (42 shared connections)
- [[Community 2]] (23 shared connections)
- [[Community 12]] (20 shared connections)
- [[Community 17]] (17 shared connections)
- [[Community 1]] (14 shared connections)
- [[Community 5]] (10 shared connections)
- [[Community 16]] (7 shared connections)
- [[Community 10]] (6 shared connections)
- [[Community 8]] (6 shared connections)
- [[Community 7]] (5 shared connections)
- [[Community 4]] (4 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/application/query/AdminAuditQueryHandler.java`
- `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditQueryPort.java`
- `services/api/src/main/java/mn/tasky/analytics/dao/AnalyticsEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/StrikeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- `services/api/src/main/java/mn/tasky/booking/application/NoShowService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingReliabilityIncidentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/NoShowReminderScheduler.java`
- `services/api/src/main/java/mn/tasky/category/api/CategoryController.java`

## Audit Trail

- EXTRACTED: 677 (52%)
- INFERRED: 632 (48%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
