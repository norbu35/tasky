package mn.tasky.auth.application;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import mn.tasky.auth.AccountRestrictedException;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.OtpChallengeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthTokens;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.OtpChallenge;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RefreshSession;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import mn.tasky.common.security.dto.RefreshToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Core authentication and account service.
 * Handles OTP/Facebook login, token rotation, profile and verification workflows,
 * moderation actions, and signed upload URL generation.
 */
@Service
public class AuthService {

    private static final ModerationPolicy DEFAULT_MODERATION_POLICY =
            new ModerationPolicy(30, 3, 7, 14, 180, true, Instant.EPOCH);

    private static final Set<String> SUPPORTED_ROLES = Set.of("CUSTOMER", "TASKER", "ADMIN");
    private static final Set<String> NON_PROD_PROFILES = Set.of("dev", "test", "local");
    private static final Map<String, String> AVATAR_EXTENSION_BY_CONTENT_TYPE =
            Map.of("image/jpeg", "jpg", "image/png", "png", "image/webp", "webp");
    private static final Map<String, String> VERIFICATION_EXTENSION_BY_CONTENT_TYPE =
            Map.of("image/jpeg", "jpg", "image/png", "png");

    private final JwtTokenService jwtTokenService;
    private final CryptoService cryptoService;
    private final SmsService smsService;
    private final FacebookGraphClient facebookGraphClient;
    private final Environment environment;
    private final S3PresignedUrlService storageService;
    private final boolean devAuthEnabled;
    private final boolean otpEnabled;
    private final long otpTtlSeconds;
    private final String otpTestCode;
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserDao userDao;
    private final ProfileDao profileDao;
    private final OtpChallengeDao otpChallengeDao;
    private final RefreshSessionDao refreshSessionDao;
    private final VerificationDao verificationDao;
    private final AuditEventDao auditEventDao;
    private final StrikeDao strikeDao;
    private final ModerationPolicyDao moderationPolicyDao;
    private final SuspensionEventDao suspensionEventDao;
    private final BadgeDao badgeDao;
    private final MeterRegistry meterRegistry;

    public AuthService(
            JwtTokenService jwtTokenService,
            CryptoService cryptoService,
            SmsService smsService,
            FacebookGraphClient facebookGraphClient,
            Environment environment,
            S3PresignedUrlService storageService,
            UserDao userDao,
            ProfileDao profileDao,
            OtpChallengeDao otpChallengeDao,
            RefreshSessionDao refreshSessionDao,
            VerificationDao verificationDao,
            AuditEventDao auditEventDao,
            StrikeDao strikeDao,
            ModerationPolicyDao moderationPolicyDao,
            SuspensionEventDao suspensionEventDao,
            BadgeDao badgeDao,
            MeterRegistry meterRegistry,
            @Value("${tasky.dev-auth.enabled:true}") boolean devAuthEnabled,
            @Value("${tasky.otp.enabled:false}") boolean otpEnabled,
            @Value("${tasky.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
            @Value("${tasky.auth.otp-test-code:}") String otpTestCode) {
        this.jwtTokenService = jwtTokenService;
        this.cryptoService = cryptoService;
        this.smsService = smsService;
        this.facebookGraphClient = facebookGraphClient;
        this.environment = environment;
        this.storageService = storageService;
        this.userDao = userDao;
        this.profileDao = profileDao;
        this.otpChallengeDao = otpChallengeDao;
        this.refreshSessionDao = refreshSessionDao;
        this.verificationDao = verificationDao;
        this.auditEventDao = auditEventDao;
        this.strikeDao = strikeDao;
        this.moderationPolicyDao = moderationPolicyDao;
        this.suspensionEventDao = suspensionEventDao;
        this.badgeDao = badgeDao;
        this.meterRegistry = meterRegistry;
        this.devAuthEnabled = devAuthEnabled;
        this.otpEnabled = otpEnabled;
        this.otpTtlSeconds = otpTtlSeconds;
        this.otpTestCode = otpTestCode;
    }

    @PostConstruct
    void validateOtpConfiguration() {
        boolean nonProductionProfile = isNonProductionProfile();

        if (!nonProductionProfile && devAuthEnabled) {
            throw new IllegalStateException("tasky.dev-auth.enabled must be false in production.");
        }
        if (!otpEnabled) {
            return;
        }
        if (!nonProductionProfile && StringUtils.hasText(otpTestCode)) {
            throw new IllegalStateException("tasky.auth.otp-test-code must not be set in " + "production.");
        }
        if (!nonProductionProfile && !smsService.isProductionReady()) {
            throw new IllegalStateException("A production-ready SMS provider must be configured " + "in production.");
        }
    }

    private boolean isNonProductionProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .map(profile -> profile.toLowerCase(Locale.ROOT))
                .anyMatch(NON_PROD_PROFILES::contains);
    }

