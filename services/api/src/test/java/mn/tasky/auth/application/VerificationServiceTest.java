package mn.tasky.auth.application;

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

@ExtendWith(MockitoExtension.class)
@DisplayName("VerificationService")
class VerificationServiceTest {

    @Mock
    private UserDao userDao;

    @Mock
    private ProfileDao profileDao;

    @Mock
    private VerificationDao verificationDao;

    @Mock
    private S3PresignedUrlService storageService;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    @Mock
    private CryptoService cryptoService;

    private VerificationService service;

    private final Instant now = Instant.now();
    private final String userId = "user-1";
    private final String encryptedPhone = "enc-phone";
    private final String phone = "+97612345678";

    private final AuthUser taskerUser =
            new AuthUser(userId, encryptedPhone, null, "TASKER", "ACTIVE", "PHONE", now, now);

    @BeforeEach
    void setUp() {
        service = new VerificationService(
                userDao, profileDao, verificationDao, storageService, storageKeyPolicy, cryptoService);
    }

    @Nested
    @DisplayName("createVerificationUploadUrl()")
    class CreateVerificationUploadUrl {

        @Test
        @DisplayName("returns empty when user not found")
        void returnsEmptyWhenUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            Optional<PresignedUpload> result = service.createVerificationUploadUrl(userId, "image/jpeg");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty for unsupported content type")
        void returnsEmptyForUnsupportedContentType() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));

            Optional<PresignedUpload> result = service.createVerificationUploadUrl(userId, "image/webp");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns upload URL for JPEG")
        void returnsUploadUrlForJpeg() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.VERIFICATION, userId, "jpg"))
                    .thenReturn("uploads/verification/user-1/test.jpg");
            when(storageService.generateUploadUrl("uploads/verification/user-1/test.jpg", "image/jpeg"))
                    .thenReturn("https://upload.url");

            Optional<PresignedUpload> result = service.createVerificationUploadUrl(userId, "image/jpeg");

            assertThat(result).isPresent();
            assertThat(result.get().uploadUrl()).isEqualTo("https://upload.url");
        }

        @Test
        @DisplayName("returns upload URL for PNG")
        void returnsUploadUrlForPng() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.VERIFICATION, userId, "png"))
                    .thenReturn("uploads/verification/user-1/test.png");
            when(storageService.generateUploadUrl("uploads/verification/user-1/test.png", "image/png"))
                    .thenReturn("https://upload.url");

            Optional<PresignedUpload> result = service.createVerificationUploadUrl(userId, "image/png");

            assertThat(result).isPresent();
        }

        @Test
        @DisplayName("normalizes content type to lowercase")
        void normalizesContentType() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(storageKeyPolicy.createKey(StorageKeyPolicy.Namespace.VERIFICATION, userId, "jpg"))
                    .thenReturn("uploads/verification/user-1/test.jpg");
            when(storageService.generateUploadUrl(anyString(), eq("image/jpeg")))
                    .thenReturn("https://upload.url");

            service.createVerificationUploadUrl(userId, "Image/JPEG");

            verify(storageService).generateUploadUrl(anyString(), eq("image/jpeg"));
        }
    }

    @Nested
    @DisplayName("submitVerification()")
    class SubmitVerification {

        @Test
        @DisplayName("returns USER_NOT_FOUND when user not found")
        void returnsUserNotFound() {
            when(userDao.findById(userId)).thenReturn(Optional.empty());

            VerificationSubmitResult result = service.submitVerification(userId, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.USER_NOT_FOUND);
            assertThat(result.statusResponse()).isNull();
        }

        @Test
        @DisplayName("returns NOT_TASKER when user is not a tasker")
        void returnsNotTasker() {
            AuthUser customer = new AuthUser(userId, encryptedPhone, null, "CUSTOMER", "ACTIVE", "PHONE", now, now);
            when(userDao.findById(userId)).thenReturn(Optional.of(customer));

            VerificationSubmitResult result = service.submitVerification(userId, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.NOT_TASKER);
        }

        @Test
        @DisplayName("returns CONFLICT when pending verification exists")
        void returnsConflictWhenPending() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            VerificationRequest existing =
                    new VerificationRequest("v-1", userId, "front", "back", "PENDING", now, null, null);
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.of(existing));

            VerificationSubmitResult result = service.submitVerification(userId, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.CONFLICT);
        }

        @Test
        @DisplayName("returns CONFLICT when approved verification exists")
        void returnsConflictWhenApproved() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            VerificationRequest existing =
                    new VerificationRequest("v-1", userId, "front", "back", "APPROVED", now, null, now);
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.of(existing));

            VerificationSubmitResult result = service.submitVerification(userId, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.CONFLICT);
        }

        @Test
        @DisplayName("returns SUCCESS when no existing verification")
        void returnsSuccessWhenNoExisting() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.empty());

            VerificationSubmitResult result = service.submitVerification(userId, "front-key", "back-key", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.SUCCESS);
            assertThat(result.statusResponse()).isNotNull();
            assertThat(result.statusResponse().status()).isEqualTo("PENDING");
            verify(verificationDao)
                    .insert(
                            anyString(),
                            eq(userId),
                            eq("front-key"),
                            eq("back-key"),
                            eq("PENDING"),
                            any(Instant.class),
                            eq(null),
                            eq(null),
                            eq("v1"),
                            any(Instant.class),
                            eq(null));
        }

        @Test
        @DisplayName("allows submission when existing is REJECTED")
        void allowsSubmissionWhenRejected() {
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            VerificationRequest rejected =
                    new VerificationRequest("v-1", userId, "front", "back", "REJECTED", now, "bad photo", now);
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.of(rejected));

            VerificationSubmitResult result = service.submitVerification(userId, "front", "back", "v1");

            assertThat(result.outcome()).isEqualTo(VerificationSubmitResult.SUCCESS);
        }
    }

    @Nested
    @DisplayName("getVerificationStatus()")
    class GetVerificationStatus {

        @Test
        @DisplayName("returns NOT_SUBMITTED when no verification found")
        void returnsNotSubmitted() {
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.empty());

            VerificationStatusResponse result = service.getVerificationStatus(userId);

            assertThat(result.status()).isEqualTo("NOT_SUBMITTED");
            assertThat(result.adminNotes()).isNull();
            assertThat(result.submittedAt()).isNull();
            assertThat(result.reviewedAt()).isNull();
        }

        @Test
        @DisplayName("returns verification status when found")
        void returnsStatusWhenFound() {
            VerificationRequest request =
                    new VerificationRequest("v-1", userId, "front", "back", "PENDING", now, null, null);
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.of(request));

            VerificationStatusResponse result = service.getVerificationStatus(userId);

            assertThat(result.status()).isEqualTo("PENDING");
            assertThat(result.submittedAt()).isEqualTo(now.toString());
            assertThat(result.reviewedAt()).isNull();
        }

        @Test
        @DisplayName("returns reviewed_at when present")
        void returnsReviewedAtWhenPresent() {
            VerificationRequest request =
                    new VerificationRequest("v-1", userId, "front", "back", "APPROVED", now, "looks good", now);
            when(verificationDao.findLatestByUserId(userId)).thenReturn(Optional.of(request));

            VerificationStatusResponse result = service.getVerificationStatus(userId);

            assertThat(result.status()).isEqualTo("APPROVED");
            assertThat(result.adminNotes()).isEqualTo("looks good");
            assertThat(result.reviewedAt()).isEqualTo(now.toString());
        }
    }

    @Nested
    @DisplayName("getVerificationDetail()")
    class GetVerificationDetail {

        @Test
        @DisplayName("returns empty when verification not found")
        void returnsEmptyWhenNotFound() {
            when(verificationDao.findById("v-1")).thenReturn(Optional.empty());

            Optional<VerificationDetail> result = service.getVerificationDetail("v-1");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns detail with presigned download URLs")
        void returnsDetailWithUrls() {
            VerificationRequest request =
                    new VerificationRequest("v-1", userId, "front-key", "back-key", "PENDING", now, null, null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(request));
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(storageService.generateDownloadUrl("front-key", StorageKeyPolicy.Namespace.VERIFICATION))
                    .thenReturn("https://front-download");
            when(storageService.generateDownloadUrl("back-key", StorageKeyPolicy.Namespace.VERIFICATION))
                    .thenReturn("https://back-download");

            Optional<VerificationDetail> result = service.getVerificationDetail("v-1");

            assertThat(result).isPresent();
            VerificationDetail detail = result.get();
            assertThat(detail.id()).isEqualTo("v-1");
            assertThat(detail.userId()).isEqualTo(userId);
            assertThat(detail.userPhone()).isEqualTo(phone);
            assertThat(detail.userName()).isEqualTo("Tasky User");
            assertThat(detail.idCardFrontUrl()).isEqualTo("https://front-download");
            assertThat(detail.idCardBackUrl()).isEqualTo("https://back-download");
            assertThat(detail.status()).isEqualTo("PENDING");
        }

        @Test
        @DisplayName("handles missing user gracefully")
        void handlesMissingUser() {
            VerificationRequest request =
                    new VerificationRequest("v-1", userId, "front-key", "back-key", "PENDING", now, null, null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(request));
            when(userDao.findById(userId)).thenReturn(Optional.empty());
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenReturn("https://download");

            Optional<VerificationDetail> result = service.getVerificationDetail("v-1");

            assertThat(result).isPresent();
            assertThat(result.get().userPhone()).isNull();
            assertThat(result.get().userName()).isNull();
        }

        @Test
        @DisplayName("handles download URL generation failure gracefully")
        void handlesDownloadUrlFailure() {
            VerificationRequest request =
                    new VerificationRequest("v-1", userId, "front-key", "back-key", "PENDING", now, null, null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(request));
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(storageService.generateDownloadUrl("front-key", StorageKeyPolicy.Namespace.VERIFICATION))
                    .thenThrow(new IllegalArgumentException("bad key"));
            when(storageService.generateDownloadUrl("back-key", StorageKeyPolicy.Namespace.VERIFICATION))
                    .thenReturn("https://back-download");

            Optional<VerificationDetail> result = service.getVerificationDetail("v-1");

            assertThat(result).isPresent();
            assertThat(result.get().idCardFrontUrl()).isNull();
            assertThat(result.get().idCardBackUrl()).isEqualTo("https://back-download");
        }
    }

    @Nested
    @DisplayName("listPendingVerifications()")
    class ListPendingVerifications {

        @Test
        @DisplayName("returns empty list when no pending verifications")
        void returnsEmptyList() {
            when(verificationDao.findPending((String) null, 10)).thenReturn(List.of());

            List<VerificationDetail> result = service.listPendingVerifications(10);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns mapped pending verifications")
        void returnsMappedPending() {
            VerificationRequest request =
                    new VerificationRequest("v-1", userId, "front", "back", "PENDING", now, null, null);
            when(verificationDao.findPending((String) null, 10)).thenReturn(List.of(request));
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.of(UserProfileState.defaultState()));
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenReturn("https://download");

            List<VerificationDetail> result = service.listPendingVerifications(10);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).id()).isEqualTo("v-1");
        }

        @Test
        @DisplayName("passes cursor to DAO when provided")
        void passesCursorToDao() {
            when(verificationDao.findPending("cursor-1", 10)).thenReturn(List.of());

            List<VerificationDetail> result = service.listPendingVerifications("cursor-1", 10);

            assertThat(result).isEmpty();
            verify(verificationDao).findPending("cursor-1", 10);
        }
    }

    @Nested
    @DisplayName("verificationExists()")
    class VerificationExists {

        @Test
        @DisplayName("returns true when verification found")
        void returnsTrueWhenFound() {
            VerificationRequest request = new VerificationRequest("v-1", userId, "f", "b", "PENDING", now, null, null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(request));

            assertThat(service.verificationExists("v-1")).isTrue();
        }

        @Test
        @DisplayName("returns false when not found")
        void returnsFalseWhenNotFound() {
            when(verificationDao.findById("v-1")).thenReturn(Optional.empty());

            assertThat(service.verificationExists("v-1")).isFalse();
        }
    }

    @Nested
    @DisplayName("approveVerification()")
    class ApproveVerification {

        @Test
        @DisplayName("returns empty when verification not found")
        void returnsEmptyWhenNotFound() {
            when(verificationDao.findById("v-1")).thenReturn(Optional.empty());

            Optional<VerificationDetail> result = service.approveVerification("v-1");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when verification not PENDING")
        void returnsEmptyWhenNotPending() {
            VerificationRequest approved = new VerificationRequest("v-1", userId, "f", "b", "APPROVED", now, null, now);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(approved));

            Optional<VerificationDetail> result = service.approveVerification("v-1");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("approves pending verification and marks user VERIFIED")
        void approvesPendingVerification() {
            VerificationRequest pending =
                    new VerificationRequest("v-1", userId, "front", "back", "PENDING", now, null, null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(pending));
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenReturn("https://download");

            Optional<VerificationDetail> result = service.approveVerification("v-1");

            assertThat(result).isPresent();
            assertThat(result.get().status()).isEqualTo("APPROVED");
            verify(verificationDao).updateStatus(eq("v-1"), eq("APPROVED"), eq(null), any(Instant.class));
            verify(userDao).updateStatus(userId, "VERIFIED");
        }

        @Test
        @DisplayName("approves with existing admin notes when no new notes")
        void approvesWithExistingNotes() {
            VerificationRequest pending =
                    new VerificationRequest("v-1", userId, "f", "b", "PENDING", now, "existing note", null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(pending));
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenReturn("https://download");

            service.approveVerification("v-1");

            verify(verificationDao).updateStatus(eq("v-1"), eq("APPROVED"), eq("existing note"), any(Instant.class));
        }
    }

    @Nested
    @DisplayName("rejectVerification()")
    class RejectVerification {

        @Test
        @DisplayName("returns empty when verification not found")
        void returnsEmptyWhenNotFound() {
            when(verificationDao.findById("v-1")).thenReturn(Optional.empty());

            Optional<VerificationDetail> result = service.rejectVerification("v-1", "bad photo");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("returns empty when verification not PENDING")
        void returnsEmptyWhenNotPending() {
            VerificationRequest rejected =
                    new VerificationRequest("v-1", userId, "f", "b", "REJECTED", now, "reason", now);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(rejected));

            Optional<VerificationDetail> result = service.rejectVerification("v-1", "another reason");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("rejects pending verification without marking user verified")
        void rejectsPendingVerification() {
            VerificationRequest pending =
                    new VerificationRequest("v-1", userId, "front", "back", "PENDING", now, null, null);
            when(verificationDao.findById("v-1")).thenReturn(Optional.of(pending));
            when(userDao.findById(userId)).thenReturn(Optional.of(taskerUser));
            when(profileDao.findByUserId(userId)).thenReturn(Optional.empty());
            when(cryptoService.decrypt(encryptedPhone)).thenReturn(phone);
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenReturn("https://download");

            Optional<VerificationDetail> result = service.rejectVerification("v-1", "blurry photo");

            assertThat(result).isPresent();
            assertThat(result.get().status()).isEqualTo("REJECTED");
            verify(verificationDao).updateStatus(eq("v-1"), eq("REJECTED"), eq("blurry photo"), any(Instant.class));
            verify(userDao, never()).updateStatus(anyString(), anyString());
        }
    }
}
