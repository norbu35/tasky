package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.CreateBookingIntentRequest;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import org.springframework.stereotype.Component;

@Component
public class BookingIntentCreationService {

    private final BookingIntentCommandPort bookingIntentCommandPort;
    private final BookingIntentCompositionService bookingIntentCompositionService;
    private final IdempotencyService idempotencyService;

    public BookingIntentCreationService(
            BookingIntentCommandPort bookingIntentCommandPort,
            BookingIntentCompositionService bookingIntentCompositionService,
            IdempotencyService idempotencyService) {
        this.bookingIntentCommandPort = bookingIntentCommandPort;
        this.bookingIntentCompositionService = bookingIntentCompositionService;
        this.idempotencyService = idempotencyService;
    }

    public BookingIntentCreationOutcome createIntent(
            String customerId, String taskId, CreateBookingIntentRequest body, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingIntentCreationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return BookingIntentCreationOutcome.replayMissing();
            }
            return bookingIntentCommandPort
                    .getIntent(claim.record().resourceId().toString())
                    .map(bookingIntentCompositionService::bookingIntentResponse)
                    .map(BookingIntentCreationOutcome::success)
                    .orElseGet(BookingIntentCreationOutcome::replayMissing);
        }

        try {
            BookingIntentCreateResult result = bookingIntentCommandPort.createIntent(
                    customerId, taskId, body.source(), body.taskerId(), body.originalBookingId());
            if (result.isSuccess()) {
                BookingIntentState intent = result.intent().orElseThrow();
                idempotencyService.completeWithResource(
                        customerId,
                        IdempotencyOperations.CREATE_BOOKING_INTENT,
                        idempotencyKey,
                        "BOOKING_INTENT",
                        intent.id());
                Map<String, Object> response = bookingIntentCompositionService.bookingIntentResponse(intent);
                return BookingIntentCreationOutcome.success(response);
            }

            idempotencyService.abandon(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingIntentCreateResult.NOT_FOUND -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.NOT_FOUND, "NOT_FOUND", result.errorMessage());
                case BookingIntentCreateResult.FORBIDDEN -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.FORBIDDEN, "FORBIDDEN", result.errorMessage());
                case BookingIntentCreateResult.NOT_COMPLETED -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.NOT_COMPLETED, "NOT_COMPLETED", result.errorMessage());
                case BookingIntentCreateResult.TASK_NOT_OPEN -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.TASK_NOT_OPEN, "TASK_NOT_OPEN", result.errorMessage());
                case BookingIntentCreateResult.CONFLICT -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.CONFLICT, "CONFLICT", result.errorMessage());
                case BookingIntentCreateResult.INVALID_REQUEST -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.INVALID_REQUEST, "BAD_REQUEST", result.errorMessage());
                case BookingIntentCreateResult.INVALID_SOURCE -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.INVALID_SOURCE, "BAD_REQUEST", result.errorMessage());
                case BookingIntentCreateResult.DEFERRED -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.DEFERRED, "NOT_IMPLEMENTED", result.errorMessage());
                default -> BookingIntentCreationOutcome.failure(
                        BookingIntentCreationOutcome.Status.INTERNAL_ERROR, null, null);
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(customerId, IdempotencyOperations.CREATE_BOOKING_INTENT, idempotencyKey);
            throw exception;
        }
    }
}
