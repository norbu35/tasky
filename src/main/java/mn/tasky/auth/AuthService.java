package mn.tasky.auth;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.security.JwtTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private static final String DEFAULT_PROFILE_NAME = "Tasky User";
    private static final Map<String, String> AVATAR_EXTENSION_BY_CONTENT_TYPE = Map.of(
        "image/jpeg", "jpg",
        "image/png", "png",
        "image/webp", "webp"
    );

    private final JwtTokenService jwtTokenService;
    private final long otpTtlSeconds;
    private final String staticOtpCode;
    private final String avatarUploadBaseUrl;
    private final long avatarMaxBytes;
    private final long avatarUploadUrlTtlSeconds;

    private final ConcurrentHashMap<String, AuthUser> usersByPhone = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AuthUser> usersById = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UserProfileState> profileByUserId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, OtpChallenge> otpChallengesByPhone = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RefreshSession> refreshSessionsByTokenId = new ConcurrentHashMap<>();

    public AuthService(
        JwtTokenService jwtTokenService,
        @Value("${tasky.auth.otp-ttl-seconds:300}") long otpTtlSeconds,
        @Value("${tasky.auth.otp-code:123456}") String staticOtpCode,
        @Value("${tasky.storage.avatar-upload-base-url:https://upload.tasky.local}") String avatarUploadBaseUrl,
        @Value("${tasky.storage.avatar-max-bytes:5242880}") long avatarMaxBytes,
        @Value("${tasky.storage.avatar-upload-url-ttl-seconds:900}") long avatarUploadUrlTtlSeconds
    ) {
        this.jwtTokenService = jwtTokenService;
        this.otpTtlSeconds = otpTtlSeconds;
        this.staticOtpCode = staticOtpCode;
        this.avatarUploadBaseUrl = avatarUploadBaseUrl;
        this.avatarMaxBytes = avatarMaxBytes;
        this.avatarUploadUrlTtlSeconds = avatarUploadUrlTtlSeconds;
    }

    public String requestOtp(String rawPhone) {
        String phone = normalizePhone(rawPhone);
        ensureUser(phone);

        otpChallengesByPhone.put(
            phone,
            new OtpChallenge(staticOtpCode, Instant.now().plusSeconds(otpTtlSeconds))
        );

        return maskPhone(phone);
    }

    public Optional<AuthSession> verifyOtp(String rawPhone, String code) {
        String phone = normalizePhone(rawPhone);
        OtpChallenge challenge = otpChallengesByPhone.get(phone);
        if (challenge == null) {
            return Optional.empty();
        }

        if (challenge.expiresAt().isBefore(Instant.now())) {
            otpChallengesByPhone.remove(phone);
            return Optional.empty();
        }

        if (!challenge.code().equals(code)) {
            return Optional.empty();
        }

        otpChallengesByPhone.remove(phone);
        AuthUser user = ensureUser(phone);
        return Optional.of(issueSession(user));
    }

    public Optional<AuthTokens> refreshToken(String refreshToken) {
        Optional<JwtTokenService.ParsedRefreshToken> parsedOpt = jwtTokenService.parseRefreshToken(
            refreshToken
        );
        if (parsedOpt.isEmpty()) {
            return Optional.empty();
        }

        JwtTokenService.ParsedRefreshToken parsed = parsedOpt.get();
        RefreshSession session = refreshSessionsByTokenId.remove(parsed.tokenId());
        if (session == null) {
            return Optional.empty();
        }

        if (!session.userId().equals(parsed.userId()) || session.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }

        AuthUser user = usersById.get(parsed.userId());
        if (user == null) {
            return Optional.empty();
        }

        AuthSession rotated = issueSession(user);
        return Optional.of(new AuthTokens(rotated.accessToken(), rotated.refreshToken()));
    }

    public Optional<UserProfile> getProfile(String userId) {
        AuthUser user = usersById.get(userId);
        if (user == null) {
            return Optional.empty();
        }

        UserProfileState profile = profileByUserId.computeIfAbsent(
            user.id(),
            ignored -> UserProfileState.defaultState()
        );
        return Optional.of(toProfile(user, profile));
    }

    public Optional<UserProfile> updateProfile(String userId, ProfileUpdate update) {
        AuthUser user = usersById.get(userId);
        if (user == null) {
            return Optional.empty();
        }

        profileByUserId.compute(user.id(), (ignored, current) -> {
            UserProfileState baseline = current != null ? current : UserProfileState.defaultState();
            String fullName = update.fullName() != null ? update.fullName().trim() : baseline.fullName();
            String avatarUrl = update.avatarUrl() != null ? update.avatarUrl().trim() : baseline.avatarUrl();

            return new UserProfileState(
                fullName,
                avatarUrl,
                baseline.ratingAvg(),
                baseline.completedTasks()
            );
        });

        return getProfile(user.id());
    }

    public Optional<PresignedUpload> createAvatarUploadUrl(String userId, String contentType) {
        AuthUser user = usersById.get(userId);
        if (user == null) {
            return Optional.empty();
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = AVATAR_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = "uploads/avatars/" +
            user.id() +
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
        JwtTokenService.RefreshToken refreshToken = jwtTokenService.issueRefreshToken(user.id());

        refreshSessionsByTokenId.put(
            refreshToken.tokenId(),
            new RefreshSession(user.id(), refreshToken.expiresAt())
        );

        return new AuthSession(
            accessToken,
            refreshToken.token(),
            Map.of(
                "id", user.id(),
                "phone", user.phone(),
                "role", user.role(),
                "status", user.status(),
                "created_at", user.createdAt().toString()
            )
        );
    }

    private AuthUser ensureUser(String phone) {
        return usersByPhone.computeIfAbsent(phone, key -> {
            AuthUser created = new AuthUser(
                UUID.randomUUID().toString(),
                key,
                "CUSTOMER",
                "PENDING",
                Instant.now()
            );
            usersById.put(created.id(), created);
            profileByUserId.put(created.id(), UserProfileState.defaultState());
            return created;
        });
    }

    private UserProfile toProfile(AuthUser user, UserProfileState profile) {
        boolean isPro = profile.completedTasks() > 5 && profile.ratingAvg() > 4.5d;
        return new UserProfile(
            user.id(),
            user.phone(),
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

    private String buildUploadUrl(String storageKey, String contentType) {
        String baseUrl = avatarUploadBaseUrl.endsWith("/")
            ? avatarUploadBaseUrl.substring(0, avatarUploadBaseUrl.length() - 1)
            : avatarUploadBaseUrl;

        return baseUrl +
            "/presigned-upload?key=" +
            URLEncoder.encode(storageKey, StandardCharsets.UTF_8) +
            "&content_type=" +
            URLEncoder.encode(contentType, StandardCharsets.UTF_8) +
            "&max_bytes=" +
            avatarMaxBytes +
            "&expires_in=" +
            avatarUploadUrlTtlSeconds;
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) {
            return "****";
        }
        return phone.substring(0, Math.min(6, phone.length())) + "****";
    }

    private record AuthUser(
        String id,
        String phone,
        String role,
        String status,
        Instant createdAt
    ) {
    }

    private record OtpChallenge(String code, Instant expiresAt) {
    }

    private record RefreshSession(String userId, Instant expiresAt) {
    }

    private record UserProfileState(
        String fullName,
        String avatarUrl,
        double ratingAvg,
        int completedTasks
    ) {

        private static UserProfileState defaultState() {
            return new UserProfileState(DEFAULT_PROFILE_NAME, null, 0.0d, 0);
        }
    }

    public record AuthSession(String accessToken, String refreshToken, Map<String, String> user) {
    }

    public record AuthTokens(String accessToken, String refreshToken) {
    }

    public record ProfileUpdate(String fullName, String avatarUrl) {
    }

    public record UserProfile(
        String id,
        String phone,
        String role,
        String status,
        String fullName,
        String avatarUrl,
        double ratingAvg,
        int completedTasks,
        boolean isPro,
        String createdAt
    ) {
    }

    public record PresignedUpload(String uploadUrl, String storageKey) {
    }
}
