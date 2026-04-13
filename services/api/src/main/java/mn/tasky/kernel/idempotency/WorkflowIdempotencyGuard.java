package mn.tasky.kernel.idempotency;

import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Idempotency guard for workflow handlers.
 * Uses event_id from AutomationEventEnvelope as the dedup key.
 *
 * Usage in handler.handle(envelope):
 *   if (!idempotencyGuard.claim(eventType(), envelope.eventId())) {
 *       log.info("Duplicate event skipped: eventId={}", envelope.eventId());
 *       return;
 *   }
 *   // ... proceed with side effects
 */
@Component
public class WorkflowIdempotencyGuard {

    private static final Logger log = LoggerFactory.getLogger(WorkflowIdempotencyGuard.class);

    private final EventIdempotencyDao dao;

    public WorkflowIdempotencyGuard(EventIdempotencyDao dao) {
        this.dao = dao;
    }

    /**
     * Atomically claims the event for processing.
     * @return true if this handler should proceed (first claim), false if already processed.
     */
    public boolean claim(String eventType, String eventId) {
        String handlerName = eventType.replace(".", "_") + "_handler";
        int claimed = dao.claimEvent(eventId, eventType, handlerName, Instant.now());
        if (claimed == 1) {
            return true;
        }
        // Already processed — log and skip
        Optional<EventIdempotencyRecord> existing = dao.findByEventId(eventId);
        log.info(
                "Duplicate event detected, skipping: eventId={} type={} handler={}",
                eventId,
                eventType,
                existing.map(EventIdempotencyRecord::handler).orElse(handlerName));
        return false;
    }
}
