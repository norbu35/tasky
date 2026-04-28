# Community 27

> 42 nodes

## Key Concepts

- **TrustQueryPort** (20 connections)
- **TrustQueryHandler** (10 connections) — `services/api/src/main/java/mn/tasky/trust/application/query/TrustQueryHandler.java`
- **.getOpenCases()** (7 connections) — `services/api/src/main/java/mn/tasky/review/publicapi/ReviewQueryPort.java`
- **DisputePublicCompositionService** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputePublicCompositionService.java`
- **ReviewPublicCompositionService** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionService.java`
- **ReviewPublicCompositionServiceTests.java** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **GetPendingReviewCases** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **.getPendingReviewCases()** (4 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionService.java`
- **DisputeRaiseService** (4 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseService.java`
- **ReviewResponse** (4 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **.disputeSummary()** (3 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputePublicCompositionService.java`
- **.disputeSummaryWithEvidence()** (3 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputePublicCompositionService.java`
- **.getOpenCases_returnsEmpty_whenNoOpenCases()** (3 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **ReviewPublicCompositionServiceTests** (3 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **.returnsMappedCases()** (3 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **.returnsEmptyList()** (3 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **.includesResolvedAt()** (3 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`
- **BookingLifecycleService.java** (2 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- **ReviewQueryPort** (2 connections) — `services/api/src/main/java/mn/tasky/review/publicapi/ReviewQueryPort.java`
- **ReviewPublicCompositionService.java** (2 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionService.java`
- **DisputePublicCompositionService.java** (2 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputePublicCompositionService.java`
- **DisputeRaiseService.java** (2 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseService.java`
- **TrustQueryHandler.java** (2 connections) — `services/api/src/main/java/mn/tasky/trust/application/query/TrustQueryHandler.java`
- **BookingSelectionScenarioTests.java** (2 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **BookingLifecycleServiceTest.java** (2 connections) — `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- _... and 17 more nodes in this community_

## Relationships

- [[Community 2]] (12 shared connections)
- [[Community 0]] (9 shared connections)
- [[Community 3]] (6 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 7]] (2 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- `services/api/src/main/java/mn/tasky/review/publicapi/ReviewQueryPort.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputePublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/trust/application/query/TrustQueryHandler.java`
- `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- `services/api/src/test/java/mn/tasky/booking/application/BookingLifecycleServiceTest.java`
- `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/ReviewPublicCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 103 (83%)
- INFERRED: 21 (17%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
