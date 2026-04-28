# Community 1

> 426 nodes

## Key Concepts

- **.status()** (367 connections) — `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyException.java`
- **Claim** (161 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **Abandon** (51 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **.isEnabled()** (36 connections) — `services/api/src/main/java/mn/tasky/runtime/RuntimeSurfaceProperties.java`
- **CompleteWithResource** (34 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **CancelBooking** (34 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationServiceTests.java`
- **.overrideBookingStatus()** (29 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminBookingCompositionService.java`
- **.createBooking()** (28 connections) — `services/api/src/main/java/mn/tasky/booking/publicapi/BookingCommandPort.java`
- **ConfirmIntent** (26 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationServiceTests.java`
- **.booking()** (25 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicCompositionServiceTests.java`
- **.conciergeAssign()** (21 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskConciergeAssignmentService.java`
- **.raiseDispute()** (19 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseService.java`
- **GetDispute** (19 connections) — `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- **.inProgress()** (18 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationServiceTests.java`
- **.buildDisputeRequest()** (17 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/DisputeRaiseServiceTests.java`
- **BookingResponse** (17 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingResponseCompositionServiceTests.java`
- **.initiatePayment()** (16 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/PaymentInitiationService.java`
- **.markBookingDone()** (16 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- **.processPayout()** (15 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminPayoutProcessingService.java`
- **.cancelBooking()** (15 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- **.completeBooking()** (15 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- **.confirmIntent()** (15 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationService.java`
- **.find()** (14 connections) — `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyDao.java`
- **.requestPayout()** (14 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/WalletPayoutRequestService.java`
- **.flagNoShow()** (14 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationService.java`
- _... and 401 more nodes in this community_

## Relationships

- [[Community 0]] (354 shared connections)
- [[Community 5]] (79 shared connections)
- [[Community 2]] (23 shared connections)
- [[Community 10]] (22 shared connections)
- [[Community 19]] (21 shared connections)
- [[Community 17]] (20 shared connections)
- [[Community 6]] (18 shared connections)
- [[Community 4]] (17 shared connections)
- [[Community 15]] (15 shared connections)
- [[Community 3]] (14 shared connections)
- [[Community 11]] (13 shared connections)
- [[Community 12]] (10 shared connections)

## Source Files

- `apps/mobile/src/features/verification/hooks/useVerification.ts`
- `services/api/src/main/java/mn/tasky/admin/api/AdminPayoutController.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingCommandPort.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingQueryPort.java`
- `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyDao.java`
- `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyException.java`
- `services/api/src/main/java/mn/tasky/marketplace/publicapi/MarketplaceCommandPort.java`
- `services/api/src/main/java/mn/tasky/messaging/application/PhoneLeakDetector.java`
- `services/api/src/main/java/mn/tasky/payment/api/PaymentController.java`
- `services/api/src/main/java/mn/tasky/payment/publicapi/PaymentCommandPort.java`
- `services/api/src/main/java/mn/tasky/runtime/RuntimeSurfaceProperties.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminBookingCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeResolutionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminPayoutProcessingService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminTaskConciergeAssignmentService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingIntentCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/BookingIntentConfirmationService.java`

## Audit Trail

- EXTRACTED: 925 (34%)
- INFERRED: 1807 (66%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
