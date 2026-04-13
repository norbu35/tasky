package mn.tasky.common.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.kernel.logging.LogField;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Publishes domain events to the outbox table with enriched context propagation.
 * Extracts correlation, causation, command, workflow, and actor identifiers from
 * the current request's MDC so that downstream workers can trace the full chain.
 */
@Service
public class DomainEventOutboxService {

    private final OutboxEventDao outboxEventDao;
    private final ObjectMapper objectMapper;

    public DomainEventOutboxService(OutboxEventDao outboxEventDao, ObjectMapper objectMapper) {
        this.outboxEventDao = outboxEventDao;
        this.objectMapper = objectMapper;
    }

    public void publish(String eventType, String aggregateType, String aggregateId, Map<String, Object> payload) {
        UUID aggregateUuid = aggregateId != null ? UUID.fromString(aggregateId) : null;
        publish(eventType, aggregateType, aggregateUuid, payload);
    }

    public void publish(String eventType, String aggregateType, UUID aggregateId, Map<String, Object> payload) {
        String payloadJson = toPayloadJson(enrichWithObservability(payload));
        Instant now = Instant.now();

        outboxEventDao.insert(
                UUID.randomUUID(),
                eventType,
                aggregateType,
                aggregateId,
                payloadJson,
                "PENDING",
                0,
                now,
                now,
                extractMdc(LogField.CORRELATION_ID.key()),
                extractMdc(LogField.CAUSATION_ID.key()),
                extractMdc(LogField.COMMAND_ID.key()),
                extractMdc(LogField.WORKFLOW_ID.key()),
                extractMdc(LogField.ACTOR_ID.key()));
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

    private String extractMdc(String key) {
        String value = MDC.get(key);
        return StringUtils.hasText(value) ? value : null;
    }

    private String toPayloadJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Failed to serialize domain event payload.", exception);
        }
    }
}
