package mn.tasky.auth.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record TaskerBadge(
        String taskerId,
        String badgeType,
        Instant assignedAt,
        @Nullable Instant revokedAt) {}
