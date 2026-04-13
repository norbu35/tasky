package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.VerificationService;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationRequest;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Domain-unit tests for VerificationService.
 * Covers submission lifecycle, approval/rejection transitions, upload URL generation,
 * and query operations.
 */
@ExtendWith(MockitoExtension.class)
class VerificationServiceTests {

    private static final String USER_ID = UUID.randomUUID().toString();
    private static final String VERIFICATION_ID = UUID.randomUUID().toString();

    @Mock private UserDao userDao;
    @Mock private ProfileDao profileDao;
    @Mock private VerificationDao verificationDao;
    @Mock private S3PresignedUrlService storageService;
    @Mock private StorageKeyPolicy storageKeyPolicy;
    @Mock private CryptoService cryptoService;

    private VerificationService service;

    private AuthUser taskerUser() {
        return new AuthUser(USER_ID, "encrypted-phone", null, "TASKER", "ACTIVE", "FACEBOOK",
                Instant.now(), Instant.now());
    }

    private AuthUser customerUser() {
        return new AuthUser(USER_ID, null, null, "CUSTOMER", "ACTIVE", "FACEBOOK",
                Instant.now(), Instant.now());
    }

    @BeforeEach
    void setUp() {
        service = new VerificationService(
                userDao, profileDao, verificationDao, storageService, storageKeyPolicy, cryptoService);
    }

    // ── submitVerification ─────────────────────────────────────────────────

    @Nested
    @DisplayName("submitVerification")
    class SubmitVerification {

        @Test
        @DisplayName("Returns USER_NOT_FOUND when user does not exist")
        void userNotFound() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());

