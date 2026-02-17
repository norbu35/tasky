package mn.tasky.task.dao;

import mn.tasky.task.dto.TaskApplicationState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(TaskApplicationState.class)
public interface TaskApplicationDao {

    @SqlUpdate("INSERT INTO task_applications (id, task_id, tasker_id, message, status, created_at) "
             + "VALUES (:id, :taskId, :taskerId, :message, :status, :createdAt)")
    void insert(@Bind("id") String id,
                @Bind("taskId") String taskId,
                @Bind("taskerId") String taskerId,
                @Bind("message") String message,
                @Bind("status") String status,
                @Bind("createdAt") Instant createdAt);

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
            + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
            + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
            + "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS tasker_is_pro, "
            + "ta.message, ta.status, ta.created_at "
            + "FROM task_applications ta "
            + "LEFT JOIN profiles p ON p.user_id = CAST(ta.tasker_id AS UUID) "
            + "WHERE ta.id = :id")
    Optional<TaskApplicationState> findById(@Bind("id") String id);

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
            + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
            + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
            + "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS tasker_is_pro, "
            + "ta.message, ta.status, ta.created_at "
            + "FROM task_applications ta "
            + "LEFT JOIN profiles p ON p.user_id = CAST(ta.tasker_id AS UUID) "
            + "WHERE ta.task_id = :taskId ORDER BY ta.created_at")
    List<TaskApplicationState> findByTaskId(@Bind("taskId") String taskId);

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_applications WHERE task_id = :taskId AND tasker_id = :taskerId)")
    boolean existsByTaskIdAndTaskerId(@Bind("taskId") String taskId, @Bind("taskerId") String taskerId);

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_applications WHERE task_id = :taskId AND status = 'ACCEPTED')")
    boolean hasAccepted(@Bind("taskId") String taskId);

    @SqlUpdate("UPDATE task_applications SET status = :status WHERE id = :id")
    void updateStatus(@Bind("id") String id, @Bind("status") String status);

    @SqlUpdate("UPDATE task_applications SET status = 'REJECTED' "
             + "WHERE task_id = :taskId AND status = 'PENDING' AND id != :excludeId")
    void rejectOthers(@Bind("taskId") String taskId, @Bind("excludeId") String excludeId);
}
