package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.auth.application.SmsService;
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
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.RefreshSession;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

/**
 * Domain-unit tests for AuthService critical scenarios.
 * No Spring context. External boundaries (FacebookGraphClient, SmsService, S3) are mocked.
 * Internal DAOs are stubbed with minimal in-memory behaviour per-scenario.
 */
class AuthScenarioTests {

    // 32+ char key satisfies HMAC-SHA256 minimum key length
    private static final String TEST_JWT_SECRET = "test-jwt-secret-key-minimum-32-chars-long-xxx";
    private static final String TEST_FB_ID = "fb-user-123";
    private static final String TEST_USER_ID = UUID.randomUUID().toString();

    private FacebookGraphClient facebookGraphClient;
    private UserDao userDao;
    private ProfileDao profileDao;
    private RefreshSessionDao refreshSessionDao;
    private SuspensionEventDao suspensionEventDao;
    private ModerationPolicyDao moderationPolicyDao;
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        facebookGraphClient = mock(FacebookGraphClient.class);
        userDao = mock(UserDao.class);
        profileDao = mock(ProfileDao.class);
        refreshSessionDao = mock(RefreshSessionDao.class);
        suspensionEventDao = mock(SuspensionEventDao.class);
        moderationPolicyDao = mock(ModerationPolicyDao.class);
        jwtTokenService = new JwtTokenService(TEST_JWT_SECRET, 900L, 1209600L);

