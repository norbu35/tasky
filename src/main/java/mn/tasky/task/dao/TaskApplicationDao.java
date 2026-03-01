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

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(TaskApplicationState.class)
public interface TaskApplicationDao {

    default void insert(String id,
                        String taskId,
                        String taskerId,
                        String message,
                        String status,
                        Instant createdAt) {
        insert(
            required(id,
                "id"),
            required(taskId,
                "taskId"),
            required(taskerId,
                "taskerId"),
            message,
            status,
            createdAt
        );
    }

    @SqlUpdate(
        "INSERT INTO task_applications (id, task_id, tasker_id, message, status, created_at) "
            + "VALUES (:id, :taskId, :taskerId, :message, :status, :createdAt)")
    void insert(@Bind("id") UUID id,
                @Bind("taskId") UUID taskId,
                @Bind("taskerId") UUID taskerId,
                @Bind("message") String message,
                @Bind("status") String status,
                @Bind("createdAt") Instant createdAt);

    default Optional<TaskApplicationState> findById(String id) {
        return findById(required(id,
            "id"));
    }

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
        + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
        + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
        +
        "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS" +
        " tasker_is_pro, "
        + "ta.message, ta.status, ta.created_at "
        + "FROM task_applications ta "
        + "LEFT JOIN profiles p ON p.user_id = ta.tasker_id "
        + "WHERE ta.id = :id")
    Optional<TaskApplicationState> findById(@Bind("id") UUID id);

    default List<TaskApplicationState> findByTaskId(String taskId) {
        return findByTaskId(taskId,
            null,
            100);
    }

    default List<TaskApplicationState> findByTaskId(String taskId,
                                                    String cursor,
                                                    int limit) {
        UUID taskUuid = required(taskId,
            "taskId");
        UUID cursorUuid = optional(cursor);
        if (cursorUuid == null) {
            return findByTaskIdFirstPage(taskUuid,
                limit);
        }
        return findByTaskIdAfterCursor(taskUuid,
            cursorUuid,
            limit);
    }

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
        + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
        + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
        +
        "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS" +
        " tasker_is_pro, "
        + "ta.message, ta.status, ta.created_at "
        + "FROM task_applications ta "
        + "LEFT JOIN profiles p ON p.user_id = ta.tasker_id "
        + "WHERE ta.task_id = :taskId "
        + "ORDER BY ta.id LIMIT :limit")
    List<TaskApplicationState> findByTaskIdFirstPage(@Bind("taskId") UUID taskId,
                                                     @Bind("limit") int limit);

    @SqlQuery("SELECT ta.id, ta.task_id, ta.tasker_id, "
        + "p.full_name AS tasker_full_name, p.avatar_url AS tasker_avatar_url, "
        + "p.rating_avg AS tasker_rating_avg, p.completed_tasks AS tasker_completed_tasks, "
        +
        "CASE WHEN p.completed_tasks >= 6 AND p.rating_avg >= 4.5 THEN true ELSE false END AS" +
        " tasker_is_pro, "
        + "ta.message, ta.status, ta.created_at "
        + "FROM task_applications ta "
        + "LEFT JOIN profiles p ON p.user_id = ta.tasker_id "
        + "WHERE ta.task_id = :taskId AND ta.id > :cursor "
        + "ORDER BY ta.id LIMIT :limit")
    List<TaskApplicationState> findByTaskIdAfterCursor(@Bind("taskId") UUID taskId,
                                                       @Bind("cursor") UUID cursor,
                                                       @Bind("limit") int limit);

    default boolean existsByTaskIdAndTaskerId(String taskId,
                                              String taskerId) {
        UUID taskUuid = required(taskId,
            "taskId");
        UUID taskerUuid = required(taskerId,
            "taskerId");
        return existsByTaskIdAndTaskerId(taskUuid,
            taskerUuid);
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_applications WHERE task_id = :taskId AND " +
        "tasker_id = :taskerId)")
    boolean existsByTaskIdAndTaskerId(@Bind("taskId") UUID taskId,
                                      @Bind("taskerId") UUID taskerId);

    default boolean hasAccepted(String taskId) {
        return hasAccepted(required(taskId,
            "taskId"));
    }

    @SqlQuery("SELECT EXISTS(SELECT 1 FROM task_applications WHERE task_id = :taskId AND status =" +
        " 'ACCEPTED')")
    boolean hasAccepted(@Bind("taskId") UUID taskId);

    default int countByTaskId(String taskId) {
        return countByTaskId(required(taskId,
            "taskId"));
    }

    @SqlQuery("SELECT COUNT(*) FROM task_applications WHERE task_id = :taskId")
    int countByTaskId(@Bind("taskId") UUID taskId);

    default void updateStatus(String id,
                              String status) {
        updateStatus(required(id,
                "id"),
            status);
    }

    @SqlUpdate("UPDATE task_applications SET status = :status WHERE id = :id")
    void updateStatus(@Bind("id") UUID id,
                      @Bind("status") String status);

    default void rejectOthers(String taskId,
                              String excludeId) {
        UUID taskUuid = required(taskId,
            "taskId");
        UUID excludeUuid = required(excludeId,
            "excludeId");
        rejectOthers(taskUuid,
            excludeUuid);
    }

    @SqlUpdate("UPDATE task_applications SET status = 'REJECTED' "
        + "WHERE task_id = :taskId AND status = 'PENDING' AND id != :excludeId")
    void rejectOthers(@Bind("taskId") UUID taskId,
                      @Bind("excludeId") UUID excludeId);

    default List<String> findNearbyTaskerCandidates(
        String categoryId,
        double lat,
        double lng,
        double radiusMeters,
        String customerId,
        int limit
    ) {
        return findNearbyTaskerCandidates(
            required(categoryId,
                "categoryId"),
            lat,
            lng,
            radiusMeters,
            required(customerId,
                "customerId"),
            limit
        ).stream()
            .map(UUID::toString)
            .toList();
    }

    @SqlQuery("SELECT DISTINCT ta.tasker_id "
        + "FROM task_applications ta "
        + "JOIN tasks t ON t.id = ta.task_id "
        + "JOIN users u ON u.id = ta.tasker_id "
        + "JOIN device_tokens dt ON dt.user_id = ta.tasker_id "
        + "WHERE u.role = 'TASKER' "
        + "AND u.status IN ('ACTIVE', 'VERIFIED') "
        + "AND t.category_id = :categoryId "
        +
        "AND ST_DWithin(t.location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)" +
        "::geography, :radiusMeters) "
        + "AND ta.tasker_id <> :customerId "
        + "ORDER BY ta.tasker_id "
        + "LIMIT :limit")
    List<UUID> findNearbyTaskerCandidates(
        @Bind("categoryId") UUID categoryId,
        @Bind("lat") double lat,
        @Bind("lng") double lng,
        @Bind("radiusMeters") double radiusMeters,
        @Bind("customerId") UUID customerId,
        @Bind("limit") int limit
    );
}
