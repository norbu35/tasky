package mn.tasky.booking.publicapi;

import mn.tasky.booking.dto.BookingIntentConfirmResult;

public interface BookingIntentCommandPort {
    BookingIntentConfirmResult confirmIntent(String customerId, String intentId, boolean liabilityDisclaimerAccepted);
}
