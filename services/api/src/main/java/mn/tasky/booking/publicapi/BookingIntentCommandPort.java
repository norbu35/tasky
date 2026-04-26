package mn.tasky.booking.publicapi;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;

public interface BookingIntentCommandPort {
    BookingIntentConfirmResult confirmIntent(String customerId, String intentId, boolean liabilityDisclaimerAccepted);

    BookingIntentCreateResult createIntent(
            String customerId, String taskId, String source, String taskerId, String originalBookingId, String offerId);

    BookingIntentCreateResult createApplicationSelectionIntent(
            String customerId, String taskId, String applicationId, String taskerId, Instant expiresAt);

    Optional<BookingIntentState> getIntent(String intentId);

    Optional<BookingIntentState> findPendingApplicationSelectionIntent(
            String taskId, String applicationId, Instant now);

    int expirePendingApplicationSelectionForTask(String taskId, Instant now);

    void markIntentConfirmed(String intentId, String bookingId, Instant confirmedAt);
}
