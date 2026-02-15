package mn.tasky.analytics.application;

import mn.tasky.analytics.dto.Event;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AnalyticsService {

    public static final String EVENT_TASK_POSTED = "TASK_POSTED";
    public static final String EVENT_APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED";
    public static final String EVENT_TASKER_ACCEPTED = "TASKER_ACCEPTED";
    public static final String EVENT_PAYMENT_INITIATED = "PAYMENT_INITIATED";
    public static final String EVENT_PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String EVENT_BOOKING_COMPLETED = "BOOKING_COMPLETED";
    public static final String EVENT_DISPUTE_RAISED = "DISPUTE_RAISED";
    public static final String PROPERTY_TASK_ID = "task_id";
    public static final String PROPERTY_BOOKING_ID = "booking_id";
    public static final String PROPERTY_CORRELATION_ID = "correlation_id";

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    private final List<Event> events = new CopyOnWriteArrayList<>();

    public void track(String eventName, String userId, Map<String, Object> properties) {
        Map<String, Object> enrichedProperties = new LinkedHashMap<>();
        if (properties != null) {
            enrichedProperties.putAll(properties);
        }

        String correlationId = MDC.get(RequestObservabilityFilter.CORRELATION_ID_MDC_KEY);
        if (StringUtils.hasText(correlationId)) {
            enrichedProperties.putIfAbsent(PROPERTY_CORRELATION_ID, correlationId);
        }

        Event event = new Event(
            UUID.randomUUID().toString(),
            eventName,
            userId,
            Map.copyOf(enrichedProperties),
            Instant.now()
        );
        events.add(event);
        log.info("TRACK event={} user={} props={}", eventName, userId, event.properties());
    }

    public List<Event> getEvents() {
        return List.copyOf(events);
    }

}
