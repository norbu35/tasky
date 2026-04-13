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
 * Two-phase lifecycle:
 *   1. claim(eventType, eventId) — inserts IN_PROGRESS row. If row already exists:
 *      - COMPLETED → skip (side effects already ran)
 *      - IN_PROGRESS → proceed (previous attempt crashed, retry is safe)
 *   2. complete(eventId) — transitions to COMPLETED after side effects succeed.
 *
 * Usage in handler.handle(envelope):
 *   if (!idempotencyGuard.claim(eventType(), envelope.eventId())) {
 *       log.info("Duplicate event skipped: eventId={}", envelope.eventId());
 *       return;
 *   }
 *   try {
 *       // ... side effects
 *       idempotencyGuard.complete(envelope.eventId());
 *   } catch (RuntimeException e) {
 *       // Row stays IN_PROGRESS — retry will re-execute side effects
 *       throw e;
 *   }
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
     * @return true if this handler should proceed (first claim or retry of crashed attempt),
     *         false if already completed.
     */
    public boolean claim(String eventType, String eventId) {
        String handlerName = eventType.replace(".", "_") + "_handler";
        int claimed = dao.claimEvent(eventId, eventType, handlerName, Instant.now());
        if (claimed == 1) {
            return true;
        }
        // Already exists — check status
        Optional<EventIdempotencyRecord> existing = dao.findByEventId(eventId);
        if (existing.isPresent()) {
            EventIdempotencyRecord record = existing.get();
            if ("COMPLETED".equals(record.eventStatus())) {
                log.info(
                        "Duplicate event detected, skipping: eventId={} type={} handler={}",
                        eventId,
                        eventType,
                        record.handler());
                return false;
            }
            // IN_PROGRESS — previous attempt crashed, allow retry
            log.info("Retrying in-progress event: eventId={} type={} handler={}", eventId, eventType, record.handler());
            return true;
        }
        // Race condition: row exists but not yet readable — allow through for safety
        return true;
    }

    /** Marks the event as completed after side effects succeed. */
    public void complete(String eventId) {
        dao.completeEvent(eventId);
    }
}
