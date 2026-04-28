# Community 23

> 53 nodes

## Key Concepts

- **.incrementAndGet()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- **.verifyOtp()** (8 connections) — `services/api/src/main/java/mn/tasky/auth/api/OtpController.java`
- **.requestOtp()** (7 connections) — `services/api/src/main/java/mn/tasky/auth/api/OtpController.java`
- **OtpRateLimitService** (7 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.enforce()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **AssertRefreshAllowed** (6 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.deleteExpired()** (5 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **AssertRequestAllowed** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **OtpController** (4 connections) — `services/api/src/main/java/mn/tasky/auth/api/OtpController.java`
- **RefreshSessionDao** (4 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **OtpRateLimitServiceTest.java** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **AssertVerifyAllowed** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **OtpSentResponse** (4 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/OtpPublicCompositionServiceTests.java`
- **.assertRefreshAllowed()** (3 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **RateLimitCounterDao** (3 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- **RateLimitCleanupScheduler** (3 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/RateLimitCleanupScheduler.java`
- **SessionCleanupScheduler** (3 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/SessionCleanupScheduler.java`
- **.allowsWhenUnderLimit()** (3 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.allowsWhenUnderLimit()** (3 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.usesTokenIdAsKey()** (3 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.fallsBackToHashedTokenWhenParsingFails()** (3 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.throwsWhenRefreshLimitExceeded()** (3 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.throwsWhenRefreshIpLimitExceeded()** (3 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **OtpPublicCompositionServiceTests.java** (3 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/OtpPublicCompositionServiceTests.java`
- **AuthSessionResponse** (3 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/OtpPublicCompositionServiceTests.java`
- _... and 28 more nodes in this community_

## Relationships

- [[Community 0]] (8 shared connections)
- [[Community 6]] (3 shared connections)
- [[Community 2]] (3 shared connections)
- [[Community 1]] (2 shared connections)
- [[Community 17]] (1 shared connections)
- [[Community 14]] (1 shared connections)
- [[Community 4]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/api/OtpController.java`
- `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/RateLimitCleanupScheduler.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/SessionCleanupScheduler.java`
- `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/OtpPublicCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 99 (64%)
- INFERRED: 56 (36%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
