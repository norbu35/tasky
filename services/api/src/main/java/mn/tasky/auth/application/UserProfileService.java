package mn.tasky.auth.application;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * User profile management service.
 * Handles profile CRUD, status queries, avatar uploads, instant match access,
 * and tasker role activation.
 */
@Service
public class UserProfileService {

    private static final Map<String, String> AVATAR_EXTENSION_BY_CONTENT_TYPE =
            Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");

    private final UserDao userDao;
    private final ProfileDao profileDao;
    private final BadgeDao badgeDao;
    private final S3PresignedUrlService storageService;
    private final StorageKeyPolicy storageKeyPolicy;
    private final UserStatusResolver userStatusResolver;
    private final CryptoService cryptoService;
    private final JwtTokenService jwtTokenService;
    private final RefreshSessionDao refreshSessionDao;
    private final boolean otpEnabled;
    private final boolean devAuthEnabled;

    public UserProfileService(
            UserDao userDao,
            ProfileDao profileDao,
            BadgeDao badgeDao,
            S3PresignedUrlService storageService,
            StorageKeyPolicy storageKeyPolicy,
            UserStatusResolver userStatusResolver,
            CryptoService cryptoService,
            JwtTokenService jwtTokenService,
            RefreshSessionDao refreshSessionDao,
            @Value("${tasky.otp.enabled:false}") boolean otpEnabled,
            @Value("${tasky.dev-auth.enabled:false}") boolean devAuthEnabled) {
        this.userDao = userDao;
        this.profileDao = profileDao;
        this.badgeDao = badgeDao;
        this.storageService = storageService;
        this.storageKeyPolicy = storageKeyPolicy;
        this.userStatusResolver = userStatusResolver;
        this.cryptoService = cryptoService;
        this.jwtTokenService = jwtTokenService;
        this.refreshSessionDao = refreshSessionDao;
        this.otpEnabled = otpEnabled;
        this.devAuthEnabled = devAuthEnabled;
    }

