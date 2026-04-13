package mn.tasky.projection.admin;

import static mn.tasky.common.persistence.UuidHelper.optional;

import java.util.List;
import java.util.UUID;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

@RegisterConstructorMapper(AdminVerificationQueueRow.class)
public interface AdminVerificationQueueProjectionDao {

    default List<AdminVerificationQueueRow> findPending(String cursor, int limit) {
        return findPending(optional(cursor), limit);
    }

    default List<AdminVerificationQueueRow> findPending(UUID cursor, int limit) {
        if (cursor == null) {
            return findPendingFirstPage(limit);
        }
        return findPendingAfterCursor(cursor, limit);
    }

    @SqlQuery("SELECT id, user_id, encrypted_user_phone, user_name, id_card_front_key, id_card_back_key, status, "
            + "admin_notes, submitted_at, reviewed_at "
            + "FROM admin_verification_queue_projection ORDER BY id LIMIT :limit")
    List<AdminVerificationQueueRow> findPendingFirstPage(@Bind("limit") int limit);

    @SqlQuery("SELECT id, user_id, encrypted_user_phone, user_name, id_card_front_key, id_card_back_key, status, "
            + "admin_notes, submitted_at, reviewed_at "
            + "FROM admin_verification_queue_projection WHERE id > :cursor ORDER BY id LIMIT :limit")
    List<AdminVerificationQueueRow> findPendingAfterCursor(@Bind("cursor") UUID cursor, @Bind("limit") int limit);
}