            VerificationSubmitResult result = service.submitVerification(USER_ID, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.USER_NOT_FOUND);
        }

        @Test
        @DisplayName("Returns NOT_TASKER when user is CUSTOMER")
        void notTasker() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(customerUser()));

            VerificationSubmitResult result = service.submitVerification(USER_ID, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.NOT_TASKER);
        }

        @Test
        @DisplayName("Returns CONFLICT when PENDING verification already exists")
        void conflictWithPending() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(verificationDao.findLatestByUserId(USER_ID))
                    .thenReturn(Optional.of(new VerificationRequest(
                            "old-id", USER_ID, "f", "b", "PENDING", Instant.now(), null, null)));

            VerificationSubmitResult result = service.submitVerification(USER_ID, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.CONFLICT);
        }

        @Test
        @DisplayName("Returns CONFLICT when APPROVED verification already exists")
        void conflictWithApproved() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(verificationDao.findLatestByUserId(USER_ID))
                    .thenReturn(Optional.of(new VerificationRequest(
                            "old-id", USER_ID, "f", "b", "APPROVED", Instant.now(), null, Instant.now())));

            VerificationSubmitResult result = service.submitVerification(USER_ID, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.CONFLICT);
        }

        @Test
        @DisplayName("Successful submission returns SUCCESS with PENDING status")
        void successfulSubmission() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(verificationDao.findLatestByUserId(USER_ID)).thenReturn(Optional.empty());

            VerificationSubmitResult result = service.submitVerification(USER_ID, "front-key", "back-key", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.SUCCESS);
            assertThat(result.statusResponse()).isNotNull();
            assertThat(result.statusResponse().status()).isEqualTo("PENDING");
            verify(verificationDao).insert(
                    anyString(), eq(USER_ID), eq("front-key"), eq("back-key"),
                    eq("PENDING"), any(Instant.class), any(), any(), eq("v1"), any(Instant.class), any());
        }

        @Test
        @DisplayName("Resubmission allowed after REJECTED verification")
        void resubmissionAfterRejection() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(verificationDao.findLatestByUserId(USER_ID))
                    .thenReturn(Optional.of(new VerificationRequest(
                            "old-id", USER_ID, "f", "b", "REJECTED", Instant.now(), "bad photo", Instant.now())));

            VerificationSubmitResult result = service.submitVerification(USER_ID, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.SUCCESS);
        }
    }

    // ── approveVerification ────────────────────────────────────────────────

    @Nested
    @DisplayName("approveVerification")
    class ApproveVerification {

        @Test
        @DisplayName("Approval marks user VERIFIED and returns detail")
        void approvalMarksVerified() {
            VerificationRequest pending = new VerificationRequest(
                    VERIFICATION_ID, USER_ID, "front", "back", "PENDING", Instant.now(), null, null);
            when(verificationDao.findById(VERIFICATION_ID)).thenReturn(Optional.of(pending));
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(profileDao.findByUserId(USER_ID)).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(cryptoService.decrypt("encrypted-phone")).thenReturn("+97699001122");

            Optional<VerificationDetail> result = service.approveVerification(VERIFICATION_ID);

            assertThat(result).isPresent();
            assertThat(result.get().status()).isEqualTo("APPROVED");
            verify(userDao).updateStatus(USER_ID, "VERIFIED");
            verify(verificationDao).updateStatus(eq(VERIFICATION_ID), eq("APPROVED"), any(), any(Instant.class));
        }

        @Test
        @DisplayName("Returns empty when verification does not exist")
        void missingVerificationReturnsEmpty() {
            when(verificationDao.findById(VERIFICATION_ID)).thenReturn(Optional.empty());

            assertThat(service.approveVerification(VERIFICATION_ID)).isEmpty();
        }

        @Test
        @DisplayName("Returns empty when verification is not PENDING")
        void nonPendingReturnsEmpty() {
            VerificationRequest approved = new VerificationRequest(
                    VERIFICATION_ID, USER_ID, "f", "b", "APPROVED", Instant.now(), null, Instant.now());
            when(verificationDao.findById(VERIFICATION_ID)).thenReturn(Optional.of(approved));

            assertThat(service.approveVerification(VERIFICATION_ID)).isEmpty();
        }
    }

    // ── rejectVerification ─────────────────────────────────────────────────

    @Nested
    @DisplayName("rejectVerification")
    class RejectVerification {

        @Test
        @DisplayName("Rejection does NOT mark user as VERIFIED")
        void rejectionDoesNotVerifyUser() {
            VerificationRequest pending = new VerificationRequest(
                    VERIFICATION_ID, USER_ID, "front", "back", "PENDING", Instant.now(), null, null);
            when(verificationDao.findById(VERIFICATION_ID)).thenReturn(Optional.of(pending));
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(profileDao.findByUserId(USER_ID)).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(cryptoService.decrypt("encrypted-phone")).thenReturn("+97699001122");

            Optional<VerificationDetail> result = service.rejectVerification(VERIFICATION_ID, "Blurry photo");

            assertThat(result).isPresent();
            assertThat(result.get().status()).isEqualTo("REJECTED");
            verify(userDao, never()).updateStatus(anyString(), eq("VERIFIED"));
            verify(verificationDao).updateStatus(eq(VERIFICATION_ID), eq("REJECTED"), eq("Blurry photo"), any(Instant.class));
        }
    }

    // ── getVerificationStatus ──────────────────────────────────────────────

    @Nested
    @DisplayName("getVerificationStatus")
    class GetVerificationStatus {

        @Test
        @DisplayName("Returns NOT_SUBMITTED when no verification exists")
        void returnsNotSubmitted() {
            when(verificationDao.findLatestByUserId(USER_ID)).thenReturn(Optional.empty());

            VerificationStatusResponse response = service.getVerificationStatus(USER_ID);

            assertThat(response.status()).isEqualTo("NOT_SUBMITTED");
        }

        @Test
        @DisplayName("Returns latest verification status")
        void returnsLatestStatus() {
            when(verificationDao.findLatestByUserId(USER_ID))
                    .thenReturn(Optional.of(new VerificationRequest(
                            "id", USER_ID, "f", "b", "PENDING", Instant.parse("2026-04-10T00:00:00Z"), null, null)));

            VerificationStatusResponse response = service.getVerificationStatus(USER_ID);

            assertThat(response.status()).isEqualTo("PENDING");
            assertThat(response.submittedAt()).contains("2026-04-10");
        }
    }

    // ── createVerificationUploadUrl ────────────────────────────────────────

    @Nested
    @DisplayName("createVerificationUploadUrl")
    class CreateVerificationUploadUrl {

        @Test
        @DisplayName("Returns URL for image/jpeg")
        void jpegReturnsUrl() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.VERIFICATION, USER_ID, "jpg"))
                    .thenReturn("verification/key.jpg");
            when(storageService.generateUploadUrl("verification/key.jpg", "image/jpeg"))
                    .thenReturn("https://s3/upload");

            Optional<PresignedUpload> result = service.createVerificationUploadUrl(USER_ID, "image/jpeg");

            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://s3/upload");
        }

        @Test
        @DisplayName("Returns empty for unsupported image/webp (only jpeg/png allowed)")
        void webpNotSupported() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));

            assertThat(service.createVerificationUploadUrl(USER_ID, "image/webp")).isEmpty();
        }

        @Test
        @DisplayName("Returns empty when user does not exist")
        void missingUserReturnsEmpty() {
            when(userDao.findById(USER_ID)).thenReturn(Optional.empty());
            assertThat(service.createVerificationUploadUrl(USER_ID, "image/jpeg")).isEmpty();
        }
    }

    // ── verificationExists ────────────────────────────────────────────────

    @Nested
    @DisplayName("verificationExists")
    class VerificationExists {

        @Test
        @DisplayName("Returns true when verification exists")
        void existsReturnsTrue() {
            when(verificationDao.findById(VERIFICATION_ID))
                    .thenReturn(Optional.of(new VerificationRequest(
                            VERIFICATION_ID, USER_ID, "f", "b", "PENDING", Instant.now(), null, null)));

            assertThat(service.verificationExists(VERIFICATION_ID)).isTrue();
        }

        @Test
        @DisplayName("Returns false when verification does not exist")
        void missingReturnsFalse() {
            when(verificationDao.findById(VERIFICATION_ID)).thenReturn(Optional.empty());

            assertThat(service.verificationExists(VERIFICATION_ID)).isFalse();
        }
    }

    // ── listPendingVerifications ───────────────────────────────────────────

    @Nested
    @DisplayName("listPendingVerifications")
    class ListPendingVerifications {

        @Test
        @DisplayName("Returns mapped verification details")
        void returnsMappedDetails() {
            VerificationRequest request = new VerificationRequest(
                    VERIFICATION_ID, USER_ID, "front-key", "back-key", "PENDING", Instant.now(), null, null);
            when(verificationDao.findPending(null, 10)).thenReturn(List.of(request));
            when(userDao.findById(USER_ID)).thenReturn(Optional.of(taskerUser()));
            when(profileDao.findByUserId(USER_ID))
                    .thenReturn(Optional.of(new UserProfileState("Test User", null, 0.0, 0, null)));
            when(cryptoService.decrypt("encrypted-phone")).thenReturn("+97699001122");
            when(storageService.generateDownloadUrl("front-key", StorageKeyPolicy.Namespace.VERIFICATION))
                    .thenReturn("https://s3/front");
            when(storageService.generateDownloadUrl("back-key", StorageKeyPolicy.Namespace.VERIFICATION))
                    .thenReturn("https://s3/back");

            List<VerificationDetail> results = service.listPendingVerifications(null, 10);

            assertThat(results).hasSize(1);
            VerificationDetail detail = results.getFirst();
            assertThat(detail.userName()).isEqualTo("Test User");
            assertThat(detail.userPhone()).isEqualTo("+97699001122");
            assertThat(detail.idCardFrontUrl()).isEqualTo("https://s3/front");
            assertThat(detail.idCardBackUrl()).isEqualTo("https://s3/back");
        }
    }
}
