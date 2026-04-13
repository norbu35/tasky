package mn.tasky.marketplace.application.command;

import java.util.Optional;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceCommandHandler implements MarketplaceCommandPort {
    private final TaskService taskService;

    public MarketplaceCommandHandler(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    public TaskCreateResult createTask(String customerId, CreateTask command) {
        return taskService.createTask(customerId, command);
    }

    @Override
    public TaskUpdateResult updateTask(String customerId, String taskId, UpdateTask command) {
        return taskService.updateTask(customerId, taskId, command);
    }

    @Override
    public TaskCancelResult cancelTask(String customerId, String taskId) {
        return taskService.cancelTask(customerId, taskId);
    }

    @Override
    public TaskApplyResult applyToTask(String taskerId, String taskerRole, String taskId, String message) {
        return taskService.applyToTask(taskerId, taskerRole, taskId, message);
    }

    @Override
    public TaskAcceptResult acceptApplication(
            String customerId, String taskId, String applicationId, boolean liabilityDisclaimerAccepted) {
        return taskService.acceptApplication(customerId, taskId, applicationId, liabilityDisclaimerAccepted);
    }

    @Override
    public Optional<PresignedUpload> createPhotoUploadUrl(String userId, String contentType) {
        return taskService.createPhotoUploadUrl(userId, contentType);
    }
}
