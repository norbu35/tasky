# Community 22

> 60 nodes

## Key Concepts

- **.listPending()** (17 connections) — `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- **.findPending()** (12 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.pendingVerifications()** (11 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **GetVerificationDetail** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **AdminVerificationCompositionService** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.verificationDetail()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **PendingVerificationsTests** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingDisputes()** (8 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- **AdminVerificationController** (6 connections) — `services/api/src/main/java/mn/tasky/admin/api/AdminVerificationController.java`
- **.queueDetailResponse()** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **PendingDisputesTests** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`
- **.pendingVerifications_decryptionFailure()** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.verificationQueueExposesQueueAgeAndSlaPosture()** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.verificationDetail_withIdCards_recordsAudit()** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.verificationDetail_noIdCards_noAudit()** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.verificationDetail_onlyFront_recordsOneAudit()** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.slaDeadlineAt()** (5 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **ListPendingVerifications** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.pendingDisputes_returnsPage()** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`
- **.pendingDisputes_hasMore()** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`
- **.pendingVerifications_hasMore()** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **VerificationDetailTests** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.buildQueueRow()** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.buildDetail()** (5 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **ListPendingDisputes** (4 connections) — `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- _... and 35 more nodes in this community_

## Relationships

- [[Community 1]] (25 shared connections)
- [[Community 0]] (19 shared connections)
- [[Community 2]] (12 shared connections)
- [[Community 8]] (2 shared connections)
- [[Community 3]] (2 shared connections)
- [[Community 5]] (2 shared connections)
- [[Community 18]] (2 shared connections)
- [[Community 10]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/api/AdminVerificationController.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/dispute/application/DisputeService.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminDisputeQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/trust/application/query/TrustQueryHandlerTest.java`

## Audit Trail

- EXTRACTED: 135 (51%)
- INFERRED: 128 (49%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
