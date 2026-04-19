package mn.tasky.auth.dto;

import java.time.Instant;

public record UserProfileState(
        String fullName,
        String avatarUrl,
        String bio,
        double ratingAvg,
        int completedTasks,
        Instant instantMatchRevokedUntil) {

    private static final String DEFAULT_PROFILE_NAME = "Tasky User";

    public static UserProfileState defaultState() {
        return new UserProfileState(DEFAULT_PROFILE_NAME, null, null, 0.0d, 0, null);
    }
}
