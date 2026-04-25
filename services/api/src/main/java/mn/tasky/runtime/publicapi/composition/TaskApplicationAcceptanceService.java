package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.marketplace.publicapi.MarketplaceCommandPort;
import org.springframework.stereotype.Component;

@Component
public class TaskApplicationAcceptanceService {
    private final MarketplaceCommandPort marketplaceCommandPort;
    private final BookingIntentCommandPort bookingIntentCommandPort;
    private final BookingIntentCompositionService bookingIntentCompositionService;
    private final IdempotencyService idempotencyService;

    public TaskApplicationAcceptanceService(
            MarketplaceCommandPort marketplaceCommandPort,
            BookingIntentCommandPort bookingIntentCommandPort,
            BookingIntentCompositionService bookingIntentCompositionService,
            IdempotencyService idempotencyService) {
        this.marketplaceCommandPort = marketplaceCommandPort;
        this.bookingIntentCommandPort = bookingIntentCommandPort;
        this.bookingIntentCompositionService = bookingIntentCompositionService;
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
            return bookingIntentCommandPort
                    .getIntent(claim.record().resourceId().toString())
                    .map(bookingIntentCompositionService::bookingIntentResponse)
                    .map(TaskApplicationAcceptanceOutcome::success)
                    .orElseGet(TaskApplicationAcceptanceOutcome::replayMissing);
        }
        try {
            if (!liabilityDisclaimerAccepted) {
                idempotencyService.abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
                return TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        "Liability disclaimer must be accepted.");
            }
            BookingIntentCreateResult result = marketplaceCommandPort.acceptApplication(
                    customerId, taskId, applicationId, liabilityDisclaimerAccepted);
            if (result.isSuccess()) {
                BookingIntentState intent = result.intent().orElseThrow();
                idempotencyService.completeWithResource(
                        customerId,
                        IdempotencyOperations.ACCEPT_APPLICATION,
                        idempotencyKey,
                        "BOOKING_INTENT",
                        intent.id());
                Map<String, Object> body = bookingIntentCompositionService.bookingIntentResponse(intent);
                return TaskApplicationAcceptanceOutcome.success(body);
            }
            idempotencyService.abandon(customerId, IdempotencyOperations.ACCEPT_APPLICATION, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingIntentCreateResult.NOT_FOUND -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.NOT_FOUND,
                        "NOT_FOUND",
                        "Task or application not found.");
                case BookingIntentCreateResult.FORBIDDEN -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only the task owner can select applicants.");
                case BookingIntentCreateResult.TASK_NOT_OPEN -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.TASK_NOT_OPEN,
                        "TASK_NOT_OPEN",
                        "Task is no longer open.");
                case BookingIntentCreateResult.DISCLAIMER_REQUIRED -> TaskApplicationAcceptanceOutcome.failure(
                        TaskApplicationAcceptanceOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        "Liability disclaimer must be accepted.");
                case BookingIntentCreateResult.CONFLICT -> TaskApplicationAcceptanceOutcome.failure(
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
