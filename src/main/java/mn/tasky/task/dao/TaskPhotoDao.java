package mn.tasky.task.dao;

import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

public interface TaskPhotoDao {

    @SqlUpdate("INSERT INTO task_photos (id, task_id, storage_key, sort_order) "
             + "VALUES (:id, :taskId, :storageKey, :sortOrder)")
    void insert(@Bind("id") UUID id,
                @Bind("taskId") UUID taskId,
                @Bind("storageKey") String storageKey,
                @Bind("sortOrder") int sortOrder);

    default void insert(String id, String taskId, String storageKey, int sortOrder) {
        insert(required(id, "id"), required(taskId, "taskId"), storageKey, sortOrder);
    }

    @SqlQuery("SELECT storage_key FROM task_photos WHERE task_id = :taskId ORDER BY sort_order")
    List<String> findKeysByTaskId(@Bind("taskId") UUID taskId);

    default List<String> findKeysByTaskId(String taskId) {
        return findKeysByTaskId(required(taskId, "taskId"));
    }
}
