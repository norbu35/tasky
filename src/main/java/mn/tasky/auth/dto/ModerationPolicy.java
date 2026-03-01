package mn.tasky.auth.dto;

import java.time.Instant;

public record ModerationPolicy(
    int strikeWindowDays,
    int strikeThreshold,
    int firstSuspensionDays,
    int repeatSuspensionDays,
    int repeatOffenseWindowDays,
    boolean autoUnsuspendEnabled,
    Instant updatedAt) {
}
