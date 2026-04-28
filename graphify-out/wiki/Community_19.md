# Community 19

> 72 nodes

## Key Concepts

- **VerificationService** (15 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **WalletService** (15 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.findPending()** (12 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.plainText()** (11 connections) — `services/api/src/main/java/mn/tasky/common/validation/TextSanitizer.java`
- **.resolveVerification()** (10 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **TrustQueryHandlerTest** (10 connections) — `services/api/src/test/java/mn/tasky/trust/application/query/TrustQueryHandlerTest.java`
- **.toVerificationDetail()** (8 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.processPayout()** (8 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **WalletDao** (8 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- **PayoutRequestDao** (7 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- **.submitVerification()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.addBalance()** (6 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- **.creditTaskCompletion()** (5 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.holdFunds()** (5 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **ListPendingVerifications** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- **.releaseFunds()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.requestPayout()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.creditRefund()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.creditCancellationFee()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.toAuditMetadata()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- **.debitBalance()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- **.debitHeldBalance()** (4 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- **ListPendingDisputes** (4 connections) — `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- **.toVerificationStatus()** (3 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- **.safeVerificationDownloadUrl()** (3 connections) — `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- _... and 47 more nodes in this community_

## Relationships

- [[Community 0]] (34 shared connections)
- [[Community 1]] (14 shared connections)
- [[Community 3]] (13 shared connections)
- [[Community 4]] (9 shared connections)
- [[Community 2]] (8 shared connections)
- [[Community 6]] (4 shared connections)
- [[Community 9]] (3 shared connections)
- [[Community 7]] (2 shared connections)
- [[Community 10]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/VerificationService.java`
- `services/api/src/main/java/mn/tasky/common/validation/TextSanitizer.java`
- `services/api/src/main/java/mn/tasky/dispute/application/DisputeService.java`
- `services/api/src/main/java/mn/tasky/projection/admin/AdminDisputeQueueProjectionService.java`
- `services/api/src/main/java/mn/tasky/wallet/application/WalletService.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/CreditedBookingDao.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/PayoutRequestDao.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- `services/api/src/test/java/mn/tasky/auth/application/VerificationServiceTest.java`
- `services/api/src/test/java/mn/tasky/dispute/application/DisputeServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/trust/application/query/TrustQueryHandlerTest.java`

## Audit Trail

- EXTRACTED: 146 (54%)
- INFERRED: 122 (46%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
