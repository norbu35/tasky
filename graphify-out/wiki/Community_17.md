# Community 17

> 86 nodes

## Key Concepts

- **.customerSelectsApplicantAndSelectedTaskerAcceptanceConfirmsBooking()** (20 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.confirmAcceptance()** (18 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskApplicationService.java`
- **TaskApplicationDao** (18 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- **BookingSelectionScenarioTests** (17 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.confirmIntent()** (15 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.acceptApplication()** (14 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskApplicationService.java`
- **.bookingPriceIsLockedAtConfirmedBooking()** (14 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **BookingIntentCommandHandlerTest** (14 connections) — `services/api/src/test/java/mn/tasky/booking/application/command/BookingIntentCommandHandlerTest.java`
- **.findByTaskerAndId()** (13 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- **.customerCannotSelectSecondApplicantWhileFirstSelectionIsPending()** (12 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.nonSelectedApplicationsCloseAutomatically()** (12 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **BookingIntentService** (11 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.declineIntent()** (10 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **BookingIntentCommandPort** (10 connections) — `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`
- **TaskApplicationService** (9 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskApplicationService.java`
- **.expireStaleSelections()** (9 connections) — `services/api/src/main/java/mn/tasky/task/application/TaskApplicationService.java`
- **.findByTaskId()** (9 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- **.bookingConfirmationWithoutDisclaimerIsRejected()** (9 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.selectedTaskerDoesNotAcceptWithin4HoursSelectionExpires()** (8 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.createApplicationSelectionIntent()** (7 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.openBudgetTask()** (7 connections) — `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- **.createIntent()** (6 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.createApplicationSelectionIntent()** (6 connections) — `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`
- **.findPendingApplicationSelectionIntent()** (6 connections) — `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`
- **.rejectOthers()** (6 connections) — `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- _... and 61 more nodes in this community_

## Relationships

- [[Community 0]] (80 shared connections)
- [[Community 1]] (20 shared connections)
- [[Community 3]] (17 shared connections)
- [[Community 6]] (9 shared connections)
- [[Community 12]] (6 shared connections)
- [[Community 4]] (3 shared connections)
- [[Community 23]] (2 shared connections)
- [[Community 14]] (1 shared connections)
- [[Community 11]] (1 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- `services/api/src/main/java/mn/tasky/booking/publicapi/BookingIntentCommandPort.java`
- `services/api/src/main/java/mn/tasky/task/application/TaskApplicationService.java`
- `services/api/src/main/java/mn/tasky/task/dao/TaskApplicationDao.java`
- `services/api/src/main/java/mn/tasky/task/scheduling/SelectionExpiryScheduler.java`
- `services/api/src/test/java/mn/tasky/booking/BookingSelectionScenarioTests.java`
- `services/api/src/test/java/mn/tasky/booking/application/command/BookingIntentCommandHandlerTest.java`
- `services/api/src/test/java/mn/tasky/task/scheduling/SelectionExpirySchedulerTest.java`

## Audit Trail

- EXTRACTED: 229 (52%)
- INFERRED: 208 (48%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
