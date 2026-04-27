package mn.tasky.runtime.publicapi.composition;

import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentDeclineResult;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import org.springframework.stereotype.Component;

@Component
public class BookingIntentConfirmationService {

    private final BookingIntentCommandPort bookingIntentCommandPort;
    private final BookingQueryPort bookingQueryPort;
    private final BookingIntentCompositionService bookingIntentCompositionService;
    private final BookingResponseCompositionService bookingResponseCompositionService;
    private final IdempotencyService idempotencyService;

    public BookingIntentConfirmationService(
            BookingIntentCommandPort bookingIntentCommandPort,
            BookingQueryPort bookingQueryPort,
            BookingIntentCompositionService bookingIntentCompositionService,
            BookingResponseCompositionService bookingResponseCompositionService,
            IdempotencyService idempotencyService) {
        this.bookingIntentCommandPort = bookingIntentCommandPort;
        this.bookingQueryPort = bookingQueryPort;
        this.bookingIntentCompositionService = bookingIntentCompositionService;
        this.bookingResponseCompositionService = bookingResponseCompositionService;
        this.idempotencyService = idempotencyService;
    }

    public BookingIntentConfirmationOutcome confirmIntent(String taskerId, String intentId, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(taskerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingIntentConfirmationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return BookingIntentConfirmationOutcome.replayMissing();
            }
            String bookingId = claim.record().resourceId().toString();
            return bookingQueryPort
                    .getBooking(bookingId)
                    .map(booking -> BookingIntentConfirmationOutcome.success(
                            bookingResponseCompositionService.basicBookingResponse(booking)))
                    .orElseGet(BookingIntentConfirmationOutcome::replayMissing);
        }

        try {
            BookingIntentConfirmResult result = bookingIntentCommandPort.confirmIntent(taskerId, intentId);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        taskerId,
                        IdempotencyOperations.CONFIRM_BOOKING_INTENT,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return BookingIntentConfirmationOutcome.success(
                        bookingResponseCompositionService.basicBookingResponse(result.booking()));
            }

            idempotencyService.abandon(taskerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingIntentConfirmResult.NOT_FOUND -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.NOT_FOUND, "NOT_FOUND", result.errorMessage());
                case BookingIntentConfirmResult.FORBIDDEN -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.FORBIDDEN, "FORBIDDEN", result.errorMessage());
                case BookingIntentConfirmResult.TASK_NOT_OPEN -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.TASK_NOT_OPEN, "TASK_NOT_OPEN", result.errorMessage());
                case BookingIntentConfirmResult.CONFLICT -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.CONFLICT, "CONFLICT", result.errorMessage());
                case BookingIntentConfirmResult.DEFERRED -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.DEFERRED, "NOT_IMPLEMENTED", result.errorMessage());
                default -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.INTERNAL_ERROR, null, null);
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(taskerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
            throw exception;
        }
    }

    public BookingIntentConfirmationOutcome declineIntent(String taskerId, String intentId, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(taskerId, IdempotencyOperations.DECLINE_BOOKING_INTENT, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return BookingIntentConfirmationOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return BookingIntentConfirmationOutcome.replayMissing();
            }
            return bookingIntentCommandPort
                    .getIntent(claim.record().resourceId().toString())
                    .map(intent -> BookingIntentConfirmationOutcome.success(
                            bookingIntentCompositionService.bookingIntentResponse(intent)))
                    .orElseGet(BookingIntentConfirmationOutcome::replayMissing);
        }

        try {
            BookingIntentDeclineResult result = bookingIntentCommandPort.declineIntent(taskerId, intentId);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        taskerId,
                        IdempotencyOperations.DECLINE_BOOKING_INTENT,
                        idempotencyKey,
                        "BOOKING_INTENT",
                        result.intent().id());
                return BookingIntentConfirmationOutcome.success(
                        bookingIntentCompositionService.bookingIntentResponse(result.intent()));
            }

            idempotencyService.abandon(taskerId, IdempotencyOperations.DECLINE_BOOKING_INTENT, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingIntentDeclineResult.NOT_FOUND -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.NOT_FOUND, "NOT_FOUND", result.errorMessage());
                case BookingIntentDeclineResult.FORBIDDEN -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.FORBIDDEN, "FORBIDDEN", result.errorMessage());
                case BookingIntentDeclineResult.CONFLICT -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.CONFLICT, "CONFLICT", result.errorMessage());
                case BookingIntentDeclineResult.DEFERRED -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.DEFERRED, "NOT_IMPLEMENTED", result.errorMessage());
                default -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.INTERNAL_ERROR, null, null);
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(taskerId, IdempotencyOperations.DECLINE_BOOKING_INTENT, idempotencyKey);
            throw exception;
        }
    }
}
