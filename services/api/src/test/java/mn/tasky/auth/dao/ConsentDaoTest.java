package mn.tasky.auth.dao;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import mn.tasky.test.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@IntegrationTest
@DisplayName("ConsentDao")
class ConsentDaoTest {

    @Autowired
    private ConsentDao consentDao;

    @Test
    @DisplayName("recordConsent and hasConsented round-trip")
    void roundTrip() {
        UUID userId = UUID.randomUUID();
        assertThat(consentDao.hasConsented(userId, "TOS", "1.0")).isFalse();
        consentDao.recordConsent(userId, "TOS", "1.0");
        assertThat(consentDao.hasConsented(userId, "TOS", "1.0")).isTrue();
    }

    @Test
    @DisplayName("recordConsent is idempotent on conflict")
    void idempotent() {
        UUID userId = UUID.randomUUID();
        consentDao.recordConsent(userId, "PRIVACY", "2.0");
        consentDao.recordConsent(userId, "PRIVACY", "2.0");
        assertThat(consentDao.hasConsented(userId, "PRIVACY", "2.0")).isTrue();
    }
}
