package mn.tasky.booking.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

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
        Instant updatedAt) {}
