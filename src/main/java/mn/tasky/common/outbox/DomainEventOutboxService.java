package mn.tasky.common.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

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
            UUID.randomUUID(), eventType, aggregateType, aggregateId, payloadJson, "PENDING", 0, now, now);
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
