# Community 9

> 164 nodes

## Key Concepts

- **.listPending()** (17 connections) — `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- **.recordAdminAction()** (16 connections) — `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- **UpdateModerationPolicy** (13 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **IdentityQueryHandlerTest** (13 connections) — `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- **.updatePolicy()** (12 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`
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
- **.approve_success()** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **PendingVerificationsTests** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingDisputes()** (8 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- **GetVerificationStatus** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.reject_success()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.strikePolicyResponse()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionService.java`
- **.reject()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- **VerificationExists** (7 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approve_notPending()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.approve_notFound()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- _... and 139 more nodes in this community_

## Relationships

- [[Community 0]] (63 shared connections)
- [[Community 1]] (23 shared connections)
- [[Community 6]] (14 shared connections)
- [[Community 2]] (10 shared connections)
- [[Community 3]] (7 shared connections)
- [[Community 19]] (3 shared connections)
- [[Community 7]] (3 shared connections)
- [[Community 13]] (2 shared connections)
- [[Community 16]] (2 shared connections)
- [[Community 4]] (2 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- `services/api/src/main/java/mn/tasky/admin/api/AdminVerificationController.java`
- `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueryPort.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateOutcome.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationPublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/user/composition/UserAccountDeletionService.java`
- `services/api/src/main/java/mn/tasky/user/api/UserProfileController.java`
- `services/api/src/test/java/mn/tasky/admin/application/command/AdminAuditCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 362 (56%)
- INFERRED: 289 (44%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
