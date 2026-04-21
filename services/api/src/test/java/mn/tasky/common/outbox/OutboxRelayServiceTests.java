// Scenario gap: No tests/scenarios/automation.md or outbox.md exists.
// These tests are not backed by scenario files. Create scenarios before next review cycle.
package mn.tasky.common.outbox;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Field;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import mn.tasky.automation.broker.EventRelayPublisher;
import mn.tasky.automation.event.AutomationEventEnvelope;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("OutboxRelayService")
class OutboxRelayServiceTests {

    private static final int BATCH_SIZE = 50;
    private static final int MAX_ATTEMPTS = 3;
    private static final Duration CLAIM_DURATION = Duration.ofMinutes(5);
    private static final Duration BACKOFF_BASE = Duration.ofSeconds(30);
    private static final Duration BACKOFF_MAX = Duration.ofHours(1);
    private static final Duration PERMANENT_BACKOFF = Duration.ofHours(24);

    @Mock
    private OutboxEventDao outboxEventDao;

    @Mock
    private EventRelayPublisher eventRelayPublisher;

    private OutboxRelayService relayService;

    @BeforeEach
    void setUp() {
        relayService =
                new OutboxRelayService(outboxEventDao, new ObjectMapper(), BATCH_SIZE, MAX_ATTEMPTS, CLAIM_DURATION);
        injectPublisher(relayService, eventRelayPublisher);
    }

    private void injectPublisher(OutboxRelayService service, EventRelayPublisher publisher) {
        try {
            Field field = OutboxRelayService.class.getDeclaredField("eventRelayPublisher");
            field.setAccessible(true);
            field.set(service, publisher);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject eventRelayPublisher via reflection", e);
        }
    }

    private OutboxEvent createTestEvent(UUID id, int attempts) {
        return new OutboxEvent(
                id,
                "BOOKING_COMPLETED",
                "booking",
                UUID.randomUUID(),
                "{\"bookingId\":\"b-123\"}",
                "PENDING",
                attempts,
                Instant.now(),
                Instant.now(),
                null,
                null,
                "corr-1",
                "trace-1",
                "cause-1",
                "cmd-1",
                "wf-1",
                "actor-1",
                "mn",
                "WEB");
    }

    @Nested
    @DisplayName("Successful relay")
    class SuccessfulRelay {

        @Test
        @DisplayName("OutboxRelayService: should mark processed when publish succeeds")
        void shouldMarkProcessedWhenPublishSucceeds() {
            UUID eventId = UUID.randomUUID();
            OutboxEvent event = createTestEvent(eventId, 0);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));

            relayService.relayPending();

            ArgumentCaptor<AutomationEventEnvelope> envelopeCaptor =
                    ArgumentCaptor.forClass(AutomationEventEnvelope.class);
            verify(eventRelayPublisher).publish(envelopeCaptor.capture());
            verify(outboxEventDao).markProcessed(eq(eventId), any(Instant.class));

