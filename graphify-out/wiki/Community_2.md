# Community 2

> 370 nodes

## Key Concepts

- **.resolve()** (88 connections) — `tooling/scripts/governance/validate-doc-claims.py`
- **.decrypt()** (54 connections) — `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`
- **BlindIndex** (33 connections) — `services/api/src/test/java/mn/tasky/common/security/CryptoServiceTest.java`
- **.debugToken()** (25 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **.findActiveByTaskerId()** (24 connections) — `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- **.findByFacebookId()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **defaultState()** (22 connections) — `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- **.findByPhoneBlindIndex()** (21 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **AuthService** (20 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **IdentityCommandHandlerTest** (20 connections) — `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- **.refreshToken()** (19 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.fetchProfile()** (17 connections) — `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- **.findActive()** (16 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- **SearchUsersByName** (16 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.findByPhoneBlindIdx()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- **UserDao** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **.updateStatusAndSuspensionEnd()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **AddStrike** (15 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **VerifyOtp** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.linksPhoneToFacebookUser()** (15 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **.verifyOtp()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- **UserProfileService** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- **SearchUsersByPhone** (14 connections) — `services/api/src/test/java/mn/tasky/auth/application/UserSearchServiceTest.java`
- **.fallsBackToPhoneUser()** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- **FacebookLogin** (13 connections) — `services/api/src/test/java/mn/tasky/auth/application/AuthServiceTest.java`
- _... and 345 more nodes in this community_

## Relationships

- [[Community 0]] (194 shared connections)
- [[Community 6]] (64 shared connections)
- [[Community 10]] (26 shared connections)
- [[Community 1]] (23 shared connections)
- [[Community 3]] (23 shared connections)
- [[Community 19]] (12 shared connections)
- [[Community 5]] (9 shared connections)
- [[Community 14]] (9 shared connections)
- [[Community 15]] (7 shared connections)
- [[Community 22]] (5 shared connections)
- [[Community 20]] (3 shared connections)
- [[Community 12]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/api/DevAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/application/AuthService.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- `services/api/src/main/java/mn/tasky/auth/application/LoggingSmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/ModerationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/SmsService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserSearchService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserStatusResolver.java`
- `services/api/src/main/java/mn/tasky/auth/dao/BadgeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/OtpChallengeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/SuspensionEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/auth/dto/UserProfileState.java`
- `services/api/src/main/java/mn/tasky/auth/provider/OAuthProvider.java`
- `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- `services/api/src/main/java/mn/tasky/common/security/CryptoService.java`

## Audit Trail

- EXTRACTED: 826 (41%)
- INFERRED: 1193 (59%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
