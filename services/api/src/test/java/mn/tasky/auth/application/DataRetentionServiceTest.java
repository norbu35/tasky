package mn.tasky.auth.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.storage.S3StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("DataRetentionService")
class DataRetentionServiceTest {

    @Mock
    private UserDao userDao;

    @Mock
    private VerificationDao verificationDao;

    @Mock
    private AuditEventDao auditEventDao;

    @Mock
    private FeatureToggleService featureToggleService;

    @Mock
    private S3StorageService s3StorageService;

    private DataRetentionService service;

    private static final AuthUser BANNED_USER =
            new AuthUser("u1", "phone", "fb1", "CUSTOMER", "BANNED", "FACEBOOK", Instant.now(), Instant.now());

    @BeforeEach
    void setUp() {
        service = new DataRetentionService(
                userDao, verificationDao, auditEventDao, featureToggleService, s3StorageService);
    }

    @Nested
    @DisplayName("findUsersEligibleForDeletion()")
    class FindUsersEligibleForDeletion {

        @Test
        @DisplayName("returns user with storage keys in verification records")
        void returnsUserWithStorageKeys() {
            when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(BANNED_USER));
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", "front.jpg", "back.jpg", "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            List<AuthUser> result = service.findUsersEligibleForDeletion();

            org.assertj.core.api.Assertions.assertThat(result).containsExactly(BANNED_USER);
        }

        @Test
        @DisplayName("excludes user whose verifications have no storage keys")
        void excludesUserWithNoStorageKeys() {
            when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(BANNED_USER));
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", null, null, "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            List<AuthUser> result = service.findUsersEligibleForDeletion();

            org.assertj.core.api.Assertions.assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when no banned users")
        void returnsEmptyWhenNoBannedUsers() {
            when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of());

            List<AuthUser> result = service.findUsersEligibleForDeletion();

            org.assertj.core.api.Assertions.assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("includes user with only front key")
        void includesUserWithOnlyFrontKey() {
            when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(BANNED_USER));
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", "front.jpg", null, "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            List<AuthUser> result = service.findUsersEligibleForDeletion();

            org.assertj.core.api.Assertions.assertThat(result).containsExactly(BANNED_USER);
        }
    }

    @Nested
    @DisplayName("deleteIdentityData()")
    class DeleteIdentityData {

        @Test
        @DisplayName("dry run mode does not delete or anonymize")
        void dryRunMode() {
            when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(true);
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", "front.jpg", "back.jpg", "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            service.deleteIdentityData("u1");

            verifyNoInteractions(s3StorageService);
            verify(verificationDao, never()).anonymize(anyString());
            verify(auditEventDao, never())
                    .insert((String) isNull(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("live mode deletes S3 objects, anonymizes, and audits")
        void liveMode() {
            when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(false);
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", "front.jpg", "back.jpg", "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            service.deleteIdentityData("u1");

            verify(s3StorageService).deleteObject("front.jpg");
            verify(s3StorageService).deleteObject("back.jpg");
            verify(verificationDao).anonymize("v1");
            verify(auditEventDao).insert((String) isNull(), anyString(), anyString(), eq("v1"), anyString());
        }

        @Test
        @DisplayName("skips verifications with no storage keys")
        void skipsVerificationsWithNoStorageKeys() {
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", null, null, "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            service.deleteIdentityData("u1");

            verifyNoInteractions(s3StorageService);
            verify(verificationDao, never()).anonymize(anyString());
        }

        @Test
        @DisplayName("deletes only front key when back key is null")
        void deletesOnlyFrontKey() {
            when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(false);
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", "front.jpg", null, "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));

            service.deleteIdentityData("u1");

            verify(s3StorageService).deleteObject("front.jpg");
            verify(s3StorageService, never()).deleteObject("back.jpg");
            verify(verificationDao).anonymize("v1");
        }

        @Test
        @DisplayName("handles empty verification list")
        void handlesEmptyVerificationList() {
            when(verificationDao.findByUserId("u1")).thenReturn(List.of());

            service.deleteIdentityData("u1");

            verifyNoInteractions(s3StorageService, auditEventDao);
        }
    }

    @Nested
    @DisplayName("processRetention()")
    class ProcessRetention {

        @Test
        @DisplayName("processes all eligible users")
        void processesEligibleUsers() {
            when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(BANNED_USER));
            VerificationRequest vr =
                    new VerificationRequest("v1", "u1", "front.jpg", null, "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1")).thenReturn(List.of(vr));
            when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(false);

            service.processRetention();

            verify(verificationDao).anonymize("v1");
        }

        @Test
        @DisplayName("continues processing when one user fails")
        void continuesOnFailure() {
            AuthUser user2 =
                    new AuthUser("u2", "phone2", null, "CUSTOMER", "BANNED", "OTP", Instant.now(), Instant.now());
            when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(BANNED_USER, user2));
            VerificationRequest vr1 =
                    new VerificationRequest("v1", "u1", "front1.jpg", null, "PENDING", Instant.now(), null, null);
            VerificationRequest vr2 =
                    new VerificationRequest("v2", "u2", "front2.jpg", null, "PENDING", Instant.now(), null, null);
            when(verificationDao.findByUserId("u1"))
                    .thenReturn(List.of(vr1))
                    .thenThrow(new RuntimeException("DB error"));
            when(verificationDao.findByUserId("u2")).thenReturn(List.of(vr2));
            when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(false);

            service.processRetention();

            verify(verificationDao).anonymize("v2");
        }
    }
}
