# Community 12

> 157 nodes

## Key Concepts

- **.getState()** (19 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **.code()** (19 connections) — `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyException.java`
- **.isOpen()** (17 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **.recordFailure()** (16 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **FacebookCircuitBreakerTests** (13 connections) — `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- **ApiExceptionHandler** (12 connections) — `services/api/src/main/java/mn/tasky/common/api/ApiExceptionHandler.java`
- **.error()** (12 connections) — `services/api/src/main/java/mn/tasky/common/api/ApiExceptionHandler.java`
- **.processCallback()** (11 connections) — `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- **.recordSuccess()** (10 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **QPayPaymentProvider** (10 connections) — `services/api/src/main/java/mn/tasky/payment/provider/QPayPaymentProvider.java`
- **healthy()** (8 connections) — `services/api/src/main/java/mn/tasky/automation/provider/ProviderHealth.java`
- **FacebookCircuitBreakerTest** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/FacebookCircuitBreakerTest.java`
- **FacebookCircuitBreaker** (7 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **LoggingPushProvider** (7 connections) — `services/api/src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java`
- **.health()** (7 connections) — `services/api/src/main/java/mn/tasky/payment/provider/QPayPaymentProvider.java`
- **RequireKey** (7 connections) — `services/api/src/test/java/mn/tasky/common/idempotency/IdempotencyServiceTest.java`
- **getStatus()** (6 connections) — `apps/mobile/src/features/disputes/screens/DisputeStatus/model.ts`
- **.login()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- **.assertAllowed()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookRateLimitService.java`
- **.fetchProfile()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **FacebookOAuthProvider** (6 connections) — `services/api/src/main/java/mn/tasky/auth/provider/FacebookOAuthProvider.java`
- **.doProbe()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`
- **LoggingLlmProvider** (6 connections) — `services/api/src/main/java/mn/tasky/automation/provider/llm/LoggingLlmProvider.java`
- **PaymentService** (6 connections) — `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- **FacebookRateLimitServiceTest** (6 connections) — `services/api/src/test/java/mn/tasky/auth/application/FacebookRateLimitServiceTest.java`
- _... and 132 more nodes in this community_

## Relationships

- [[Community 4]] (14 shared connections)
- [[Community 0]] (11 shared connections)
- [[Community 2]] (10 shared connections)
- [[Community 5]] (7 shared connections)
- [[Community 1]] (5 shared connections)
- [[Community 3]] (3 shared connections)
- [[Community 6]] (2 shared connections)
- [[Community 17]] (1 shared connections)
- [[Community 11]] (1 shared connections)
- [[Community 18]] (1 shared connections)
- [[Community 10]] (1 shared connections)
- [[Community 14]] (1 shared connections)

## Source Files

- `apps/mobile/src/features/disputes/screens/DisputeStatus/model.ts`
- `services/api/src/main/java/mn/tasky/auth/api/FacebookAuthController.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookHealthIndicator.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookRateLimitService.java`
- `services/api/src/main/java/mn/tasky/auth/provider/FacebookOAuthProvider.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`
- `services/api/src/main/java/mn/tasky/automation/provider/ProviderHealth.java`
- `services/api/src/main/java/mn/tasky/automation/provider/llm/LoggingLlmProvider.java`
- `services/api/src/main/java/mn/tasky/common/api/ApiExceptionHandler.java`
- `services/api/src/main/java/mn/tasky/common/idempotency/IdempotencyException.java`
- `services/api/src/main/java/mn/tasky/notification/provider/FirebasePushProvider.java`
- `services/api/src/main/java/mn/tasky/notification/provider/LoggingPushProvider.java`
- `services/api/src/main/java/mn/tasky/notification/provider/LoggingSmsNotificationProvider.java`
- `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- `services/api/src/main/java/mn/tasky/payment/dao/PaymentIntentDao.java`
- `services/api/src/main/java/mn/tasky/payment/provider/QPayPaymentProvider.java`
- `services/api/src/test/java/mn/tasky/auth/AuthExceptionTest.java`
- `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`

## Audit Trail

- EXTRACTED: 326 (58%)
- INFERRED: 237 (42%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
