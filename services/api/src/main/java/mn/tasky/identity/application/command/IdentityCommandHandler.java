package mn.tasky.identity.application.command;

import java.util.Optional;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.auth.application.ReliabilityScoreService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.application.VerificationService;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthTokens;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.springframework.stereotype.Service;

@Service
public class IdentityCommandHandler implements IdentityCommandPort {
    private final AuthService authService;
    private final UserProfileService userProfileService;
    private final VerificationService verificationService;
    private final ModerationService moderationService;
    private final ReliabilityScoreService reliabilityScoreService;
    private final BadgeEvaluationService badgeEvaluationService;

    public IdentityCommandHandler(
            AuthService authService,
            UserProfileService userProfileService,
            VerificationService verificationService,
            ModerationService moderationService,
            ReliabilityScoreService reliabilityScoreService,
            BadgeEvaluationService badgeEvaluationService) {
        this.authService = authService;
        this.userProfileService = userProfileService;
        this.verificationService = verificationService;
        this.moderationService = moderationService;
        this.reliabilityScoreService = reliabilityScoreService;
        this.badgeEvaluationService = badgeEvaluationService;
    }

    @Override
    public AuthSession facebookLogin(String accessToken) {
        return authService.facebookLogin(accessToken);
    }

    @Override
    public AuthSession devLogin(String rawPhone, String role) {
        return authService.devLogin(rawPhone, role);
    }

    @Override
    public String requestOtp(String rawPhone) {
        return authService.requestOtp(rawPhone);
    }

    @Override
    public Optional<AuthSession> verifyOtp(String rawPhone, String code, String facebookAccessToken) {
        return authService.verifyOtp(rawPhone, code, facebookAccessToken);
    }

    @Override
    public Optional<AuthTokens> refreshToken(String refreshToken) {
        return authService.refreshToken(refreshToken);
    }

    @Override
    public Optional<UserProfile> updateProfile(String userId, ProfileUpdate update) {
        return userProfileService.updateProfile(userId, update);
    }

    @Override
    public Optional<RoleActivationResult> activateTaskerRole(String userId) {
        return userProfileService.activateTaskerRole(userId);
    }

    @Override
    public Optional<PresignedUpload> createAvatarUploadUrl(String userId, String contentType) {
        return userProfileService.createAvatarUploadUrl(userId, contentType);
    }

    @Override
    public Optional<PresignedUpload> createVerificationUploadUrl(String userId, String contentType) {
        return verificationService.createVerificationUploadUrl(userId, contentType);
    }

    @Override
    public VerificationSubmitResult submitVerification(
            String userId, String frontKey, String backKey, String consentPolicyVersion) {
        return verificationService.submitVerification(userId, frontKey, backKey, consentPolicyVersion);
    }

    @Override
    public Optional<VerificationDetail> approveVerification(String verificationId) {
        return verificationService.approveVerification(verificationId);
    }

    @Override
    public Optional<VerificationDetail> rejectVerification(String verificationId, String reason) {
        return verificationService.rejectVerification(verificationId, reason);
    }

    @Override
    public boolean banUser(String adminId, String userId, String reason) {
        return moderationService.banUser(adminId, userId, reason);
    }

    @Override
    public boolean unbanUser(String adminId, String userId, String reason) {
        return moderationService.unbanUser(adminId, userId, reason);
    }

    @Override
    public ModerationPolicy updateModerationPolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays,
            boolean autoUnsuspendEnabled) {
        return moderationService.updateModerationPolicy(
                strikeWindowDays,
                strikeThreshold,
                firstSuspensionDays,
                repeatSuspensionDays,
                repeatOffenseWindowDays,
                autoUnsuspendEnabled);
    }

    @Override
    public void requestAccountDeletion(String userId) {
        moderationService.requestAccountDeletion(userId);
    }

    @Override
    public void recomputeReliabilityScore(String taskerId) {
        reliabilityScoreService.recompute(taskerId);
    }

    @Override
    public void evaluateBadges(String taskerId) {
        badgeEvaluationService.evaluate(taskerId);
    }
}
