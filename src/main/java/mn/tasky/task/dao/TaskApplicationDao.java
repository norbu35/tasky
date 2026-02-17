package mn.tasky.task.dao;

import mn.tasky.task.dto.TaskApplicationState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(TaskApplicationState.class)
public interface TaskApplicationDao {

    @SqlUpdate("INSERT INTO task_applications (id, task_id, tasker_id, message, status, created_at) "
             + "VALUES (:id, :taskId, :taskerId, :message, :status, :createdAt)")
    void insert(@Bind("id") UUID id,
                @Bind("taskId") UUID taskId,
                @Bind("taskerId") UUID taskerId,
                @Bind("message") String message,
                @Bind("status") String status,
                @Bind("createdAt") Instant createdAt);

    default void insert(String id,
                        String taskId,
                        String taskerId,
                        String message,
                        String status,
                        Instant createdAt) {
        insert(
            required(id, "id"),
            required(taskId, "taskId"),
            required(taskerId, "taskerId"),
            message,
            status,
            createdAt
        );
    }

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
            + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
            + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
            + "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS tasker_is_pro, "
            + "ta.message, ta.status, ta.created_at "
            + "FROM task_applications ta "
            + "LEFT JOIN profiles p ON p.user_id = ta.tasker_id "
            + "WHERE ta.id = :id")
    Optional<TaskApplicationState> findById(@Bind("id") UUID id);

    default Optional<TaskApplicationState> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
            + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
            + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
            + "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS tasker_is_pro, "
            + "ta.message, ta.status, ta.created_at "
            + "FROM task_applications ta "
            + "LEFT JOIN profiles p ON p.user_id = ta.tasker_id "
            + "WHERE ta.task_id = :taskId ORDER BY ta.created_at")
    List<TaskApplicationState> findByTaskId(@Bind("taskId") UUID taskId);

    default List<TaskApplicationState> findByTaskId(String taskId) {
        return findByTaskId(required(taskId, "taskId"));
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_applications WHERE task_id = :taskId AND tasker_id = :taskerId)")
    boolean existsByTaskIdAndTaskerId(@Bind("taskId") UUID taskId, @Bind("taskerId") UUID taskerId);

    default boolean existsByTaskIdAndTaskerId(String taskId, String taskerId) {
        UUID taskUuid = required(taskId, "taskId");
        UUID taskerUuid = required(taskerId, "taskerId");
        return existsByTaskIdAndTaskerId(taskUuid, taskerUuid);
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_applications WHERE task_id = :taskId AND status = 'ACCEPTED')")
    boolean hasAccepted(@Bind("taskId") UUID taskId);

    default boolean hasAccepted(String taskId) {
        return hasAccepted(required(taskId, "taskId"));
    }

    @SqlUpdate("UPDATE task_applications SET status = :status WHERE id = :id")
    void updateStatus(@Bind("id") UUID id, @Bind("status") String status);

    default void updateStatus(String id, String status) {
        updateStatus(required(id, "id"), status);
    }

    @SqlUpdate("UPDATE task_applications SET status = 'REJECTED' "
             + "WHERE task_id = :taskId AND status = 'PENDING' AND id != :excludeId")
    void rejectOthers(@Bind("taskId") UUID taskId, @Bind("excludeId") UUID excludeId);

    default void rejectOthers(String taskId, String excludeId) {
        UUID taskUuid = required(taskId, "taskId");
        UUID excludeUuid = required(excludeId, "excludeId");
        rejectOthers(taskUuid, excludeUuid);
    }
}
