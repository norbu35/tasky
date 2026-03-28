package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.MeterRegistry;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.OtpChallengeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.security.JwtTokenService;
import mn.tasky.common.storage.S3PresignedUrlService;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;

class AuthServiceConfigurationTests {

    @Test
    void devAuthRequiresExplicitLocalOrTestProfile() {
        AuthService authService = authService(true, false, "dev");

        assertThatThrownBy(authService::validateOtpConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("explicit local or test profile");
    }

    @Test
    void devAuthAllowedForLocalProfile() {
        AuthService authService = authService(true, false, "local");

        assertThatCode(authService::validateOtpConfiguration).doesNotThrowAnyException();
    }

    private AuthService authService(boolean devAuthEnabled, boolean otpEnabled, String... activeProfiles) {
        Environment environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(activeProfiles);

        return new AuthService(
                mock(JwtTokenService.class),
                mock(CryptoService.class),
                mock(SmsService.class),
                mock(FacebookGraphClient.class),
                environment,
                mock(S3PresignedUrlService.class),
                mock(UserDao.class),
                mock(ProfileDao.class),
                mock(OtpChallengeDao.class),
                mock(RefreshSessionDao.class),
                mock(VerificationDao.class),
                mock(AuditEventDao.class),
                mock(StrikeDao.class),
                mock(ModerationPolicyDao.class),
                mock(SuspensionEventDao.class),
                mock(BadgeDao.class),
                mock(MeterRegistry.class),
                devAuthEnabled,
                otpEnabled,
                300,
                "");
    }
}
