package mn.tasky.projection.admin;

import static mn.tasky.common.persistence.UuidHelper.optional;

import java.util.List;
import java.util.UUID;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

@RegisterConstructorMapper(AdminDisputeQueueRow.class)
public interface AdminDisputeQueueProjectionDao {

    default List<AdminDisputeQueueRow> findPending(String cursor, int limit) {
        return findPending(optional(cursor), limit);
    }

    default List<AdminDisputeQueueRow> findPending(UUID cursor, int limit) {
        if (cursor == null) {
            return findPendingFirstPage(limit);
        }
        return findPendingAfterCursor(cursor, limit);
    }

    @SqlQuery("SELECT id, booking_id, raised_by, reason, status, resolution_action, wrongful_party_user_id, "
            + "resolution_notes, created_at, resolved_at "
            + "FROM admin_dispute_queue_projection ORDER BY created_at ASC, id ASC LIMIT :limit")
    List<AdminDisputeQueueRow> findPendingFirstPage(@Bind("limit") int limit);

    @SqlQuery("WITH cursor_row AS (SELECT created_at, id FROM admin_dispute_queue_projection WHERE id = :cursor) "
            + "SELECT d.id, d.booking_id, d.raised_by, d.reason, d.status, d.resolution_action, "
            + "d.wrongful_party_user_id, d.resolution_notes, d.created_at, d.resolved_at "
            + "FROM admin_dispute_queue_projection d, cursor_row c "
            + "WHERE d.created_at > c.created_at OR (d.created_at = c.created_at AND d.id > c.id) "
            + "ORDER BY d.created_at ASC, d.id ASC LIMIT :limit")
    List<AdminDisputeQueueRow> findPendingAfterCursor(@Bind("cursor") UUID cursor, @Bind("limit") int limit);
}
