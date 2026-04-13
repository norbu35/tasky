package mn.tasky.runtime.publicapi.composition;

import mn.tasky.user.dto.ProfileResponse;

public record UserProfileUpdateOutcome(Status status, ProfileResponse profile) {

    public enum Status {
        SUCCESS,
        INVALID_AVATAR_KEY,
        USER_NOT_FOUND
    }

    public static UserProfileUpdateOutcome success(ProfileResponse profile) {
        return new UserProfileUpdateOutcome(Status.SUCCESS, profile);
    }

    public static UserProfileUpdateOutcome invalidAvatarKey() {
        return new UserProfileUpdateOutcome(Status.INVALID_AVATAR_KEY, null);
    }

    public static UserProfileUpdateOutcome userNotFound() {
        return new UserProfileUpdateOutcome(Status.USER_NOT_FOUND, null);
    }
}
