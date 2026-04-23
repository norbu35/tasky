package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.task.dto.TaskSelectResult;
import org.springframework.stereotype.Component;

@Component
public class TaskApplicationAcceptanceService {
    private final MarketplaceCommandPort marketplaceCommandPort;
    private final IdempotencyService idempotencyService;

    public TaskApplicationAcceptanceService(
            MarketplaceCommandPort marketplaceCommandPort, IdempotencyService idempotencyService) {
        this.marketplaceCommandPort = marketplaceCommandPort;
        this.idempotencyService = idempotencyService;
    }

    public TaskApplicationAcceptanceOutcome acceptApplication(
            String customerId,
            String taskId,
            String applicationId,
            boolean liabilityDisclaimerAccepted,
            String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return TaskApplicationAcceptanceOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return TaskApplicationAcceptanceOutcome.replayMissing();
            }
            Map<String, Object> body =
                    Map.of("application_id", claim.record().resourceId().toString(), "status", "SELECTED");
            return TaskApplicationAcceptanceOutcome.success(body);
        }
        try {
            if (!liabilityDisclaimerAccepted) {
                idempotencyService.abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
                return TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        "Liability disclaimer must be accepted.");
            }
            TaskSelectResult result = marketplaceCommandPort.selectApplication(customerId, taskId, applicationId);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        customerId,
                        IdempotencyOperations.ACCEPT_APPLICATION,
                        idempotencyKey,
                        "TASK_APPLICATION",
                        result.application().id());
                Map<String, Object> body = Map.of(
                        "application_id",
                        result.application().id(),
                        "status",
                        result.application().status(),
                        "respond_by_at",
                        result.application().respondByAt() != null
                                ? result.application().respondByAt().toString()
                                : null);
                return TaskApplicationAcceptanceOutcome.success(body);
            }
            idempotencyService.abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
            return switch (result.errorCode()) {
                case TaskSelectResult.NOT_FOUND -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.NOT_FOUND,
                        "NOT_FOUND",
                        "Task or application not found.");
                case TaskSelectResult.FORBIDDEN -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only the task owner can select applicants.");
                case TaskSelectResult.TASK_NOT_OPEN -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.TASK_NOT_OPEN,
                        "TASK_NOT_OPEN",
                        "Task is no longer open.");
                case TaskSelectResult.CONFLICT -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.CONFLICT,
                        "CONFLICT",
                        "Application already processed or task assigned.");
                default -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.INTERNAL_ERROR, null, null);
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
            throw exception;
        }
    }
}
