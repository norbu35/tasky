# Community 16

> 104 nodes

## Key Concepts

- **.listPending()** (17 connections) — `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- **.recordAdminAction()** (16 connections) — `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- **IdentityQueryHandlerTest** (13 connections) — `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- **.findPending()** (12 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.pendingVerifications()** (11 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **GetVerificationDetail** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **ApproveVerification** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.verificationDecisionNotificationIsSentToAffectedTasker()** (10 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **AdminVerificationCompositionService** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.verificationDetail()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.detailResponse()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.approve()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- **VerificationServiceTest.java** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **RejectVerification** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approve_success()** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **PendingVerificationsTests** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingDisputes()** (8 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- **.returnsMappedPending()** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.reject_success()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.reject()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- **VerificationExists** (7 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approve_notPending()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.approve_notFound()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.pendingVerifications_returnsPage()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingVerifications_storageUrlFailure()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- _... and 79 more nodes in this community_

## Relationships

- [[Community 0]] (64 shared connections)
- [[Community 1]] (10 shared connections)
- [[Community 4]] (9 shared connections)
- [[Community 5]] (9 shared connections)
- [[Community 13]] (6 shared connections)
- [[Community 14]] (5 shared connections)
- [[Community 11]] (5 shared connections)
- [[Community 18]] (3 shared connections)
- [[Community 8]] (2 shared connections)
- [[Community 15]] (2 shared connections)
- [[Community 2]] (2 shared connections)
- [[Community 6]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/dispute/application/DisputeService.java`
- `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueryPort.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminDisputeQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- `services/api/src/main/java/mn/tasky/user/api/UserProfileController.java`
- `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- `services/api/src/test/java/mn/tasky/admin/application/command/AdminAuditCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- `services/api/src/test/java/mn/tasky/trust/application/query/TrustQueryHandlerTest.java`

## Audit Trail

- EXTRACTED: 243 (49%)
- INFERRED: 255 (51%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
