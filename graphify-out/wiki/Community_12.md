# Community 12

> 110 nodes

## Key Concepts

- **.findActive()** (16 connections) — `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- **.updateStatusAndSuspensionEnd()** (15 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **AddStrike** (15 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.updatePolicy()** (13 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`
- **UpdateModerationPolicy** (13 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **AutoUnsuspendEnabled** (12 connections) — `services/api/src/test/java/mn/tasky/auth/UserStatusResolverTests.java`
- **IdentityQueryPort** (11 connections) — `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueryPort.java`
- **ModerationService** (10 connections) — `services/api/src/main/java/mn/tasky/auth/application/ModerationService.java`
- **.countSince()** (10 connections) — `services/api/src/main/java/mn/tasky/auth/dao/SuspensionEventDao.java`
- **.findSuspensionEndAt()** (9 connections) — `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- **.atThresholdTriggersSuspension()** (9 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.addStrike()** (8 connections) — `services/api/src/main/java/mn/tasky/auth/application/ModerationService.java`
- **.repeatOffenderLongerSuspension()** (8 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.strikePolicyResponse()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionService.java`
- **.banUser()** (7 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminUserCompositionService.java`
- **.bannedUserNotSuspended()** (7 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.suspendedUserNotDoubled()** (7 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.banSetsStatusAndAudits()** (7 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.resolve()** (6 connections) — `services/api/src/main/java/mn/tasky/auth/application/UserStatusResolver.java`
- **.currentStrikePolicy()** (6 connections) — `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionService.java`
- **.pastEndAutoUnsuspends()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/UserStatusResolverTests.java`
- **.usesDefaultPolicy()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/UserStatusResolverTests.java`
- **.belowThresholdNoSuspension()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.unbanRestoresActiveAndAudits()** (6 connections) — `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- **.updatePolicy_success()** (6 connections) — `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateServiceTests.java`
- _... and 85 more nodes in this community_

## Relationships

- [[Community 1]] (22 shared connections)
- [[Community 0]] (18 shared connections)
- [[Community 2]] (17 shared connections)
- [[Community 3]] (15 shared connections)
- [[Community 4]] (13 shared connections)
- [[Community 5]] (9 shared connections)
- [[Community 7]] (5 shared connections)
- [[Community 13]] (3 shared connections)
- [[Community 9]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/admin/api/AdminModerationController.java`
- `services/api/src/main/java/mn/tasky/auth/application/ModerationService.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserStatusResolver.java`
- `services/api/src/main/java/mn/tasky/auth/dao/SuspensionEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/UserDao.java`
- `services/api/src/main/java/mn/tasky/category/dao/CategoryDao.java`
- `services/api/src/main/java/mn/tasky/identity/publicapi/IdentityQueryPort.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateOutcome.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateService.java`
- `services/api/src/main/java/mn/tasky/runtime/adminapi/composition/AdminUserCompositionService.java`
- `services/api/src/test/java/mn/tasky/auth/AuthScenarioTests.java`
- `services/api/src/test/java/mn/tasky/auth/ModerationServiceTests.java`
- `services/api/src/test/java/mn/tasky/auth/UserStatusResolverTests.java`
- `services/api/src/test/java/mn/tasky/identity/application/command/IdentityCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/identity/application/query/IdentityQueryHandlerTest.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminModerationCompositionServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminModerationPolicyUpdateServiceTests.java`
- `services/api/src/test/java/mn/tasky/runtime/adminapi/composition/AdminUserCompositionServiceTests.java`

## Audit Trail

- EXTRACTED: 206 (46%)
- INFERRED: 241 (54%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
