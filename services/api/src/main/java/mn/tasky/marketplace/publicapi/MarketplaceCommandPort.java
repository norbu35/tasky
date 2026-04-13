package mn.tasky.marketplace.publicapi;

import java.util.Optional;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;

public interface MarketplaceCommandPort {
    TaskCreateResult createTask(String customerId, CreateTask command);

    TaskUpdateResult updateTask(String customerId, String taskId, UpdateTask command);

    TaskCancelResult cancelTask(String customerId, String taskId);

    TaskApplyResult applyToTask(String taskerId, String taskerRole, String taskId, String message);

    TaskAcceptResult acceptApplication(
            String customerId, String taskId, String applicationId, boolean liabilityDisclaimerAccepted);

    Optional<PresignedUpload> createPhotoUploadUrl(String userId, String contentType);
}
