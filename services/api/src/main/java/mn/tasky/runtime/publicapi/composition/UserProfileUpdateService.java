package mn.tasky.runtime.publicapi.composition;

import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.springframework.stereotype.Component;

@Component
public class UserProfileUpdateService {

    private final IdentityCommandPort identityCommandPort;
    private final StorageKeyPolicy storageKeyPolicy;
    private final UserProfileCompositionService userProfileCompositionService;

    public UserProfileUpdateService(
            IdentityCommandPort identityCommandPort,
            StorageKeyPolicy storageKeyPolicy,
            UserProfileCompositionService userProfileCompositionService) {
        this.identityCommandPort = identityCommandPort;
        this.storageKeyPolicy = storageKeyPolicy;
        this.userProfileCompositionService = userProfileCompositionService;
    }

    public UserProfileUpdateOutcome updateProfile(String userId, String fullName, String avatarUrl, String bio) {
        if (avatarUrl != null) {
            try {
                storageKeyPolicy.validateOwnedKey(
                        userProfileCompositionService.extractAvatarStorageKey(avatarUrl),
                        StorageKeyPolicy.Namespace.AVATAR,
                        userId);
            } catch (IllegalArgumentException exception) {
                return UserProfileUpdateOutcome.invalidAvatarKey();
            }
        }

        ProfileUpdate update = new ProfileUpdate(fullName, avatarUrl, bio);
        return identityCommandPort
                .updateProfile(userId, update)
                .map(profile ->
                        UserProfileUpdateOutcome.success(userProfileCompositionService.profileResponse(profile)))
                .orElseGet(UserProfileUpdateOutcome::userNotFound);
    }
}
