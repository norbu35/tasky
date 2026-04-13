package mn.tasky.runtime.publicapi.composition;

import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import org.springframework.stereotype.Component;

@Component
public class BookingIntentConfirmationService {

    private final BookingIntentService bookingIntentService;
    private final BookingQueryPort bookingQueryPort;
    private final BookingResponseCompositionService bookingResponseCompositionService;
    private final IdempotencyService idempotencyService;

    public BookingIntentConfirmationService(
            BookingIntentService bookingIntentService,
            BookingQueryPort bookingQueryPort,
            BookingResponseCompositionService bookingResponseCompositionService,
            IdempotencyService idempotencyService) {
        this.bookingIntentService = bookingIntentService;
        this.bookingQueryPort = bookingQueryPort;
        this.bookingResponseCompositionService = bookingResponseCompositionService;
        this.idempotencyService = idempotencyService;
    }

    public BookingIntentConfirmationOutcome confirmIntent(
            String customerId, String intentId, boolean liabilityDisclaimerAccepted, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
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
            BookingIntentService.ConfirmResult result =
                    bookingIntentService.confirmIntent(customerId, intentId, liabilityDisclaimerAccepted);
            if (result.isSuccess()) {
                idempotencyService.completeWithResource(
                        customerId,
                        IdempotencyOperations.CONFIRM_BOOKING_INTENT,
                        idempotencyKey,
                        "BOOKING",
                        result.booking().id());
                return BookingIntentConfirmationOutcome.success(
                        bookingResponseCompositionService.basicBookingResponse(result.booking()));
            }

            idempotencyService.abandon(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
            return switch (result.errorCode()) {
                case BookingIntentService.ConfirmResult.NOT_FOUND -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.NOT_FOUND, "NOT_FOUND", result.errorMessage());
                case BookingIntentService.ConfirmResult.FORBIDDEN -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.FORBIDDEN, "FORBIDDEN", result.errorMessage());
                case BookingIntentService.ConfirmResult.DISCLAIMER_REQUIRED -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.DISCLAIMER_REQUIRED,
                        "DISCLAIMER_REQUIRED",
                        result.errorMessage());
                case BookingIntentService.ConfirmResult.TASK_NOT_OPEN -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.TASK_NOT_OPEN, "TASK_NOT_OPEN", result.errorMessage());
                case BookingIntentService.ConfirmResult.CONFLICT -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.CONFLICT, "CONFLICT", result.errorMessage());
                case BookingIntentService.ConfirmResult.DEFERRED -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.DEFERRED, "NOT_IMPLEMENTED", result.errorMessage());
                default -> BookingIntentConfirmationOutcome.failure(
                        BookingIntentConfirmationOutcome.Status.INTERNAL_ERROR, null, null);
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(customerId, IdempotencyOperations.CONFIRM_BOOKING_INTENT, idempotencyKey);
            throw exception;
        }
    }
}
