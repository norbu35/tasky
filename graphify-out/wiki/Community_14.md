# Community 14

> 84 nodes

## Key Concepts

- **.getState()** (19 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **.isOpen()** (17 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **.recordFailure()** (16 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **FacebookCircuitBreakerTests** (13 connections) — `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- **.processCallback()** (11 connections) — `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- **.recordSuccess()** (10 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **QPayPaymentProvider** (10 connections) — `services/api/src/main/java/mn/tasky/payment/provider/QPayPaymentProvider.java`
- **FacebookCircuitBreakerTest** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/FacebookCircuitBreakerTest.java`
- **useDisputeStatusScreen()** (7 connections) — `apps/mobile/src/features/disputes/screens/DisputeStatus/useDisputeStatusScreen.ts`
- **model.ts** (7 connections) — `apps/mobile/src/features/disputes/screens/DisputeStatus/model.ts`
- **FacebookCircuitBreaker** (7 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **.health()** (7 connections) — `services/api/src/main/java/mn/tasky/payment/provider/QPayPaymentProvider.java`
- **getStatus()** (6 connections) — `apps/mobile/src/features/disputes/screens/DisputeStatus/model.ts`
- **.fetchProfile()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **.doProbe()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`
- **PaymentService** (6 connections) — `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- **.initiatePayment()** (6 connections) — `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- **.tryHalfOpen()** (5 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- **FacebookGraphClient** (5 connections) — `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- **.findBookingIdByPaymentId()** (5 connections) — `services/api/src/main/java/mn/tasky/payment/dao/PaymentIntentDao.java`
- **.successAfterOpenClosesCircuit()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- **.failuresAfterWindowExpiryDoNotOpenCircuit()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- **.tryHalfOpenTransitionsFromOpen()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- **.successFromHalfOpenClosesCircuit()** (5 connections) — `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- **FacebookHealthIndicatorTest** (5 connections) — `services/api/src/test/java/mn/tasky/auth/application/FacebookHealthIndicatorTest.java`
- _... and 59 more nodes in this community_

## Relationships

- [[Community 5]] (12 shared connections)
- [[Community 1]] (8 shared connections)
- [[Community 0]] (7 shared connections)
- [[Community 2]] (5 shared connections)
- [[Community 17]] (2 shared connections)
- [[Community 4]] (2 shared connections)
- [[Community 23]] (1 shared connections)
- [[Community 12]] (1 shared connections)

## Source Files

- `apps/mobile/src/features/disputes/hooks/useDisputeDetail.ts`
- `apps/mobile/src/features/disputes/screens/DisputeStatus/model.ts`
- `apps/mobile/src/features/disputes/screens/DisputeStatus/useDisputeStatusScreen.ts`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookCircuitBreaker.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookGraphClient.java`
- `services/api/src/main/java/mn/tasky/auth/application/FacebookHealthIndicator.java`
- `services/api/src/main/java/mn/tasky/auth/scheduling/FacebookCircuitBreakerProbe.java`
- `services/api/src/main/java/mn/tasky/payment/application/PaymentService.java`
- `services/api/src/main/java/mn/tasky/payment/dao/PaymentIntentDao.java`
- `services/api/src/main/java/mn/tasky/payment/provider/QPayPaymentProvider.java`
- `services/api/src/test/java/mn/tasky/auth/FacebookCircuitBreakerTests.java`
- `services/api/src/test/java/mn/tasky/auth/application/FacebookCircuitBreakerTest.java`
- `services/api/src/test/java/mn/tasky/auth/application/FacebookHealthIndicatorTest.java`

## Audit Trail

- EXTRACTED: 167 (49%)
- INFERRED: 177 (51%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
