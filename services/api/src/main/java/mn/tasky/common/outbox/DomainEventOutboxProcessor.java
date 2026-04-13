package mn.tasky.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import mn.tasky.automation.broker.EventRelayPublisher;
import mn.tasky.automation.event.AutomationEventEnvelope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Polls the outbox table and relays persisted events to the RabbitMQ event bus.
 * The event was already persisted when this processor picks it up, so relay failures
 * are retried without risk of data loss.
 *
 * Once all event families are migrated to workflow handlers, this class is deleted
 * and the outbox service publishes directly to the broker at write time.
 */
@Service
@ConditionalOnBean(EventRelayPublisher.class)
public class DomainEventOutboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(DomainEventOutboxProcessor.class);

    private final OutboxEventDao outboxEventDao;
    private final ObjectMapper objectMapper;
    private final EventRelayPublisher eventRelayPublisher;
    private final int batchSize;
    private static final int MAX_ATTEMPTS = 10;
    private final long retryDelaySeconds;
    private final long processingLeaseSeconds;

    public DomainEventOutboxProcessor(
            OutboxEventDao outboxEventDao,
            ObjectMapper objectMapper,
            EventRelayPublisher eventRelayPublisher,
            @Value("${tasky.outbox.processor.batch-size:25}") int batchSize,
            @Value("${tasky.outbox.processor.retry-delay-seconds:15}") long retryDelaySeconds,
            @Value("${tasky.outbox.processor.processing-lease-seconds:60}") long processingLeaseSeconds) {
        this.outboxEventDao = outboxEventDao;
        this.objectMapper = objectMapper;
        this.eventRelayPublisher = eventRelayPublisher;
        this.batchSize = batchSize;
        this.retryDelaySeconds = retryDelaySeconds;
        this.processingLeaseSeconds = processingLeaseSeconds;
    }

    @Scheduled(fixedDelayString = "${tasky.outbox.processor.poll-interval-ms:1000}")
    public void processBatch() {
        Instant now = Instant.now();
        List<OutboxEvent> events = outboxEventDao.claimBatch(now, now.plusSeconds(processingLeaseSeconds), batchSize);
        for (OutboxEvent event : events) {
            if (event.attempts() >= MAX_ATTEMPTS) {
                log.error(
                        "Outbox event exceeded max retries, marking failed: id={} type={} attempts={}",
                        event.id(),
                        event.eventType(),
                        event.attempts());
                outboxEventDao.markFailed(event.id(), null, "Exceeded max retry attempts (" + MAX_ATTEMPTS + ")");
                continue;
            }
            try {
                relay(event);
                outboxEventDao.markProcessed(event.id(), Instant.now());
            } catch (RuntimeException exception) {
                String error =
                        exception.getMessage() == null ? exception.getClass().getSimpleName() : exception.getMessage();
                if (error.length() > 1024) {
                    error = error.substring(0, 1024);
                }
                outboxEventDao.markFailed(event.id(), Instant.now().plusSeconds(retryDelaySeconds), error);
                log.warn("Outbox event relay failed: id={} type={} error={}", event.id(), event.eventType(), error);
            }
        }
    }

    private void relay(OutboxEvent event) {
        AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                .eventId(event.id().toString())
                .eventType(event.eventType())
                .aggregateType(event.aggregateType())
                .aggregateId(event.aggregateId() != null ? event.aggregateId().toString() : null)
                .payload(parsePayload(event.payload()))
                .correlationId(event.correlationId())
                .traceId(event.traceId())
                .causationId(event.causationId())
                .commandId(event.commandId())
                .workflowId(event.workflowId())
                .actorId(event.actorId())
                .locale(event.locale())
                .platform(event.platform())
                .occurredAt(event.createdAt())
                .build();
        eventRelayPublisher.publish(envelope);
    }

    private java.util.Map<String, Object> parsePayload(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (Exception exception) {
            throw new IllegalArgumentException("Failed to parse outbox event payload.", exception);
        }
    }
}