    /**
     * Returns consolidated user profile view including resolved status.
     *
     * @param userId User identifier.
     * @return User profile when user exists.
     */
    public Optional<UserProfile> getProfile(String userId) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        UserProfileState profile = profileDao.findByUserId(user.id()).orElse(UserProfileState.defaultState());
        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
        AuthUser effectiveUser = new AuthUser(
                user.id(),
                user.phone(),
                user.facebookId(),
                user.role(),
                effectiveStatus,
                user.primaryAuth(),
                user.createdAt(),
                user.updatedAt());
        return Optional.of(toProfile(effectiveUser, profile));
    }

    /**
     * Updates mutable profile fields for an existing user.
     *
     * @param userId User identifier.
     * @param update Profile update payload.
     * @return Updated profile when user exists.
     */
    public Optional<UserProfile> updateProfile(String userId, ProfileUpdate update) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        UserProfileState current = profileDao.findByUserId(user.id()).orElse(UserProfileState.defaultState());

        String fullName = update.fullName() != null ? update.fullName().trim() : current.fullName();
        String avatarUrl = update.avatarUrl() != null ? update.avatarUrl().trim() : current.avatarUrl();

        profileDao.updateNameAndAvatar(user.id(), fullName, avatarUrl);

        return getProfile(user.id());
    }

    /**
     * Activates tasker role for a customer account and rotates tokens.
     *
     * @param userId User identifier.
     * @return Activation payload when transition is applicable.
     */
    public Optional<RoleActivationResult> activateTaskerRole(String userId) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        if ("TASKER".equals(user.role()) || "ADMIN".equals(user.role())) {
            return Optional.empty();
        }

        userDao.updateRole(user.id(), "TASKER");
        AuthUser updated = new AuthUser(
                user.id(),
                user.phone(),
                user.facebookId(),
                "TASKER",
                user.status(),
                user.primaryAuth(),
                user.createdAt(),
                user.updatedAt());

        AuthSession session = issueSession(updated);
        return Optional.of(new RoleActivationResult(session.accessToken(), session.refreshToken(), session.user()));
    }

    /**
     * Updates aggregate profile stats.
     *
     * @param userId             User identifier.
     * @param rating             Optional new rating; values {@code <= 0} do not change average.
     * @param incrementCompleted Whether to increment completed task count.
     */
    public void updateUserStats(String userId, double rating, boolean incrementCompleted) {
        UserProfileState current = profileDao.findByUserId(userId).orElse(UserProfileState.defaultState());

        int newCompleted = current.completedTasks() + (incrementCompleted ? 1 : 0);
        double newRating = current.ratingAvg();

        if (rating > 0) {
            if (current.ratingAvg() == 0.0) {
                newRating = rating;
            } else {
                int count = current.completedTasks();
                if (count == 0) {
                    count = 1;
                }
                newRating = (current.ratingAvg() * count + rating) / (count + 1);
                if (current.ratingAvg() == 5.0 && rating == 5.0) {
                    newRating = 5.0;
                }
            }
        }

        profileDao.updateStats(userId, newRating, newCompleted);
    }

    /**
     * Returns effective status for a user id if id format and user are valid.
     *
     * @param userId User identifier.
     * @return Effective status when user exists and id is valid UUID; otherwise empty.
     */
    public Optional<String> currentUserStatus(String userId) {
        try {
            UUID.fromString(userId);
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
        return userDao.findById(userId).map(user -> userStatusResolver.resolve(user.id(), user.status()));
    }

    /**
     * Returns whether an existing Facebook-era account must complete OTP migration before product access.
     *
     * @param userId Authenticated user identifier.
     * @return {@code true} when OTP is enabled and user has Facebook identity without a linked phone.
     */
    public boolean requiresOtpMigration(String userId) {
        return otpEnabled
                && userDao.findById(userId)
                        .map(user -> StringUtils.hasText(user.facebookId())
                                && !StringUtils.hasText(decryptPhone(user.phone())))
                        .orElse(false);
    }

    /**
     * Revokes Instant Match access for the given user for the specified duration.
     * Writes instant_match_revoked_until = NOW + duration to the user profile.
     *
     * @param userId   The user whose Instant Match access to revoke.
     * @param duration How long to revoke access for.
     */
    public void revokeInstantMatch(String userId, java.time.Duration duration) {
        Instant revokedUntil = Instant.now().plus(duration);
        profileDao.setInstantMatchRevokedUntil(userId, revokedUntil);
    }

    /**
     * Returns true if the user is currently allowed to use Instant Match.
     * Returns true if no revocation timestamp is recorded or if it has expired.
     *
     * @param userId The customer user ID to check.
     * @return true if Instant Match is allowed, false if currently revoked.
     */
    public boolean isInstantMatchAllowed(String userId) {
        return profileDao
                .findByUserId(userId)
                .map(p -> p.instantMatchRevokedUntil() == null || Instant.now().isAfter(p.instantMatchRevokedUntil()))
                .orElse(true);
    }

    /**
     * Creates a signed upload URL for avatar images.
     *
     * @param userId      User identifier.
     * @param contentType MIME type.
     * @return Upload payload when user exists and MIME type is supported.
     */
    public Optional<PresignedUpload> createAvatarUploadUrl(String userId, String contentType) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = AVATAR_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.AVATAR, userId, extension);
        String uploadUrl = storageService.generateUploadUrl(storageKey, normalizedContentType);
        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }

    private UserProfile toProfile(AuthUser user, UserProfileState profile) {
        boolean isPro =
                badgeDao.findActiveByTaskerId(user.id()).stream().anyMatch(badge -> "PRO".equals(badge.badgeType()));
        return new UserProfile(
                user.id(),
                decryptPhone(user.phone()),
                user.role(),
                user.status(),
                profile.fullName(),
                profile.avatarUrl(),
                profile.ratingAvg(),
                profile.completedTasks(),
                isPro,
                user.createdAt().toString());
    }

    private AuthSession issueSession(AuthUser user) {
        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
        JwtPrincipal principal = new JwtPrincipal(user.id(), user.role(), effectiveStatus);
        String accessToken = jwtTokenService.issueAccessToken(principal);
        mn.tasky.common.security.dto.RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        refreshSessionDao.insert(refreshToken.tokenId(), user.id(), refreshToken.expiresAt());

        Map<String, Object> sessionUser = new java.util.LinkedHashMap<>();
        sessionUser.put("id", user.id());
        String decryptedPhone = decryptPhone(user.phone());
        if (decryptedPhone != null) {
            sessionUser.put("phone", decryptedPhone);
        }
        if (user.facebookId() != null) {
            sessionUser.put("facebook_id", user.facebookId());
        }
        sessionUser.put("role", user.role());
        sessionUser.put("status", effectiveStatus);
        sessionUser.put("created_at", user.createdAt().toString());

        return new AuthSession(accessToken, refreshToken.token(), sessionUser);
    }

    private String decryptPhone(String encryptedPhone) {
        if (!StringUtils.hasText(encryptedPhone)) {
            return null;
        }
        return cryptoService.decrypt(encryptedPhone);
    }
}
