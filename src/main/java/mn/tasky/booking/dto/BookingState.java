package mn.tasky.booking.dto;

import org.springframework.lang.Nullable;

import java.time.Instant;

public record BookingState(
    String id,
    String taskId,
    String taskerId,
    String customerId,
    int price,
    String status,
    Integer cancellationFee,
    boolean liabilityDisclaimerAccepted,
    @Nullable Instant confirmedScheduledAt,
    String settlementMode,
    boolean lateCancelIncident,
    @Nullable Instant liabilityDisclaimerAcceptedAt,
    Instant createdAt,
    Instant updatedAt) {
}
