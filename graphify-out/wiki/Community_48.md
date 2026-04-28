# Community 48

> 10 nodes

## Key Concepts

- **StompRateLimitInterceptorTest** (8 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.preSend()** (7 connections) — `services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java`
- **.stompSend()** (6 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.preSend_noUser_passesThrough()** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.preSend_withUser_passesThrough()** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.preSend_rateLimitExceeded_throws()** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.preSend_differentUsers_separateBuckets()** (3 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.preSend_nonSendCommand_passesThrough()** (2 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **StompRateLimitInterceptorTest.java** (1 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`
- **.setUp()** (1 connections) — `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`

## Relationships

- [[Community 2]] (2 shared connections)
- [[Community 0]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java`
- `services/api/src/test/java/mn/tasky/common/security/StompRateLimitInterceptorTest.java`

## Audit Trail

- EXTRACTED: 26 (70%)
- INFERRED: 11 (30%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
