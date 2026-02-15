package mn.tasky.auth.dto;

public record UserProfileState(
    String fullName,
    String avatarUrl,
    double ratingAvg,
    int completedTasks
) {

    private static final String DEFAULT_PROFILE_NAME = "Tasky User";

    public static UserProfileState defaultState() {
        return new UserProfileState(DEFAULT_PROFILE_NAME, null, 0.0d, 0);
    }
}
