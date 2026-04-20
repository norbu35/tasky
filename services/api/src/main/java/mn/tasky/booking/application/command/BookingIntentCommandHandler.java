package mn.tasky.booking.application.command;

import java.util.Optional;
import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
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
    public BookingIntentService.CreateResult createIntent(
            String customerId,
            String taskId,
            String source,
            String taskerId,
            String originalBookingId,
            String offerId) {
        return bookingIntentService.createIntent(customerId, taskId, source, taskerId, originalBookingId, offerId);
    }

    @Override
    public Optional<BookingIntentState> getIntent(String intentId) {
        return bookingIntentService.getIntent(intentId);
    }
}
