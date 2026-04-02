package mn.tasky.review.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record ReviewEnforcementCase(
        String id,
        String bookingId,
        String userId,
        String reasonCode,
        String status,
        boolean investigationActive,
        Instant triggeredAt,
        @Nullable Instant resolvedAt) {}
