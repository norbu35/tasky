package mn.tasky.booking.application.command;

import mn.tasky.booking.application.BookingIntentService;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
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
}
