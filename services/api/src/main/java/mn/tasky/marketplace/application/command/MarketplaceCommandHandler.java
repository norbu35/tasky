package mn.tasky.marketplace.application.command;

import java.util.Optional;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.task.application.TaskApplicationService;
import mn.tasky.task.application.TaskCreationService;
import mn.tasky.task.application.TaskDraftService;
import mn.tasky.task.application.TaskLifecycleService;
import mn.tasky.task.application.TaskMutationService;
import mn.tasky.task.application.TaskPhotoService;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskDraft;
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceCommandHandler implements MarketplaceCommandPort {
    private final TaskCreationService taskCreationService;
    private final TaskMutationService taskMutationService;
    private final TaskLifecycleService taskLifecycleService;
    private final TaskApplicationService taskApplicationService;
    private final TaskPhotoService taskPhotoService;
    private final TaskDraftService taskDraftService;

    public MarketplaceCommandHandler(
            TaskCreationService taskCreationService,
            TaskMutationService taskMutationService,
            TaskLifecycleService taskLifecycleService,
            TaskApplicationService taskApplicationService,
            TaskPhotoService taskPhotoService,
            TaskDraftService taskDraftService) {
        this.taskCreationService = taskCreationService;
        this.taskMutationService = taskMutationService;
        this.taskLifecycleService = taskLifecycleService;
        this.taskApplicationService = taskApplicationService;
        this.taskPhotoService = taskPhotoService;
        this.taskDraftService = taskDraftService;
    }

    @Override
    public TaskCreateResult createTask(String customerId, CreateTask command) {
        return taskCreationService.createTask(customerId, command);
    }

    @Override
    public TaskUpdateResult updateTask(String customerId, String taskId, UpdateTask command) {
        return taskMutationService.updateTask(customerId, taskId, command);
    }

    @Override
    public TaskCancelResult cancelTask(String customerId, String taskId) {
        return taskMutationService.cancelTask(customerId, taskId);
    }

    @Override
    public TaskApplyResult applyToTask(
            String taskerId, String taskerRole, String taskId, String message, Integer quotePrice) {
        return taskApplicationService.applyToTask(taskerId, taskerRole, taskId, message, quotePrice);
    }

    @Override
    public TaskAcceptResult acceptApplication(
            String customerId, String taskId, String applicationId, boolean liabilityDisclaimerAccepted) {
        return taskApplicationService.acceptApplication(customerId, taskId, applicationId, liabilityDisclaimerAccepted);
    }

    @Override
    public Optional<PresignedUpload> createPhotoUploadUrl(String userId, String contentType) {
        return taskPhotoService.createPhotoUploadUrl(userId, contentType);
    }

    @Override
    public void updateTaskStatus(String taskId, String status) {
        taskLifecycleService.updateTaskStatus(taskId, status);
    }

    @Override
    public TaskDraft createDraft(String customerId, String categoryId) {
        return taskDraftService.createDraft(customerId, categoryId);
    }

    @Override
    public TaskDraft updateDraft(
            String draftId,
            String userId,
            String intakeAnswersJson,
            String summaryDraft,
            Double locationLat,
            Double locationLng,
            String locationText) {
        return taskDraftService.updateDraft(
                draftId, userId, intakeAnswersJson, summaryDraft, locationLat, locationLng, locationText);
    }
}
