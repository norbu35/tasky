package mn.tasky.auth.application;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import mn.tasky.auth.AccountRestrictedException;
import mn.tasky.auth.dao.OtpChallengeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthTokens;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.OtpChallenge;
import mn.tasky.auth.dto.RefreshSession;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import mn.tasky.common.security.dto.RefreshToken;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
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

    private static final Set<String> DEV_AUTH_ALLOWED_ROLES = Set.of("CUSTOMER", "TASKER", "ADMIN");
    private static final Set<String> NON_PROD_PROFILES = Set.of("dev", "test", "local");
    private static final Set<String> DEV_AUTH_ALLOWED_PROFILES = Set.of("local", "test");

    private final JwtTokenService jwtTokenService;
    private final CryptoService cryptoService;
    private final SmsService smsService;
    private final FacebookGraphClient facebookGraphClient;
    private final Environment environment;
    private final S3PresignedUrlService storageService;
    private final StorageKeyPolicy storageKeyPolicy;
    private final boolean devAuthEnabled;
    private final boolean otpEnabled;
    private final long otpTtlSeconds;
    private final String otpTestCode;
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserDao userDao;
    private final ProfileDao profileDao;
    private final OtpChallengeDao otpChallengeDao;
    private final RefreshSessionDao refreshSessionDao;
    private final UserStatusResolver userStatusResolver;
    private final MeterRegistry meterRegistry;

    public AuthService(
            JwtTokenService jwtTokenService,
            CryptoService cryptoService,
            SmsService smsService,
            FacebookGraphClient facebookGraphClient,
            Environment environment,
            S3PresignedUrlService storageService,
            StorageKeyPolicy storageKeyPolicy,
            UserDao userDao,
            ProfileDao profileDao,
            OtpChallengeDao otpChallengeDao,
            RefreshSessionDao refreshSessionDao,
            UserStatusResolver userStatusResolver,
            MeterRegistry meterRegistry,
            @Value("${tasky.dev-auth.enabled:false}") boolean devAuthEnabled,
            @Value("${tasky.otp.enabled:false}") boolean otpEnabled,
            @Value("${tasky.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
            @Value("${tasky.auth.otp-test-code:}") String otpTestCode) {
        this.jwtTokenService = jwtTokenService;
        this.cryptoService = cryptoService;
        this.smsService = smsService;
        this.facebookGraphClient = facebookGraphClient;
        this.environment = environment;
        this.storageService = storageService;
        this.storageKeyPolicy = storageKeyPolicy;
        this.userDao = userDao;
        this.profileDao = profileDao;
        this.otpChallengeDao = otpChallengeDao;
        this.refreshSessionDao = refreshSessionDao;
        this.userStatusResolver = userStatusResolver;
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
        if (devAuthEnabled && !isDevAuthAllowedProfile()) {
            throw new IllegalStateException("tasky.dev-auth.enabled requires an explicit local or test profile.");
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

    private boolean isDevAuthAllowedProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .map(profile -> profile.toLowerCase(Locale.ROOT))
                .anyMatch(DEV_AUTH_ALLOWED_PROFILES::contains);
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

        String codeHash = cryptoService.blindIndex(otpCode);
        otpChallengeDao.upsert(blindIndex, codeHash, Instant.now().plusSeconds(otpTtlSeconds));
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
            AuthUser user = existing.get();
            if (!StringUtils.hasText(user.phone())) {
                String encryptedPhone = cryptoService.encrypt(phone);
                Instant now = Instant.now();
                userDao.updatePhoneAndBlindIndex(user.id(), encryptedPhone, blindIndex);
                return new AuthUser(
                        user.id(),
                        encryptedPhone,
                        user.facebookId(),
                        user.role(),
                        user.status(),
                        user.primaryAuth(),
                        user.createdAt(),
                        now);
            }
            return user;
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
            meterRegistry
                    .counter("tasky.auth.login_attempts", "method", "otp", "result", "failure")
                    .increment();
            return Optional.empty();
        }

        OtpChallenge challenge = challengeOpt.get();
        if (challenge.expiresAt().isBefore(Instant.now())) {
            otpChallengeDao.delete(blindIndex);
            meterRegistry
                    .counter("tasky.auth.login_attempts", "method", "otp", "result", "failure")
                    .increment();
            return Optional.empty();
        }

        String submittedHash = cryptoService.blindIndex(code);
        if (!constantTimeEquals(challenge.code(), submittedHash)) {
            int attempts = challenge.attempts() + 1;
            if (attempts >= 3) {
                otpChallengeDao.delete(blindIndex);
            } else {
                otpChallengeDao.incrementAttempts(blindIndex);
            }
            meterRegistry
                    .counter("tasky.auth.login_attempts", "method", "otp", "result", "failure")
                    .increment();
            return Optional.empty();
        }

        otpChallengeDao.delete(blindIndex);
        AuthUser user = resolveOtpUser(phone, blindIndex, facebookAccessToken);
        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
        if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
            meterRegistry
                    .counter("tasky.auth.login_attempts", "method", "otp", "result", "failure")
                    .increment();
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
        meterRegistry
                .counter("tasky.auth.login_attempts", "method", "otp", "result", "success")
                .increment();
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

    private AuthSession issueSession(AuthUser user) {
        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
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
            String debugTokenUserId = facebookGraphClient.debugToken(token);
            FacebookGraphClient.FacebookProfile profile = facebookGraphClient.fetchProfile(token);
            if (debugTokenUserId != null && !debugTokenUserId.equals(profile.facebookId())) {
                throw new IllegalArgumentException("Facebook token user mismatch.");
            }

            AuthUser user = ensureUserByFacebookId(profile.facebookId(), profile);
            String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
            if ("BANNED".equals(effectiveStatus) || "SUSPENDED".equals(effectiveStatus)) {
                meterRegistry
                        .counter("tasky.auth.login_attempts", "method", "facebook", "result", "failure")
                        .increment();
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
            meterRegistry
                    .counter("tasky.auth.login_attempts", "method", "facebook", "result", "success")
                    .increment();
            return issueSession(effectiveUser);
        } catch (AccountRestrictedException e) {
            throw e;
        } catch (Exception e) {
            meterRegistry
                    .counter("tasky.auth.login_attempts", "method", "facebook", "result", "failure")
                    .increment();
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
        if (!DEV_AUTH_ALLOWED_ROLES.contains(normalizedRole)) {
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

        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
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
        String effectiveStatus = userStatusResolver.resolve(user.id(), user.status());
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
}
