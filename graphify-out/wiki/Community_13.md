# Community 13

> 105 nodes

## Key Concepts

- **.listPending()** (17 connections) — `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- **.recordAdminAction()** (16 connections) — `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- **.pendingVerifications()** (11 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **GetVerificationDetail** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **ApproveVerification** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approve_success()** (10 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.verificationDecisionNotificationIsSentToAffectedTasker()** (10 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **AdminVerificationCompositionService** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.verificationDetail()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.detailResponse()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- **.approve()** (9 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- **VerificationServiceTest.java** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **RejectVerification** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **PendingVerificationsTests** (9 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingDisputes()** (8 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- **GetVerificationStatus** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.approve_notPending()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.approve_notFound()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.reject_success()** (8 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.reject()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- **VerificationExists** (7 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.pendingVerifications_returnsPage()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.pendingVerifications_storageUrlFailure()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- **.reject_notFound()** (7 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- **.queueDetailResponse()** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- _... and 80 more nodes in this community_

## Relationships

- [[Community 2]] (29 shared connections)
- [[Community 3]] (22 shared connections)
- [[Community 1]] (21 shared connections)
- [[Community 0]] (20 shared connections)
- [[Community 7]] (9 shared connections)
- [[Community 4]] (6 shared connections)
- [[Community 12]] (3 shared connections)
- [[Community 9]] (2 shared connections)
- [[Community 21]] (2 shared connections)
- [[Community 14]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/publicapi/AdminAuditCommandPort.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminVerificationQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationPublicCompositionService.java`
- `services/api/src/test/java/mn/tasky/admin/application/command/AdminAuditCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminDisputeCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminVerificationDecisionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/VerificationPublicCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 241 (49%)
- INFERRED: 246 (51%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
