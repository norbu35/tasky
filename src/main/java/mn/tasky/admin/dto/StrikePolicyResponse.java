package mn.tasky.admin.dto;

public record StrikePolicyResponse(
        int strikeWindowDays,
        int strikeThreshold,
        int firstSuspensionDays,
        int repeatSuspensionDays,
        int repeatOffenseWindowDays,
        boolean autoUnsuspendEnabled,
        String updatedAt) {}
