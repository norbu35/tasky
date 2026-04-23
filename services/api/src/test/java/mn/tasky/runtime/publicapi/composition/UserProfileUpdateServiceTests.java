package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.user.dto.ProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserProfileUpdateServiceTests {

    @Mock
    private IdentityCommandPort identityCommandPort;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    @Mock
    private UserProfileCompositionService userProfileCompositionService;

    private UserProfileUpdateService service;

    @BeforeEach
    void setUp() {
        service = new UserProfileUpdateService(identityCommandPort, storageKeyPolicy, userProfileCompositionService);
    }

    private UserProfile buildProfile() {
        return new UserProfile(
                "user-001",
                "+97699112233",
                "CUSTOMER",
                "VERIFIED",
                "Batdorj",
                "https://cdn.tasky.mn/avatars/user-001/photo.jpg",
                "Hello world",
                4.5,
                10,
                false,
                "2025-01-01T00:00:00Z");
    }

    private ProfileResponse buildProfileResponse() {
        return new ProfileResponse(
                "user-001",
                "+97699112233",
                "CUSTOMER",
                "VERIFIED",
                "Batdorj",
                "https://cdn.tasky.mn/avatars/user-001/photo.jpg",
                "Hello world",
                4.5,
                10,
                false,
                "2025-01-01T00:00:00Z");
    }

    @Nested
    @DisplayName("updateProfile happy path")
    class HappyPath {

        @Test
        @DisplayName("updates profile and returns success outcome with profile response")
        void updatesProfileSuccessfully() {
            UserProfile profile = buildProfile();
            ProfileResponse profileResponse = buildProfileResponse();

            when(userProfileCompositionService.extractAvatarStorageKey(
                            "https://cdn.tasky.mn/avatars/user-001/photo.jpg"))
                    .thenReturn("avatars/user-001/photo.jpg");
            when(identityCommandPort.updateProfile(eq("user-001"), any(ProfileUpdate.class)))
                    .thenReturn(Optional.of(profile));
            when(userProfileCompositionService.profileResponse(profile)).thenReturn(profileResponse);

            UserProfileUpdateOutcome outcome = service.updateProfile(
                    "user-001", "Batdorj", "https://cdn.tasky.mn/avatars/user-001/photo.jpg", "Hello world");

            assertThat(outcome.status()).isEqualTo(UserProfileUpdateOutcome.Status.SUCCESS);
            assertThat(outcome.profile()).isEqualTo(profileResponse);
        }

        @Test
        @DisplayName("delegates correct ProfileUpdate to identity port")
        void delegatesCorrectProfileUpdate() {
            when(userProfileCompositionService.extractAvatarStorageKey(
                            "https://cdn.tasky.mn/avatars/user-001/photo.jpg"))
                    .thenReturn("avatars/user-001/photo.jpg");
            when(identityCommandPort.updateProfile(eq("user-001"), any(ProfileUpdate.class)))
                    .thenReturn(Optional.of(buildProfile()));
            when(userProfileCompositionService.profileResponse(any())).thenReturn(buildProfileResponse());

            service.updateProfile("user-001", "New Name", "https://cdn.tasky.mn/avatars/user-001/photo.jpg", "New bio");

            verify(identityCommandPort)
                    .updateProfile(
                            eq("user-001"),
                            eq(new ProfileUpdate(
                                    "New Name", "https://cdn.tasky.mn/avatars/user-001/photo.jpg", "New bio")));
        }

        @Test
        @DisplayName("skips avatar validation when avatarUrl is null")
        void skipsAvatarValidationWhenNull() {
            when(identityCommandPort.updateProfile(eq("user-001"), any(ProfileUpdate.class)))
                    .thenReturn(Optional.of(buildProfile()));
            when(userProfileCompositionService.profileResponse(any())).thenReturn(buildProfileResponse());

            UserProfileUpdateOutcome outcome = service.updateProfile("user-001", "Name Only", null, "Bio");

            assertThat(outcome.status()).isEqualTo(UserProfileUpdateOutcome.Status.SUCCESS);
            verify(storageKeyPolicy, never()).validateOwnedKey(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("updateProfile error cases")
    class ErrorCases {

        @Test
        @DisplayName("returns INVALID_AVATAR_KEY when storage key validation fails")
        void invalidAvatarKey() {
            when(userProfileCompositionService.extractAvatarStorageKey("https://evil.com/malicious.jpg"))
                    .thenThrow(new IllegalArgumentException("Invalid avatar URL"));

            UserProfileUpdateOutcome outcome =
                    service.updateProfile("user-001", "Name", "https://evil.com/malicious.jpg", "Bio");

            assertThat(outcome.status()).isEqualTo(UserProfileUpdateOutcome.Status.INVALID_AVATAR_KEY);
            assertThat(outcome.profile()).isNull();
            verifyNoInteractions(identityCommandPort);
        }

        @Test
        @DisplayName("returns USER_NOT_FOUND when identity port returns empty optional")
        void userNotFound() {
            when(userProfileCompositionService.extractAvatarStorageKey("uploads/avatars/user-001/photo.jpg"))
                    .thenReturn("avatars/user-001/photo.jpg");
            when(identityCommandPort.updateProfile(eq("user-001"), any(ProfileUpdate.class)))
                    .thenReturn(Optional.empty());

            UserProfileUpdateOutcome outcome =
                    service.updateProfile("user-001", "Name", "uploads/avatars/user-001/photo.jpg", "Bio");

            assertThat(outcome.status()).isEqualTo(UserProfileUpdateOutcome.Status.USER_NOT_FOUND);
            assertThat(outcome.profile()).isNull();
        }

        @Test
        @DisplayName("returns INVALID_AVATAR_KEY when storage key policy rejects ownership")
        void invalidAvatarKeyOnOwnershipMismatch() {
            when(userProfileCompositionService.extractAvatarStorageKey("uploads/avatars/other-user/photo.jpg"))
                    .thenReturn("avatars/other-user/photo.jpg");
            doThrow(new IllegalArgumentException("Invalid storage key"))
                    .when(storageKeyPolicy)
                    .validateOwnedKey(
                            eq("avatars/other-user/photo.jpg"), eq(StorageKeyPolicy.Namespace.AVATAR), eq("user-001"));

            UserProfileUpdateOutcome outcome =
                    service.updateProfile("user-001", "Name", "uploads/avatars/other-user/photo.jpg", "Bio");

            assertThat(outcome.status()).isEqualTo(UserProfileUpdateOutcome.Status.INVALID_AVATAR_KEY);
            verifyNoInteractions(identityCommandPort);
        }
    }
}
