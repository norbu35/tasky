package mn.tasky.common.outbox;

import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RegisterConstructorMapper(OutboxEvent.class)
public interface OutboxEventDao {

    @SqlUpdate(
        """
            INSERT INTO domain_outbox_events
                (id, event_type, aggregate_type, aggregate_id, payload, status, attempts, available_at, created_at)
            VALUES
                (:id, :eventType, :aggregateType, :aggregateId, CAST(:payload AS jsonb),
                 :status, :attempts, :availableAt, :createdAt)
            """)
    void insert(
        @Bind("id") UUID id,
        @Bind("eventType") String eventType,
        @Bind("aggregateType") String aggregateType,
        @Bind("aggregateId") UUID aggregateId,
        @Bind("payload") String payload,
        @Bind("status") String status,
        @Bind("attempts") int attempts,
        @Bind("availableAt") Instant availableAt,
        @Bind("createdAt") Instant createdAt);

    @SqlQuery(
        """
            WITH candidates AS (
                SELECT id
                FROM domain_outbox_events
                WHERE status IN ('PENDING', 'FAILED', 'PROCESSING')
                  AND available_at <= :now
                ORDER BY created_at
                FOR UPDATE SKIP LOCKED
                LIMIT :limit
            )
            UPDATE domain_outbox_events e
            SET status = 'PROCESSING',
                available_at = :claimUntil,
                last_error = NULL
            FROM candidates c
            WHERE e.id = c.id
            RETURNING e.id,
                      e.event_type,
                      e.aggregate_type,
                      e.aggregate_id,
                      e.payload::text AS payload,
                      e.status,
                      e.attempts,
                      e.available_at,
                      e.created_at,
                      e.processed_at,
                      e.last_error
            """)
    List<OutboxEvent> claimBatch(
        @Bind("now") Instant now, @Bind("claimUntil") Instant claimUntil, @Bind("limit") int limit);

    @SqlUpdate(
        """
            UPDATE domain_outbox_events
            SET status = 'PROCESSED',
                processed_at = :processedAt,
                last_error = NULL
            WHERE id = :id
            """)
    int markProcessed(@Bind("id") UUID id, @Bind("processedAt") Instant processedAt);

    @SqlUpdate(
        """
            UPDATE domain_outbox_events
            SET status = 'FAILED',
                attempts = attempts + 1,
                available_at = :availableAt,
                last_error = :lastError
            WHERE id = :id
            """)
    int markFailed(@Bind("id") UUID id, @Bind("availableAt") Instant availableAt, @Bind("lastError") String lastError);
}
