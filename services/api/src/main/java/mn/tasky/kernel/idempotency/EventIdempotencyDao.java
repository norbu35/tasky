package mn.tasky.kernel.idempotency;

import java.time.Instant;
import java.util.Optional;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

/**
 * Event-level idempotency for workflow handlers.
 * Uses event_id (from AutomationEventEnvelope) as the deduplication key.
 * Two-phase lifecycle:
 *   1. claimEvent() inserts with IN_PROGRESS status (idempotent via ON CONFLICT DO NOTHING).
 *   2. completeEvent() transitions to COMPLETED after side effects succeed.
 *
 * If a handler crashes after claim but before complete, the event remains IN_PROGRESS
 * and the retry will proceed (not skipped), preventing data loss.
 */
@RegisterConstructorMapper(EventIdempotencyRecord.class)
public interface EventIdempotencyDao {

    /**
     * Atomically claims an event for processing with IN_PROGRESS status.
     * Returns 1 if this is a new claim, 0 if already exists.
     */
    @SqlUpdate(
            """
        INSERT INTO event_idempotency (event_id, event_type, handler, event_status, processed_at)
        VALUES (:eventId, :eventType, :handler, 'IN_PROGRESS', :processedAt)
        ON CONFLICT (event_id) DO NOTHING
    """)
    int claimEvent(
            @Bind("eventId") String eventId,
            @Bind("eventType") String eventType,
            @Bind("handler") String handler,
            @Bind("processedAt") Instant processedAt);

    /**
     * Checks if an event has already been completed.
     */
    @SqlQuery(
            """
        SELECT event_id, event_type, handler, event_status, processed_at
        FROM event_idempotency
        WHERE event_id = :eventId
    """)
    Optional<EventIdempotencyRecord> findByEventId(@Bind("eventId") String eventId);

    /**
     * Transitions the event from IN_PROGRESS to COMPLETED after side effects succeed.
     */
    @SqlUpdate(
            """
        UPDATE event_idempotency
        SET event_status = 'COMPLETED'
        WHERE event_id = :eventId AND event_status = 'IN_PROGRESS'
    """)
    int completeEvent(@Bind("eventId") String eventId);

    /**
     * Purges old idempotency records (for maintenance).
     */
    @SqlUpdate("""
        DELETE FROM event_idempotency
        WHERE processed_at < :cutoff
    """)
    int purgeOlderThan(@Bind("cutoff") Instant cutoff);
}
