package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import mn.tasky.test.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@IntegrationTest
@DisplayName("TokenBlacklistDao")
class TokenBlacklistDaoTest {

    @Autowired
    private TokenBlacklistDao tokenBlacklistDao;

    @Test
    @DisplayName("insert and exists round-trip")
    void roundTrip() {
        String jti = "test-jti-" + java.util.UUID.randomUUID();
        Instant expiresAt = Instant.now().plusSeconds(3600);
        assertThat(tokenBlacklistDao.exists(jti)).isFalse();
        tokenBlacklistDao.insert(jti, expiresAt);
        assertThat(tokenBlacklistDao.exists(jti)).isTrue();
    }

    @Test
    @DisplayName("deleteExpired removes expired rows")
    void deleteExpired() {
        String jti = "expired-jti-" + java.util.UUID.randomUUID();
        tokenBlacklistDao.insert(jti, Instant.now().minusSeconds(60));
        assertThat(tokenBlacklistDao.exists(jti)).isTrue();
        int deleted = tokenBlacklistDao.deleteExpired(Instant.now());
        assertThat(deleted).isGreaterThanOrEqualTo(1);
        assertThat(tokenBlacklistDao.exists(jti)).isFalse();
    }

    @Test
    @DisplayName("insert is idempotent on conflict")
    void idempotent() {
        String jti = "idem-jti-" + java.util.UUID.randomUUID();
        Instant expiresAt = Instant.now().plusSeconds(3600);
        tokenBlacklistDao.insert(jti, expiresAt);
        tokenBlacklistDao.insert(jti, expiresAt);
        assertThat(tokenBlacklistDao.exists(jti)).isTrue();
    }
}
