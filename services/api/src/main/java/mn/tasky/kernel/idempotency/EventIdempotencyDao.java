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
 */
@RegisterConstructorMapper(EventIdempotencyRecord.class)
public interface EventIdempotencyDao {

    /**
     * Atomically claims an event for processing.
     * Returns 1 if this is the first processing attempt, 0 if already processed.
     */
    @SqlUpdate(
            """
        INSERT INTO event_idempotency (event_id, event_type, handler, processed_at)
        VALUES (:eventId, :eventType, :handler, :processedAt)
        ON CONFLICT (event_id) DO NOTHING
    """)
    int claimEvent(
            @Bind("eventId") String eventId,
            @Bind("eventType") String eventType,
            @Bind("handler") String handler,
            @Bind("processedAt") Instant processedAt);

    /**
     * Checks if an event has already been processed.
     */
    @SqlQuery(
            """
        SELECT event_id, event_type, handler, processed_at
        FROM event_idempotency
        WHERE event_id = :eventId
    """)
    Optional<EventIdempotencyRecord> findByEventId(@Bind("eventId") String eventId);

    /**
     * Purges old idempotency records (for maintenance).
     */
    @SqlUpdate("""
        DELETE FROM event_idempotency
        WHERE processed_at < :cutoff
    """)
    int purgeOlderThan(@Bind("cutoff") Instant cutoff);
}
