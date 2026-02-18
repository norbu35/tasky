package mn.tasky.auth.application;

import jakarta.annotation.PostConstruct;
import mn.tasky.auth.AccountRestrictedException;
import mn.tasky.auth.dao.AuditLogDao;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.OtpChallengeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuditLogEntry;
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
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final ModerationPolicy DEFAULT_MODERATION_POLICY = new ModerationPolicy(
            30,
            3,
            7,
            14,
            180,
            true,
            Instant.EPOCH
    );

    private static final Set<String> SUPPORTED_ROLES = Set.of("CUSTOMER",
                                                              "TASKER",
                                                              "ADMIN");
    private static final Map<String, String> AVATAR_EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg",
            "jpg",
            "image/png",
            "png",
            "image/webp",
            "webp"
    );
    private static final Map<String, String> VERIFICATION_EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg",
            "jpg",
            "image/png",
            "png"
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
    private final ModerationPolicyDao moderationPolicyDao;
    private final SuspensionEventDao suspensionEventDao;

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
            ModerationPolicyDao moderationPolicyDao,
            SuspensionEventDao suspensionEventDao,
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
        this.jwtTokenService                 = jwtTokenService;
        this.cryptoService                   = cryptoService;
        this.smsService                      = smsService;
        this.environment                     = environment;
        this.userDao                         = userDao;
        this.profileDao                      = profileDao;
        this.otpChallengeDao                 = otpChallengeDao;
        this.refreshSessionDao               = refreshSessionDao;
        this.verificationDao                 = verificationDao;
        this.auditLogDao                     = auditLogDao;
        this.strikeDao                       = strikeDao;
        this.moderationPolicyDao             = moderationPolicyDao;
        this.suspensionEventDao              = suspensionEventDao;
        this.devAuthEnabled                  = devAuthEnabled;
        this.otpTtlSeconds                   = otpTtlSeconds;
        this.otpTestCode                     = otpTestCode;
        this.avatarUploadBaseUrl             = avatarUploadBaseUrl;
        this.avatarMaxBytes                  = avatarMaxBytes;
        this.avatarUploadUrlTtlSeconds       = avatarUploadUrlTtlSeconds;
        this.verificationUploadBaseUrl       = verificationUploadBaseUrl;
        this.verificationMaxBytes            = verificationMaxBytes;
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
            throw new IllegalStateException("tasky.auth.otp-test-code must not be set in " +
                                                    "production.");
        }
        if (productionProfile && !smsService.isProductionReady()) {
            throw new IllegalStateException("A production-ready SMS provider must be configured " +
                                                    "in production.");
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

        otpChallengeDao.upsert(blindIndex,
                               otpCode,
                               Instant.now()
                                       .plusSeconds(otpTtlSeconds));
        smsService.sendOtp(phone,
                           otpCode);

        return maskPhone(phone);
    }

    private String normalizePhone(String phone) {
        return StringUtils.trimAllWhitespace(phone);
    }

    private AuthUser ensureUser(String phone) {
        String blindIndex = cryptoService.blindIndex(phone);
        Optional<AuthUser> existing = userDao.findByPhoneBlindIndex(blindIndex);

        if (existing.isPresent()) {
            return existing.get();
        }

        String id = UUID.randomUUID()
                .toString();
        String encryptedPhone = cryptoService.encrypt(phone);
        Instant now = Instant.now();
        userDao.insert(id,
                       encryptedPhone,
                       blindIndex,
                       "CUSTOMER",
                       "PENDING",
                       now);
        profileDao.ensureExists(id,
                                UserProfileState.defaultState()
                                        .fullName());
        return new AuthUser(id,
                            encryptedPhone,
                            "CUSTOMER",
                            "PENDING",
                            now);
    }

    private String generateOtpCode() {
        if (StringUtils.hasText(otpTestCode)) {
            return otpTestCode;
        }
        return String.format(Locale.ROOT,
                             "%06d",
                             secureRandom.nextInt(1_000_000));
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) {
            return "****";
        }
        return phone.substring(0,
                               Math.min(6,
                                        phone.length())) + "****";
    }

    public Optional<AuthSession> verifyOtp(String rawPhone,
                                           String code) {
        String phone = normalizePhone(rawPhone);
        String blindIndex = cryptoService.blindIndex(phone);
        Optional<OtpChallenge> challengeOpt = otpChallengeDao.findByPhoneBlindIdx(blindIndex);
        if (challengeOpt.isEmpty()) {
            return Optional.empty();
        }

        OtpChallenge challenge = challengeOpt.get();
        if (challenge.expiresAt()
                .isBefore(Instant.now())) {
            otpChallengeDao.delete(blindIndex);
            return Optional.empty();
        }

        if (!constantTimeEquals(challenge.code(),
                                code)) {
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
        String effectiveStatus = resolveUserStatus(user.id(),
                                                   user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            throw new AccountRestrictedException("This account is suspended or banned.");
        }

        AuthUser effectiveUser = new AuthUser(user.id(),
                                              user.phone(),
                                              user.role(),
                                              effectiveStatus,
                                              user.createdAt());
        return Optional.of(issueSession(effectiveUser));
    }

    private boolean constantTimeEquals(String left,
                                       String right) {
        if (left == null || right == null) {
            return false;
        }
        return MessageDigest.isEqual(
                left.getBytes(StandardCharsets.UTF_8),
                right.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String resolveUserStatus(String userId,
                                     String currentStatus) {
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
        if (suspensionEnd.get()
                .isAfter(Instant.now())) {
            return currentStatus;
        }

        userDao.updateStatusAndSuspensionEnd(userId,
                                             "ACTIVE",
                                             null);
        suspensionEventDao.markUnsuspended(userId,
                                           Instant.now());
        return "ACTIVE";
    }

    private AuthSession issueSession(AuthUser user) {
        String effectiveStatus = resolveUserStatus(user.id(),
                                                   user.status());
        JwtPrincipal principal = new JwtPrincipal(user.id(),
                                                  user.role(),
                                                  effectiveStatus);
        String accessToken = jwtTokenService.issueAccessToken(principal);
        RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        refreshSessionDao.insert(refreshToken.tokenId(),
                                 user.id(),
                                 refreshToken.expiresAt());

        return new AuthSession(
                accessToken,
                refreshToken.token(),
                Map.of(
                        "id",
                        user.id(),
                        "phone",
                        cryptoService.decrypt(user.phone()),
                        "role",
                        user.role(),
                        "status",
                        effectiveStatus,
                        "created_at",
                        user.createdAt()
                                .toString()
                )
        );
    }

    private ModerationPolicy moderationPolicy() {
        return moderationPolicyDao.findActive()
                .orElse(DEFAULT_MODERATION_POLICY);
    }

    public AuthSession devLogin(String rawPhone,
                                String role) {
        String phone = normalizePhone(rawPhone);
        String normalizedRole = role == null
                ? "CUSTOMER"
                : role.trim()
                        .toUpperCase(Locale.ROOT);
        if (!SUPPORTED_ROLES.contains(normalizedRole)) {
            throw new IllegalArgumentException("Unsupported role: " + normalizedRole);
        }

        AuthUser user = ensureUser(phone);
        if (!normalizedRole.equals(user.role())) {
            userDao.updateRole(user.id(),
                               normalizedRole);
            user = new AuthUser(user.id(),
                                user.phone(),
                                normalizedRole,
                                user.status(),
                                user.createdAt());
        }

        String effectiveStatus = resolveUserStatus(user.id(),
                                                   user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            throw new AccountRestrictedException("This account is suspended or banned.");
        }

        AuthUser effectiveUser = new AuthUser(user.id(),
                                              user.phone(),
                                              user.role(),
                                              effectiveStatus,
                                              user.createdAt());
        return issueSession(effectiveUser);
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
        if (!session.userId()
                .equals(parsed.userId()) || session.expiresAt()
                .isBefore(Instant.now())) {
            return Optional.empty();
        }

        Optional<AuthUser> userOpt = userDao.findById(parsed.userId());
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        AuthUser user = userOpt.get();
        String effectiveStatus = resolveUserStatus(user.id(),
                                                   user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            return Optional.empty();
        }

        AuthUser effectiveUser = new AuthUser(user.id(),
                                              user.phone(),
                                              user.role(),
                                              effectiveStatus,
                                              user.createdAt());
        AuthSession rotated = issueSession(effectiveUser);
        return Optional.of(new AuthTokens(rotated.accessToken(),
                                          rotated.refreshToken()));
    }

    public Optional<UserProfile> updateProfile(String userId,
                                               ProfileUpdate update) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        UserProfileState current = profileDao.findByUserId(user.id())
                .orElse(UserProfileState.defaultState());

        String fullName = update.fullName() != null
                ? update.fullName()
                .trim()
                : current.fullName();
        String avatarUrl = update.avatarUrl() != null
                ? update.avatarUrl()
                .trim()
                : current.avatarUrl();

        profileDao.updateNameAndAvatar(user.id(),
                                       fullName,
                                       avatarUrl);

        return getProfile(user.id());
    }

    public Optional<UserProfile> getProfile(String userId) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        AuthUser user = userOpt.get();
        UserProfileState profile = profileDao.findByUserId(user.id())
                .orElse(UserProfileState.defaultState());
        String effectiveStatus = resolveUserStatus(user.id(),
                                                   user.status());
        AuthUser effectiveUser = new AuthUser(user.id(),
                                              user.phone(),
                                              user.role(),
                                              effectiveStatus,
                                              user.createdAt());
        return Optional.of(toProfile(effectiveUser,
                                     profile));
    }

    private UserProfile toProfile(AuthUser user,
                                  UserProfileState profile) {
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
                user.createdAt()
                        .toString()
        );
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

        userDao.updateRole(user.id(),
                           "TASKER");
        AuthUser updated = new AuthUser(user.id(),
                                        user.phone(),
                                        "TASKER",
                                        user.status(),
                                        user.createdAt());

        AuthSession session = issueSession(updated);
        return Optional.of(new RoleActivationResult(
                session.accessToken(),
                session.refreshToken(),
                session.user()
        ));
    }

    public Optional<PresignedUpload> createVerificationUploadUrl(String userId,
                                                                 String contentType) {
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
                verificationUploadBaseUrl,
                storageKey,
                normalizedContentType,
                verificationMaxBytes,
                verificationUploadUrlTtlSeconds
        );

        return Optional.of(new PresignedUpload(uploadUrl,
                                               storageKey));
    }

    private String buildPresignedUploadUrl(
            String baseUrl,
            String storageKey,
            String contentType,
            long maxBytes,
            long ttlSeconds
    ) {
        String normalizedBase = baseUrl.endsWith("/")
                ? baseUrl.substring(0,
                                    baseUrl.length() - 1)
                : baseUrl;

        return normalizedBase +
                "/presigned-upload?key=" +
                URLEncoder.encode(storageKey,
                                  StandardCharsets.UTF_8) +
                "&content_type=" +
                URLEncoder.encode(contentType,
                                  StandardCharsets.UTF_8) +
                "&max_bytes=" +
                maxBytes +
                "&expires_in=" +
                ttlSeconds;
    }

    public VerificationSubmitResult submitVerification(String userId,
                                                       String frontKey,
                                                       String backKey) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return new VerificationSubmitResult(VerificationSubmitResult.USER_NOT_FOUND,
                                                null);
        }
        AuthUser user = userOpt.get();

        if (!"TASKER".equals(user.role())) {
            return new VerificationSubmitResult(VerificationSubmitResult.NOT_TASKER,
                                                null);
        }

        Optional<VerificationRequest> existingOpt = verificationDao.findLatestByUserId(userId);
        boolean hasPendingOrApproved = existingOpt
                .map(existing -> "PENDING".equals(existing.status()) ||
                        "APPROVED".equals(existing.status()))
                .orElse(false);
        if (hasPendingOrApproved) {
            return new VerificationSubmitResult(VerificationSubmitResult.CONFLICT,
                                                null);
        }

        String id = UUID.randomUUID()
                .toString();
        Instant now = Instant.now();
        verificationDao.insert(id,
                               userId,
                               frontKey,
                               backKey,
                               "PENDING",
                               now,
                               null,
                               null);
        VerificationRequest request = new VerificationRequest(id,
                                                              userId,
                                                              frontKey,
                                                              backKey,
                                                              "PENDING",
                                                              now,
                                                              null,
                                                              null);
        return new VerificationSubmitResult(VerificationSubmitResult.SUCCESS,
                                            toVerificationStatus(request));
    }

    private VerificationStatusResponse toVerificationStatus(VerificationRequest request) {
        return new VerificationStatusResponse(
                request.status(),
                request.adminNotes(),
                request.submittedAt() != null
                        ? request.submittedAt()
                        .toString()
                        : null,
                request.reviewedAt() != null
                        ? request.reviewedAt()
                        .toString()
                        : null
        );
    }

    public VerificationStatusResponse getVerificationStatus(String userId) {
        return verificationDao.findLatestByUserId(userId)
                .map(this::toVerificationStatus)
                .orElseGet(() -> new VerificationStatusResponse("NOT_SUBMITTED",
                                                                null,
                                                                null,
                                                                null));
    }

    public List<VerificationDetail> listPendingVerifications(int limit) {
        return listPendingVerifications(null,
                                        limit);
    }

    public List<VerificationDetail> listPendingVerifications(String cursor,
                                                             int limit) {
        List<VerificationRequest> pending = verificationDao.findPending(cursor,
                                                                        limit);
        return pending.stream()
                .map(this::toVerificationDetail)
                .toList();
    }

    private VerificationDetail toVerificationDetail(VerificationRequest request) {
        Optional<AuthUser> userOpt = userDao.findById(request.userId());
        UserProfileState profile = profileDao.findByUserId(request.userId())
                .orElse(null);
        String phone = userOpt.map(u -> cryptoService.decrypt(u.phone()))
                .orElse(null);
        String name = profile != null
                ? profile.fullName()
                : null;

        String frontUrl = buildPresignedGetUrl(verificationUploadBaseUrl,
                                               request.idCardFrontKey());
        String backUrl = buildPresignedGetUrl(verificationUploadBaseUrl,
                                              request.idCardBackKey());

        return new VerificationDetail(
                request.id(),
                request.userId(),
                phone,
                name,
                frontUrl,
                backUrl,
                request.status(),
                request.adminNotes(),
                request.submittedAt()
                        .toString(),
                request.reviewedAt() != null
                        ? request.reviewedAt()
                        .toString()
                        : null
        );
    }

    private String buildPresignedGetUrl(String baseUrl,
                                        String storageKey) {
        String normalizedBase = baseUrl.endsWith("/")
                ? baseUrl.substring(0,
                                    baseUrl.length() - 1)
                : baseUrl;

        return normalizedBase +
                "/presigned-get?key=" +
                URLEncoder.encode(storageKey,
                                  StandardCharsets.UTF_8);
    }

    public boolean verificationExists(String verificationId) {
        return verificationDao.findById(verificationId)
                .isPresent();
    }

    public Optional<VerificationDetail> approveVerification(String verificationId) {
        return resolveVerification(verificationId,
                                   "APPROVED",
                                   null,
                                   true);
    }

    private Optional<VerificationDetail> resolveVerification(
            String verificationId,
            String status,
            String notes,
            boolean markUserVerified
    ) {
        Optional<VerificationRequest> requestOpt = verificationDao.findById(verificationId);
        if (requestOpt.isEmpty()) {
            return Optional.empty();
        }

        VerificationRequest request = requestOpt.get();
        if (!"PENDING".equals(request.status())) {
            return Optional.empty();
        }

        String adminNotes = notes != null
                ? notes
                : request.adminNotes();
        Instant now = Instant.now();
        verificationDao.updateStatus(verificationId,
                                     status,
                                     adminNotes,
                                     now);
        if (markUserVerified) {
            userDao.updateStatus(request.userId(),
                                 "VERIFIED");
        }

        VerificationRequest resolved = new VerificationRequest(
                request.id(),
                request.userId(),
                request.idCardFrontKey(),
                request.idCardBackKey(),
                status,
                request.submittedAt(),
                adminNotes,
                now
        );
        return Optional.of(toVerificationDetail(resolved));
    }

    public Optional<VerificationDetail> rejectVerification(String verificationId,
                                                           String reason) {
        return resolveVerification(verificationId,
                                   "REJECTED",
                                   reason,
                                   false);
    }

    public void updateUserStats(String userId,
                                int rating,
                                boolean incrementCompleted) {
        UserProfileState current = profileDao.findByUserId(userId)
                .orElse(UserProfileState.defaultState());

        int newCompleted = current.completedTasks() + (incrementCompleted
                ? 1
                : 0);
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

        profileDao.updateStats(userId,
                               newRating,
                               newCompleted);
    }

    public List<AuditLogEntry> getAuditLog() {
        return auditLogDao.findAll();
    }

    public void addStrike(String userId) {
        Instant now = Instant.now();
        strikeDao.insert(UUID.randomUUID()
                                 .toString(),
                         userId,
                         null,
                         now);

        ModerationPolicy policy = moderationPolicy();
        Instant windowStart = now.minus(policy.strikeWindowDays(),
                                        ChronoUnit.DAYS);
        long recentStrikes = strikeDao.countSince(userId,
                                                  windowStart);

        if (recentStrikes < policy.strikeThreshold()) {
            return;
        }

        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }
        AuthUser user = userOpt.get();
        String effectiveStatus = resolveUserStatus(user.id(),
                                                   user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            return;
        }

        Instant repeatLookback = now.minus(policy.repeatOffenseWindowDays(),
                                           ChronoUnit.DAYS);
        long priorSuspensions = suspensionEventDao.countSince(userId,
                                                              repeatLookback);
        int suspensionDays = priorSuspensions > 0
                ? policy.repeatSuspensionDays()
                : policy.firstSuspensionDays();
        Instant suspensionEndAt = now.plus(suspensionDays,
                                           ChronoUnit.DAYS);

        userDao.updateStatusAndSuspensionEnd(userId,
                                             "SUSPENDED",
                                             suspensionEndAt);
        suspensionEventDao.insert(
                UUID.randomUUID()
                        .toString(),
                userId,
                Math.toIntExact(recentStrikes),
                suspensionDays,
                now,
                null
        );
    }

    public List<UserProfile> searchUsersByPhone(String phonePart) {
        return userDao.findAll()
                .stream()
                .filter(u -> cryptoService.decrypt(u.phone())
                        .contains(phonePart))
                .map(u -> {
                    String effectiveStatus = resolveUserStatus(u.id(),
                                                               u.status());
                    AuthUser effectiveUser = new AuthUser(u.id(),
                                                          u.phone(),
                                                          u.role(),
                                                          effectiveStatus,
                                                          u.createdAt());
                    return toProfile(effectiveUser,
                                     profileDao.findByUserId(u.id())
                                             .orElse(UserProfileState.defaultState()));
                })
                .toList();
    }

    public UserProfilePage searchUsersByPhone(String phonePart,
                                              String cursor,
                                              int limit) {
        UUID cursorId = parseUserSearchCursor(cursor);
        List<UserProfile> candidates = searchUsersByPhone(phonePart)
                .stream()
                .sorted(Comparator.comparing(profile -> UUID.fromString(profile.id())))
                .filter(profile -> cursorId == null || UUID.fromString(profile.id())
                        .compareTo(cursorId) > 0)
                .limit(limit + 1L)
                .toList();

        boolean hasMore = candidates.size() > limit;
        List<UserProfile> pageData = hasMore
                ? candidates.subList(0,
                                     limit)
                : candidates;
        String nextCursor = hasMore && !pageData.isEmpty()
                ? pageData.get(pageData.size() - 1)
                        .id()
                : null;

        return new UserProfilePage(List.copyOf(pageData),
                                   nextCursor,
                                   hasMore);
    }

    public boolean banUser(String adminId,
                           String userId,
                           String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) return false;

        userDao.updateStatusAndSuspensionEnd(userId,
                                             "BANNED",
                                             null);
        auditLogDao.insert(UUID.randomUUID()
                                   .toString(),
                           adminId,
                           "BAN_USER",
                           userId,
                           reason,
                           Instant.now());
        return true;
    }

    public boolean unbanUser(String adminId,
                             String userId,
                             String reason) {
        Optional<AuthUser> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) return false;

        userDao.updateStatusAndSuspensionEnd(userId,
                                             "ACTIVE",
                                             null);
        auditLogDao.insert(UUID.randomUUID()
                                   .toString(),
                           adminId,
                           "UNBAN_USER",
                           userId,
                           reason,
                           Instant.now());
        return true;
    }

    public Optional<String> currentUserStatus(String userId) {
        try {
            UUID.fromString(userId);
        } catch (IllegalArgumentException ignored) {
            return Optional.empty();
        }
        return userDao.findById(userId)
                .map(user -> resolveUserStatus(user.id(),
                                               user.status()));
    }

    public ModerationPolicy getModerationPolicy() {
        return moderationPolicy();
    }

    public ModerationPolicy updateModerationPolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays,
            boolean autoUnsuspendEnabled
    ) {
        validatePolicy(strikeWindowDays,
                       strikeThreshold,
                       firstSuspensionDays,
                       repeatSuspensionDays,
                       repeatOffenseWindowDays);
        Instant now = Instant.now();
        int updated = moderationPolicyDao.update(
                strikeWindowDays,
                strikeThreshold,
                firstSuspensionDays,
                repeatSuspensionDays,
                repeatOffenseWindowDays,
                autoUnsuspendEnabled,
                now
        );
        if (updated == 0) {
            throw new IllegalStateException("Moderation policy row is missing.");
        }
        return moderationPolicyDao.findActive()
                .orElse(
                        new ModerationPolicy(
                                strikeWindowDays,
                                strikeThreshold,
                                firstSuspensionDays,
                                repeatSuspensionDays,
                                repeatOffenseWindowDays,
                                autoUnsuspendEnabled,
                                now
                        )
                );
    }

    private void validatePolicy(
            int strikeWindowDays,
            int strikeThreshold,
            int firstSuspensionDays,
            int repeatSuspensionDays,
            int repeatOffenseWindowDays
    ) {
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
            throw new IllegalArgumentException("repeatSuspensionDays must be between " +
                                                       "firstSuspensionDays and 365");
        }
        if (repeatOffenseWindowDays < strikeWindowDays || repeatOffenseWindowDays > 730) {
            throw new IllegalArgumentException("repeatOffenseWindowDays must be between " +
                                                       "strikeWindowDays and 730");
        }
    }

    public Optional<PresignedUpload> createAvatarUploadUrl(String userId,
                                                           String contentType) {
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
        String uploadUrl = buildUploadUrl(storageKey,
                                          normalizedContentType);

        return Optional.of(new PresignedUpload(uploadUrl,
                                               storageKey));
    }

    private String buildUploadUrl(String storageKey,
                                  String contentType) {
        return buildPresignedUploadUrl(
                avatarUploadBaseUrl,
                storageKey,
                contentType,
                avatarMaxBytes,
                avatarUploadUrlTtlSeconds
        );
    }

    private UUID parseUserSearchCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }
        try {
            return UUID.fromString(cursor.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Cursor is invalid.",
                                               exception);
        }
    }

}
