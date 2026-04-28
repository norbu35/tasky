# Community 19

> 69 nodes

## Key Concepts

- **TaskAssistanceScenarioTests** (15 connections) — `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- **MarketplaceCommandHandler** (14 connections) — `services/api/src/main/java/mn/tasky/marketplace/application/command/MarketplaceCommandHandler.java`
- **.evaluateExternalDistribution()** (12 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- **.recordExternalDistribution()** (10 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- **.processRescue()** (10 connections) — `services/api/src/main/java/mn/tasky/task/scheduling/RescueScheduler.java`
- **TaskAssistanceService** (9 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- **.countByTaskId()** (9 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- **.processRescue_createsEventForOldOpenTaskWithZeroApplications()** (8 connections) — `services/api/src/test/java/mn/tasky/task/scheduling/RescueSchedulerTest.java`
- **.findOpenOlderThan()** (7 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskDao.java`
- **.externalDistributionTriggersOnlyAfterEightHoursWithoutQualifiedApplication()** (7 connections) — `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- **.externalDistributionLimitedToAdminEligibleCategories()** (7 connections) — `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- **.adminLaunchControlMarksInitialSeedCategoriesEligible()** (7 connections) — `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- **RescueSchedulerTest** (7 connections) — `services/api/src/test/java/mn/tasky/task/scheduling/RescueSchedulerTest.java`
- **.processRescue_skipsTaskWithExistingApplications()** (7 connections) — `services/api/src/test/java/mn/tasky/task/scheduling/RescueSchedulerTest.java`
- **.processRescue_skipsTaskWithExistingRescueEvent()** (7 connections) — `services/api/src/test/java/mn/tasky/task/scheduling/RescueSchedulerTest.java`
- **.processRescue_continuesAfterException()** (7 connections) — `services/api/src/test/java/mn/tasky/task/scheduling/RescueSchedulerTest.java`
- **.recordManualRescue()** (6 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- **.classifyOutcome()** (6 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- **.existsByTaskId()** (6 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskRescueEventDao.java`
- **.findLatestByTaskId()** (6 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskRescueEventDao.java`
- **.processTask()** (6 connections) — `services/api/src/main/java/mn/tasky/task/scheduling/RescueScheduler.java`
- **.openTaskCreatedHoursAgo()** (6 connections) — `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- **.trackIntervention()** (5 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- **RescueScheduler** (5 connections) — `services/api/src/main/java/mn/tasky/task/scheduling/RescueScheduler.java`
- **.systemAssistedOutcomeWhenExternalDistributionWasUsed()** (5 connections) — `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- _... and 44 more nodes in this community_

## Relationships

- [[Community 0]] (24 shared connections)
- [[Community 1]] (6 shared connections)
- [[Community 3]] (4 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 2]] (2 shared connections)
- [[Community 15]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/marketplace/application/command/MarketplaceCommandHandler.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskAssistanceService.java`
- `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- `services/api/src/main/java/mn/tasky/task/dao/TaskDao.java`
- `services/api/src/main/java/mn/tasky/task/dao/TaskRescueEventDao.java`
- `services/api/src/main/java/mn/tasky/task/scheduling/RescueScheduler.java`
- `services/api/src/test/java/mn/tasky/marketplace/application/command/MarketplaceCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/task/TaskApplicationServiceTests.java`
- `services/api/src/test/java/mn/tasky/task/TaskAssistanceScenarioTests.java`
- `services/api/src/test/java/mn/tasky/task/application/TaskAssistanceServiceTest.java`
- `services/api/src/test/java/mn/tasky/task/scheduling/RescueSchedulerTest.java`

## Audit Trail

- EXTRACTED: 154 (53%)
- INFERRED: 134 (47%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
