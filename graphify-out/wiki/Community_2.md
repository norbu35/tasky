# Community 2

> 532 nodes

## Key Concepts

- **.status()** (367 connections) — `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyException.java`
- **Claim** (161 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **.userId()** (93 connections) — `services/api/src/test/java/mn/tasky/task/TaskScenarioTests.java`
- **Abandon** (51 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **.errorBody()** (43 connections) — `services/api/src/main/java/mn/tasky/common/api/ApiResponseSupport.java`
- **.isEnabled()** (36 connections) — `services/api/src/main/java/mn/tasky/runtime/RuntimeSurfaceProperties.java`
- **CompleteWithResource** (34 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **.overrideBookingStatus()** (31 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminBookingCompositionService.java`
- **ConfirmIntent** (26 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationServiceTests.java`
- **.booking()** (25 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicCompositionServiceTests.java`
- **.conciergeAssign()** (22 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskConciergeAssignmentService.java`
- **.raiseDispute()** (21 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseService.java`
- **CompleteBooking** (20 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationServiceTests.java`
- **GetDispute** (19 connections) — `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- **.markBookingDone()** (18 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- **.inProgress()** (18 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationServiceTests.java`
- **.inProgress()** (18 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/WalletPayoutRequestServiceTests.java`
- **.initiatePayment()** (17 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/PaymentInitiationService.java`
- **.confirmIntent()** (17 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationService.java`
- **.cancelBooking()** (17 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- **.completeBooking()** (17 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- **BookingResponse** (17 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingResponseCompositionServiceTests.java`
- **.buildDisputeRequest()** (17 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseServiceTests.java`
- **.recordAdminAction()** (16 connections) — `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- **.processPayout()** (16 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminPayoutProcessingService.java`
- _... and 507 more nodes in this community_

## Relationships

- [[Community 0]] (352 shared connections)
- [[Community 1]] (91 shared connections)
- [[Community 10]] (76 shared connections)
- [[Community 3]] (26 shared connections)
- [[Community 4]] (24 shared connections)
- [[Community 14]] (20 shared connections)
- [[Community 16]] (15 shared connections)
- [[Community 13]] (14 shared connections)
- [[Community 5]] (13 shared connections)
- [[Community 22]] (12 shared connections)
- [[Community 21]] (12 shared connections)
- [[Community 18]] (11 shared connections)

## Source Files

- `apps/mobile/src/features/verification/hooks/useVerification.ts`
- `services/api/src/main/java/mn/tasky/admin/api/AdminBookingController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminDisputeController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminFeatureToggleController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminPayoutController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminTaskController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminUserController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminVerificationController.java`
- `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/booking/api/BookingController.java`
- `services/api/src/main/java/mn/tasky/booking/api/BookingIntentController.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingCommandPort.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingQueryPort.java`
- `services/api/src/main/java/mn/tasky/category/api/CategoryController.java`
- `services/api/src/main/java/mn/tasky/common/api/ApiResponseSupport.java`
- `services/api/src/main/java/mn/tasky/common/config/ChannelInterceptorConfig.java`

## Audit Trail

- EXTRACTED: 1164 (35%)
- INFERRED: 2204 (65%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
