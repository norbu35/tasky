# Community 11

> 134 nodes

## Key Concepts

- **.isUserLocked()** (37 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.getCategory()** (30 connections) — `services/api/src/main/java/mn/tasky/category/publicapi/CategoryQueryPort.java`
- **.createTask()** (22 connections) — `services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java`
- **AreOwnedTaskPhotoKeys** (18 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskPhotoKeyHelperTest.java`
- **.createTask()** (17 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskCreationService.java`
- **PublicTaskCompositionService** (16 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionService.java`
- **ListBookings** (14 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicCompositionServiceTests.java`
- **RecentLocationsTests** (12 connections) — `services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java`
- **.success()** (12 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskCreationServiceTest.java`
- **.mapsTaskListToPublicResponses()** (11 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionServiceTests.java`
- **.returnsPublicForOtherViewer()** (11 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionServiceTests.java`
- **BuildPhotoAccessUrls** (11 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskPhotoServiceTest.java`
- **.toPublicTaskResponse()** (10 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionService.java`
- **.omitsCategoryAndCustomerWhenEmpty()** (10 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionServiceTests.java`
- **.taskCreationUsesAdminActiveCategoryCatalog()** (10 connections) — `services/api/src/test/java/mn/tasky/task/TaskApplicationScenarioTests.java`
- **ValidationErrors** (10 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskCreationServiceTest.java`
- **.withPhotos()** (10 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskCreationServiceTest.java`
- **.notifiesNearbyTaskers()** (10 connections) — `services/api/src/test/java/mn/tasky/task/application/TaskCreationServiceTest.java`
- **.isWithinServiceArea()** (9 connections) — `services/api/src/main/java/mn/tasky/location/publicapi/LocationQueryPort.java`
- **BookingQueryHandlerTest** (9 connections) — `services/api/src/test/java/mn/tasky/booking/application/query/BookingQueryHandlerTest.java`
- **.handlesNullPhotoKeys()** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionServiceTests.java`
- **.getWithToken()** (9 connections) — `services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java`
- **.rejectsTaskCreationOutsideUlaanbaatarServiceArea()** (9 connections) — `services/api/src/test/java/mn/tasky/task/TaskApplicationScenarioTests.java`
- **.buildTask()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionServiceTests.java`
- **CountApplications** (8 connections) — `services/api/src/test/java/mn/tasky/task/TaskApplicationServiceTests.java`
- _... and 109 more nodes in this community_

## Relationships

- [[Community 0]] (118 shared connections)
- [[Community 1]] (13 shared connections)
- [[Community 5]] (11 shared connections)
- [[Community 12]] (8 shared connections)
- [[Community 8]] (8 shared connections)
- [[Community 23]] (6 shared connections)
- [[Community 6]] (6 shared connections)
- [[Community 7]] (5 shared connections)
- [[Community 16]] (4 shared connections)
- [[Community 13]] (4 shared connections)
- [[Community 14]] (4 shared connections)
- [[Community 4]] (2 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/booking/api/BookingController.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingQueryPort.java`
- `services/api/src/main/java/mn/tasky/category/publicapi/CategoryQueryPort.java`
- `services/api/src/main/java/mn/tasky/location/publicapi/LocationQueryPort.java`
- `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionService.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskCreationService.java`
- `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- `services/api/src/test/java/mn/tasky/booking/application/BookingScheduleServiceTest.java`
- `services/api/src/test/java/mn/tasky/booking/application/query/BookingQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/marketplace/application/query/MarketplaceQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/PublicTaskCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/RecentLocationsTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskApplicationScenarioTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskApplicationServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskCreationServiceTest.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskPhotoKeyHelperTest.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskPhotoServiceTest.java`

## Audit Trail

- EXTRACTED: 330 (47%)
- INFERRED: 368 (53%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
