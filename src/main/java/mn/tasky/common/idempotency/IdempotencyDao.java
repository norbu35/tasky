package mn.tasky.common.idempotency;

import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@RegisterConstructorMapper(IdempotencyRecord.class)
public interface IdempotencyDao {

    @SqlUpdate(
            "INSERT INTO idempotency_keys (id, user_id, operation, idempotency_key, status, " +
                    "created_at, updated_at) "
                    + "VALUES (:id, :userId, :operation, :key, :status, :createdAt, :updatedAt) "
                    + "ON CONFLICT (user_id, operation, idempotency_key) DO NOTHING")
    int insert(
            @Bind("id") UUID id,
            @Bind("userId") UUID userId,
            @Bind("operation") String operation,
            @Bind("key") String key,
            @Bind("status") String status,
            @Bind("createdAt") Instant createdAt,
            @Bind("updatedAt") Instant updatedAt
    );

    @SqlQuery(
            "SELECT id, user_id, operation, idempotency_key, status, resource_type, resource_id, " +
                    "created_at, updated_at "
                    + "FROM idempotency_keys "
                    +
                    "WHERE user_id = :userId AND operation = :operation AND idempotency_key = :key")
    Optional<IdempotencyRecord> find(
            @Bind("userId") UUID userId,
            @Bind("operation") String operation,
            @Bind("key") String key
    );

    @SqlUpdate("UPDATE idempotency_keys "
            +
            "SET status = 'COMPLETED', resource_type = :resourceType, resource_id = :resourceId, " +
            "updated_at = :updatedAt "
            + "WHERE user_id = :userId AND operation = :operation AND idempotency_key = :key")
    int markCompleted(
            @Bind("userId") UUID userId,
            @Bind("operation") String operation,
            @Bind("key") String key,
            @Bind("resourceType") String resourceType,
            @Bind("resourceId") UUID resourceId,
            @Bind("updatedAt") Instant updatedAt
    );

    @SqlUpdate("DELETE FROM idempotency_keys "
            +
            "WHERE user_id = :userId AND operation = :operation AND idempotency_key = :key AND " +
            "status = 'IN_PROGRESS'")
    int abandonInProgress(
            @Bind("userId") UUID userId,
            @Bind("operation") String operation,
            @Bind("key") String key
    );
}
