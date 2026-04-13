package mn.tasky.common.outbox;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(OutboxEvent.class)
public interface OutboxEventDao {

    @SqlUpdate(
            """
            INSERT INTO domain_outbox_events
                (id, event_type, aggregate_type, aggregate_id, payload, status, attempts,
                 available_at, created_at,
                 correlation_id, trace_id, causation_id, command_id, workflow_id, actor_id,
                 locale, platform)
            VALUES
                (:id, :eventType, :aggregateType, :aggregateId, CAST(:payload AS jsonb),
                 :status, :attempts, :availableAt, :createdAt,
                 :correlationId, :traceId, :causationId, :commandId, :workflowId, :actorId,
                 :locale, :platform)
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
            @Bind("createdAt") Instant createdAt,
            @Bind("correlationId") String correlationId,
            @Bind("traceId") String traceId,
            @Bind("causationId") String causationId,
            @Bind("commandId") String commandId,
            @Bind("workflowId") String workflowId,
            @Bind("actorId") String actorId,
            @Bind("locale") String locale,
            @Bind("platform") String platform);

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
                      e.last_error,
                      e.correlation_id,
                      e.trace_id,
                      e.causation_id,
                      e.command_id,
                      e.workflow_id,
                      e.actor_id,
                      e.locale,
                      e.platform
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

    @SqlQuery(
            """
            SELECT e.id,
                   e.event_type,
                   e.aggregate_type,
                   e.aggregate_id,
                   e.payload::text AS payload,
                   e.status,
                   e.attempts,
                   e.available_at,
                   e.created_at,
                   e.processed_at,
                   e.last_error,
                   e.correlation_id,
                   e.trace_id,
                   e.causation_id,
                   e.command_id,
                   e.workflow_id,
                   e.actor_id,
                   e.locale,
                   e.platform
            FROM domain_outbox_events e
            WHERE e.id = :id
            """)
    OutboxEvent findById(@Bind("id") UUID id);

    @SqlQuery(
            """
            SELECT e.id,
                   e.event_type,
                   e.aggregate_type,
                   e.aggregate_id,
                   e.payload::text AS payload,
                   e.status,
                   e.attempts,
                   e.available_at,
                   e.created_at,
                   e.processed_at,
                   e.last_error,
                   e.correlation_id,
                   e.trace_id,
                   e.causation_id,
                   e.command_id,
                   e.workflow_id,
                   e.actor_id,
                   e.locale,
                   e.platform
            FROM domain_outbox_events e
            WHERE e.status IN (:statuses)
            ORDER BY e.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    List<OutboxEvent> findByStatuses(
            @Bind("statuses") List<String> statuses, @Bind("limit") int limit, @Bind("offset") int offset);

    @SqlQuery(
            """
            SELECT e.id,
                   e.event_type,
                   e.aggregate_type,
                   e.aggregate_id,
                   e.payload::text AS payload,
                   e.status,
                   e.attempts,
                   e.available_at,
                   e.created_at,
                   e.processed_at,
                   e.last_error,
                   e.correlation_id,
                   e.trace_id,
                   e.causation_id,
                   e.command_id,
                   e.workflow_id,
                   e.actor_id,
                   e.locale,
                   e.platform
            FROM domain_outbox_events e
            WHERE e.status = :status
            ORDER BY e.created_at DESC
            LIMIT :limit OFFSET :offset
            """)
    List<OutboxEvent> findByStatus(@Bind("status") String status, @Bind("limit") int limit, @Bind("offset") int offset);

    @SqlQuery("""
            SELECT COUNT(*) FROM domain_outbox_events WHERE status = :status
            """)
    long countByStatus(@Bind("status") String status);

    @SqlUpdate(
            """
            UPDATE domain_outbox_events
            SET status = 'PENDING',
                attempts = 0,
                available_at = :availableAt,
                last_error = NULL
            WHERE id = :id AND status = 'FAILED'
            """)
    int resetForReplay(@Bind("id") UUID id, @Bind("availableAt") Instant availableAt);
}
