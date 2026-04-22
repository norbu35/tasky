package mn.tasky.task.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.time.Instant;
import java.util.UUID;
import mn.tasky.task.dto.TaskRescueEvent;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(TaskRescueEvent.class)
public interface TaskRescueEventDao {

    default void insert(
            String id,
            String taskId,
            Instant triggeredAt,
            String triggerWindow,
            String actionsJson,
            String interventionType) {
        insert(
                required(id, "id"),
                required(taskId, "taskId"),
                triggeredAt,
                triggerWindow,
                actionsJson,
                interventionType);
    }

    @SqlUpdate(
            "INSERT INTO task_rescue_events (id, task_id, triggered_at, trigger_window, actions_json, intervention_type) "
                    + "VALUES (:id, :taskId, :triggeredAt, :triggerWindow, CAST(:actionsJson AS jsonb), :interventionType)")
    void insert(
            @Bind("id") UUID id,
            @Bind("taskId") UUID taskId,
            @Bind("triggeredAt") Instant triggeredAt,
            @Bind("triggerWindow") String triggerWindow,
            @Bind("actionsJson") String actionsJson,
            @Bind("interventionType") String interventionType);

    default boolean existsByTaskId(String taskId) {
        return existsByTaskId(required(taskId, "taskId"));
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_rescue_events WHERE task_id = :taskId)")
    boolean existsByTaskId(@Bind("taskId") UUID taskId);
}