        // Safe defaults: no active suspension, no moderation policy override
        when(userDao.findSuspensionEndAt(anyString())).thenReturn(Optional.empty());
        when(moderationPolicyDao.findActive()).thenReturn(Optional.empty());
        when(profileDao.findByUserId(anyString()))
                .thenReturn(Optional.of(new UserProfileState("Test User", null, 0.0, 0, null)));
    }

    // ── SCN-AUTH-001 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-001: Dev auth enabled in production profile throws on startup")
    void devAuthEnabledInProductionProfileThrowsOnStartup() throws Throwable {
        // Given: devAuthEnabled=true, active profile is production (not dev/test/local)
        AuthService productionService = authService(true, false, "production");
        AuthService localService = authService(true, false, "local");
        AuthService testService = authService(true, false, "test");

        // When/Then: startup validation throws
        // validateOtpConfiguration is package-private; invoke via reflection
        assertThatThrownBy(() -> invokeValidateOtpConfiguration(productionService))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("must be false in production");

        invokeValidateOtpConfiguration(localService);
        invokeValidateOtpConfiguration(testService);
    }

    // ── SCN-AUTH-004 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-004: Valid Facebook OAuth token creates a CUSTOMER session")
    void validFacebookTokenCreatesCustomerSession() {
        // Given: Facebook resolves to a new identity, no existing Tasky account
        when(facebookGraphClient.debugToken(anyString())).thenReturn(TEST_FB_ID);
        when(facebookGraphClient.fetchProfile(anyString()))
                .thenReturn(new FacebookGraphClient.FacebookProfile(TEST_FB_ID, "Test User", null));
        when(userDao.findByFacebookId(TEST_FB_ID)).thenReturn(Optional.empty());

        // Capture the inserted user so findById returns it for issueSession
        Map<String, AuthUser> store = new HashMap<>();
        org.mockito.stubbing.Answer<Void> captureInsert = inv -> {
            UUID id = inv.getArgument(0);
            store.put(id.toString(), new AuthUser(
                    id.toString(), null, TEST_FB_ID, "CUSTOMER", "PENDING", "FACEBOOK",
                    Instant.now(), Instant.now()));
            return null;
        };
        org.mockito.Mockito.doAnswer(captureInsert)
                .when(userDao).insertWithFacebookId(any(UUID.class), anyString(), anyString(), anyString(), any());
        when(userDao.findById(anyString()))
                .thenAnswer(inv -> Optional.ofNullable(store.get(inv.getArgument(0).toString())));

        // When
        AuthSession session = authService(false, false).facebookLogin("valid-fb-token");

        // Then: session contains access and refresh tokens, user has CUSTOMER role
        assertThat(session.accessToken()).isNotBlank();
        assertThat(session.refreshToken()).isNotBlank();
        assertThat(session.user()).containsEntry("role", "CUSTOMER");
    }

    // ── SCN-AUTH-005 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-005: Same facebook_id authenticates the existing user without creating a duplicate account")
    void sameFacebookIdReturnsExistingUser() {
        // Given: a Tasky account already exists for this facebook_id
        AuthUser existing = new AuthUser(
                TEST_USER_ID, null, TEST_FB_ID, "CUSTOMER", "ACTIVE", "FACEBOOK",
                Instant.now(), Instant.now());
        when(facebookGraphClient.debugToken(anyString())).thenReturn(TEST_FB_ID);
        when(facebookGraphClient.fetchProfile(anyString()))
                .thenReturn(new FacebookGraphClient.FacebookProfile(TEST_FB_ID, "Test User", null));
        when(userDao.findByFacebookId(TEST_FB_ID)).thenReturn(Optional.of(existing));
        when(userDao.findById(anyString())).thenReturn(Optional.of(existing));

        // When
        AuthSession session = authService(false, false).facebookLogin("valid-fb-token");

        // Then: returned user id matches the existing account
        assertThat(session.user()).containsEntry("id", TEST_USER_ID);
        // And: insertWithFacebookId was never called
        org.mockito.Mockito.verify(userDao, org.mockito.Mockito.never())
                .insertWithFacebookId(any(UUID.class), anyString(), anyString(), anyString(), any());
    }

    // ── SCN-AUTH-006 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-006: Successful authentication issues a signed JWT with sub, role, exp, and iat claims")
    void successfulAuthenticationIssuesJwtWithRequiredClaims() {
        // Given: existing ACTIVE user
        AuthUser existing = new AuthUser(
                TEST_USER_ID, null, TEST_FB_ID, "CUSTOMER", "ACTIVE", "FACEBOOK",
                Instant.now(), Instant.now());
        when(facebookGraphClient.debugToken(anyString())).thenReturn(TEST_FB_ID);
        when(facebookGraphClient.fetchProfile(anyString()))
                .thenReturn(new FacebookGraphClient.FacebookProfile(TEST_FB_ID, "Test User", null));
        when(userDao.findByFacebookId(TEST_FB_ID)).thenReturn(Optional.of(existing));
        when(userDao.findById(anyString())).thenReturn(Optional.of(existing));

        // When
        AuthSession session = authService(false, false).facebookLogin("valid-fb-token");

        // Then: decode the access token and verify required claims
        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(TEST_JWT_SECRET.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(session.accessToken())
                .getPayload();

        assertThat(claims.getSubject()).isEqualTo(TEST_USER_ID);
        assertThat(claims.get("role")).isEqualTo("CUSTOMER");
        assertThat(claims.getExpiration()).isAfter(new java.util.Date());
        assertThat(claims.getIssuedAt()).isNotNull();
    }

    // ── SCN-AUTH-008 ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-AUTH-008: BANNED or active SUSPENDED account is denied authentication even with otherwise valid credentials")
    void bannedAccountDeniedAuthentication() {
        // Given: banned user
        AuthUser banned = new AuthUser(
                TEST_USER_ID, null, TEST_FB_ID, "CUSTOMER", "BANNED", "FACEBOOK",
                Instant.now(), Instant.now());
        when(facebookGraphClient.debugToken(anyString())).thenReturn(TEST_FB_ID);
        when(facebookGraphClient.fetchProfile(anyString()))
                .thenReturn(new FacebookGraphClient.FacebookProfile(TEST_FB_ID, "Banned User", null));
        when(userDao.findByFacebookId(TEST_FB_ID)).thenReturn(Optional.of(banned));

        // When/Then
        assertThatThrownBy(() -> authService(false, false).facebookLogin("valid-fb-token"))
                .isInstanceOf(AccountRestrictedException.class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private AuthService authService(boolean devAuthEnabled, boolean otpEnabled, String... activeProfiles) {
        Environment environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(activeProfiles);

        return new AuthService(
                jwtTokenService,
                mock(CryptoService.class),
                mock(SmsService.class),
                facebookGraphClient,
                environment,
                mock(S3PresignedUrlService.class),
                mock(StorageKeyPolicy.class),
                userDao,
                profileDao,
                mock(OtpChallengeDao.class),
                refreshSessionDao,
                mock(VerificationDao.class),
                mock(AuditEventDao.class),
                mock(StrikeDao.class),
                moderationPolicyDao,
                suspensionEventDao,
                mock(BadgeDao.class),
                new io.micrometer.core.instrument.simple.SimpleMeterRegistry(),
                devAuthEnabled,
                otpEnabled,
                300L,
                "");
    }

    /** Convenience overload: no active profiles (production-like). */
    private AuthService authService(boolean devAuthEnabled, boolean otpEnabled) {
        return authService(devAuthEnabled, otpEnabled, new String[0]);
    }

    private void invokeValidateOtpConfiguration(AuthService service) throws Throwable {
        try {
            var method = AuthService.class.getDeclaredMethod("validateOtpConfiguration");
            method.setAccessible(true);
            method.invoke(service);
        } catch (java.lang.reflect.InvocationTargetException e) {
            throw e.getCause();
        }
    }
}
