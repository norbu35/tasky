package mn.tasky.auth.application;

import jakarta.annotation.PostConstruct;
import mn.tasky.auth.dao.AuditLogDao;
import mn.tasky.auth.dao.OtpChallengeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuditLogEntry;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthTokens;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.OtpChallenge;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RefreshSession;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import mn.tasky.common.security.dto.RefreshToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final Set<String> SUPPORTED_ROLES = Set.of("CUSTOMER", "TASKER", "ADMIN");
    private static final Map<String, String> AVATAR_EXTENSION_BY_CONTENT_TYPE = Map.of(
        "image/jpeg", "jpg",
        "image/png", "png",
        "image/webp", "webp"
    );
    private static final Map<String, String> VERIFICATION_EXTENSION_BY_CONTENT_TYPE = Map.of(
        "image/jpeg", "jpg",
        "image/png", "png"
    );

    private final JwtTokenService jwtTokenService;
    private final CryptoService cryptoService;
    private final SmsService smsService;
    private final Environment environment;
    private final boolean devAuthEnabled;
    private final long otpTtlSeconds;
    private final String otpTestCode;
    private final String avatarUploadBaseUrl;
    private final long avatarMaxBytes;
    private final long avatarUploadUrlTtlSeconds;
    private final String verificationUploadBaseUrl;
    private final long verificationMaxBytes;
    private final long verificationUploadUrlTtlSeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserDao userDao;
    private final ProfileDao profileDao;
    private final OtpChallengeDao otpChallengeDao;
    private final RefreshSessionDao refreshSessionDao;
    private final VerificationDao verificationDao;
    private final AuditLogDao auditLogDao;
    private final StrikeDao strikeDao;

    public AuthService(
        JwtTokenService jwtTokenService,
        CryptoService cryptoService,
        SmsService smsService,
        Environment environment,
        UserDao userDao,
        ProfileDao profileDao,
        OtpChallengeDao otpChallengeDao,
        RefreshSessionDao refreshSessionDao,
        VerificationDao verificationDao,
        AuditLogDao auditLogDao,
        StrikeDao strikeDao,
        @Value("${tasky.dev-auth.enabled:true}") boolean devAuthEnabled,
        @Value("${tasky.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
        @Value("${tasky.auth.otp-test-code:}") String otpTestCode,
        @Value("${tasky.storage.avatar-upload-base-url:https://upload.tasky.local}") String avatarUploadBaseUrl,
        @Value("${tasky.storage.avatar-max-bytes:5242880}") long avatarMaxBytes,
        @Value("${tasky.storage.avatar-upload-url-ttl-seconds:900}") long avatarUploadUrlTtlSeconds,
        @Value("${tasky.storage.verification-upload-base-url:https://upload.tasky.local}") String verificationUploadBaseUrl,
        @Value("${tasky.storage.verification-max-bytes:10485760}") long verificationMaxBytes,
        @Value("${tasky.storage.verification-upload-url-ttl-seconds:900}") long verificationUploadUrlTtlSeconds
    ) {
        this.jwtTokenService = jwtTokenService;
        this.cryptoService = cryptoService;
        this.smsService = smsService;
        this.environment = environment;
        this.userDao = userDao;
        this.profileDao = profileDao;
        this.otpChallengeDao = otpChallengeDao;
        this.refreshSessionDao = refreshSessionDao;
        this.verificationDao = verificationDao;
        this.auditLogDao = auditLogDao;
        this.strikeDao = strikeDao;
        this.devAuthEnabled = devAuthEnabled;
        this.otpTtlSeconds = otpTtlSeconds;
        this.otpTestCode = otpTestCode;
        this.avatarUploadBaseUrl = avatarUploadBaseUrl;
        this.avatarMaxBytes = avatarMaxBytes;
        this.avatarUploadUrlTtlSeconds = avatarUploadUrlTtlSeconds;
        this.verificationUploadBaseUrl = verificationUploadBaseUrl;
        this.verificationMaxBytes = verificationMaxBytes;
        this.verificationUploadUrlTtlSeconds = verificationUploadUrlTtlSeconds;
    }

    @PostConstruct
    void validateOtpConfiguration() {
        boolean productionProfile = false;
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                productionProfile = true;
                break;
            }
        }

        if (productionProfile && StringUtils.hasText(otpTestCode)) {
            throw new IllegalStateException("tasky.auth.otp-test-code must not be set in production.");
        }
        if (productionProfile && !smsService.isProductionReady()) {
            throw new IllegalStateException("A production-ready SMS provider must be configured in production.");
        }
        if (productionProfile && devAuthEnabled) {
            throw new IllegalStateException("tasky.dev-auth.enabled must be false in production.");
        }
    }

    public String requestOtp(String rawPhone) {
        String phone = normalizePhone(rawPhone);
        String blindIndex = cryptoService.blindIndex(phone);
        ensureUser(phone);
        String otpCode = generateOtpCode();

        otpChallengeDao.upsert(blindIndex, otpCode, Instant.now().plusSeconds(otpTtlSeconds));
        smsService.sendOtp(phone, otpCode);

        return maskPhone(phone);
    }

    public Optional<AuthSession> verifyOtp(String rawPhone, String code) {
        String phone = normalizePhone(rawPhone);
        String blindIndex = cryptoService.blindIndex(phone);
        Optional<OtpChallenge> challengeOpt = otpChallengeDao.findByPhoneBlindIdx(blindIndex);
        if (challengeOpt.isEmpty()) {
            return Optional.empty();
        }

        OtpChallenge challenge = challengeOpt.get();
        if (challenge.expiresAt().isBefore(Instant.now())) {
            otpChallengeDao.delete(blindIndex);
            return Optional.empty();
        }

        if (!constantTimeEquals(challenge.code(), code)) {
            int attempts = challenge.attempts() + 1;
            if (attempts >= 3) {
                otpChallengeDao.delete(blindIndex);
            } else {
                otpChallengeDao.incrementAttempts(blindIndex);
            }
            return Optional.empty();
        }

        otpChallengeDao.delete(blindIndex);
        AuthUser user = ensureUser(phone);
        return Optional.of(issueSession(user));
    }

    public AuthSession devLogin(String rawPhone, String role) {
        String phone = normalizePhone(rawPhone);
        String normalizedRole = role == null ? "CUSTOMER" : role.trim().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException("Unsupported role: " + normalizedRole);
        }

        AuthUser user = ensureUser(phone);
        if (!normalizedRole.equals(user.role())) {
            userDao.updateRole(user.id(), normalizedRole);
            user = new AuthUser(user.id(), user.phone(), normalizedRole, user.status(), user.createdAt());
        }

        return issueSession(user);
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
        return new AuthUser(id, encryptedPhone, "CUSTOMER", "PENDING", now);
    }

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
        if ("BANNED".equals(user.status()) || "SUSPENDED".equals(user.status())) {
            return Optional.empty();
        }

        AuthSession rotated = issueSession(user);
        return Optional.of(new AuthTokens(rotated.accessToken(), rotated.refreshToken()));
    }

    public Optional<UserProfile> getProfile(String userId) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        UserProfileState profile = profileDao.findByUserId(user.id())
            .orElse(UserProfileState.defaultState());
        return Optional.of(toProfile(user, profile));
    }

    public Optional<UserProfile> updateProfile(String userId, ProfileUpdate update) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        UserProfileState current = profileDao.findByUserId(user.id())
            .orElse(UserProfileState.defaultState());

        String fullName = update.fullName() != null ? update.fullName().trim() : current.fullName();
        String avatarUrl = update.avatarUrl() != null ? update.avatarUrl().trim() : current.avatarUrl();

        profileDao.updateNameAndAvatar(user.id(), fullName, avatarUrl);

        return getProfile(user.id());
    }

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
        AuthUser updated = new AuthUser(user.id(), user.phone(), "TASKER", user.status(), user.createdAt());

        AuthSession session = issueSession(updated);
        return Optional.of(new RoleActivationResult(
            session.accessToken(), session.refreshToken(), session.user()
        ));
    }

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

        String storageKey = "uploads/verification/" +
            userId +
            "/" +
            UUID.randomUUID() +
            "." +
            extension;
        String uploadUrl = buildPresignedUploadUrl(
            verificationUploadBaseUrl, storageKey, normalizedContentType,
            verificationMaxBytes, verificationUploadUrlTtlSeconds
        );

        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }

    public VerificationSubmitResult submitVerification(String userId, String frontKey, String backKey) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return new VerificationSubmitResult(VerificationSubmitResult.USER_NOT_FOUND, null);
        }
        AuthUser user = userOpt.get();

        if (!"TASKER".equals(user.role())) {
            return new VerificationSubmitResult(VerificationSubmitResult.NOT_TASKER, null);
        }

        Optional<VerificationRequest> existingOpt = verificationDao.findLatestByUserId(userId);
        if (existingOpt.isPresent()) {
            VerificationRequest existing = existingOpt.get();
            if ("PENDING".equals(existing.status()) || "APPROVED".equals(existing.status())) {
                return new VerificationSubmitResult(VerificationSubmitResult.CONFLICT, null);
            }
        }

        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        verificationDao.insert(id, userId, frontKey, backKey, "PENDING", now, null, null);
        VerificationRequest request = new VerificationRequest(id, userId, frontKey, backKey, "PENDING", now, null, null);
        return new VerificationSubmitResult(VerificationSubmitResult.SUCCESS, toVerificationStatus(request));
    }

    public VerificationStatusResponse getVerificationStatus(String userId) {
        Optional<VerificationRequest> requestOpt = verificationDao.findLatestByUserId(userId);
        if (requestOpt.isEmpty()) {
            return new VerificationStatusResponse("NOT_SUBMITTED", null, null, null);
        }
        return toVerificationStatus(requestOpt.get());
    }

    public List<VerificationDetail> listPendingVerifications(int limit) {
        List<VerificationRequest> pending = verificationDao.findPending(limit);
        return pending.stream().map(this::toVerificationDetail).toList();
    }

    public boolean verificationExists(String verificationId) {
        return verificationDao.findById(verificationId).isPresent();
    }

    public Optional<VerificationDetail> approveVerification(String verificationId) {
        Optional<VerificationRequest> requestOpt = verificationDao.findById(verificationId);
        if (requestOpt.isEmpty()) {
            return Optional.empty();
        }

        VerificationRequest request = requestOpt.get();
        if (!"PENDING".equals(request.status())) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        verificationDao.updateStatus(verificationId, "APPROVED", request.adminNotes(), now);
        userDao.updateStatus(request.userId(), "VERIFIED");

        VerificationRequest approved = new VerificationRequest(
            request.id(), request.userId(), request.idCardFrontKey(), request.idCardBackKey(),
            "APPROVED", request.submittedAt(), request.adminNotes(), now
        );
        return Optional.of(toVerificationDetail(approved));
    }

    public Optional<VerificationDetail> rejectVerification(String verificationId, String reason) {
        Optional<VerificationRequest> requestOpt = verificationDao.findById(verificationId);
        if (requestOpt.isEmpty()) {
            return Optional.empty();
        }

        VerificationRequest request = requestOpt.get();
        if (!"PENDING".equals(request.status())) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        verificationDao.updateStatus(verificationId, "REJECTED", reason, now);

        VerificationRequest rejected = new VerificationRequest(
            request.id(), request.userId(), request.idCardFrontKey(), request.idCardBackKey(),
            "REJECTED", request.submittedAt(), reason, now
        );
        return Optional.of(toVerificationDetail(rejected));
    }

    public void updateUserStats(String userId, int rating, boolean incrementCompleted) {
        UserProfileState current = profileDao.findByUserId(userId)
            .orElse(UserProfileState.defaultState());

        int newCompleted = current.completedTasks() + (incrementCompleted ? 1 : 0);
        double newRating = current.ratingAvg();

        if (rating > 0) {
            if (current.ratingAvg() == 0.0) {
                newRating = rating;
            } else {
                int count = current.completedTasks();
                if (count == 0) count = 1;
                newRating = (current.ratingAvg() * count + rating) / (count + 1);
                if (current.ratingAvg() == 5.0 && rating == 5) newRating = 5.0;
            }
        }

        profileDao.updateStats(userId, newRating, newCompleted);
    }

    public List<AuditLogEntry> getAuditLog() {
        return auditLogDao.findAll();
    }

    public void addStrike(String userId) {
        strikeDao.insert(UUID.randomUUID().toString(), userId, null, Instant.now());

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        long recentStrikes = strikeDao.countSince(userId, thirtyDaysAgo);

        if (recentStrikes >= 3) {
            userDao.updateStatus(userId, "SUSPENDED");
        }
    }

    public List<UserProfile> searchUsersByPhone(String phonePart) {
        return userDao.findAll().stream()
            .filter(u -> cryptoService.decrypt(u.phone()).contains(phonePart))
            .map(u -> toProfile(u, profileDao.findByUserId(u.id()).orElse(UserProfileState.defaultState())))
            .toList();
    }

    public boolean banUser(String adminId, String userId, String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) return false;

        userDao.updateStatus(userId, "BANNED");
        auditLogDao.insert(UUID.randomUUID().toString(), adminId, "BAN_USER", userId, reason, Instant.now());
        return true;
    }

    public boolean unbanUser(String adminId, String userId, String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) return false;

        userDao.updateStatus(userId, "ACTIVE");
        auditLogDao.insert(UUID.randomUUID().toString(), adminId, "UNBAN_USER", userId, reason, Instant.now());
        return true;
    }

    public Optional<String> currentUserStatus(String userId) {
        return userDao.findById(userId).map(AuthUser::status);
    }

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

        String storageKey = "uploads/avatars/" +
            userId +
            "/" +
            UUID.randomUUID() +
            "." +
            extension;
        String uploadUrl = buildUploadUrl(storageKey, normalizedContentType);

        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }

    private AuthSession issueSession(AuthUser user) {
        JwtPrincipal principal = new JwtPrincipal(user.id(), user.role(), user.status());
        String accessToken = jwtTokenService.issueAccessToken(principal);
        RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        refreshSessionDao.insert(refreshToken.tokenId(), user.id(), refreshToken.expiresAt());

        return new AuthSession(
            accessToken,
            refreshToken.token(),
            Map.of(
                "id", user.id(),
                "phone", cryptoService.decrypt(user.phone()),
                "role", user.role(),
                "status", user.status(),
                "created_at", user.createdAt().toString()
            )
        );
    }

    private UserProfile toProfile(AuthUser user, UserProfileState profile) {
        boolean isPro = profile.completedTasks() >= 6 && profile.ratingAvg() >= 4.5d;
        return new UserProfile(
            user.id(),
            cryptoService.decrypt(user.phone()),
            user.role(),
            user.status(),
            profile.fullName(),
            profile.avatarUrl(),
            profile.ratingAvg(),
            profile.completedTasks(),
            isPro,
            user.createdAt().toString()
        );
    }

    private String normalizePhone(String phone) {
        return StringUtils.trimAllWhitespace(phone);
    }

    private String generateOtpCode() {
        if (StringUtils.hasText(otpTestCode)) {
            return otpTestCode;
        }
        return String.format(Locale.ROOT, "%06d", secureRandom.nextInt(1_000_000));
    }

    private boolean constantTimeEquals(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return MessageDigest.isEqual(
            left.getBytes(StandardCharsets.UTF_8),
            right.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String buildUploadUrl(String storageKey, String contentType) {
        return buildPresignedUploadUrl(
            avatarUploadBaseUrl, storageKey, contentType,
            avatarMaxBytes, avatarUploadUrlTtlSeconds
        );
    }

    private String buildPresignedUploadUrl(
        String baseUrl, String storageKey, String contentType,
        long maxBytes, long ttlSeconds
    ) {
        String normalizedBase = baseUrl.endsWith("/")
            ? baseUrl.substring(0, baseUrl.length() - 1)
            : baseUrl;

        return normalizedBase +
            "/presigned-upload?key=" +
            URLEncoder.encode(storageKey, StandardCharsets.UTF_8) +
            "&content_type=" +
            URLEncoder.encode(contentType, StandardCharsets.UTF_8) +
            "&max_bytes=" +
            maxBytes +
            "&expires_in=" +
            ttlSeconds;
    }

    private String buildPresignedGetUrl(String baseUrl, String storageKey) {
        String normalizedBase = baseUrl.endsWith("/")
            ? baseUrl.substring(0, baseUrl.length() - 1)
            : baseUrl;

        return normalizedBase +
            "/presigned-get?key=" +
            URLEncoder.encode(storageKey, StandardCharsets.UTF_8);
    }

    private VerificationStatusResponse toVerificationStatus(VerificationRequest request) {
        return new VerificationStatusResponse(
            request.status(),
            request.adminNotes(),
            request.submittedAt() != null ? request.submittedAt().toString() : null,
            request.reviewedAt() != null ? request.reviewedAt().toString() : null
        );
    }

    private VerificationDetail toVerificationDetail(VerificationRequest request) {
        Optional<AuthUser> userOpt = userDao.findById(request.userId());
        UserProfileState profile = profileDao.findByUserId(request.userId()).orElse(null);
        String phone = userOpt.map(u -> cryptoService.decrypt(u.phone())).orElse(null);
        String name = profile != null ? profile.fullName() : null;

        String frontUrl = buildPresignedGetUrl(verificationUploadBaseUrl, request.idCardFrontKey());
        String backUrl = buildPresignedGetUrl(verificationUploadBaseUrl, request.idCardBackKey());

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
            request.reviewedAt() != null ? request.reviewedAt().toString() : null
        );
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) {
            return "****";
        }
        return phone.substring(0, Math.min(6, phone.length())) + "****";
    }

}
