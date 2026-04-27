# Community 2

> 306 nodes

## Key Concepts

- **.required()** (155 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **.findByIdForUpdate()** (30 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **FlagNoShow** (27 connections) — `services/api/src/test/java/mn/tasky/runtime/publicapi/composition/BookingPublicOperationServiceTests.java`
- **.optional()** (25 connections) — `services/api/src/main/java/mn/tasky/common/persistence/UuidHelper.java`
- **.recordEvent()** (22 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- **BookingDao** (21 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- **NoShowServiceTest** (20 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **.flagNoShow_success_customerFlags_taskerNoShow()** (19 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **.flagNoShow()** (16 connections) — `services/api/src/main/java/mn/tasky/booking/application/NoShowService.java`
- **.cancelBooking()** (16 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- **.flagNoShow_success_taskerFlags_customerNoShow_noStrikeForCustomer()** (16 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **.confirmIntent()** (15 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.findByTaskAndParticipants()** (15 connections) — `services/api/src/main/java/mn/tasky/messaging/dao/ConversationDao.java`
- **.existsRecentByBookingId()** (12 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- **IdentityQueryHandler** (12 connections) — `services/api/src/main/java/mn/tasky/identity/application/query/IdentityQueryHandler.java`
- **MessagingService** (12 connections) — `services/api/src/main/java/mn/tasky/messaging/application/MessagingService.java`
- **.assignedBooking()** (12 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **BookingIntentService** (11 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- **.completeBooking()** (11 connections) — `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- **.findByBookingId()** (11 connections) — `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- **DisputeDao** (11 connections) — `services/api/src/main/java/mn/tasky/dispute/dao/DisputeDao.java`
- **.flagNoShow_futureRescheduleSupersedes()** (11 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **.flagNoShow_pastRescheduleAccepted_doesNotBlock()** (11 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **.flagNoShow_noConversation_doesNotBlock()** (11 connections) — `services/api/src/test/java/mn/tasky/booking/application/NoShowServiceTest.java`
- **VerificationDao** (10 connections) — `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- _... and 281 more nodes in this community_

## Relationships

- [[Community 0]] (202 shared connections)
- [[Community 5]] (55 shared connections)
- [[Community 11]] (27 shared connections)
- [[Community 6]] (17 shared connections)
- [[Community 3]] (13 shared connections)
- [[Community 1]] (11 shared connections)
- [[Community 20]] (10 shared connections)
- [[Community 14]] (9 shared connections)
- [[Community 17]] (7 shared connections)
- [[Community 8]] (5 shared connections)
- [[Community 19]] (4 shared connections)
- [[Community 4]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/analytics/dao/AnalyticsEventDao.java`
- `services/api/src/main/java/mn/tasky/auth/application/UserProfileService.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ProfileDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/ReliabilityScoreDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/StrikeDao.java`
- `services/api/src/main/java/mn/tasky/auth/dao/VerificationDao.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingIntentService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingLifecycleService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingScheduleService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingService.java`
- `services/api/src/main/java/mn/tasky/booking/application/BookingTimelineService.java`
- `services/api/src/main/java/mn/tasky/booking/application/NoShowService.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingCompletionSignalDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingIntentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingReliabilityIncidentDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingScheduleEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/dao/BookingTimelineEventDao.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/NoShowReminderScheduler.java`
- `services/api/src/main/java/mn/tasky/booking/scheduling/RescheduleExpiryScheduler.java`

## Audit Trail

- EXTRACTED: 662 (47%)
- INFERRED: 761 (53%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
