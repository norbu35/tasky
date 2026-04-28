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
        insert(id, taskId, triggeredAt, triggerWindow, actionsJson, interventionType, null);
    }

    default void insert(
            String id,
            String taskId,
            Instant triggeredAt,
            String triggerWindow,
            String actionsJson,
            String interventionType,
            String interventionStage) {
        insert(
                required(id, "id"),
                required(taskId, "taskId"),
                triggeredAt,
                triggerWindow,
                actionsJson,
                interventionType,
                interventionStage);
    }

    @SqlUpdate("INSERT INTO task_rescue_events "
            + "(id, task_id, triggered_at, trigger_window, actions_json, intervention_type, intervention_stage) "
            + "VALUES (:id, :taskId, :triggeredAt, :triggerWindow, "
            + "CAST(:actionsJson AS jsonb), :interventionType, :interventionStage)")
    void insert(
            @Bind("id") UUID id,
            @Bind("taskId") UUID taskId,
            @Bind("triggeredAt") Instant triggeredAt,
            @Bind("triggerWindow") String triggerWindow,
            @Bind("actionsJson") String actionsJson,
            @Bind("interventionType") String interventionType,
            @Bind("interventionStage") String interventionStage);

    default boolean existsByTaskId(String taskId) {
        return existsByTaskId(required(taskId, "taskId"));
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_rescue_events WHERE task_id = :taskId)")
    boolean existsByTaskId(@Bind("taskId") UUID taskId);

    default java.util.Optional<TaskRescueEvent> findLatestByTaskId(String taskId) {
        return findLatestByTaskId(required(taskId, "taskId"));
    }

    @SqlQuery("SELECT id, task_id, triggered_at, trigger_window, actions_json, intervention_type, "
            + "intervention_stage, created_at "
            + "FROM task_rescue_events WHERE task_id = :taskId "
            + "ORDER BY triggered_at DESC, created_at DESC LIMIT 1")
    java.util.Optional<TaskRescueEvent> findLatestByTaskId(@Bind("taskId") UUID taskId);
}
