package mn.tasky.auth.application;

import java.util.UUID;
import mn.tasky.auth.dao.ConsentDao;
import mn.tasky.common.audit.AuditEventDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentService {

    private static final Logger log = LoggerFactory.getLogger(ConsentService.class);
    private static final String POLICY_TOS = "TOS";
    private static final String POLICY_PRIVACY = "PRIVACY";

    private final ConsentDao consentDao;
    private final AuditEventDao auditEventDao;

    public ConsentService(ConsentDao consentDao, AuditEventDao auditEventDao) {
        this.consentDao = consentDao;
        this.auditEventDao = auditEventDao;
    }

    @Transactional
    public void recordConsent(UUID userId, String tosVersion, String privacyVersion) {
        String userIdStr = userId.toString();
        if (tosVersion != null && !tosVersion.isBlank()) {
            consentDao.recordConsent(userId, POLICY_TOS, tosVersion);
            auditEventDao.insert(userIdStr, "TOS_CONSENT_ACCEPTED", "user", userIdStr, null);
            log.info("TOS consent recorded for user {} version {}", userId, tosVersion);
        }
        if (privacyVersion != null && !privacyVersion.isBlank()) {
            consentDao.recordConsent(userId, POLICY_PRIVACY, privacyVersion);
            auditEventDao.insert(userIdStr, "PRIVACY_CONSENT_ACCEPTED", "user", userIdStr, null);
            log.info("Privacy consent recorded for user {} version {}", userId, privacyVersion);
        }
    }

    public boolean hasTosConsent(UUID userId, String version) {
        return consentDao.hasConsented(userId, POLICY_TOS, version);
    }

    public boolean hasPrivacyConsent(UUID userId, String version) {
        return consentDao.hasConsented(userId, POLICY_PRIVACY, version);
    }
}