    /**
     * Creates/updates an OTP challenge for a phone number and dispatches the code.
     *
     * @param rawPhone Raw phone input.
     * @return Masked phone string suitable for UI display.
     */
    public String requestOtp(String rawPhone) {
        String phone = normalizePhone(rawPhone);
        String blindIndex = cryptoService.blindIndex(phone);
        String otpCode = generateOtpCode();

        otpChallengeDao.upsert(blindIndex, otpCode, Instant.now().plusSeconds(otpTtlSeconds));
        smsService.sendOtp(phone, otpCode);

        return maskPhone(phone);
    }

    private String normalizePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return "";
        }
        String digitsOnly = phone.trim().replaceAll("\\D", "");
        if (!StringUtils.hasText(digitsOnly)) {
            return "";
        }
        return "+" + digitsOnly;
    }

    private AuthUser ensureUser(String phone) {
        String blindIndex = cryptoService.blindIndex(phone);
        Optional<AuthUser> existing = userDao.findByPhoneBlindIndex(blindIndex);

        if (existing.isPresent()) {
            return existing.get();
        }

        String id = UUID.randomUUID().toString();
        String encryptedPhone = cryptoService.encrypt(phone);
        Instant now = Instant.now();
        userDao.insert(id, encryptedPhone, blindIndex, "CUSTOMER", "PENDING", now);
        profileDao.ensureExists(id, UserProfileState.defaultState().fullName());
        return new AuthUser(id, encryptedPhone, null, "CUSTOMER", "PENDING", "FACEBOOK", now, now);
    }

    private String generateOtpCode() {
        if (StringUtils.hasText(otpTestCode)) {
            return otpTestCode;
        }
        return String.format(Locale.ROOT, "%06d", secureRandom.nextInt(1_000_000));
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) {
            return "****";
        }
        return phone.substring(0, Math.min(6, phone.length())) + "****";
    }

    /**
     * Verifies OTP challenge and issues an authenticated session when valid.
     *
     * @param rawPhone Raw phone input.
     * @param code     OTP code.
     * @return Session payload when verification succeeds; empty when challenge is missing,
     * expired, or invalid.
     * @throws AccountRestrictedException when account status resolves to suspended or banned.
     */
    public Optional<AuthSession> verifyOtp(String rawPhone, String code) {
        return verifyOtp(rawPhone, code, null);
    }

    /**
     * Verifies OTP challenge and issues an authenticated session when valid.
     * Optional Facebook token allows linking phone credentials to an existing Facebook-era account.
     *
     * @param rawPhone            Raw phone input.
     * @param code                OTP code.
     * @param facebookAccessToken Optional Facebook access token used for migration linkage.
     * @return Session payload when verification succeeds; empty when challenge is missing,
     * expired, or invalid.
     * @throws AccountRestrictedException when account status resolves to suspended or banned.
     */
    public Optional<AuthSession> verifyOtp(String rawPhone, String code, String facebookAccessToken) {
        String phone = normalizePhone(rawPhone);
        String blindIndex = cryptoService.blindIndex(phone);
        Optional<OtpChallenge> challengeOpt = otpChallengeDao.findByPhoneBlindIdx(blindIndex);
        if (challengeOpt.isEmpty()) {
            meterRegistry.counter("tasky.auth.login_attempts", "method", "otp", "result", "failure").increment();
            return Optional.empty();
        }

        OtpChallenge challenge = challengeOpt.get();
        if (challenge.expiresAt().isBefore(Instant.now())) {
            otpChallengeDao.delete(blindIndex);
            meterRegistry.counter("tasky.auth.login_attempts", "method", "otp", "result", "failure").increment();
            return Optional.empty();
        }

        if (!constantTimeEquals(challenge.code(), code)) {
            int attempts = challenge.attempts() + 1;
            if (attempts >= 3) {
                otpChallengeDao.delete(blindIndex);
            } else {
                otpChallengeDao.incrementAttempts(blindIndex);
            }
            meterRegistry.counter("tasky.auth.login_attempts", "method", "otp", "result", "failure").increment();
            return Optional.empty();
        }

        otpChallengeDao.delete(blindIndex);
        AuthUser user = resolveOtpUser(phone, blindIndex, facebookAccessToken);
        String effectiveStatus = resolveUserStatus(user.id(), user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            meterRegistry.counter("tasky.auth.login_attempts", "method", "otp", "result", "failure").increment();
            throw new AccountRestrictedException("This account is suspended or banned.");
        }

        AuthUser effectiveUser = new AuthUser(
                user.id(),
                user.phone(),
                user.facebookId(),
                user.role(),
                effectiveStatus,
                user.primaryAuth(),
                user.createdAt(),
                user.updatedAt());
        meterRegistry.counter("tasky.auth.login_attempts", "method", "otp", "result", "success").increment();
        return Optional.of(issueSession(effectiveUser));
    }

    private AuthUser resolveOtpUser(String phone, String blindIndex, String facebookAccessToken) {
        if (!StringUtils.hasText(facebookAccessToken)) {
            return ensureUser(phone);
        }

        String token = facebookAccessToken.trim();
        facebookGraphClient.debugToken(token);
        FacebookGraphClient.FacebookProfile profile = facebookGraphClient.fetchProfile(token);
        Optional<AuthUser> facebookUserOpt = userDao.findByFacebookId(profile.facebookId());
        if (facebookUserOpt.isEmpty()) {
            return ensureUser(phone);
        }

        AuthUser facebookUser = facebookUserOpt.get();
        Optional<AuthUser> phoneUserOpt = userDao.findByPhoneBlindIndex(blindIndex);
        if (phoneUserOpt.isPresent() && !phoneUserOpt.get().id().equals(facebookUser.id())) {
            throw new IllegalArgumentException("Phone number is already linked to another account.");
        }

        String encryptedPhone = cryptoService.encrypt(phone);
        String existingPhone = decryptPhone(facebookUser.phone());
        if (StringUtils.hasText(existingPhone) && !phone.equals(existingPhone)) {
            throw new IllegalArgumentException("Phone number does not match linked Facebook account.");
        }
        if (!StringUtils.hasText(existingPhone)) {
            userDao.updatePhoneAndBlindIndex(facebookUser.id(), encryptedPhone, blindIndex);
        }

        return userDao.findById(facebookUser.id())
                .orElseGet(() -> new AuthUser(
                        facebookUser.id(),
                        encryptedPhone,
                        facebookUser.facebookId(),
                        facebookUser.role(),
                        facebookUser.status(),
                        facebookUser.primaryAuth(),
                        facebookUser.createdAt(),
                        facebookUser.updatedAt()));
    }

    private boolean constantTimeEquals(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return MessageDigest.isEqual(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8));
    }

    private String resolveUserStatus(String userId, String currentStatus) {
        if (!"SUSPENDED".equals(currentStatus)) {
            return currentStatus;
        }

        ModerationPolicy policy = moderationPolicy();
        if (!policy.autoUnsuspendEnabled()) {
            return currentStatus;
        }

        Optional<Instant> suspensionEnd = userDao.findSuspensionEndAt(userId);
        if (suspensionEnd.isEmpty()) {
            return currentStatus;
        }
        if (suspensionEnd.get().isAfter(Instant.now())) {
            return currentStatus;
        }

        userDao.updateStatusAndSuspensionEnd(userId, "ACTIVE", null);
        suspensionEventDao.markUnsuspended(userId, Instant.now());
        return "ACTIVE";
    }

    private AuthSession issueSession(AuthUser user) {
        String effectiveStatus = resolveUserStatus(user.id(), user.status());
        JwtPrincipal principal = new JwtPrincipal(user.id(), user.role(), effectiveStatus);
        String accessToken = jwtTokenService.issueAccessToken(principal);
        RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        refreshSessionDao.insert(refreshToken.tokenId(), user.id(), refreshToken.expiresAt());

        Map<String, Object> sessionUser = new LinkedHashMap<>();
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

    private ModerationPolicy moderationPolicy() {
        return moderationPolicyDao.findActive().orElse(DEFAULT_MODERATION_POLICY);
    }

    private String decryptPhone(String encryptedPhone) {
        if (!StringUtils.hasText(encryptedPhone)) {
            return null;
        }
        return cryptoService.decrypt(encryptedPhone);
    }

    /**
     * Authenticates with a Facebook access token and returns a session.
     *
     * @param accessToken Facebook user access token.
     * @return Authenticated session payload.
     * @throws AccountRestrictedException when account status resolves to suspended or banned.
     */
    public AuthSession facebookLogin(String accessToken) {
        String token = accessToken.strip();
        try {
            facebookGraphClient.debugToken(token);
            FacebookGraphClient.FacebookProfile profile = facebookGraphClient.fetchProfile(token);

            AuthUser user = ensureUserByFacebookId(profile.facebookId(), profile);
            String effectiveStatus = resolveUserStatus(user.id(), user.status());
            if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
                meterRegistry.counter("tasky.auth.login_attempts", "method", "facebook", "result", "failure").increment();
                throw new AccountRestrictedException("This account is suspended or banned.");
            }

            AuthUser effectiveUser = new AuthUser(
                    user.id(),
                    user.phone(),
                    user.facebookId(),
                    user.role(),
                    effectiveStatus,
                    user.primaryAuth(),
                    user.createdAt(),
                    user.updatedAt());
            meterRegistry.counter("tasky.auth.login_attempts", "method", "facebook", "result", "success").increment();
            return issueSession(effectiveUser);
        } catch (AccountRestrictedException e) {
            throw e;
        } catch (Exception e) {
            meterRegistry.counter("tasky.auth.login_attempts", "method", "facebook", "result", "failure").increment();
            throw e;
        }
    }

    private AuthUser ensureUserByFacebookId(String facebookId, FacebookGraphClient.FacebookProfile profile) {
        if (!StringUtils.hasText(facebookId)) {
            throw new IllegalArgumentException("Facebook profile id is required.");
        }

        Optional<AuthUser> existing = userDao.findByFacebookId(facebookId);
        if (existing.isPresent()) {
            return existing.get();
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        userDao.insertWithFacebookId(id, facebookId, "CUSTOMER", "PENDING", now);

        String fullName = StringUtils.hasText(profile.name())
                ? profile.name().trim()
                : UserProfileState.defaultState().fullName();
        String avatarUrl =
                StringUtils.hasText(profile.pictureUrl()) ? profile.pictureUrl().trim() : null;
        profileDao.ensureExists(id, fullName);
        if (StringUtils.hasText(profile.name()) || avatarUrl != null) {
            profileDao.updateNameAndAvatar(id, fullName, avatarUrl);
        }

        return new AuthUser(id, null, facebookId, "CUSTOMER", "PENDING", "FACEBOOK", now, now);
    }

    /**
     * Performs local development login for a phone and requested role.
     *
     * @param rawPhone Raw phone input.
     * @param role     Requested role; defaults to {@code CUSTOMER} when absent.
     * @return Authenticated session payload.
     * @throws IllegalArgumentException   when role is unsupported.
     * @throws AccountRestrictedException when account status resolves to suspended or banned.
     */
    public AuthSession devLogin(String rawPhone, String role) {
        String phone = normalizePhone(rawPhone);
        String normalizedRole = role == null ? "CUSTOMER" : role.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException("Unsupported role: " + normalizedRole);
        }

        AuthUser user = ensureUser(phone);
        if (!normalizedRole.equals(user.role())) {
            userDao.updateRole(user.id(), normalizedRole);
            user = new AuthUser(
                    user.id(),
                    user.phone(),
                    user.facebookId(),
                    normalizedRole,
                    user.status(),
                    user.primaryAuth(),
                    user.createdAt(),
                    user.updatedAt());
        }

        String effectiveStatus = resolveUserStatus(user.id(), user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            throw new AccountRestrictedException("This account is suspended or banned.");
        }

        AuthUser effectiveUser = new AuthUser(
                user.id(),
                user.phone(),
                user.facebookId(),
                user.role(),
                effectiveStatus,
                user.primaryAuth(),
                user.createdAt(),
                user.updatedAt());
        return issueSession(effectiveUser);
    }

    /**
     * Rotates refresh token and returns new access/refresh tokens when valid.
     *
     * @param refreshToken Raw refresh token.
     * @return New token pair when refresh is accepted; empty otherwise.
     */
    public Optional<AuthTokens> refreshToken(String refreshToken) {
        Optional<ParsedRefreshToken> parsedOpt = jwtTokenService.parseRefreshToken(refreshToken);
        if (parsedOpt.isEmpty()) {
            return Optional.empty();
        }

        ParsedRefreshToken parsed = parsedOpt.get();
        Optional<RefreshSession> sessionOpt = refreshSessionDao.findAndDelete(parsed.tokenId());
        if (sessionOpt.isEmpty()) {
            return Optional.empty();
        }

        RefreshSession session = sessionOpt.get();
        if (!session.userId().equals(parsed.userId()) || session.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        Optional<AuthUser> userOpt = userDao.findById(parsed.userId());
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        AuthUser user = userOpt.get();
        String effectiveStatus = resolveUserStatus(user.id(), user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            return Optional.empty();
        }

        AuthUser effectiveUser = new AuthUser(
                user.id(),
                user.phone(),
                user.facebookId(),
                user.role(),
                effectiveStatus,
                user.primaryAuth(),
                user.createdAt(),
                user.updatedAt());
        AuthSession rotated = issueSession(effectiveUser);
        return Optional.of(new AuthTokens(rotated.accessToken(), rotated.refreshToken()));
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
        String effectiveStatus = resolveUserStatus(user.id(), user.status());
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
     * Creates a signed upload URL for verification document images.
     *
     * @param userId      User identifier.
     * @param contentType MIME type.
     * @return Upload payload when user exists and MIME type is supported.
     */
    public Optional<PresignedUpload> createVerificationUploadUrl(String userId, String contentType) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = VERIFICATION_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = "uploads/verification/" + userId + "/" + UUID.randomUUID() + "." + extension;
        String uploadUrl = storageService.generateUploadUrl(storageKey, normalizedContentType);
        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }


    /**
     * Submits a tasker verification request.
     *
     * @param userId   Tasker identifier.
     * @param frontKey Storage key for front ID image.
     * @param backKey  Storage key for back ID image.
     * @return Verification submission result with status code and payload when successful.
     */
    public VerificationSubmitResult submitVerification(
            String userId, String frontKey, String backKey, String consentPolicyVersion) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return new VerificationSubmitResult(VerificationSubmitResult.USER_NOT_FOUND, null);
        }
        AuthUser user = userOpt.get();

        if (!"TASKER".equals(user.role())) {
            return new VerificationSubmitResult(VerificationSubmitResult.NOT_TASKER, null);
        }

        Optional<VerificationRequest> existingOpt = verificationDao.findLatestByUserId(userId);
        boolean hasPendingOrApproved = existingOpt
                .map(existing -> "PENDING".equals(existing.status()) || "APPROVED".equals(existing.status()))
                .orElse(false);
        if (hasPendingOrApproved) {
            return new VerificationSubmitResult(VerificationSubmitResult.CONFLICT, null);
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        verificationDao.insert(
                id, userId, frontKey, backKey, "PENDING", now, null, null, consentPolicyVersion, now, null);
        VerificationRequest request =
                new VerificationRequest(id, userId, frontKey, backKey, "PENDING", now, null, null);
        return new VerificationSubmitResult(VerificationSubmitResult.SUCCESS, toVerificationStatus(request));
    }

    private VerificationStatusResponse toVerificationStatus(VerificationRequest request) {
        return new VerificationStatusResponse(
                request.status(),
                request.adminNotes(),
                request.submittedAt() != null ? request.submittedAt().toString() : null,
                request.reviewedAt() != null ? request.reviewedAt().toString() : null);
    }

    /**
     * Returns latest verification status for a user, or {@code NOT_SUBMITTED}.
     *
     * @param userId User identifier.
     * @return Current verification status view.
     */
    public VerificationStatusResponse getVerificationStatus(String userId) {
        return verificationDao
                .findLatestByUserId(userId)
                .map(this::toVerificationStatus)
                .orElseGet(() -> new VerificationStatusResponse("NOT_SUBMITTED", null, null, null));
    }

    /**
     * Returns a single verification detail by ID, including presigned URLs.
     *
     * @param verificationId Verification identifier.
     * @return Verification detail when found.
     */
    public Optional<VerificationDetail> getVerificationDetail(String verificationId) {
        return verificationDao.findById(verificationId).map(this::toVerificationDetail);
    }

    /**
     * Lists pending verification requests using first-page defaults.
     *
     * @param limit Maximum number of rows.
     * @return Pending verification details.
     */
    public List<VerificationDetail> listPendingVerifications(int limit) {
        return listPendingVerifications(null, limit);
    }

    /**
     * Lists pending verification requests with pagination cursor.
     *
     * @param cursor Optional cursor.
     * @param limit  Maximum number of rows.
     * @return Pending verification details.
     */
    public List<VerificationDetail> listPendingVerifications(String cursor, int limit) {
        List<VerificationRequest> pending = verificationDao.findPending(cursor, limit);
        return pending.stream().map(this::toVerificationDetail).toList();
    }

    private VerificationDetail toVerificationDetail(VerificationRequest request) {
        Optional<AuthUser> userOpt = userDao.findById(request.userId());
        UserProfileState profile = profileDao.findByUserId(request.userId()).orElse(null);
        String phone = userOpt.map(u -> decryptPhone(u.phone())).orElse(null);
        String name = profile != null ? profile.fullName() : null;

        String frontUrl = storageService.generateDownloadUrl(request.idCardFrontKey());
        String backUrl = storageService.generateDownloadUrl(request.idCardBackKey());

        return new VerificationDetail(
                request.id(),
                request.userId(),
                phone,
                name,
                frontUrl,
                backUrl,
                request.status(),
                request.adminNotes(),
                request.submittedAt().toString(),
                request.reviewedAt() != null ? request.reviewedAt().toString() : null,
                null,
                null,
                null);
    }


    /**
     * Checks whether a verification request exists.
     *
     * @param verificationId Verification identifier.
     * @return {@code true} when present.
     */
    public boolean verificationExists(String verificationId) {
        return verificationDao.findById(verificationId).isPresent();
    }

    /**
     * Approves a pending verification and marks user status as {@code VERIFIED}.
     *
     * @param verificationId Verification identifier.
     * @return Resolved verification detail when transition succeeds.
     */
    public Optional<VerificationDetail> approveVerification(String verificationId) {
        return resolveVerification(verificationId, "APPROVED", null, true);
    }

    private Optional<VerificationDetail> resolveVerification(
            String verificationId, String status, String notes, boolean markUserVerified) {
        Optional<VerificationRequest> requestOpt = verificationDao.findById(verificationId);
        if (requestOpt.isEmpty()) {
            return Optional.empty();
        }

        VerificationRequest request = requestOpt.get();
        if (!"PENDING".equals(request.status())) {
            return Optional.empty();
        }

        String adminNotes = notes != null ? notes : request.adminNotes();
        Instant now = Instant.now();
        verificationDao.updateStatus(verificationId, status, adminNotes, now);
        if (markUserVerified) {
            userDao.updateStatus(request.userId(), "VERIFIED");
        }

        VerificationRequest resolved = new VerificationRequest(
                request.id(),
                request.userId(),
                request.idCardFrontKey(),
                request.idCardBackKey(),
                status,
                request.submittedAt(),
                adminNotes,
                now);
        return Optional.of(toVerificationDetail(resolved));
    }

    /**
     * Rejects a pending verification with admin reason.
     *
     * @param verificationId Verification identifier.
     * @param reason         Rejection reason/notes.
     * @return Resolved verification detail when transition succeeds.
     */
    public Optional<VerificationDetail> rejectVerification(String verificationId, String reason) {
        return resolveVerification(verificationId, "REJECTED", reason, false);
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

    // getAuditLog removed — audit_log table replaced by audit_events (V10).
    // A query-capable audit service will be introduced in a later task.

    /**
     * Adds a moderation strike and applies suspension policy when thresholds are reached.
     *
     * @param userId Target user identifier.
     */
    public void addStrike(String userId) {
        Instant now = Instant.now();
        strikeDao.insert(UUID.randomUUID().toString(), userId, null, null, now);

        ModerationPolicy policy = moderationPolicy();
        Instant windowStart = now.minus(policy.strikeWindowDays(), ChronoUnit.DAYS);
        long recentStrikes = strikeDao.countSince(userId, windowStart);

        if (recentStrikes < policy.strikeThreshold()) {
            return;
        }

        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }
        AuthUser user = userOpt.get();
        String effectiveStatus = resolveUserStatus(user.id(), user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            return;
        }

        Instant repeatLookback = now.minus(policy.repeatOffenseWindowDays(), ChronoUnit.DAYS);
        long priorSuspensions = suspensionEventDao.countSince(userId, repeatLookback);
        int suspensionDays = priorSuspensions > 0 ? policy.repeatSuspensionDays() : policy.firstSuspensionDays();
        Instant suspensionEndAt = now.plus(suspensionDays, ChronoUnit.DAYS);

        userDao.updateStatusAndSuspensionEnd(userId, "SUSPENDED", suspensionEndAt);
        suspensionEventDao.insert(
                UUID.randomUUID().toString(), userId, Math.toIntExact(recentStrikes), suspensionDays, now, null);
    }

    /**
     * Searches users by exact normalized phone value and returns cursor-paged profile results.
     *
     * @param phonePart Phone input to normalize and search.
     * @param cursor    Optional UUID cursor.
     * @param limit     Page size.
     * @return Paged user profiles.
     * @throws IllegalArgumentException when cursor is not a valid UUID.
     */
    public UserProfilePage searchUsersByPhone(String phonePart, String cursor, int limit) {
        UUID cursorId = parseUserSearchCursor(cursor);
        List<UserProfile> candidates = searchUsersByPhoneExact(phonePart).stream()
                .sorted(Comparator.comparing(profile -> UUID.fromString(profile.id())))
                .filter(profile ->
                        cursorId == null || UUID.fromString(profile.id()).compareTo(cursorId) > 0)
                .limit(limit + 1L)
                .toList();

        boolean hasMore = candidates.size() > limit;
        List<UserProfile> pageData = hasMore ? candidates.subList(0, limit) : candidates;
        String nextCursor = hasMore && !pageData.isEmpty() ? pageData.getLast().id() : null;

        return new UserProfilePage(List.copyOf(pageData), nextCursor, hasMore);
    }

    private UUID parseUserSearchCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }
        try {
            return UUID.fromString(cursor.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.", exception);
        }
    }

    private List<UserProfile> searchUsersByPhoneExact(String phone) {
        String normalizedPhone = normalizePhone(phone);
        if (!StringUtils.hasText(normalizedPhone)) {
            return List.of();
        }
        String blindIndex = cryptoService.blindIndex(normalizedPhone);
        return userDao
                .findByPhoneBlindIndex(blindIndex)
                .map(user -> {
                    String effectiveStatus = resolveUserStatus(user.id(), user.status());
                    AuthUser effectiveUser = new AuthUser(
                            user.id(),
                            user.phone(),
                            user.facebookId(),
                            user.role(),
                            effectiveStatus,
                            user.primaryAuth(),
                            user.createdAt(),
                            user.updatedAt());
                    return toProfile(
                            effectiveUser, profileDao.findByUserId(user.id()).orElse(UserProfileState.defaultState()));
                })
                .stream()
                .toList();
    }

    /**
     * Bans a user and writes an admin audit log entry.
     *
     * @param adminId Admin identifier.
     * @param userId  Target user identifier.
     * @param reason  Ban reason.
     * @return {@code true} when user exists and was updated.
     */
    public boolean banUser(String adminId, String userId, String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }

        userDao.updateStatusAndSuspensionEnd(userId, "BANNED", null);
        auditEventDao.insert(adminId, "BAN_USER", "USER", userId, "{\"reason\":\"" + reason + "\"}");
        return true;
    }

    /**
     * Removes ban/suspension status from a user and writes an admin audit log entry.
     *
     * @param adminId Admin identifier.
     * @param userId  Target user identifier.
     * @param reason  Unban reason.
     * @return {@code true} when user exists and was updated.
     */
    public boolean unbanUser(String adminId, String userId, String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }

        userDao.updateStatusAndSuspensionEnd(userId, "ACTIVE", null);
        auditEventDao.insert(adminId, "UNBAN_USER", "USER", userId, "{\"reason\":\"" + reason + "\"}");
        return true;
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
        return userDao.findById(userId).map(user -> resolveUserStatus(user.id(), user.status()));
    }

    /**
     * Returns whether an existing Facebook-era account must complete OTP migration before product access.
     *
     * @param userId Authenticated user identifier.
     * @return {@code true} when OTP is enabled and user has Facebook identity without a linked phone.
     */
    public boolean requiresOtpMigration(String userId) {
        if (!otpEnabled) {
            return false;
        }
        return userDao.findById(userId)
                .map(user -> StringUtils.hasText(user.facebookId()) && !StringUtils.hasText(decryptPhone(user.phone())))
                .orElse(false);
    }

    /**
     * Returns the active moderation policy, or default policy when no row is present.
     *
     * @return Current moderation policy.
     */
    public ModerationPolicy getModerationPolicy() {
        return moderationPolicy();
    }

    /**
     * Updates moderation policy after validating value ranges.
     *
     * @param strikeWindowDays        Strike rolling window in days.
     * @param strikeThreshold         Strike count that triggers suspension.
     * @param firstSuspensionDays     First suspension duration in days.
     * @param repeatSuspensionDays    Repeat suspension duration in days.
     * @param repeatOffenseWindowDays Lookback window for repeat offense escalation.
     * @param autoUnsuspendEnabled    Whether automatic unsuspend is enabled.
     * @return Updated moderation policy.
     * @throws IllegalArgumentException if provided values fail validation constraints.
     * @throws IllegalStateException    if moderation policy row is missing at update time.
     */
    public ModerationPolicy updateModerationPolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays,
            boolean autoUnsuspendEnabled) {
        validatePolicy(
                strikeWindowDays, strikeThreshold, firstSuspensionDays, repeatSuspensionDays, repeatOffenseWindowDays);
        Instant now = Instant.now();
        int updated = moderationPolicyDao.update(
                strikeWindowDays,
                strikeThreshold,
                firstSuspensionDays,
                repeatSuspensionDays,
                repeatOffenseWindowDays,
                autoUnsuspendEnabled,
                now);
        if (updated == 0) {
            throw new IllegalStateException("Moderation policy row is missing.");
        }
        return moderationPolicyDao
                .findActive()
                .orElse(new ModerationPolicy(
                        strikeWindowDays,
                        strikeThreshold,
                        firstSuspensionDays,
                        repeatSuspensionDays,
                        repeatOffenseWindowDays,
                        autoUnsuspendEnabled,
                        now));
    }

    private void validatePolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays) {
        if (strikeWindowDays < 1 || strikeWindowDays > 365) {
            throw new IllegalArgumentException("strikeWindowDays must be between 1 and 365");
        }
        if (strikeThreshold < 1 || strikeThreshold > 10) {
            throw new IllegalArgumentException("strikeThreshold must be between 1 and 10");
        }
        if (firstSuspensionDays < 1 || firstSuspensionDays > 365) {
            throw new IllegalArgumentException("firstSuspensionDays must be between 1 and 365");
        }
        if (repeatSuspensionDays < firstSuspensionDays || repeatSuspensionDays > 365) {
            throw new IllegalArgumentException("repeatSuspensionDays must be between " + "firstSuspensionDays and 365");
        }
        if (repeatOffenseWindowDays < strikeWindowDays || repeatOffenseWindowDays > 730) {
            throw new IllegalArgumentException("repeatOffenseWindowDays must be between " + "strikeWindowDays and 730");
        }
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

        String storageKey = "uploads/avatars/" + userId + "/" + UUID.randomUUID() + "." + extension;
        String uploadUrl = storageService.generateUploadUrl(storageKey, normalizedContentType);
        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }
}
