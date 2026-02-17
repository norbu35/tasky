package mn.tasky.auth.dao;

import mn.tasky.auth.dto.AuditLogEntry;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(AuditLogEntry.class)
public interface AuditLogDao {

    @SqlUpdate("INSERT INTO audit_log (id, admin_id, action, target_user_id, reason, created_at) "
             + "VALUES (:id, :adminId, :action, :targetUserId, :reason, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("adminId") String adminId,
                @Bind("action") String action,
                @Bind("targetUserId") String targetUserId,
                @Bind("reason") String reason,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT id, admin_id, action, target_user_id AS target_id, reason, created_at FROM audit_log ORDER BY created_at DESC")
    List<AuditLogEntry> findAll();
}
