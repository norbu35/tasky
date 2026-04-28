# Community 2

> 296 nodes

## Key Concepts

- **.resolve()** (88 connections) — `tooling/scripts/governance/validate-doc-claims.py`
- **.decrypt()** (54 connections) — `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`
- **BlindIndex** (33 connections) — `services/api/src/test/java/mn/tasky/common/security/CryptoServiceTest.java`
- **.debugToken()** (25 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **.findActiveByTaskerId()** (24 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- **.findByFacebookId()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **.findByPhoneBlindIndex()** (21 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **AuthService** (20 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **IdentityCommandHandlerTest** (20 connections) — `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- **.refreshToken()** (19 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.fetchProfile()** (17 connections) — `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- **SearchUsersByName** (16 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.findByPhoneBlindIdx()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- **UserDao** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **VerifyOtp** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.linksPhoneToFacebookUser()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.verifyOtp()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **SearchUsersByPhone** (14 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.ensureExists()** (13 connections) — `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- **.fallsBackToPhoneUser()** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **FacebookLogin** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.resolveOtpUser()** (12 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **SearchByName** (12 connections) — `services/api/src/test/java/mn/tasky/auth/UserSearchServiceTests.java`
- **SearchUsersByFacebookId** (12 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.searchUsersByPhoneExact()** (11 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserSearchService.java`
- _... and 271 more nodes in this community_

## Relationships

- [[Community 0]] (180 shared connections)
- [[Community 3]] (39 shared connections)
- [[Community 1]] (12 shared connections)
- [[Community 9]] (10 shared connections)
- [[Community 4]] (9 shared connections)
- [[Community 19]] (8 shared connections)
- [[Community 6]] (7 shared connections)
- [[Community 13]] (7 shared connections)
- [[Community 21]] (6 shared connections)
- [[Community 14]] (5 shared connections)
- [[Community 17]] (3 shared connections)
- [[Community 12]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/api/DevAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/SmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserSearchService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`
- `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminUserCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/publicapi/composition/OtpPublicCompositionService.java`
- `services/api/src/main/java/mn/tasky/wallet/dao/WalletDao.java`
- `services/api/src/test/java/mn/tasky/auth/AuthScenarioTests.java`
- `services/api/src/test/java/mn/tasky/auth/UserProfileServiceTests.java`

## Audit Trail

- EXTRACTED: 659 (42%)
- INFERRED: 924 (58%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
