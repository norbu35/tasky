# Community 37

> 17 nodes

## Key Concepts

- **OutboxEventDao** (10 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **OutboxReplayController** (7 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **.getEvent()** (4 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **.replayEvent()** (4 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **.replayAllFailed()** (4 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **.listEvents()** (3 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **.findByStatus()** (3 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.countByStatus()** (3 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.resetForReplay()** (3 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.getSummary()** (2 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **OutboxReplayController.java** (1 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **.OutboxReplayController()** (1 connections) — `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- **OutboxEventDao.java** (1 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.insert()** (1 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.markProcessed()** (1 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.findById()** (1 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.findByStatuses()** (1 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`

## Relationships

- [[Community 0]] (2 shared connections)
- [[Community 2]] (2 shared connections)
- [[Community 6]] (2 shared connections)
- [[Community 3]] (1 shared connections)
- [[Community 7]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/api/OutboxReplayController.java`
- `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`

## Audit Trail

- EXTRACTED: 32 (64%)
- INFERRED: 18 (36%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
