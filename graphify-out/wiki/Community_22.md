# Community 22

> 62 nodes

## Key Concepts

- **IdentityCommandHandler** (20 connections) — `services/api/src/main/java/mn/tasky/identity/application/command/IdentityCommandHandler.java`
- **IdentityCommandPort** (19 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.upsert()** (16 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- **.recompute()** (14 connections) — `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- **.countByTaskerAndStatusSince()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **ReliabilityScoreServiceTest** (9 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.averagePunctualityByRevieweeSince()** (8 connections) — `services/api/src/main/java/mn/tasky/review/dao/ReviewDao.java`
- **.handlesNoPunctualityReviews()** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.handlesNoProfileFound()** (8 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.computesScoreAtMinimumSampleSize()** (7 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.computesCorrectScoreWithPerfectValues()** (7 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.computesScoreWithMixedResults()** (7 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.skipsWhenBelowMinimumSampleSize()** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **.skipsWhenFourBookings()** (4 connections) — `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- **ReliabilityScoreService** (3 connections) — `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- **ReliabilityScoreDao** (3 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- **.recomputeReliabilityScore()** (3 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.evaluateBadges()** (3 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- **.recomputeReliabilityScore_delegates()** (3 connections) — `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- **.evaluateBadges_delegates()** (3 connections) — `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- **.findByTaskerId()** (2 connections) — `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- **.recomputeReliabilityScore()** (2 connections) — `services/api/src/main/java/mn/tasky/identity/application/command/IdentityCommandHandler.java`
- **.evaluateBadges()** (2 connections) — `services/api/src/main/java/mn/tasky/identity/application/command/IdentityCommandHandler.java`
- **ReliabilityScoreService.java** (1 connections) — `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- **.ReliabilityScoreService()** (1 connections) — `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- _... and 37 more nodes in this community_

## Relationships

- [[Community 1]] (11 shared connections)
- [[Community 5]] (6 shared connections)
- [[Community 2]] (5 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 21]] (2 shared connections)
- [[Community 6]] (2 shared connections)
- [[Community 3]] (2 shared connections)
- [[Community 0]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/auth/application/ReliabilityScoreService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/identity/application/command/IdentityCommandHandler.java`
- `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityCommandPort.java`
- `services/api/src/main/java/mn/tasky/review/dao/ReviewDao.java`
- `services/api/src/test/java/mn/tasky/auth/application/ReliabilityScoreServiceTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`

## Audit Trail

- EXTRACTED: 111 (54%)
- INFERRED: 93 (46%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
