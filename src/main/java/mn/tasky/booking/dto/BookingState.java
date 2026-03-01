package mn.tasky.booking.dto;

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
    Instant createdAt,
    Instant updatedAt
) {

}
