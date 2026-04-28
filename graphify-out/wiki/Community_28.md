# Community 28

> 40 nodes

## Key Concepts

- **.incrementAndGet()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- **OtpRateLimitService** (7 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.enforce()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **AssertRefreshAllowed** (6 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **.deleteExpired()** (5 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **AssertRequestAllowed** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **RefreshSessionDao** (4 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **OtpRateLimitServiceTest.java** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **AssertVerifyAllowed** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
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
- **.assertRequestAllowed()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.assertVerifyAllowed()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.sha256()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.insert()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **.purgeExpired()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/RateLimitCleanupScheduler.java`
- **.purgeExpiredSessions()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/SessionCleanupScheduler.java`
- _... and 15 more nodes in this community_

## Relationships

- [[Community 2]] (6 shared connections)
- [[Community 16]] (1 shared connections)
- [[Community 7]] (1 shared connections)
- [[Community 1]] (1 shared connections)
- [[Community 5]] (1 shared connections)
- [[Community 3]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/RateLimitCleanupScheduler.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/SessionCleanupScheduler.java`
- `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`

## Audit Trail

- EXTRACTED: 77 (66%)
- INFERRED: 40 (34%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
