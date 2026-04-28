# Community 10

> 176 nodes

## Key Concepts

- **.generateDownloadUrl()** (23 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **.listPending()** (17 connections) — `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- **.recordAdminAction()** (16 connections) — `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- **UpdateModerationPolicy** (13 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **IdentityQueryHandlerTest** (13 connections) — `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- **.updatePolicy()** (12 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`
- **.findPending()** (12 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **IdentityQueryPort** (11 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueryPort.java`
- **.pendingVerifications()** (11 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **GetVerificationDetail** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **ApproveVerification** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.verificationDecisionNotificationIsSentToAffectedTasker()** (10 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **AdminVerificationCompositionService** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.verificationDetail()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.detailResponse()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.approve()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- **VerificationServiceTest.java** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.returnsDetailWithUrls()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approvesPendingVerification()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **RejectVerification** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.rejectsPendingVerification()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approve_success()** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **PendingVerificationsTests** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingDisputes()** (8 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- **.returnsMappedPending()** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- _... and 151 more nodes in this community_

## Relationships

- [[Community 0]] (74 shared connections)
- [[Community 2]] (26 shared connections)
- [[Community 1]] (22 shared connections)
- [[Community 6]] (13 shared connections)
- [[Community 5]] (11 shared connections)
- [[Community 19]] (7 shared connections)
- [[Community 14]] (7 shared connections)
- [[Community 3]] (6 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 7]] (3 shared connections)
- [[Community 12]] (3 shared connections)
- [[Community 15]] (2 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- `services/api/src/main/java/mn/tasky/dispute/application/DisputeService.java`
- `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueryPort.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminDisputeQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateOutcome.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- `services/api/src/test/java/mn/tasky/admin/application/command/AdminAuditCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`

## Audit Trail

- EXTRACTED: 359 (47%)
- INFERRED: 401 (53%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
