package mn.tasky.marketplace.publicapi;

import java.util.Optional;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;

public interface MarketplaceCommandPort {
    TaskCreateResult createTask(String customerId, CreateTask command);

    TaskUpdateResult updateTask(String customerId, String taskId, UpdateTask command);

    TaskCancelResult cancelTask(String customerId, String taskId);

    TaskApplyResult applyToTask(String taskerId, String taskerRole, String taskId, String message, Integer quotePrice);

    TaskAcceptResult acceptApplication(
            String customerId, String taskId, String applicationId, boolean liabilityDisclaimerAccepted);

    Optional<PresignedUpload> createPhotoUploadUrl(String userId, String contentType);

    /**
     * Update task status directly (used by admin concierge assignment).
     */
    void updateTaskStatus(String taskId, String status);

    TaskDraft createDraft(String customerId, String categoryId);

    TaskDraft updateDraft(
            String draftId,
            String userId,
            String intakeAnswersJson,
            String summaryDraft,
            Double locationLat,
            Double locationLng,
            String locationText);
}
