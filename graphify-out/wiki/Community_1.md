# Community 1

> 439 nodes

## Key Concepts

- **.findByUserId()** (121 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/LedgerEntryDao.java`
- **.resolve()** (88 connections) — `tooling/scripts/governance/validate-doc-claims.py`
- **.decrypt()** (54 connections) — `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`
- **BlindIndex** (33 connections) — `services/api/src/test/java/mn/tasky/common/security/CryptoServiceTest.java`
- **.debugToken()** (25 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **.findActiveByTaskerId()** (24 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- **.generateDownloadUrl()** (23 connections) — `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`
- **.findByFacebookId()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **defaultState()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- **.findByPhoneBlindIndex()** (21 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **AuthService** (20 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **IdentityCommandHandlerTest** (20 connections) — `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- **.findLatestByUserId()** (19 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- **.refreshToken()** (19 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.fetchProfile()** (17 connections) — `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- **.consentDecisionAndStateChangesAuditable()** (16 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **SearchUsersByName** (16 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.findByPhoneBlindIdx()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- **.updateStats()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- **UserDao** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **.pendingUntilAdminResolution()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/VerificationServiceTests.java`
- **VerifyOtp** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.linksPhoneToFacebookUser()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.verifyOtp()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **UserProfileService** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- _... and 414 more nodes in this community_

## Relationships

- [[Community 2]] (140 shared connections)
- [[Community 3]] (124 shared connections)
- [[Community 4]] (65 shared connections)
- [[Community 0]] (41 shared connections)
- [[Community 5]] (24 shared connections)
- [[Community 12]] (22 shared connections)
- [[Community 13]] (21 shared connections)
- [[Community 14]] (16 shared connections)
- [[Community 22]] (11 shared connections)
- [[Community 7]] (10 shared connections)
- [[Community 6]] (7 shared connections)
- [[Community 16]] (5 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/api/DevAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- `services/api/src/main/java/mn/tasky/auth/application/BadgeEvaluationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/DataRetentionService.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/SmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserSearchService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/BadgeRevocationScheduler.java`
- `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`

## Audit Trail

- EXTRACTED: 982 (39%)
- INFERRED: 1532 (61%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
