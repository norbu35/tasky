package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Instant;
import java.util.Optional;
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
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.security.TokenBlacklistService;
import mn.tasky.common.security.dto.ParsedRefreshToken;
import mn.tasky.common.security.dto.RefreshToken;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock
    private JwtTokenService jwtTokenService;

    @Mock
    private CryptoService cryptoService;

    @Mock
    private SmsService smsService;

    @Mock
    private FacebookGraphClient facebookGraphClient;

    @Mock
    private Environment environment;

    @Mock
    private S3PresignedUrlService storageService;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    @Mock
    private UserDao userDao;

    @Mock
    private ProfileDao profileDao;

    @Mock
    private OtpChallengeDao otpChallengeDao;

    @Mock
    private RefreshSessionDao refreshSessionDao;

    @Mock
    private UserStatusResolver userStatusResolver;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private AuditEventDao auditEventDao;

    @Mock
    private Counter counter;

    private AuthService service;

    private final Instant now = Instant.now();
    private final String userId = "user-1";
    private final String phone = "+97612345678";
    private final String blindIndex = "blind-index-123";
    private final String codeHash = "code-hash-abc";
    private final String encryptedPhone = "enc-phone";

    @BeforeEach
    void setUp() {
        service = new AuthService(
                jwtTokenService,
                cryptoService,
                smsService,
                facebookGraphClient,
                environment,
                storageService,
                storageKeyPolicy,
                userDao,
                profileDao,
                otpChallengeDao,
                refreshSessionDao,
                userStatusResolver,
                meterRegistry,
                tokenBlacklistService,
                auditEventDao,
                false,
                true,
                300,
                "");
        lenient().when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(counter);
    }

    private AuthUser activeUser() {
        return new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "ACTIVE", "PHONE", now, now);
    }

    private AuthUser bannedUser() {
        return new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "BANNED", "PHONE", now, now);
    }

    private AuthUser suspendedUser() {
        return new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "SUSPENDED", "PHONE", now, now);
    }

    @Nested
    @DisplayName("validateOtpConfiguration()")
    class ValidateOtpConfiguration {

        @Test
        @DisplayName("throws when devAuth enabled in production profile")
        void throwsWhenDevAuthEnabledInProduction() {
            AuthService prodService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    true,
                    false,
                    300,
                    "");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});

            assertThatThrownBy(prodService::validateOtpConfiguration)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("dev-auth.enabled must be false in production");
        }

        @Test
        @DisplayName("throws when devAuth enabled but not in allowed profile")
        void throwsWhenDevAuthNotInAllowedProfile() {
            AuthService devService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    true,
                    false,
                    300,
                    "");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});

            assertThatThrownBy(devService::validateOtpConfiguration)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("local or test profile");
        }

        @Test
        @DisplayName("throws when otpTestCode set in production")
        void throwsWhenOtpTestCodeInProduction() {
            AuthService prodService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    false,
                    true,
                    300,
                    "123456");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});

            assertThatThrownBy(prodService::validateOtpConfiguration)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("otp-test-code must not be set");
        }

        @Test
        @DisplayName("throws when SMS not production-ready in production")
        void throwsWhenSmsNotProductionReadyInProd() {
            AuthService prodService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    false,
                    true,
                    300,
                    "");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});
            when(smsService.isProductionReady()).thenReturn(false);

            assertThatThrownBy(prodService::validateOtpConfiguration)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("production-ready SMS");
        }

        @Test
        @DisplayName("passes when dev auth in local profile")
        void passesWhenDevAuthInLocalProfile() {
            AuthService localService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    true,
                    false,
                    300,
                    "");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"local"});

            assertThatNoException().isThrownBy(localService::validateOtpConfiguration);
        }

        @Test
        @DisplayName("skips OTP checks when OTP disabled")
        void skipsOtpChecksWhenDisabled() {
            AuthService noOtpService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    false,
                    false,
                    300,
                    "123456");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});

            assertThatNoException().isThrownBy(noOtpService::validateOtpConfiguration);
        }
    }

    @Nested
    @DisplayName("requestOtp()")
    class RequestOtp {

        @Test
        @DisplayName("generates and sends OTP, returns masked phone")
        void sendsOtpAndReturnsMaskedPhone() {
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);

            String result = service.requestOtp("97612345678");

            assertThat(result).isEqualTo("+97612****");
            verify(otpChallengeDao).upsert(eq(blindIndex), anyString(), any(Instant.class));
            verify(smsService).sendOtp(eq("+97612345678"), anyString());
        }

        @Test
        @DisplayName("handles short phone number")
        void handlesShortPhone() {
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);

            String result = service.requestOtp("12");

            assertThat(result).isEqualTo("****");
        }

        @Test
        @DisplayName("handles empty phone")
        void handlesEmptyPhone() {
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);

            service.requestOtp("");

            verify(smsService).sendOtp(eq(""), anyString());
        }

        @Test
        @DisplayName("uses test code when configured")
        void usesTestCodeWhenConfigured() {
            AuthService testService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    false,
                    true,
                    300,
                    "999999");

            when(environment.getActiveProfiles()).thenReturn(new String[] {"test"});
            testService.validateOtpConfiguration();
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);

            testService.requestOtp("97612345678");

            verify(smsService).sendOtp("+97612345678", "999999");
        }
    }

    @Nested
    @DisplayName("verifyOtp()")
    class VerifyOtp {

        @Test
        @DisplayName("returns empty when no challenge found")
        void returnsEmptyWhenNoChallenge() {
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.empty());

            Optional<AuthSession> result = service.verifyOtp(phone, "123456");

            assertThat(result).isEmpty();
            verify(counter).increment();
        }

        @Test
        @DisplayName("returns empty when challenge expired")
        void returnsEmptyWhenExpired() {
            OtpChallenge expired = new OtpChallenge(codeHash, now.minusSeconds(600), 0);
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(expired));

            Optional<AuthSession> result = service.verifyOtp(phone, "123456");

            assertThat(result).isEmpty();
            verify(otpChallengeDao).delete(blindIndex);
        }

        @Test
        @DisplayName("returns empty when code mismatch and increments attempts")
        void returnsEmptyOnCodeMismatch() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);
            when(cryptoService.blindIndex("wrong-code")).thenReturn("wrong-hash");
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));

            Optional<AuthSession> result = service.verifyOtp(phone, "wrong-code");

            assertThat(result).isEmpty();
            verify(otpChallengeDao).incrementAttempts(blindIndex);
            verify(otpChallengeDao, never()).delete(blindIndex);
        }

        @Test
        @DisplayName("deletes challenge after 3 failed attempts")
        void deletesAfterThreeFailedAttempts() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 2);
            when(cryptoService.blindIndex(anyString())).thenReturn(blindIndex);
            when(cryptoService.blindIndex("wrong-code")).thenReturn("wrong-hash");
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));

            Optional<AuthSession> result = service.verifyOtp(phone, "wrong-code");

            assertThat(result).isEmpty();
            verify(otpChallengeDao).delete(blindIndex);
            verify(otpChallengeDao, never()).incrementAttempts(anyString());
        }

        @Test
        @DisplayName("returns session on successful verification")
        void returnsSessionOnSuccess() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser user = activeUser();

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(userId)).thenReturn(refreshToken);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<AuthSession> result = service.verifyOtp(phone, "123456");

            assertThat(result).isPresent();
            AuthSession session = result.get();
            assertThat(session.accessToken()).isEqualTo("access-token");
            assertThat(session.refreshToken()).isEqualTo("refresh-token");
            assertThat(session.user().get("id")).isEqualTo(userId);
            assertThat(session.user().get("role")).isEqualTo("CUSTOMER");
            verify(otpChallengeDao).delete(blindIndex);
        }

        @Test
        @DisplayName("creates new user when no existing user found")
        void createsNewUserWhenNotFound() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.empty());
            when(cryptoService.encrypt(phone)).thenReturn(encryptedPhone);
            when(userStatusResolver.resolve(anyString(), eq("PENDING"))).thenReturn("PENDING");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(anyString())).thenReturn(refreshToken);

            Optional<AuthSession> result = service.verifyOtp(phone, "123456");

            assertThat(result).isPresent();
            verify(userDao)
                    .insert(
                            anyString(),
                            eq(encryptedPhone),
                            eq(blindIndex),
                            eq("CUSTOMER"),
                            eq("PENDING"),
                            any(Instant.class));
            verify(profileDao).ensureExists(anyString(), eq("Tasky User"));
        }

        @Test
        @DisplayName("throws AccountRestrictedException for banned user")
        void throwsForBannedUser() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser user = bannedUser();

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(userId, "BANNED")).thenReturn("BANNED");

            assertThatThrownBy(() -> service.verifyOtp(phone, "123456")).isInstanceOf(AccountRestrictedException.class);
        }

        @Test
        @DisplayName("throws AccountRestrictedException for suspended user")
        void throwsForSuspendedUser() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser user = suspendedUser();

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(userId, "SUSPENDED")).thenReturn("SUSPENDED");

            assertThatThrownBy(() -> service.verifyOtp(phone, "123456")).isInstanceOf(AccountRestrictedException.class);
        }

        @Test
        @DisplayName("throws AccountRestrictedException for deleted user")
        void throwsForDeletedUser() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser user = new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "DELETED", "PHONE", now, now);

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(userId, "DELETED")).thenReturn("DELETED");

            assertThatThrownBy(() -> service.verifyOtp(phone, "123456")).isInstanceOf(AccountRestrictedException.class);
        }
    }

    @Nested
    @DisplayName("verifyOtp with Facebook access token")
    class VerifyOtpWithFacebook {

        @Test
        @DisplayName("links phone to existing Facebook user")
        void linksPhoneToFacebookUser() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser fbUser = new AuthUser("fb-user-1", null, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test User", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.empty());
            when(cryptoService.encrypt(phone)).thenReturn(encryptedPhone);
            when(userDao.findById("fb-user-1"))
                    .thenReturn(Optional.of(new AuthUser(
                            "fb-user-1", encryptedPhone, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now)));
            when(userStatusResolver.resolve("fb-user-1", "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken("fb-user-1")).thenReturn(refreshToken);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<AuthSession> result = service.verifyOtp(phone, "123456", "fb-token");

            assertThat(result).isPresent();
            verify(userDao).updatePhoneAndBlindIndex(eq("fb-user-1"), eq(encryptedPhone), eq(blindIndex));
        }

        @Test
        @DisplayName("falls back to phone user when no Facebook user found")
        void fallsBackToPhoneUser() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser phoneUser = activeUser();

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-456");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-456", "Test User", null));
            when(userDao.findByFacebookId("fb-456")).thenReturn(Optional.empty());
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(phoneUser));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(userId)).thenReturn(refreshToken);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<AuthSession> result = service.verifyOtp(phone, "123456", "fb-token");

            assertThat(result).isPresent();
        }

        @Test
        @DisplayName("throws when phone linked to different account than Facebook user")
        void throwsWhenPhoneLinkedToDifferentAccount() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser fbUser = new AuthUser("fb-user-1", null, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);
            AuthUser phoneUser =
                    new AuthUser("phone-user-1", encryptedPhone, null, "CUSTOMER", "ACTIVE", "PHONE", now, now);

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test User", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(phoneUser));

            assertThatThrownBy(() -> service.verifyOtp(phone, "123456", "fb-token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Unable to verify phone number.");
        }

        @Test
        @DisplayName("throws when Facebook user has different phone already linked")
        void throwsWhenFacebookUserHasDifferentPhone() {
            OtpChallenge challenge = new OtpChallenge(codeHash, now.plusSeconds(300), 0);
            AuthUser fbUser =
                    new AuthUser("fb-user-1", "enc-other-phone", "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);

            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(cryptoService.blindIndex("123456")).thenReturn(codeHash);
            when(otpChallengeDao.findByPhoneBlindIdx(blindIndex)).thenReturn(Optional.of(challenge));
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test User", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.empty());
            when(cryptoService.decrypt("enc-other-phone")).thenReturn("+97699999999");

            assertThatThrownBy(() -> service.verifyOtp(phone, "123456", "fb-token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Unable to verify phone number.");
        }
    }

    @Nested
    @DisplayName("facebookLogin()")
    class FacebookLogin {

        @Test
        @DisplayName("creates new user and returns session")
        void createsNewUserAndReturnsSession() {
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test User", "http://pic.url"));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.empty());
            when(userStatusResolver.resolve(anyString(), eq("PENDING"))).thenReturn("PENDING");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(anyString())).thenReturn(refreshToken);

            AuthSession session = service.facebookLogin("fb-token");

            assertThat(session.accessToken()).isEqualTo("access-token");
            assertThat(session.refreshToken()).isEqualTo("refresh-token");
            verify(userDao)
                    .insertWithFacebookId(anyString(), eq("fb-123"), eq("CUSTOMER"), eq("PENDING"), any(Instant.class));
            verify(profileDao).ensureExists(anyString(), eq("Test User"));
            verify(profileDao).updateProfileDetails(anyString(), eq("Test User"), eq("http://pic.url"), eq(null));
        }

        @Test
        @DisplayName("returns existing Facebook user session")
        void returnsExistingUserSession() {
            AuthUser fbUser =
                    new AuthUser(userId, encryptedPhone, "fb-123", "CUSTOMER", "ACTIVE", "FACEBOOK", now, now);

            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test User", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(userId)).thenReturn(refreshToken);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            AuthSession session = service.facebookLogin("fb-token");

            assertThat(session.accessToken()).isEqualTo("access-token");
        }

        @Test
        @DisplayName("throws when token user mismatch")
        void throwsWhenTokenUserMismatch() {
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-different");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test", null));

            assertThatThrownBy(() -> service.facebookLogin("fb-token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("mismatch");
        }

        @Test
        @DisplayName("throws AccountRestrictedException for banned user")
        void throwsForBannedUser() {
            AuthUser fbUser =
                    new AuthUser(userId, encryptedPhone, "fb-123", "CUSTOMER", "BANNED", "FACEBOOK", now, now);

            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.of(fbUser));
            when(userStatusResolver.resolve(userId, "BANNED")).thenReturn("BANNED");

            assertThatThrownBy(() -> service.facebookLogin("fb-token")).isInstanceOf(AccountRestrictedException.class);
        }

        @Test
        @DisplayName("re-throws AccountRestrictedException from inner catch")
        void rethrowsAccountRestricted() {
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "Test", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.empty());
            when(userStatusResolver.resolve(anyString(), eq("PENDING"))).thenReturn("BANNED");

            assertThatThrownBy(() -> service.facebookLogin("fb-token")).isInstanceOf(AccountRestrictedException.class);
        }

        @Test
        @DisplayName("creates user with default name when profile has no name")
        void createsWithDefaultNameWhenNoName() {
            when(facebookGraphClient.debugToken("fb-token")).thenReturn("fb-123");
            when(facebookGraphClient.fetchProfile("fb-token"))
                    .thenReturn(new FacebookGraphClient.FacebookProfile("fb-123", "", null));
            when(userDao.findByFacebookId("fb-123")).thenReturn(Optional.empty());
            when(userStatusResolver.resolve(anyString(), eq("PENDING"))).thenReturn("PENDING");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(anyString())).thenReturn(refreshToken);

            service.facebookLogin("fb-token");

            verify(profileDao).ensureExists(anyString(), eq("Tasky User"));
            verify(profileDao, never()).updateProfileDetails(anyString(), anyString(), any(), any());
        }
    }

    @Nested
    @DisplayName("devLogin()")
    class DevLogin {

        private AuthService devService;

        @BeforeEach
        void setUpDev() {
            devService = new AuthService(
                    jwtTokenService,
                    cryptoService,
                    smsService,
                    facebookGraphClient,
                    environment,
                    storageService,
                    storageKeyPolicy,
                    userDao,
                    profileDao,
                    otpChallengeDao,
                    refreshSessionDao,
                    userStatusResolver,
                    meterRegistry,
                    tokenBlacklistService,
                    auditEventDao,
                    true,
                    false,
                    300,
                    "");
            lenient()
                    .when(meterRegistry.counter(anyString(), any(String[].class)))
                    .thenReturn(counter);
        }

        @Test
        @DisplayName("throws for unsupported role")
        void throwsForUnsupportedRole() {
            assertThatThrownBy(() -> devService.devLogin(phone, "SUPERUSER"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Unsupported role: SUPERUSER");
        }

        @Test
        @DisplayName("returns session with default CUSTOMER role when role is null")
        void returnsSessionWithDefaultRole() {
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(activeUser()));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(userId)).thenReturn(refreshToken);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            AuthSession session = devService.devLogin(phone, null);

            assertThat(session.accessToken()).isEqualTo("access-token");
            assertThat(session.user().get("role")).isEqualTo("CUSTOMER");
        }

        @Test
        @DisplayName("updates role when different from current")
        void updatesRoleWhenDifferent() {
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(activeUser()));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("access-token");
            RefreshToken refreshToken = new RefreshToken("refresh-token", "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(userId)).thenReturn(refreshToken);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            AuthSession session = devService.devLogin(phone, "TASKER");

            verify(userDao).updateRole(userId, "TASKER");
            assertThat(session.user().get("role")).isEqualTo("TASKER");
        }

        @Test
        @DisplayName("throws for banned user")
        void throwsForBannedUser() {
            when(cryptoService.blindIndex(phone)).thenReturn(blindIndex);
            when(userDao.findByPhoneBlindIndex(blindIndex)).thenReturn(Optional.of(bannedUser()));
            when(userStatusResolver.resolve(userId, "BANNED")).thenReturn("BANNED");

            assertThatThrownBy(() -> devService.devLogin(phone, "CUSTOMER"))
                    .isInstanceOf(AccountRestrictedException.class);
        }
    }

    @Nested
    @DisplayName("refreshToken()")
    class RefreshTokenTests {

        @Test
        @DisplayName("returns empty when token cannot be parsed")
        void returnsEmptyWhenUnparsable() {
            when(jwtTokenService.parseRefreshToken("bad-token")).thenReturn(Optional.empty());

            Optional<AuthTokens> result = service.refreshToken("bad-token");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when session not found")
        void returnsEmptyWhenSessionNotFound() {
            ParsedRefreshToken parsed = new ParsedRefreshToken(userId, "token-id", now.plusSeconds(1209600));
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(parsed));
            when(refreshSessionDao.findAndDelete("token-id")).thenReturn(Optional.empty());

            Optional<AuthTokens> result = service.refreshToken("refresh-token");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when user ID mismatch")
        void returnsEmptyWhenUserIdMismatch() {
            ParsedRefreshToken parsed = new ParsedRefreshToken(userId, "token-id", now.plusSeconds(1209600));
            RefreshSession session = new RefreshSession("other-user", now.plusSeconds(1209600));
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(parsed));
            when(refreshSessionDao.findAndDelete("token-id")).thenReturn(Optional.of(session));

            Optional<AuthTokens> result = service.refreshToken("refresh-token");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when session expired")
        void returnsEmptyWhenSessionExpired() {
            ParsedRefreshToken parsed = new ParsedRefreshToken(userId, "token-id", now.minusSeconds(10));
            RefreshSession session = new RefreshSession(userId, now.minusSeconds(10));
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(parsed));
            when(refreshSessionDao.findAndDelete("token-id")).thenReturn(Optional.of(session));

            Optional<AuthTokens> result = service.refreshToken("refresh-token");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            ParsedRefreshToken parsed = new ParsedRefreshToken(userId, "token-id", now.plusSeconds(1209600));
            RefreshSession session = new RefreshSession(userId, now.plusSeconds(1209600));
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(parsed));
            when(refreshSessionDao.findAndDelete("token-id")).thenReturn(Optional.of(session));
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<AuthTokens> result = service.refreshToken("refresh-token");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when user is banned")
        void returnsEmptyWhenUserBanned() {
            ParsedRefreshToken parsed = new ParsedRefreshToken(userId, "token-id", now.plusSeconds(1209600));
            RefreshSession session = new RefreshSession(userId, now.plusSeconds(1209600));
            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(parsed));
            when(refreshSessionDao.findAndDelete("token-id")).thenReturn(Optional.of(session));
            when(userDao.findById(userId)).thenReturn(Optional.of(bannedUser()));
            when(userStatusResolver.resolve(userId, "BANNED")).thenReturn("BANNED");

            Optional<AuthTokens> result = service.refreshToken("refresh-token");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns new tokens on successful rotation")
        void returnsNewTokensOnSuccess() {
            ParsedRefreshToken parsed = new ParsedRefreshToken(userId, "token-id", now.plusSeconds(1209600));
            RefreshSession session = new RefreshSession(userId, now.plusSeconds(1209600));
            AuthUser user = activeUser();

            when(jwtTokenService.parseRefreshToken("refresh-token")).thenReturn(Optional.of(parsed));
            when(refreshSessionDao.findAndDelete("token-id")).thenReturn(Optional.of(session));
            when(userDao.findById(userId)).thenReturn(Optional.of(user));
            when(userStatusResolver.resolve(userId, "ACTIVE")).thenReturn("ACTIVE");
            when(jwtTokenService.issueAccessToken(any())).thenReturn("new-access");
            RefreshToken newRefresh = new RefreshToken("new-refresh", "new-token-id", now.plusSeconds(1209600));
            when(jwtTokenService.issueRefreshToken(userId)).thenReturn(newRefresh);
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);

            Optional<AuthTokens> result = service.refreshToken("refresh-token");

            assertThat(result).isPresent();
            assertThat(result.get().accessToken()).isEqualTo("new-access");
            assertThat(result.get().refreshToken()).isEqualTo("new-refresh");
            verify(refreshSessionDao).insert("new-token-id", userId, newRefresh.expiresAt());
        }
    }

    @Nested
    @DisplayName("logout()")
    class Logout {

        @Test
        @DisplayName("revokes token by JTI")
        void revokesToken() {
            service.logout("jti-123");
            verify(tokenBlacklistService).revoke("jti-123");
        }
    }
}
