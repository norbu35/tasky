package mn.tasky.booking.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record BookingTimelineEvent(
        String id,
        String bookingId,
        String eventType,
        @Nullable String actorUserId,
        @Nullable String metadataJson,
        Instant createdAt) {}
