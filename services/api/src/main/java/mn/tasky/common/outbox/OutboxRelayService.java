package mn.tasky.common.outbox;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import mn.tasky.automation.broker.EventRelayPublisher;
import mn.tasky.automation.event.AutomationEventEnvelope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

/**
 * Claims PENDING/FAILED outbox rows and republishes them to the event broker.
 * Marked events as PROCESSED on success or FAILED with exponential backoff on failure.
 */
@Service
public class OutboxRelayService {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelayService.class);
    private static final Duration BACKOFF_BASE = Duration.ofSeconds(30);
    private static final Duration BACKOFF_MAX = Duration.ofHours(1);
    private static final Duration PERMANENT_BACKOFF = Duration.ofHours(24);
    private static final int MAX_ERROR_LENGTH = 500;

    private final OutboxEventDao outboxEventDao;
    private final ObjectMapper objectMapper;

    @Nullable
    @Autowired(required = false)
    private EventRelayPublisher eventRelayPublisher;

    private final int batchSize;
    private final int maxAttempts;
    private final Duration claimDuration;

    public OutboxRelayService(
            OutboxEventDao outboxEventDao,
            ObjectMapper objectMapper,
            @Value("${tasky.automation.relay.batch-size:50}") int batchSize,
            @Value("${tasky.automation.relay.max-attempts:10}") int maxAttempts,
            @Value("${tasky.automation.relay.claim-duration:5m}") Duration claimDuration) {
        this.outboxEventDao = outboxEventDao;
        this.objectMapper = objectMapper;
        this.batchSize = batchSize;
        this.maxAttempts = maxAttempts;
        this.claimDuration = claimDuration;
    }

    public void relayPending() {
        if (eventRelayPublisher == null) {
            return;
        }

        Instant now = Instant.now();
        Instant claimUntil = now.plus(claimDuration);
        List<OutboxEvent> batch = outboxEventDao.claimBatch(now, claimUntil, batchSize);

        if (batch.isEmpty()) {
            return;
        }

        int processed = 0;
        int failed = 0;

        for (OutboxEvent event : batch) {
            try {
                Map<String, Object> payload = parsePayload(event.payload());
                AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                        .eventId(event.id().toString())
                        .eventType(event.eventType())
                        .aggregateType(event.aggregateType())
                        .aggregateId(
                                event.aggregateId() != null
                                        ? event.aggregateId().toString()
                                        : null)
                        .payload(payload)
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
                outboxEventDao.markProcessed(event.id(), Instant.now());
                processed++;
            } catch (Exception e) {
                failed++;
                handleFailure(event, e);
            }
        }

        log.info("Outbox relay completed: claimed={} processed={} failed={}", batch.size(), processed, failed);
    }

    private void handleFailure(OutboxEvent event, Exception exception) {
        int attempts = event.attempts() + 1;
        String errorMessage = truncate(exception.getMessage(), MAX_ERROR_LENGTH);

        Instant availableAt;
        if (attempts >= maxAttempts) {
            availableAt = Instant.now().plus(PERMANENT_BACKOFF);
        } else {
            long backoffSeconds =
                    Math.min(BACKOFF_BASE.toSeconds() * (1L << Math.min(attempts - 1, 12)), BACKOFF_MAX.toSeconds());
            availableAt = Instant.now().plusSeconds(backoffSeconds);
        }

        outboxEventDao.markFailed(event.id(), availableAt, errorMessage);
        log.warn(
                "Outbox relay failed for event {}: type={} attempts={} availableAt={} error={}",
                event.id(),
                event.eventType(),
                attempts,
                availableAt,
                errorMessage);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parsePayload(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private static String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
