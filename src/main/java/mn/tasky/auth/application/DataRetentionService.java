package mn.tasky.auth.application;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.feature.FeatureToggleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Handles data retention lifecycle for banned users.
 * After a 90-day retention period, identity data (ID card images, DAN references)
 * is anonymized from verification records.
 */
@Service
public class DataRetentionService {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionService.class);
    private static final Duration RETENTION_PERIOD = Duration.ofDays(90);

    private final UserDao userDao;
    private final VerificationDao verificationDao;
    private final AuditEventDao auditEventDao;
    private final FeatureToggleService featureToggleService;
    private final mn.tasky.common.storage.S3StorageService s3StorageService;

    public DataRetentionService(
            UserDao userDao,
            VerificationDao verificationDao,
            AuditEventDao auditEventDao,
            FeatureToggleService featureToggleService,
            mn.tasky.common.storage.S3StorageService s3StorageService) {
        this.userDao = userDao;
        this.verificationDao = verificationDao;
        this.auditEventDao = auditEventDao;
        this.featureToggleService = featureToggleService;
        this.s3StorageService = s3StorageService;
    }

    /**
     * Finds banned users whose retention period has elapsed and who still have
     * non-anonymized verification records (storage keys present).
     */
    public List<AuthUser> findUsersEligibleForDeletion() {
        Instant cutoff = Instant.now().minus(RETENTION_PERIOD);
        List<AuthUser> bannedUsers = userDao.findBannedUpdatedBefore(cutoff);

        List<AuthUser> eligible = new ArrayList<>();
        for (AuthUser user : bannedUsers) {
            List<VerificationRequest> verifications = verificationDao.findByUserId(user.id());
            boolean hasStorageKeys =
                    verifications.stream().anyMatch(v -> v.idCardFrontKey() != null || v.idCardBackKey() != null);
            if (hasStorageKeys) {
                eligible.add(user);
            }
        }
        return eligible;
    }

    /**
     * Anonymizes identity data for a given user's verification records.
     * Respects the {@code data_retention_dry_run} feature toggle (default: dry-run only).
     */
    public void deleteIdentityData(String userId) {
        List<VerificationRequest> verifications = verificationDao.findByUserId(userId);

        for (VerificationRequest v : verifications) {
            if (v.idCardFrontKey() == null && v.idCardBackKey() == null) {
                continue;
            }

            if (featureToggleService.isEnabled("data_retention_dry_run")) {
                log.info(
                        "[DRY-RUN] Would anonymize verification {} for user {} " + "(front_key={}, back_key={})",
                        v.id(),
                        userId,
                        v.idCardFrontKey(),
                        v.idCardBackKey());
                continue;
            }

            if (v.idCardFrontKey() != null) {
                s3StorageService.deleteObject(v.idCardFrontKey());
            }
            if (v.idCardBackKey() != null) {
                s3StorageService.deleteObject(v.idCardBackKey());
            }
            verificationDao.anonymize(v.id());

            auditEventDao.insert(
                    null,
                    "IDENTITY_DATA_DELETED",
                    "VERIFICATION",
                    v.id(),
                    "{\"user_id\":\"" + userId + "\",\"verification_id\":\"" + v.id() + "\"}");

            log.info("Anonymized verification {} for user {}", v.id(), userId);
        }
    }

    /**
     * Main retention processing: finds eligible users and anonymizes their data.
     */
    public void processRetention() {
        List<AuthUser> eligible = findUsersEligibleForDeletion();
        log.info("Data retention: found {} users eligible for identity data deletion", eligible.size());

        for (AuthUser user : eligible) {
            try {
                deleteIdentityData(user.id());
            } catch (Exception e) {
                log.error("Failed to process retention for user {}", user.id(), e);
            }
        }
    }
}
