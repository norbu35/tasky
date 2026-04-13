package mn.tasky.automation.worker;

import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.automation.event.AutomationEventEnvelope;
import mn.tasky.kernel.idempotency.WorkflowIdempotencyGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;

/**
 * Base class for event handlers that need to enrich analytics payloads
 * with observability fields carried through the event envelope.
 * Also provides idempotency guard access for duplicate-event protection.
 */
public abstract class AbstractEventHandler implements EventHandler {

    @Autowired
    @Nullable
    protected WorkflowIdempotencyGuard idempotencyGuard;

    /**
     * Checks idempotency for the given event. Returns true if processing should proceed.
     * Subclasses should call this at the start of handle() and return early if false.
     */
    protected boolean tryClaimEvent(AutomationEventEnvelope envelope) {
        if (idempotencyGuard == null) {
            // Guard not available (e.g., broker not enabled) — allow through.
            return true;
        }
        return idempotencyGuard.claim(eventType(), envelope.eventId());
    }

    protected Map<String, Object> withObservability(Map<String, Object> payload, Map<String, Object> base) {
        Map<String, Object> enriched = new LinkedHashMap<>(base);
        copyIfPresent(payload, enriched, AnalyticsService.PROPERTY_CORRELATION_ID);
        copyIfPresent(payload, enriched, AnalyticsService.PROPERTY_LOCALE);
        copyIfPresent(payload, enriched, AnalyticsService.PROPERTY_PLATFORM);
        return enriched;
    }

    protected void copyIfPresent(Map<String, Object> source, Map<String, Object> target, String key) {
        Object value = source.get(key);
        if (value != null) {
            target.putIfAbsent(key, value);
        }
    }

    protected String requiredString(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            throw new IllegalArgumentException("Missing payload field: " + key);
        }
        return value.toString();
    }
}
