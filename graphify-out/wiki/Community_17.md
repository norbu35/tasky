# Community 17

> 94 nodes

## Key Concepts

- **.doFilterInternal()** (22 connections) — `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- **.incrementAndGet()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- **Write** (10 connections) — `services/api/src/test/java/mn/tasky/common/security/JsonSecurityResponseWriterTest.java`
- **OtpRateLimitService** (7 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.enforce()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **.doFilterInternal()** (6 connections) — `services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- **AssertRefreshAllowed** (6 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **RequestObservabilityFilterTest.java** (6 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.deleteExpired()** (5 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **RateLimitFilter** (5 connections) — `services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- **JwtAuthenticationFilter** (5 connections) — `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- **AssertRequestAllowed** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **PlatformResolution** (5 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **RefreshSessionDao** (4 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- **OtpRateLimitServiceTest.java** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **AssertVerifyAllowed** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- **TraceAndCorrelationIdResolution** (4 connections) — `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- **.assertRefreshAllowed()** (3 connections) — `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- **RateLimitCounterDao** (3 connections) — `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- **RateLimitCleanupScheduler** (3 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/RateLimitCleanupScheduler.java`
- **SessionCleanupScheduler** (3 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/SessionCleanupScheduler.java`
- **RestAccessDeniedHandler** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAccessDeniedHandler.java`
- **RestAuthenticationEntryPoint** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAuthenticationEntryPoint.java`
- **.commence()** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RestAuthenticationEntryPoint.java`
- **.writeRateLimitResponse()** (3 connections) — `services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- _... and 69 more nodes in this community_

## Relationships

- [[Community 0]] (7 shared connections)
- [[Community 1]] (5 shared connections)
- [[Community 2]] (4 shared connections)
- [[Community 4]] (2 shared connections)
- [[Community 12]] (1 shared connections)
- [[Community 3]] (1 shared connections)
- [[Community 8]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/OtpRateLimitService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RateLimitCounterDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/RefreshSessionDao.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/RateLimitCleanupScheduler.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/SessionCleanupScheduler.java`
- `services/api/src/main/java/mn/tasky/common/security/JwtAuthenticationFilter.java`
- `services/api/src/main/java/mn/tasky/common/security/RateLimitFilter.java`
- `services/api/src/main/java/mn/tasky/common/security/RestAccessDeniedHandler.java`
- `services/api/src/main/java/mn/tasky/common/security/RestAuthenticationEntryPoint.java`
- `services/api/src/test/java/mn/tasky/auth/application/OtpRateLimitServiceTest.java`
- `services/api/src/test/java/mn/tasky/common/observability/RequestObservabilityFilterTest.java`
- `services/api/src/test/java/mn/tasky/common/security/JsonSecurityResponseWriterTest.java`
- `services/api/src/test/java/mn/tasky/common/security/RestAccessDeniedHandlerTest.java`
- `services/api/src/test/java/mn/tasky/common/security/RestAuthenticationEntryPointTest.java`

## Audit Trail

- EXTRACTED: 174 (66%)
- INFERRED: 91 (34%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
