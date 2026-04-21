package mn.tasky.common.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.automation.broker.EventRelayPublisher;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.kernel.context.ContextPropagator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Publishes domain events to the outbox table with enriched context propagation,
 * and (when the broker is enabled) directly to the RabbitMQ event exchange.
 *
 * Extracts correlation, causation, command, workflow, and actor identifiers from
 * the current request's MDC so that downstream workers can trace the full chain.
 *
 * <p>Failed broker publishes are recovered by the outbox relay
 * ({@link OutboxRelayScheduler} + {@link OutboxRelayService}), which periodically
 * claims PENDING/FAILED rows and republishes them.
 */
@Service
public class DomainEventOutboxService {

    private static final Logger log = LoggerFactory.getLogger(DomainEventOutboxService.class);

    private final OutboxEventDao outboxEventDao;
    private final ObjectMapper objectMapper;

    @Nullable
    @Autowired(required = false)
    private EventRelayPublisher eventRelayPublisher;

    public DomainEventOutboxService(OutboxEventDao outboxEventDao, ObjectMapper objectMapper) {
        this.outboxEventDao = outboxEventDao;
        this.objectMapper = objectMapper;
    }

    public void publish(String eventType, String aggregateType, String aggregateId, Map<String, Object> payload) {
        UUID aggregateUuid = aggregateId != null ? UUID.fromString(aggregateId) : null;
        publish(eventType, aggregateType, aggregateUuid, payload);
    }

    public void publish(String eventType, String aggregateType, UUID aggregateId, Map<String, Object> payload) {
        Map<String, Object> enrichedPayload = enrichWithObservability(payload);
        String payloadJson = toPayloadJson(enrichedPayload);
        String eventId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        Map<String, String> capturedMdc = ContextPropagator.captureMdc();
        String correlationId = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_CORRELATION_ID);
        String traceId = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_TRACE_ID);
        String causationId = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_CAUSATION_ID);
        String commandId = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_COMMAND_ID);
        String workflowId = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_WORKFLOW_ID);
        String actorId = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_ACTOR_ID);
        String locale = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_LOCALE);
        String platform = ContextPropagator.fromMdc(capturedMdc, ContextPropagator.MDC_PLATFORM);

        outboxEventDao.insert(
                UUID.fromString(eventId),
                eventType,
                aggregateType,
                aggregateId,
                payloadJson,
                "PENDING",
                0,
                now,
                now,
                correlationId,
                traceId,
                causationId,
                commandId,
                workflowId,
                actorId,
                locale,
                platform);

        if (eventRelayPublisher != null) {
            AutomationEventEnvelope envelope = AutomationEventEnvelope.builder()
                    .eventId(eventId)
                    .eventType(eventType)
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId != null ? aggregateId.toString() : null)
                    .payload(enrichedPayload)
                    .correlationId(correlationId)
                    .traceId(traceId)
                    .causationId(causationId)
                    .commandId(commandId)
                    .workflowId(workflowId)
                    .actorId(actorId)
                    .locale(locale)
                    .platform(platform)
                    .occurredAt(now)
                    .build();

            try {
                eventRelayPublisher.publish(envelope);
                outboxEventDao.markProcessed(UUID.fromString(eventId), Instant.now());
            } catch (RuntimeException exception) {
                // Event is already persisted to the outbox table, so this failure
                // is recoverable by a future retry. Log and continue — we never
                // want a broker outage to roll back the domain transaction.
                log.warn(
                        "Failed to publish event to broker at write time (outbox row persisted): eventId={} type={} error={}",
                        eventId,
                        eventType,
                        exception.getMessage());
            }
        }
    }

    private Map<String, Object> enrichWithObservability(Map<String, Object> payload) {
        Map<String, Object> enriched = new LinkedHashMap<>();
        if (payload != null) {
            enriched.putAll(payload);
        }

        String correlationId = MDC.get(RequestObservabilityFilter.CORRELATION_ID_MDC_KEY);
        if (StringUtils.hasText(correlationId)) {
            enriched.putIfAbsent(AnalyticsService.PROPERTY_CORRELATION_ID, correlationId);
        }

        String locale = MDC.get(RequestObservabilityFilter.LOCALE_MDC_KEY);
        if (StringUtils.hasText(locale)) {
            enriched.putIfAbsent(AnalyticsService.PROPERTY_LOCALE, locale);
        }

        String platform = MDC.get(RequestObservabilityFilter.PLATFORM_MDC_KEY);
        if (StringUtils.hasText(platform)) {
            enriched.putIfAbsent(AnalyticsService.PROPERTY_PLATFORM, platform.toUpperCase(Locale.ROOT));
        }
        return enriched;
    }

    private String toPayloadJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to serialize domain event payload.", exception);
        }
    }
}
