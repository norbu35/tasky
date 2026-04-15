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

    public static final ModerationPolicy DEFAULT = new ModerationPolicy(30, 3, 7, 14, 180, true, Instant.EPOCH);
}
