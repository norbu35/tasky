package mn.tasky.task.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.UUID;

public interface TaskPhotoDao {

    default void insert(String id,
                        String taskId,
                        String storageKey,
                        int sortOrder) {
        insert(required(id,
                        "id"),
               required(taskId,
                        "taskId"),
               storageKey,
               sortOrder);
    }

    @SqlUpdate("INSERT INTO task_photos (id, task_id, storage_key, sort_order) "
            + "VALUES (:id, :taskId, :storageKey, :sortOrder)")
    void insert(@Bind("id") UUID id,
                @Bind("taskId") UUID taskId,
                @Bind("storageKey") String storageKey,
                @Bind("sortOrder") int sortOrder);

    default List<String> findKeysByTaskId(String taskId) {
        return findKeysByTaskId(required(taskId,
                                         "taskId"));
    }

    @SqlQuery("SELECT storage_key FROM task_photos WHERE task_id = :taskId ORDER BY sort_order")
    List<String> findKeysByTaskId(@Bind("taskId") UUID taskId);

    default void deleteByTaskId(String taskId) {
        deleteByTaskId(required(taskId,
                                "taskId"));
    }

    @SqlUpdate("DELETE FROM task_photos WHERE task_id = :taskId")
    void deleteByTaskId(@Bind("taskId") UUID taskId);
}
