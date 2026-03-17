package mn.tasky.auth.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.List;
import java.util.UUID;
import mn.tasky.auth.dto.TaskerBadge;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(TaskerBadge.class)
public interface BadgeDao {

    default void assign(String taskerId, String badgeType) {
        assign(required(taskerId, "taskerId"), badgeType);
    }

    @SqlUpdate("INSERT INTO tasker_badges (tasker_id, badge_type) "
            + "VALUES (:taskerId, :badgeType) "
            + "ON CONFLICT (tasker_id, badge_type) DO UPDATE SET "
            + "revoked_at = NULL, assigned_at = now()")
    void assign(@Bind("taskerId") UUID taskerId, @Bind("badgeType") String badgeType);

    default void revoke(String taskerId, String badgeType) {
        revoke(required(taskerId, "taskerId"), badgeType);
    }

    @SqlUpdate("UPDATE tasker_badges SET revoked_at = now() "
            + "WHERE tasker_id = :taskerId AND badge_type = :badgeType")
    void revoke(@Bind("taskerId") UUID taskerId, @Bind("badgeType") String badgeType);

    default List<TaskerBadge> findActiveByTaskerId(String taskerId) {
        return findActiveByTaskerId(required(taskerId, "taskerId"));
    }

    @SqlQuery("SELECT * FROM tasker_badges WHERE tasker_id = :taskerId AND revoked_at IS NULL")
    List<TaskerBadge> findActiveByTaskerId(@Bind("taskerId") UUID taskerId);

    @SqlQuery("SELECT * FROM tasker_badges WHERE revoked_at IS NULL")
    List<TaskerBadge> findAllActive();
}
