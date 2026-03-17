package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import mn.tasky.auth.application.DataRetentionService;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.feature.FeatureToggleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class DataRetentionTests {

    private UserDao userDao;
    private VerificationDao verificationDao;
    private AuditEventDao auditEventDao;
    private FeatureToggleService featureToggleService;
    private DataRetentionService service;

    private static final String USER_ID = "00000000-0000-0000-0000-000000000001";
    private static final String VERIFICATION_ID = "00000000-0000-0000-0000-000000000010";

    @BeforeEach
    void setUp() {
        userDao = mock(UserDao.class);
        verificationDao = mock(VerificationDao.class);
        auditEventDao = mock(AuditEventDao.class);
        featureToggleService = mock(FeatureToggleService.class);
        service = new DataRetentionService(userDao, verificationDao, auditEventDao, featureToggleService);
    }

    @Test
    @DisplayName("Dry-run mode: no data deleted, log only")
    void dryRunModeNoDataDeleted() {
        when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(true);

        VerificationRequest verification = new VerificationRequest(
                VERIFICATION_ID,
                USER_ID,
                "front-key",
                "back-key",
                "APPROVED",
                Instant.now().minus(100, ChronoUnit.DAYS),
                null,
                Instant.now().minus(99, ChronoUnit.DAYS));

        when(verificationDao.findByUserId(USER_ID)).thenReturn(List.of(verification));

        service.deleteIdentityData(USER_ID);

        verify(verificationDao, never()).anonymize(anyString());
        verify(auditEventDao, never())
                .insert(anyString(), eq("IDENTITY_DATA_DELETED"), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Active mode: verification anonymized and audit event written")
    void activeModeAnonymizesAndAudits() {
        when(featureToggleService.isEnabled("data_retention_dry_run")).thenReturn(false);

        VerificationRequest verification = new VerificationRequest(
                VERIFICATION_ID,
                USER_ID,
                "front-key",
                "back-key",
                "APPROVED",
                Instant.now().minus(100, ChronoUnit.DAYS),
                null,
                Instant.now().minus(99, ChronoUnit.DAYS));

        when(verificationDao.findByUserId(USER_ID)).thenReturn(List.of(verification));

        service.deleteIdentityData(USER_ID);

        verify(verificationDao).anonymize(VERIFICATION_ID);
        verify(auditEventDao)
                .insert(
                        isNull(),
                        eq("IDENTITY_DATA_DELETED"),
                        eq("VERIFICATION"),
                        eq(VERIFICATION_ID),
                        eq("{\"user_id\":\"" + USER_ID + "\",\"verification_id\":\"" + VERIFICATION_ID + "\"}"));
    }

    @Test
    @DisplayName("User not eligible (< 90 days) is skipped")
    void userNotEligibleSkipped() {
        // User was banned only 30 days ago -- not past retention cutoff
        Instant recentUpdate = Instant.now().minus(30, ChronoUnit.DAYS);
        AuthUser recentBannedUser = new AuthUser(
                USER_ID,
                null,
                null,
                "CUSTOMER",
                "BANNED",
                "FACEBOOK",
                Instant.now().minus(365, ChronoUnit.DAYS),
                recentUpdate);

        // The DAO query filters by updated_at < cutoff, so this user won't appear
        when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of());

        List<AuthUser> eligible = service.findUsersEligibleForDeletion();

        assertThat(eligible).isEmpty();
    }

    @Test
    @DisplayName("Eligible user with storage keys is returned")
    void eligibleUserWithStorageKeysReturned() {
        AuthUser bannedUser = new AuthUser(
                USER_ID,
                null,
                null,
                "CUSTOMER",
                "BANNED",
                "FACEBOOK",
                Instant.now().minus(365, ChronoUnit.DAYS),
                Instant.now().minus(100, ChronoUnit.DAYS));

        when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(bannedUser));

        VerificationRequest verification = new VerificationRequest(
                VERIFICATION_ID,
                USER_ID,
                "front-key",
                "back-key",
                "APPROVED",
                Instant.now().minus(200, ChronoUnit.DAYS),
                null,
                Instant.now().minus(199, ChronoUnit.DAYS));
        when(verificationDao.findByUserId(USER_ID)).thenReturn(List.of(verification));

        List<AuthUser> eligible = service.findUsersEligibleForDeletion();

        assertThat(eligible).hasSize(1);
        assertThat(eligible.get(0).id()).isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("Banned user past retention but with null storage keys is not eligible")
    void bannedUserWithNullKeysNotEligible() {
        AuthUser bannedUser = new AuthUser(
                USER_ID,
                null,
                null,
                "CUSTOMER",
                "BANNED",
                "FACEBOOK",
                Instant.now().minus(365, ChronoUnit.DAYS),
                Instant.now().minus(100, ChronoUnit.DAYS));

        when(userDao.findBannedUpdatedBefore(any(Instant.class))).thenReturn(List.of(bannedUser));

        // Already anonymized -- both keys null
        VerificationRequest verification = new VerificationRequest(
                VERIFICATION_ID,
                USER_ID,
                null,
                null,
                "APPROVED",
                Instant.now().minus(200, ChronoUnit.DAYS),
                null,
                Instant.now().minus(199, ChronoUnit.DAYS));
        when(verificationDao.findByUserId(USER_ID)).thenReturn(List.of(verification));

        List<AuthUser> eligible = service.findUsersEligibleForDeletion();

        assertThat(eligible).isEmpty();
    }
}
