# Community 38

> 14 nodes

## Key Concepts

- **.findLatest()** (6 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **AnalyticsService** (5 connections) — `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- **.getLogs()** (4 connections) — `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- **NotificationLogDao** (4 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **.getEventsDelegatesToDao()** (4 connections) — `services/api/src/test/java/mn/tasky/analytics/AnalyticsScenarioTests.java`
- **.getLogs_delegatesToDao()** (4 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.track()** (3 connections) — `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- **.getLogs_returnsEmpty_whenNoLogs()** (3 connections) — `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`
- **.getEvents()** (2 connections) — `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- **.sanitizeForLog()** (2 connections) — `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- **.insert()** (2 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- **AnalyticsService.java** (1 connections) — `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- **.AnalyticsService()** (1 connections) — `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- **NotificationLogDao.java** (1 connections) — `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`

## Relationships

- [[Community 1]] (5 shared connections)
- [[Community 0]] (2 shared connections)
- [[Community 3]] (1 shared connections)
- [[Community 10]] (1 shared connections)
- [[Community 4]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/analytics/application/AnalyticsService.java`
- `services/api/src/main/java/mn/tasky/notification/application/NotificationService.java`
- `services/api/src/main/java/mn/tasky/notification/dao/NotificationLogDao.java`
- `services/api/src/test/java/mn/tasky/analytics/AnalyticsScenarioTests.java`
- `services/api/src/test/java/mn/tasky/notification/application/NotificationServiceTest.java`

## Audit Trail

- EXTRACTED: 23 (55%)
- INFERRED: 19 (45%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
