package mn.tasky.common.audit;

import static mn.tasky.common.persistence.UuidHelper.optional;

import java.util.UUID;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface AuditEventDao {

    default void insert(
            String actorUserId, String action, String resourceType, String resourceId, String metadataJson) {
        insert(optional(actorUserId), action, resourceType, optional(resourceId), metadataJson);
    }

    @SqlUpdate("INSERT INTO audit_events (actor_user_id, action, resource_type, resource_id, metadata_json) "
            + "VALUES (:actorUserId, :action, :resourceType, :resourceId, CAST(:metadataJson AS jsonb))")
    void insert(
            @Bind("actorUserId") UUID actorUserId,
            @Bind("action") String action,
            @Bind("resourceType") String resourceType,
            @Bind("resourceId") UUID resourceId,
            @Bind("metadataJson") String metadataJson);
}
