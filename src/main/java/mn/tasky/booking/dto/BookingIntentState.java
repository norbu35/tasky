package mn.tasky.booking.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record BookingIntentState(
        String id,
        String taskId,
        String taskerId,
        String customerId,
        String source,
        String status,
        @Nullable String originalBookingId,
        @Nullable String offerId,
        @Nullable Instant expiresAt,
        @Nullable String confirmedBookingId,
        @Nullable Instant confirmedAt,
        Instant createdAt,
        Instant updatedAt) {}
