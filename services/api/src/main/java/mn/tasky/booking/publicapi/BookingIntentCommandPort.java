package mn.tasky.booking.publicapi;

import java.util.Optional;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;

public interface BookingIntentCommandPort {
    BookingIntentConfirmResult confirmIntent(String customerId, String intentId, boolean liabilityDisclaimerAccepted);

    BookingIntentCreateResult createIntent(
            String customerId, String taskId, String source, String taskerId, String originalBookingId, String offerId);

    Optional<BookingIntentState> getIntent(String intentId);
}
