package mn.tasky.analytics.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.analytics.dao.AnalyticsEventDao;
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
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class AnalyticsService {

    public static final String EVENT_TASK_POSTED = "TASK_POSTED";
    public static final String EVENT_APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED";
    public static final String EVENT_TASKER_ACCEPTED = "TASKER_ACCEPTED";
    public static final String EVENT_BOOKING_CONFIRMED = "BOOKING_CONFIRMED";
    public static final String EVENT_PAYMENT_INITIATED = "PAYMENT_INITIATED";
    public static final String EVENT_PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String EVENT_BOOKING_COMPLETED = "BOOKING_COMPLETED";
    public static final String EVENT_DISPUTE_RAISED = "DISPUTE_RAISED";
    public static final String PROPERTY_TASK_ID = "task_id";
    public static final String PROPERTY_BOOKING_ID = "booking_id";
    public static final String PROPERTY_CORRELATION_ID = "correlation_id";
    public static final String PROPERTY_LOCALE = "locale";
    public static final String PROPERTY_PLATFORM = "platform";

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    private final AnalyticsEventDao analyticsEventDao;
    private final ObjectMapper objectMapper;

    public AnalyticsService(AnalyticsEventDao analyticsEventDao,
                            ObjectMapper objectMapper) {
        this.analyticsEventDao = analyticsEventDao;
        this.objectMapper      = objectMapper;
    }

    public void track(String eventName,
                      String userId,
                      Map<String, Object> properties) {
        Map<String, Object> enrichedProperties = new LinkedHashMap<>();
        if (properties != null) {
            enrichedProperties.putAll(properties);
        }

        String correlationId = MDC.get(RequestObservabilityFilter.CORRELATION_ID_MDC_KEY);
        if (StringUtils.hasText(correlationId)) {
            enrichedProperties.putIfAbsent(PROPERTY_CORRELATION_ID,
                                           correlationId);
        }
        String locale = MDC.get(RequestObservabilityFilter.LOCALE_MDC_KEY);
        if (StringUtils.hasText(locale)) {
            enrichedProperties.putIfAbsent(PROPERTY_LOCALE,
                                           locale);
        } else {
            enrichedProperties.putIfAbsent(PROPERTY_LOCALE,
                                           "mn");
        }
        String platform = MDC.get(RequestObservabilityFilter.PLATFORM_MDC_KEY);
        if (StringUtils.hasText(platform)) {
            enrichedProperties.putIfAbsent(PROPERTY_PLATFORM,
                                           platform.toUpperCase(Locale.ROOT));
        } else {
            enrichedProperties.putIfAbsent(PROPERTY_PLATFORM,
                                           "UNKNOWN");
        }

        String id = UUID.randomUUID()
                .toString();
        Instant now = Instant.now();

        String propertiesJson;
        try {
            propertiesJson = objectMapper.writeValueAsString(enrichedProperties);
        } catch (JsonProcessingException e) {
            propertiesJson = "{}";
        }

        analyticsEventDao.insert(id,
                                 eventName,
                                 userId,
                                 propertiesJson,
                                 now);
        log.info("TRACK event={} user={} props={}",
                 eventName,
                 userId,
                 enrichedProperties);
    }

    public List<Event> getEvents() {
        return analyticsEventDao.findAll();
    }

}
