package mn.tasky.booking.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record BookingScheduleEvent(
        String id,
        String bookingId,
        String actorUserId,
        String eventType,
        @Nullable Instant proposedScheduledAt,
        @Nullable String reason,
        Instant createdAt) {}
