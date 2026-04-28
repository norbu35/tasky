# Community 7

> 205 nodes

## Key Concepts

- **.userId()** (93 connections) — `services/api/src/test/java/mn/tasky/task/TaskScenarioTests.java`
- **.errorBody()** (43 connections) — `services/api/src/main/java/mn/tasky/common/api/ApiResponseSupport.java`
- **.errorMessage()** (40 connections) — `services/api/src/main/java/mn/tasky/common/i18n/BackendMessageResolver.java`
- **.toOperationResponse()** (15 connections) — `services/api/src/main/java/mn/tasky/booking/api/BookingController.java`
- **BookingController** (13 connections) — `services/api/src/main/java/mn/tasky/booking/api/BookingController.java`
- **.bookingIntentResponse()** (12 connections) — `services/api/src/main/java/mn/tasky/booking/api/BookingIntentController.java`
- **.idempotencyInProgress()** (12 connections) — `services/api/src/main/java/mn/tasky/common/api/ApiResponseSupport.java`
- **.idempotencyReplayMissing()** (12 connections) — `services/api/src/main/java/mn/tasky/common/api/ApiResponseSupport.java`
- **.raiseDispute()** (12 connections) — `services/api/src/main/java/mn/tasky/dispute/api/DisputeController.java`
- **badRequest()** (12 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/WalletPayoutRequestOutcome.java`
- **.createBookingIntent()** (11 connections) — `services/api/src/main/java/mn/tasky/booking/api/BookingIntentController.java`
- **.addDisputeEvidence()** (11 connections) — `services/api/src/main/java/mn/tasky/dispute/api/DisputeController.java`
- **featureDeferred()** (11 connections) — `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/WalletPayoutRequestOutcome.java`
- **.requestPayout()** (11 connections) — `services/api/src/main/java/mn/tasky/wallet/api/WalletController.java`
- **.acceptApplication()** (10 connections) — `services/api/src/main/java/mn/tasky/task/api/TaskController.java`
- **.getPrincipal()** (10 connections) — `services/api/src/main/java/mn/tasky/wallet/api/WalletController.java`
- **.processPayout()** (9 connections) — `services/api/src/main/java/mn/tasky/admin/api/AdminPayoutController.java`
- **.conciergeAssign()** (9 connections) — `services/api/src/main/java/mn/tasky/admin/api/AdminTaskController.java`
- **.initiatePayment()** (9 connections) — `services/api/src/main/java/mn/tasky/payment/api/PaymentController.java`
- **.submitReview()** (9 connections) — `services/api/src/main/java/mn/tasky/review/api/ReviewController.java`
- **.updateStrikePolicy()** (8 connections) — `services/api/src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- **DisputeController** (8 connections) — `services/api/src/main/java/mn/tasky/dispute/api/DisputeController.java`
- **MessagingController** (8 connections) — `services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java`
- **.sendMessage()** (8 connections) — `services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java`
- **UserProfileController** (8 connections) — `services/api/src/main/java/mn/tasky/user/api/UserProfileController.java`
- _... and 180 more nodes in this community_

## Relationships

- [[Community 2]] (64 shared connections)
- [[Community 0]] (62 shared connections)
- [[Community 3]] (12 shared connections)
- [[Community 1]] (10 shared connections)
- [[Community 6]] (10 shared connections)
- [[Community 13]] (9 shared connections)
- [[Community 4]] (8 shared connections)
- [[Community 12]] (5 shared connections)
- [[Community 14]] (5 shared connections)
- [[Community 5]] (4 shared connections)
- [[Community 11]] (4 shared connections)
- [[Community 24]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/api/AdminBookingController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminDisputeController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminFeatureToggleController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminPayoutController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminTaskController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminUserController.java`
- `services/api/src/main/java/mn/tasky/auth/api/AuthController.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/booking/api/BookingController.java`
- `services/api/src/main/java/mn/tasky/booking/api/BookingIntentController.java`
- `services/api/src/main/java/mn/tasky/common/api/ApiResponseSupport.java`
- `services/api/src/main/java/mn/tasky/common/config/ChannelInterceptorConfig.java`
- `services/api/src/main/java/mn/tasky/common/i18n/BackendMessageResolver.java`
- `services/api/src/main/java/mn/tasky/common/observability/RequestObservabilityFilter.java`
- `services/api/src/main/java/mn/tasky/common/security/LastActiveFilter.java`
- `services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- `services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java`
- `services/api/src/main/java/mn/tasky/dispute/api/DisputeController.java`
- `services/api/src/main/java/mn/tasky/messaging/api/MessagingController.java`

## Audit Trail

- EXTRACTED: 454 (48%)
- INFERRED: 498 (52%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
