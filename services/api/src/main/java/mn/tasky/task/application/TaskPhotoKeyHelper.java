package mn.tasky.task.application;

import java.util.List;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Component;

/**
 * Shared helper for task photo key operations: populating photo keys on a
 * {@link TaskState} and validating that photo keys belong to a given user's
 * task-photo namespace.
 */
@Component
public class TaskPhotoKeyHelper {

    private final TaskPhotoDao taskPhotoDao;
    private final StorageKeyPolicy storageKeyPolicy;

    public TaskPhotoKeyHelper(TaskPhotoDao taskPhotoDao, StorageKeyPolicy storageKeyPolicy) {
        this.taskPhotoDao = taskPhotoDao;
        this.storageKeyPolicy = storageKeyPolicy;
    }

    /**
     * Populates photo keys on the task from the database when the task record
     * does not already carry them.
     *
     * @param task Task state (may have empty or null photo keys).
     * @return Task state with populated photo keys, or the same instance when
     *         photo keys are already present.
     */
    public TaskState populatePhotoKeys(TaskState task) {
        if (task.photoKeys() != null && !task.photoKeys().isEmpty()) {
            return task;
        }
        List<String> keys = taskPhotoDao.findKeysByTaskId(task.id());
        return new TaskState(
                task.id(),
                task.customerId(),
                task.categoryId(),
                task.description(),
                task.budget(),
                task.locationLat(),
                task.locationLng(),
                task.locationText(),
                task.status(),
                task.scheduledAt(),
                task.pricingMode(),
                keys,
                task.intakeAnswersJson(),
                task.intakeSchemaVersion(),
                task.scopeSummarySource(),
                task.createdAt(),
                task.updatedAt());
    }

    /**
     * Validates that every photo key belongs to the caller's task-photo namespace.
     *
     * @param photoKeys  Photo storage keys to validate.
     * @param customerId Owner identifier.
     * @return {@code true} when all keys are owned by the customer.
     */
    public boolean areOwnedTaskPhotoKeys(List<String> photoKeys, String customerId) {
        for (String photoKey : photoKeys) {
            try {
                storageKeyPolicy.validateOwnedKey(photoKey, StorageKeyPolicy.Namespace.TASK_PHOTO, customerId);
            } catch (IllegalArgumentException exception) {
                return false;
            }
        }
        return true;
    }
}
