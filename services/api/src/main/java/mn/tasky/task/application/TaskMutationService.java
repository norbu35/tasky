package mn.tasky.task.application;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Handles task mutations: cancellation and partial updates for open tasks owned
 * by the requesting customer.
 */
@Service
public class TaskMutationService {

    private final TaskDao taskDao;
    private final TaskPhotoDao taskPhotoDao;
    private final TaskPhotoKeyHelper taskPhotoKeyHelper;

    public TaskMutationService(TaskDao taskDao, TaskPhotoDao taskPhotoDao, TaskPhotoKeyHelper taskPhotoKeyHelper) {
        this.taskDao = taskDao;
        this.taskPhotoDao = taskPhotoDao;
        this.taskPhotoKeyHelper = taskPhotoKeyHelper;
    }

    /**
     * Cancels an open task when requested by its owning customer.
     *
     * @param customerId Customer identifier.
     * @param taskId     Task identifier.
     * @return Result with success or reason for rejection.
     */
    public TaskCancelResult cancelTask(String customerId, String taskId) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskCancelResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId().equals(customerId)) {
            return TaskCancelResult.FORBIDDEN_RESULT;
        }

        if (!"OPEN".equals(task.status())) {
            return TaskCancelResult.INVALID_STATUS_RESULT;
        }

        taskDao.updateStatus(taskId, "CANCELLED", Instant.now());
        TaskState cancelled = taskDao.findById(taskId)
                .map(taskPhotoKeyHelper::populatePhotoKeys)
                .orElse(task);
        return TaskCancelResult.success(cancelled);
    }

    /**
     * Partially updates an open task owned by the requesting customer.
     * Supports replacing photo keys when provided.
     *
     * @param customerId Task owner identifier.
     * @param taskId     Task identifier.
     * @param command    Partial update payload.
     * @return Updated task or validation/authorization failure details.
     */
    public TaskUpdateResult updateTask(String customerId, String taskId, UpdateTask command) {
        Optional<TaskState> existingOpt = taskDao.findById(taskId).map(taskPhotoKeyHelper::populatePhotoKeys);
        if (existingOpt.isEmpty()) {
            return TaskUpdateResult.NOT_FOUND_RESULT;
        }

        TaskState existing = existingOpt.get();
        if (!existing.customerId().equals(customerId)) {
            return TaskUpdateResult.FORBIDDEN_RESULT;
        }
        if (!"OPEN".equals(existing.status())) {
            return TaskUpdateResult.INVALID_STATUS_RESULT;
        }

        String description = existing.description();
        if (command.description() != null) {
            description = TextSanitizer.plainText(command.description());
            if (!StringUtils.hasText(description)) {
                return TaskUpdateResult.INVALID_DESCRIPTION_RESULT;
            }
        }

        String locationText = existing.locationText();
        if (command.locationText() != null) {
            locationText = TextSanitizer.plainText(command.locationText());
            if (!StringUtils.hasText(locationText)) {
                return TaskUpdateResult.INVALID_LOCATION_RESULT;
            }
        }

        int budget = command.budget() != null ? command.budget() : existing.budget();
        double locationLat = command.locationLat() != null ? command.locationLat() : existing.locationLat();
        double locationLng = command.locationLng() != null ? command.locationLng() : existing.locationLng();

        Instant scheduledAt = existing.scheduledAt();
        if (command.scheduledAt() != null) {
            try {
                scheduledAt = Instant.parse(command.scheduledAt());
            } catch (Exception exception) {
                return TaskUpdateResult.INVALID_SCHEDULE_RESULT;
            }
            if (scheduledAt.isBefore(Instant.now())) {
                return TaskUpdateResult.INVALID_SCHEDULE_RESULT;
            }
        }

        boolean replacePhotos = command.photoKeys() != null;
        List<String> photoKeys = replacePhotos
                ? List.copyOf(command.photoKeys())
                : (existing.photoKeys() == null ? List.of() : List.copyOf(existing.photoKeys()));
        if (replacePhotos) {
            if (photoKeys.size() > 3) {
                return TaskUpdateResult.TOO_MANY_PHOTOS_RESULT;
            }
            if (!taskPhotoKeyHelper.areOwnedTaskPhotoKeys(photoKeys, customerId)) {
                return TaskUpdateResult.INVALID_PHOTO_KEY_RESULT;
            }
        }

        Instant now = Instant.now();
        taskDao.updateDetails(taskId, description, budget, locationLat, locationLng, locationText, scheduledAt, now);

        if (replacePhotos) {
            taskPhotoDao.deleteByTaskId(taskId);
            for (int i = 0; i < photoKeys.size(); i++) {
                taskPhotoDao.insert(UUID.randomUUID().toString(), taskId, photoKeys.get(i), i);
            }
        }

        String finalDescription = description;
        String finalLocationText = locationText;
        Instant finalScheduledAt = scheduledAt;

        TaskState updated = taskDao.findById(taskId)
                .map(taskPhotoKeyHelper::populatePhotoKeys)
                .orElseGet(() -> new TaskState(
                        existing.id(),
                        existing.customerId(),
                        existing.categoryId(),
                        finalDescription,
                        budget,
                        locationLat,
                        locationLng,
                        finalLocationText,
                        existing.status(),
                        finalScheduledAt,
                        existing.pricingMode(),
                        photoKeys,
                        existing.intakeAnswersJson(),
                        existing.intakeSchemaVersion(),
                        existing.scopeSummarySource(),
                        existing.createdAt(),
                        now));
        return TaskUpdateResult.success(updated);
    }
}
