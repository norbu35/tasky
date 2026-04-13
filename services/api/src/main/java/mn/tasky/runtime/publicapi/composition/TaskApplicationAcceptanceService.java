package mn.tasky.runtime.publicapi.composition;

import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import mn.tasky.task.dto.TaskAcceptResult;
import org.springframework.stereotype.Component;

@Component
public class TaskApplicationAcceptanceService {

    private final MarketplaceCommandPort marketplaceCommandPort;
    private final BookingQueryPort bookingQueryPort;
    private final BookingResponseCompositionService bookingResponseCompositionService;
    private final IdempotencyService idempotencyService;

    public TaskApplicationAcceptanceService(
            MarketplaceCommandPort marketplaceCommandPort,
            BookingQueryPort bookingQueryPort,
            BookingResponseCompositionService bookingResponseCompositionService,
            IdempotencyService idempotencyService) {
        this.marketplaceCommandPort = marketplaceCommandPort;
        this.bookingQueryPort = bookingQueryPort;
        this.bookingResponseCompositionService = bookingResponseCompositionService;
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
            String bookingId = claim.record().resourceId().toString();
            return bookingQueryPort
                    .getBooking(bookingId)
                    .map(booking -> TaskApplicationAcceptanceOutcome.success(
                            bookingResponseCompositionService.basicBookingResponse(booking)))
                    .orElseGet(TaskApplicationAcceptanceOutcome::replayMissing);
        }

        try {
            TaskAcceptResult result = marketplaceCommandPort.acceptApplication(
                    customerId, taskId, applicationId, liabilityDisclaimerAccepted);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        customerId,
                        IdempotencyOperations.ACCEPT_APPLICATION,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return TaskApplicationAcceptanceOutcome.success(
                        bookingResponseCompositionService.basicBookingResponse(result.booking()));
            }

            idempotencyService.abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
            return switch (result.errorCode()) {
                case TaskAcceptResult.NOT_FOUND -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.NOT_FOUND,
                        "NOT_FOUND",
                        "Task or application not found.");
                case TaskAcceptResult.FORBIDDEN -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only the task owner can accept applications.");
                case TaskAcceptResult.TASK_NOT_OPEN -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.TASK_NOT_OPEN,
                        "TASK_NOT_OPEN",
                        "Task is no longer open.");
                case TaskAcceptResult.DISCLAIMER_REQUIRED -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        "Liability disclaimer must be accepted to confirm booking.");
                case TaskAcceptResult.CONFLICT -> TaskApplicationAcceptanceOutcome.failure(
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
