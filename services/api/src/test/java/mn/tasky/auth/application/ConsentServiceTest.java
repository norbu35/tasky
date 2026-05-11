package mn.tasky.auth.application;

import static org.mockito.Mockito.verify;

import java.util.UUID;
import mn.tasky.auth.dao.AuditEventDao;
import mn.tasky.auth.dao.ConsentDao;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ConsentService")
class ConsentServiceTest {

    @Mock
    private ConsentDao consentDao;

    @Mock
    private AuditEventDao auditEventDao;

    private ConsentService service;

    @BeforeEach
    void setUp() {
        service = new ConsentService(consentDao, auditEventDao);
    }

    @Test
    @DisplayName("recordConsent persists TOS consent")
    void recordConsentTos() {
        UUID userId = UUID.randomUUID();
        service.recordConsent(userId, "1.0", null);
        verify(consentDao).recordConsent(userId, "TOS", "1.0");
        verify(auditEventDao).insert(userId.toString(), "TOS_CONSENT_ACCEPTED", "user", userId.toString(), null);
    }

    @Test
    @DisplayName("recordConsent persists privacy consent")
    void recordConsentPrivacy() {
        UUID userId = UUID.randomUUID();
        service.recordConsent(userId, null, "2.0");
        verify(consentDao).recordConsent(userId, "PRIVACY", "2.0");
        verify(auditEventDao).insert(userId.toString(), "PRIVACY_CONSENT_ACCEPTED", "user", userId.toString(), null);
    }

    @Test
    @DisplayName("recordConsent skips blank version")
    void recordConsentSkipsBlank() {
        UUID userId = UUID.randomUUID();
        service.recordConsent(userId, "  ", "  ");
        verifyNoConsentInteractions();
    }

    @Test
    @DisplayName("hasTosConsent delegates to dao")
    void hasTosConsent() {
        UUID userId = UUID.randomUUID();
        service.hasTosConsent(userId, "1.0");
        verify(consentDao).hasConsented(userId, "TOS", "1.0");
    }

    @Test
    @DisplayName("hasPrivacyConsent delegates to dao")
    void hasPrivacyConsent() {
        UUID userId = UUID.randomUUID();
        service.hasPrivacyConsent(userId, "2.0");
        verify(consentDao).hasConsented(userId, "PRIVACY", "2.0");
    }

    private void verifyNoConsentInteractions() {
        org.mockito.Mockito.verifyNoInteractions(consentDao);
    }
}
