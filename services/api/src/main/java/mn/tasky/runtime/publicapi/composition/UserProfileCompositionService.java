package mn.tasky.runtime.publicapi.composition;

import java.net.URI;
import java.util.Map;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.user.dto.ProfileResponse;
import org.springframework.stereotype.Component;

@Component
public class UserProfileCompositionService {

    public ProfileResponse profileResponse(UserProfile profile) {
        return new ProfileResponse(
                profile.id(),
                profile.phone(),
                profile.role(),
                profile.status(),
                profile.fullName(),
                profile.avatarUrl(),
                profile.bio(),
                profile.ratingAvg() != null ? profile.ratingAvg() : 0.0d,
                profile.completedTasks(),
                profile.isPro(),
                profile.createdAt());
    }

    public Map<String, Object> roleActivationResponse(RoleActivationResult result) {
        return Map.of(
                "access_token", result.accessToken(), "refresh_token", result.refreshToken(), "user", result.user());
    }

    public Map<String, Object> avatarUploadResponse(PresignedUpload upload) {
        return Map.of("upload_url", upload.uploadUrl(), "storage_key", upload.storageKey());
    }

    public String extractAvatarStorageKey(String avatarUrl) {
        if (avatarUrl.startsWith("uploads/")) {
            return avatarUrl;
        }

        URI uri = URI.create(avatarUrl);
        String host = uri.getHost();
        if (!"cdn.tasky.mn".equals(host) && !"cdn.tasky.local".equals(host)) {
            throw new IllegalArgumentException("Invalid avatar URL");
        }

        String path = uri.getPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Invalid avatar URL");
        }

        return path.startsWith("/") ? path.substring(1) : path;
    }
}
