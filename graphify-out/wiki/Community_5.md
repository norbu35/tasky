# Community 5

> 228 nodes

## Key Concepts

- **BlindIndex** (33 connections) — `services/api/src/test/java/mn/tasky/common/security/CryptoServiceTest.java`
- **.debugToken()** (25 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **.findByFacebookId()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **.findByPhoneBlindIndex()** (21 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **AuthService** (20 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **IdentityCommandHandlerTest** (20 connections) — `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- **.fetchProfile()** (17 connections) — `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- **SearchUsersByName** (16 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.findByPhoneBlindIdx()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- **UserDao** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **VerifyOtp** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.linksPhoneToFacebookUser()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.verifyOtp()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **SearchUsersByPhone** (14 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.fallsBackToPhoneUser()** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **FacebookLogin** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **IdentityQueryHandlerTest** (13 connections) — `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- **.resolveOtpUser()** (12 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **SearchByName** (12 connections) — `services/api/src/test/java/mn/tasky/auth/UserSearchServiceTests.java`
- **SearchUsersByFacebookId** (12 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.ensureUser()** (11 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **.throwsWhenFacebookUserHasDifferentPhone()** (11 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.validFacebookTokenCreatesCustomerSession()** (10 connections) — `services/api/src/test/java/mn/tasky/auth/AuthScenarioTests.java`
- **.returnsSessionOnSuccess()** (10 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.createsNewUserWhenNotFound()** (10 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- _... and 203 more nodes in this community_

## Relationships

- [[Community 1]] (114 shared connections)
- [[Community 0]] (38 shared connections)
- [[Community 2]] (13 shared connections)
- [[Community 3]] (12 shared connections)
- [[Community 12]] (7 shared connections)
- [[Community 21]] (4 shared connections)
- [[Community 11]] (3 shared connections)
- [[Community 13]] (3 shared connections)
- [[Community 4]] (2 shared connections)
- [[Community 16]] (2 shared connections)
- [[Community 22]] (2 shared connections)
- [[Community 29]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/SmsService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminUserCompositionService.java`
- `services/api/src/test/java/mn/tasky/auth/AuthScenarioTests.java`
- `services/api/src/test/java/mn/tasky/auth/UserSearchServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/LoggingSmsServiceTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- `services/api/src/test/java/mn/tasky/common/security/CryptoServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminUserCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 536 (50%)
- INFERRED: 533 (50%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
