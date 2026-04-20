package mn.tasky.task.application;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;

/**
 * Manages task status transitions: assigned, reopened, completed, cancelled,
 * and no-show. Each transition finds the task, updates its status, and returns
 * the updated state with populated photo keys.
 */
@Service
public class TaskLifecycleService {

    private final TaskDao taskDao;
    private final TaskPhotoKeyHelper taskPhotoKeyHelper;

    public TaskLifecycleService(TaskDao taskDao, TaskPhotoKeyHelper taskPhotoKeyHelper) {
        this.taskDao = taskDao;
        this.taskPhotoKeyHelper = taskPhotoKeyHelper;
    }

    /**
     * Sets task status to {@code ASSIGNED} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToAssigned(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId, "ASSIGNED", Instant.now());
        return taskDao.findById(taskId).map(taskPhotoKeyHelper::populatePhotoKeys);
    }

    /**
     * Sets task status back to {@code OPEN} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> reopenTask(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId, "OPEN", Instant.now());
        return taskDao.findById(taskId).map(taskPhotoKeyHelper::populatePhotoKeys);
    }

    /**
     * Sets task status to {@code COMPLETED} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToCompleted(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId, "COMPLETED", Instant.now());
        return taskDao.findById(taskId).map(taskPhotoKeyHelper::populatePhotoKeys);
    }

    /**
     * Sets task status to {@code CANCELLED} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToCancelled(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId, "CANCELLED", Instant.now());
        return taskDao.findById(taskId).map(taskPhotoKeyHelper::populatePhotoKeys);
    }

    /**
     * Sets task status to {@code NO_SHOW} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToNoShow(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId, "NO_SHOW", Instant.now());
        return taskDao.findById(taskId).map(taskPhotoKeyHelper::populatePhotoKeys);
    }

    /**
     * Directly update task status (used by admin concierge assignment through
     * MarketplaceCommandPort).
     */
    public void updateTaskStatus(String taskId, String status) {
        taskDao.updateStatus(taskId, status, Instant.now());
    }
}
