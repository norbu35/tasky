# Community 11

> 155 nodes

## Key Concepts

- **.updateStatus()** (72 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **ReviewEnforcementServiceTest** (25 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **.createCasesForBooking()** (23 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **defaultState()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- **.findLatestByUserId()** (19 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- **.consentDecisionAndStateChangesAuditable()** (16 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.makeCase()** (16 connections) — `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`
- **VerificationService** (15 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.findByBookingAndUser()** (15 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.pendingUntilAdminResolution()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.taskerUser()** (13 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.resolveCase()** (12 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.findOpenByUser()** (12 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.submitReview()** (11 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewService.java`
- **ReviewEnforcementCaseDao** (11 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.adminApprovesOrRejectsPendingVerification()** (11 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.resolveVerification()** (10 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **VerificationServiceTests.java** (10 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **ReviewEnforcementService** (9 connections) — `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- **.findPendingOlderThan()** (9 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **.findReminded24hOlderThan()** (9 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- **SubmitVerification** (9 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.successfulSubmission()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.approvalMarksVerified()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **.rejectionDoesNotVerifyUser()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- _... and 130 more nodes in this community_

## Relationships

- [[Community 0]] (141 shared connections)
- [[Community 5]] (35 shared connections)
- [[Community 2]] (27 shared connections)
- [[Community 1]] (16 shared connections)
- [[Community 6]] (14 shared connections)
- [[Community 13]] (8 shared connections)
- [[Community 4]] (7 shared connections)
- [[Community 16]] (5 shared connections)
- [[Community 20]] (3 shared connections)
- [[Community 33]] (2 shared connections)
- [[Community 14]] (2 shared connections)
- [[Community 15]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- `services/api/src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- `services/api/src/main/java/mn/tasky/review/application/ReviewEnforcementService.java`
- `services/api/src/main/java/mn/tasky/review/application/ReviewService.java`
- `services/api/src/main/java/mn/tasky/review/dao/ReviewEnforcementCaseDao.java`
- `services/api/src/main/java/mn/tasky/review/publicapi/ReviewQueryPort.java`
- `services/api/src/main/java/mn/tasky/review/scheduling/ReviewEnforcementExpiryScheduler.java`
- `services/api/src/main/java/mn/tasky/review/scheduling/ReviewReminderScheduler.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/VerificationPublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskLifecycleService.java`
- `services/api/src/main/java/mn/tasky/trust/application/command/TrustCommandHandler.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/notification/ReviewPromptScenarioTests.java`
- `services/api/src/test/java/mn/tasky/review/ReviewScenarioTests.java`
- `services/api/src/test/java/mn/tasky/review/application/ReviewEnforcementServiceTest.java`

## Audit Trail

- EXTRACTED: 374 (43%)
- INFERRED: 492 (57%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
