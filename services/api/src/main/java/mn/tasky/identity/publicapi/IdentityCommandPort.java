package mn.tasky.identity.publicapi;

import java.util.Optional;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthTokens;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;

public interface IdentityCommandPort {
    AuthSession facebookLogin(String accessToken);

    AuthSession devLogin(String rawPhone, String role);

    String requestOtp(String rawPhone);

    Optional<AuthSession> verifyOtp(String rawPhone, String code, String facebookAccessToken);

    Optional<AuthTokens> refreshToken(String refreshToken);

    Optional<mn.tasky.auth.dto.UserProfile> updateProfile(String userId, ProfileUpdate update);

    Optional<RoleActivationResult> activateTaskerRole(String userId);

    Optional<PresignedUpload> createAvatarUploadUrl(String userId, String contentType);

    Optional<PresignedUpload> createVerificationUploadUrl(String userId, String contentType);

    VerificationSubmitResult submitVerification(
            String userId, String frontKey, String backKey, String consentPolicyVersion);

    Optional<VerificationDetail> approveVerification(String verificationId);

    Optional<VerificationDetail> rejectVerification(String verificationId, String reason);

    boolean banUser(String adminId, String userId, String reason);

    boolean unbanUser(String adminId, String userId, String reason);

    ModerationPolicy updateModerationPolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays,
            boolean autoUnsuspendEnabled);
}
