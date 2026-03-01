package mn.tasky.auth.dao;

import mn.tasky.auth.dto.AuditLogEntry;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(AuditLogEntry.class)
public interface AuditLogDao {

    default void insert(
        String id, String adminId, String action, String targetUserId, String reason, Instant createdAt) {
        insert(required(id, "id"), required(adminId, "adminId"), action, optional(targetUserId), reason, createdAt);
    }

    @SqlUpdate("INSERT INTO audit_log (id, admin_id, action, target_user_id, reason, created_at) "
        + "VALUES (:id, :adminId, :action, :targetUserId, :reason, :createdAt)")
    void insert(
        @Bind("id") UUID id,
        @Bind("adminId") UUID adminId,
        @Bind("action") String action,
        @Bind("targetUserId") UUID targetUserId,
        @Bind("reason") String reason,
        @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT id, admin_id, action, target_user_id AS target_id, reason, created_at FROM "
        + "audit_log ORDER BY created_at DESC")
    List<AuditLogEntry> findAll();
}
