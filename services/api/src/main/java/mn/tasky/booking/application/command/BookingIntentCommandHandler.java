package mn.tasky.booking.application.command;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import org.springframework.stereotype.Service;

@Service
public class BookingIntentCommandHandler implements BookingIntentCommandPort {

    private final BookingIntentService bookingIntentService;

    public BookingIntentCommandHandler(BookingIntentService bookingIntentService) {
        this.bookingIntentService = bookingIntentService;
    }

    @Override
    public BookingIntentConfirmResult confirmIntent(
            String customerId, String intentId, boolean liabilityDisclaimerAccepted) {
        return bookingIntentService.confirmIntent(customerId, intentId, liabilityDisclaimerAccepted);
    }

    @Override
    public BookingIntentCreateResult createIntent(
            String customerId,
            String taskId,
            String source,
            String taskerId,
            String originalBookingId,
            String offerId) {
        BookingIntentService.CreateResult result =
                bookingIntentService.createIntent(customerId, taskId, source, taskerId, originalBookingId, offerId);
        if (result.isSuccess()) {
            return BookingIntentCreateResult.success(result.intent());
        }
        return BookingIntentCreateResult.error(result.errorCode(), result.errorMessage());
    }

    @Override
    public BookingIntentCreateResult createApplicationSelectionIntent(
            String customerId, String taskId, String applicationId, String taskerId, Instant expiresAt) {
        BookingIntentService.CreateResult result = bookingIntentService.createApplicationSelectionIntent(
                customerId, taskId, applicationId, taskerId, expiresAt);
        if (result.isSuccess()) {
            return BookingIntentCreateResult.success(result.intent());
        }
        return BookingIntentCreateResult.error(result.errorCode(), result.errorMessage());
    }

    @Override
    public Optional<BookingIntentState> getIntent(String intentId) {
        return bookingIntentService.getIntent(intentId);
    }

    @Override
    public Optional<BookingIntentState> findPendingApplicationSelectionIntent(
            String taskId, String applicationId, Instant now) {
        return bookingIntentService.findPendingApplicationSelectionIntent(taskId, applicationId, now);
    }

    @Override
    public int expirePendingApplicationSelectionForTask(String taskId, Instant now) {
        return bookingIntentService.expirePendingApplicationSelectionForTask(taskId, now);
    }

    @Override
    public void markIntentConfirmed(String intentId, String bookingId, Instant confirmedAt) {
        bookingIntentService.markIntentConfirmed(intentId, bookingId, confirmedAt);
    }
}