            AutomationEventEnvelope envelope = envelopeCaptor.getValue();
            assertThat(envelope.eventId()).isEqualTo(eventId.toString());
            assertThat(envelope.eventType()).isEqualTo("BOOKING_COMPLETED");
            assertThat(envelope.aggregateType()).isEqualTo("booking");
            assertThat(envelope.aggregateId()).isEqualTo(event.aggregateId().toString());
            assertThat(envelope.payload()).containsEntry("bookingId", "b-123");
            assertThat(envelope.correlationId()).isEqualTo("corr-1");
            assertThat(envelope.traceId()).isEqualTo("trace-1");
            assertThat(envelope.causationId()).isEqualTo("cause-1");
            assertThat(envelope.commandId()).isEqualTo("cmd-1");
            assertThat(envelope.workflowId()).isEqualTo("wf-1");
            assertThat(envelope.actorId()).isEqualTo("actor-1");
            assertThat(envelope.locale()).isEqualTo("mn");
            assertThat(envelope.platform()).isEqualTo("WEB");
            assertThat(envelope.occurredAt()).isEqualTo(event.createdAt());
        }
    }

    @Nested
    @DisplayName("Broker failure handling")
    class BrokerFailureHandling {

        @Test
        @DisplayName("OutboxRelayService: should mark failed with exponential backoff on first publish failure")
        void shouldMarkFailedWithExponentialBackoffOnPublishFailure() {
            UUID eventId = UUID.randomUUID();
            OutboxEvent event = createTestEvent(eventId, 0);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));
            doThrow(new RuntimeException("broker unavailable"))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            Instant before = Instant.now();
            relayService.relayPending();

            ArgumentCaptor<Instant> availableAtCaptor = ArgumentCaptor.forClass(Instant.class);
            verify(outboxEventDao).markFailed(eq(eventId), availableAtCaptor.capture(), eq("broker unavailable"));

            // attempts=0 -> attempts+1=1 -> backoff = 30s * 2^0 = 30s
            Instant expectedAvailableAt = before.plus(BACKOFF_BASE);
            assertThat(availableAtCaptor.getValue()).isCloseTo(expectedAvailableAt, within(5, ChronoUnit.SECONDS));
        }

        @Test
        @DisplayName("OutboxRelayService: should double backoff on second failure")
        void shouldDoubleBackoffOnSecondFailure() {
            UUID eventId = UUID.randomUUID();
            OutboxEvent event = createTestEvent(eventId, 1);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));
            doThrow(new RuntimeException("broker unavailable"))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            Instant before = Instant.now();
            relayService.relayPending();

            ArgumentCaptor<Instant> availableAtCaptor = ArgumentCaptor.forClass(Instant.class);
            verify(outboxEventDao).markFailed(eq(eventId), availableAtCaptor.capture(), eq("broker unavailable"));

            // attempts=1 -> attempts+1=2 -> backoff = 30s * 2^1 = 60s
            Duration expectedBackoff = BACKOFF_BASE.multipliedBy(2);
            Instant expectedAvailableAt = before.plus(expectedBackoff);
            assertThat(availableAtCaptor.getValue()).isCloseTo(expectedAvailableAt, within(5, ChronoUnit.SECONDS));
        }

        @Test
        @DisplayName("OutboxRelayService: should apply permanent backoff when attempts exceed max")
        void shouldApplyPermanentBackoffWhenAttemptsExceedMax() {
            UUID eventId = UUID.randomUUID();
            OutboxEvent event = createTestEvent(eventId, 10);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));
            doThrow(new RuntimeException("broker unavailable"))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            Instant before = Instant.now();
            relayService.relayPending();

            ArgumentCaptor<Instant> availableAtCaptor = ArgumentCaptor.forClass(Instant.class);
            verify(outboxEventDao).markFailed(eq(eventId), availableAtCaptor.capture(), eq("broker unavailable"));

            // attempts=10, maxAttempts=3 -> attempts+1=11 >= 3 -> PERMANENT_BACKOFF = 24h
            Instant expectedAvailableAt = before.plus(PERMANENT_BACKOFF);
            assertThat(availableAtCaptor.getValue()).isCloseTo(expectedAvailableAt, within(5, ChronoUnit.SECONDS));
        }

        @Test
        @DisplayName("OutboxRelayService: should cap exponential backoff at one hour")
        void shouldCapBackoffAtOneHour() {
            OutboxRelayService highMaxService =
                    new OutboxRelayService(outboxEventDao, new ObjectMapper(), BATCH_SIZE, 100, CLAIM_DURATION);
            injectPublisher(highMaxService, eventRelayPublisher);

            UUID eventId = UUID.randomUUID();
            OutboxEvent event = createTestEvent(eventId, 10);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));
            doThrow(new RuntimeException("broker unavailable"))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            Instant before = Instant.now();
            highMaxService.relayPending();

            ArgumentCaptor<Instant> availableAtCaptor = ArgumentCaptor.forClass(Instant.class);
            verify(outboxEventDao).markFailed(eq(eventId), availableAtCaptor.capture(), eq("broker unavailable"));

            // maxAttempts=100, attempts+1=11 -> exponential path: min(30s * 2^10, 1h) = 1h
            Instant expectedAvailableAt = before.plus(BACKOFF_MAX);
            assertThat(availableAtCaptor.getValue()).isCloseTo(expectedAvailableAt, within(5, ChronoUnit.SECONDS));
        }

        @Test
        @DisplayName("OutboxRelayService: should truncate long error messages to 500 characters")
        void shouldTruncateLongErrorMessages() {
            UUID eventId = UUID.randomUUID();
            OutboxEvent event = createTestEvent(eventId, 0);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));

            String longError = "x".repeat(600);
            doThrow(new RuntimeException(longError))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            relayService.relayPending();

            ArgumentCaptor<String> errorCaptor = ArgumentCaptor.forClass(String.class);
            verify(outboxEventDao).markFailed(eq(eventId), any(Instant.class), errorCaptor.capture());

            assertThat(errorCaptor.getValue()).hasSize(500);
        }
    }

    @Nested
    @DisplayName("Max attempts")
    class MaxAttempts {

        @Test
        @DisplayName("OutboxRelayService: should apply permanent 24h backoff after max attempts reached")
        void shouldApplyPermanentBackoffAfterMaxAttempts() {
            UUID eventId = UUID.randomUUID();
            // attempts=2, attempts+1=3, 3 >= maxAttempts(3) -> PERMANENT_BACKOFF
            OutboxEvent event = createTestEvent(eventId, MAX_ATTEMPTS - 1);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(event));
            doThrow(new RuntimeException("persistent failure"))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            Instant before = Instant.now();
            relayService.relayPending();

            ArgumentCaptor<Instant> availableAtCaptor = ArgumentCaptor.forClass(Instant.class);
            verify(outboxEventDao).markFailed(eq(eventId), availableAtCaptor.capture(), eq("persistent failure"));

            Instant expectedAvailableAt = before.plus(PERMANENT_BACKOFF);
            assertThat(availableAtCaptor.getValue()).isCloseTo(expectedAvailableAt, within(5, ChronoUnit.SECONDS));
        }
    }

    @Nested
    @DisplayName("Broker disabled")
    class BrokerDisabled {

        @Test
        @DisplayName("OutboxRelayService: should return early when publisher is null")
        void shouldReturnEarlyWhenPublisherIsNull() {
            OutboxRelayService noPublisherService = new OutboxRelayService(
                    outboxEventDao, new ObjectMapper(), BATCH_SIZE, MAX_ATTEMPTS, CLAIM_DURATION);

            noPublisherService.relayPending();

            verify(outboxEventDao, never()).claimBatch(any(Instant.class), any(Instant.class), anyInt());
            verifyNoMoreInteractions(outboxEventDao);
        }
    }

    @Nested
    @DisplayName("Empty batch")
    class EmptyBatch {

        @Test
        @DisplayName("OutboxRelayService: should do nothing when no events claimed")
        void shouldDoNothingWhenNoEventsClaimed() {
            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(Collections.emptyList());

            relayService.relayPending();

            verify(eventRelayPublisher, never()).publish(any(AutomationEventEnvelope.class));
            verify(outboxEventDao, never()).markProcessed(any(UUID.class), any(Instant.class));
            verify(outboxEventDao, never()).markFailed(any(UUID.class), any(Instant.class), any(String.class));
        }
    }

    @Nested
    @DisplayName("Mixed batch")
    class MixedBatch {

        @Test
        @DisplayName("OutboxRelayService: should process successful and failed events in same batch")
        void shouldProcessSuccessfulAndFailedEventsInSameBatch() {
            UUID successId = UUID.randomUUID();
            UUID failId = UUID.randomUUID();
            OutboxEvent successEvent = createTestEvent(successId, 0);
            OutboxEvent failEvent = createTestEvent(failId, 0);

            when(outboxEventDao.claimBatch(any(Instant.class), any(Instant.class), eq(BATCH_SIZE)))
                    .thenReturn(List.of(successEvent, failEvent));

            doNothing()
                    .doThrow(new RuntimeException("transient failure"))
                    .when(eventRelayPublisher)
                    .publish(any(AutomationEventEnvelope.class));

            relayService.relayPending();

            verify(outboxEventDao).markProcessed(eq(successId), any(Instant.class));
            verify(outboxEventDao).markFailed(eq(failId), any(Instant.class), eq("transient failure"));
            verify(eventRelayPublisher, times(2)).publish(any(AutomationEventEnvelope.class));
        }
    }
}
