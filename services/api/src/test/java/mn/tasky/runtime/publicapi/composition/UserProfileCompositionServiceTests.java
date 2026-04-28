package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.user.dto.ProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("UserProfileCompositionService")
class UserProfileCompositionServiceTests {

    private UserProfileCompositionService service;

    @BeforeEach
    void setUp() {
        service = new UserProfileCompositionService();
    }

    @Nested
    @DisplayName("profileResponse")
    class ProfileResponseMapping {

        @Test
        @DisplayName("maps all UserProfile fields to ProfileResponse")
        void mapsAllFields() {
            UserProfile profile = new UserProfile(
                    "u-1",
                    "+97699112233",
                    "TASKER",
                    "VERIFIED",
                    "Test User",
                    "https://cdn.tasky.mn/avatar.png",
                    "Bio text",
                    4.8,
                    12,
                    true,
                    "2025-01-01T00:00:00Z");

            ProfileResponse response = service.profileResponse(profile);

            assertThat(response.id()).isEqualTo("u-1");
            assertThat(response.phone()).isEqualTo("+97699112233");
            assertThat(response.role()).isEqualTo("TASKER");
            assertThat(response.status()).isEqualTo("VERIFIED");
            assertThat(response.fullName()).isEqualTo("Test User");
            assertThat(response.avatarUrl()).isEqualTo("https://cdn.tasky.mn/avatar.png");
            assertThat(response.bio()).isEqualTo("Bio text");
            assertThat(response.ratingAvg()).isEqualTo(4.8);
            assertThat(response.completedTasks()).isEqualTo(12);
            assertThat(response.isPro()).isTrue();
            assertThat(response.createdAt()).isEqualTo("2025-01-01T00:00:00Z");
        }

        @Test
        @DisplayName("handles profile with minimal populated fields")
        void handlesMinimalFields() {
            UserProfile profile = new UserProfile(
                    "u-2",
                    "+97699000000",
                    "CUSTOMER",
                    "ACTIVE",
                    "Jane",
                    null,
                    null,
                    null,
                    0,
                    false,
                    "2025-06-01T00:00:00Z");

            ProfileResponse response = service.profileResponse(profile);

            assertThat(response.avatarUrl()).isNull();
            assertThat(response.bio()).isNull();
            assertThat(response.ratingAvg()).isEqualTo(0.0);
            assertThat(response.completedTasks()).isEqualTo(0);
            assertThat(response.isPro()).isFalse();
        }
    }

    @Nested
    @DisplayName("roleActivationResponse")
    class RoleActivationResponse {

        @Test
        @DisplayName("maps RoleActivationResult to response map with token fields")
        void mapsToResponseMap() {
            Map<String, Object> userData = Map.of("id", "u-1", "role", "TASKER");
            RoleActivationResult result = new RoleActivationResult("access-tok", "refresh-tok", userData);

            Map<String, Object> response = service.roleActivationResponse(result);

            assertThat(response).containsEntry("access_token", "access-tok");
            assertThat(response).containsEntry("refresh_token", "refresh-tok");
            assertThat(response).containsEntry("user", userData);
        }
    }

    @Nested
    @DisplayName("avatarUploadResponse")
    class AvatarUploadResponse {

        @Test
        @DisplayName("maps PresignedUpload to response map")
        void mapsToResponseMap() {
            PresignedUpload upload = new PresignedUpload("https://s3.example.com/upload", "avatars/abc.png");

            Map<String, Object> response = service.avatarUploadResponse(upload);

            assertThat(response).containsEntry("upload_url", "https://s3.example.com/upload");
            assertThat(response).containsEntry("storage_key", "avatars/abc.png");
        }
    }

    @Nested
    @DisplayName("extractAvatarStorageKey")
    class ExtractAvatarStorageKey {

        @Test
        @DisplayName("returns raw key when URL starts with uploads/")
        void returnsRawKeyForUploadsPrefix() {
            String result = service.extractAvatarStorageKey("uploads/avatars/img.png");

            assertThat(result).isEqualTo("uploads/avatars/img.png");
        }

        @Test
        @DisplayName("extracts path from cdn.tasky.mn URL")
        void extractsPathFromCdnTasky() {
            String result = service.extractAvatarStorageKey("https://cdn.tasky.mn/avatars/img.png");

            assertThat(result).isEqualTo("avatars/img.png");
        }

        @Test
        @DisplayName("extracts path from cdn.tasky.local URL")
        void extractsPathFromCdnLocal() {
            String result = service.extractAvatarStorageKey("https://cdn.tasky.local/avatars/local.png");

            assertThat(result).isEqualTo("avatars/local.png");
        }

        @Test
        @DisplayName("throws for unknown host")
        void throwsForUnknownHost() {
            assertThatThrownBy(() -> service.extractAvatarStorageKey("https://evil.com/avatars/img.png"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid avatar URL");
        }

        @Test
        @DisplayName("throws for empty path on valid host")
        void throwsForEmptyPath() {
            assertThatThrownBy(() -> service.extractAvatarStorageKey("https://cdn.tasky.mn"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invalid avatar URL");
        }

        @Test
        @DisplayName("strips leading slash from valid path")
        void stripsLeadingSlash() {
            String result = service.extractAvatarStorageKey("https://cdn.tasky.mn/avatars/nested/img.png");

            assertThat(result).isEqualTo("avatars/nested/img.png");
        }
    }
}
