# Community 5

> 267 nodes

## Key Concepts

- **.required()** (156 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **.update()** (29 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskDraftDao.java`
- **.optional()** (25 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **BookingDao** (21 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **CategoryScenarioTests** (17 connections) — `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`
- **CategoryController** (14 connections) — `services/api/src/main/java/mn/tasky/category/api/CategoryController.java`
- **CategorySchemaVersionService** (13 connections) — `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- **.createVersion()** (13 connections) — `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- **.rollbackRestoresLastKnownGoodSchemaVersion()** (13 connections) — `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`
- **.activate()** (12 connections) — `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- **CategoryDao** (12 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- **.canaryActivationPublishesNewSchemaVersionWithoutRebindingExistingDrafts()** (12 connections) — `services/api/src/test/java/mn/tasky/category/CategoryScenarioTests.java`
- **BookingIntentService** (11 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.findActiveByCategoryId()** (11 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- **DisputeDao** (11 connections) — `services/api/src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- **ConversationDao** (11 connections) — `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- **ReviewEnforcementCaseDao** (11 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **VerificationDao** (10 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- **.declineIntent()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.findByTaskerId()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **BookingIntentDao** (9 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- **.activateSchemaVersion()** (9 connections) — `services/api/src/main/java/mn/tasky/category/api/CategoryController.java`
- **CategoryService** (9 connections) — `services/api/src/main/java/mn/tasky/category/application/CategoryService.java`
- **CategorySchemaVersionDao** (9 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- **.findByCategoryIdAndVersion()** (9 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- _... and 242 more nodes in this community_

## Relationships

- [[Community 3]] (53 shared connections)
- [[Community 2]] (46 shared connections)
- [[Community 4]] (39 shared connections)
- [[Community 0]] (31 shared connections)
- [[Community 1]] (24 shared connections)
- [[Community 12]] (9 shared connections)
- [[Community 9]] (7 shared connections)
- [[Community 15]] (7 shared connections)
- [[Community 22]] (6 shared connections)
- [[Community 10]] (6 shared connections)
- [[Community 7]] (4 shared connections)
- [[Community 20]] (4 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/analytics/dao/AnalyticsEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/StrikeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingReliabilityIncidentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- `services/api/src/main/java/mn/tasky/category/api/CategoryController.java`
- `services/api/src/main/java/mn/tasky/category/application/CategorySchemaVersionService.java`
- `services/api/src/main/java/mn/tasky/category/application/CategoryService.java`
- `services/api/src/main/java/mn/tasky/category/application/query/CategoryQueryHandler.java`
- `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- `services/api/src/main/java/mn/tasky/category/dao/CategorySchemaVersionDao.java`
- `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyDao.java`
- `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyService.java`

## Audit Trail

- EXTRACTED: 612 (54%)
- INFERRED: 521 (46%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
