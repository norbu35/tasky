# Community 6

> 265 nodes

## Key Concepts

- **builder()** (42 connections) — `services/api/src/main/java/mn/tasky/automation/event/AutomationEventEnvelope.java`
- **.build()** (40 connections) — `services/api/src/main/java/mn/tasky/automation/event/AutomationEventEnvelope.java`
- **.publish()** (38 connections) — `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- **.relayPending()** (33 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxRelayService.java`
- **.track()** (30 connections) — `services/api/src/main/java/mn/tasky/analytics/publicapi/AnalyticsCommandPort.java`
- **.handle()** (25 connections) — `services/api/src/main/java/mn/tasky/wallet/workflow/BookingCompletedHandler.java`
- **.eventType()** (21 connections) — `services/api/src/main/java/mn/tasky/wallet/workflow/BookingCompletedHandler.java`
- **.shouldMarkProcessedWhenPublishSucceeds()** (21 connections) — `services/api/src/test/java/mn/tasky/common/outbox/OutboxRelayServiceTests.java`
- **.eventId()** (18 connections) — `services/api/src/main/java/mn/tasky/automation/event/AutomationEventEnvelope.java`
- **AnalyticsScenarioTests** (16 connections) — `services/api/src/test/java/mn/tasky/analytics/AnalyticsScenarioTests.java`
- **.differentEventsExecuteIndependently()** (16 connections) — `services/api/src/test/java/mn/tasky/messaging/workflow/TaskApplicationAcceptedHandlerTest.java`
- **.bookingConfirmedEventEmittedWhenSelectedTaskerAccepts()** (15 connections) — `services/api/src/test/java/mn/tasky/analytics/AnalyticsScenarioTests.java`
- **.bookingCompletedEventEmittedOnTransition()** (15 connections) — `services/api/src/test/java/mn/tasky/analytics/AnalyticsScenarioTests.java`
- **.envelope()** (15 connections) — `services/api/src/test/java/mn/tasky/messaging/workflow/TaskApplicationAcceptedHandlerTest.java`
- **.correlationId()** (14 connections) — `services/api/src/main/java/mn/tasky/automation/event/AutomationEventEnvelope.java`
- **.startConversation()** (13 connections) — `services/api/src/main/java/mn/tasky/messaging/publicapi/MessagingCommandPort.java`
- **.handle()** (13 connections) — `services/api/src/main/java/mn/tasky/messaging/workflow/TaskApplicationAcceptedHandler.java`
- **AbstractEventHandlerTest** (13 connections) — `services/api/src/test/java/mn/tasky/automation/worker/AbstractEventHandlerTest.java`
- **BrokerConfig** (12 connections) — `services/api/src/main/java/mn/tasky/automation/broker/BrokerConfig.java`
- **.payload()** (12 connections) — `services/api/src/main/java/mn/tasky/automation/event/AutomationEventEnvelope.java`
- **.propagateMdc()** (12 connections) — `services/api/src/main/java/mn/tasky/automation/worker/EventWorkerConsumer.java`
- **.claimBatch()** (12 connections) — `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- **.propagate()** (12 connections) — `services/api/src/main/java/mn/tasky/kernel/context/ContextPropagator.java`
- **.handle()** (12 connections) — `services/api/src/main/java/mn/tasky/notification/workflow/PaymentConfirmedHandler.java`
- **.createHandler()** (12 connections) — `services/api/src/test/java/mn/tasky/automation/worker/AbstractEventHandlerTest.java`
- _... and 240 more nodes in this community_

## Relationships

- [[Community 2]] (45 shared connections)
- [[Community 4]] (26 shared connections)
- [[Community 0]] (22 shared connections)
- [[Community 16]] (12 shared connections)
- [[Community 3]] (10 shared connections)
- [[Community 7]] (10 shared connections)
- [[Community 1]] (7 shared connections)
- [[Community 11]] (5 shared connections)
- [[Community 29]] (4 shared connections)
- [[Community 17]] (4 shared connections)
- [[Community 20]] (3 shared connections)
- [[Community 14]] (3 shared connections)

## Source Files

- `services/api/src/main/java/mn/tasky/analytics/publicapi/AnalyticsCommandPort.java`
- `services/api/src/main/java/mn/tasky/automation/broker/BrokerConfig.java`
- `services/api/src/main/java/mn/tasky/automation/broker/EventRelayPublisher.java`
- `services/api/src/main/java/mn/tasky/automation/broker/JsonMessageConverter.java`
- `services/api/src/main/java/mn/tasky/automation/event/AutomationEventEnvelope.java`
- `services/api/src/main/java/mn/tasky/automation/provider/ProviderHealth.java`
- `services/api/src/main/java/mn/tasky/automation/provider/S3StorageProvider.java`
- `services/api/src/main/java/mn/tasky/automation/worker/AbstractEventHandler.java`
- `services/api/src/main/java/mn/tasky/automation/worker/EventWorkerConsumer.java`
- `services/api/src/main/java/mn/tasky/common/config/CacheConfig.java`
- `services/api/src/main/java/mn/tasky/common/config/ShedLockConfig.java`
- `services/api/src/main/java/mn/tasky/common/health/OutboxHealthIndicator.java`
- `services/api/src/main/java/mn/tasky/common/i18n/BackendMessageResolver.java`
- `services/api/src/main/java/mn/tasky/common/observability/RequestObservabilityFilter.java`
- `services/api/src/main/java/mn/tasky/common/outbox/DomainEventOutboxService.java`
- `services/api/src/main/java/mn/tasky/common/outbox/OutboxEventDao.java`
- `services/api/src/main/java/mn/tasky/common/outbox/OutboxRelayService.java`
- `services/api/src/main/java/mn/tasky/common/scheduling/OutboxRelayScheduler.java`
- `services/api/src/main/java/mn/tasky/common/security/StompRateLimitInterceptor.java`
- `services/api/src/main/java/mn/tasky/common/storage/S3PresignedUrlService.java`

## Audit Trail

- EXTRACTED: 594 (44%)
- INFERRED: 768 (56%)
- AMBIGUOUS: 0 (0%)

---

_Part of the graphify knowledge wiki. See [[index]] to navigate._
