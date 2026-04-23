package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mn.tasky.admin.dto.VerificationDetailResponse;
import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.common.security.CryptoService;
import mn.tasky.common.storage.S3PresignedUrlService;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.projection.admin.AdminVerificationQueueProjectionService;
import mn.tasky.projection.admin.AdminVerificationQueueRow;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminVerificationCompositionServiceTests {

    @Mock
    private AdminVerificationQueueProjectionService queueProjectionService;

    @Mock
    private IdentityQueryPort identityQueryPort;

    @Mock
    private AdminAuditCommandPort adminAuditCommandPort;

    @Mock
    private CryptoService cryptoService;

    @Mock
    private S3PresignedUrlService storageService;

    private AdminVerificationCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminVerificationCompositionService(
                queueProjectionService, identityQueryPort, adminAuditCommandPort, cryptoService, storageService);
    }

    @Nested
    @DisplayName("pendingVerifications")
    class PendingVerificationsTests {

        @Test
        @DisplayName("returns page of pending verifications from projection")
        void pendingVerifications_returnsPage() {
            AdminVerificationQueueRow row1 = buildQueueRow("v1");
            AdminVerificationQueueRow row2 = buildQueueRow("v2");
            when(queueProjectionService.listPending(null, 3)).thenReturn(List.of(row1, row2));
            when(cryptoService.decrypt("enc-phone")).thenReturn("99112233");
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenReturn("https://cdn.example.com/file");

            AdminVerificationPage page = service.pendingVerifications(null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
            assertThat(page.data().getFirst().id()).isEqualTo("v1");
        }

        @Test
        @DisplayName("sets hasMore and nextCursor when extra row exists")
        void pendingVerifications_hasMore() {
            AdminVerificationQueueRow row1 = buildQueueRow("v1");
            AdminVerificationQueueRow row2 = buildQueueRow("v2");
            AdminVerificationQueueRow row3 = buildQueueRow("v3");
            when(queueProjectionService.listPending(null, 3)).thenReturn(List.of(row1, row2, row3));

            AdminVerificationPage page = service.pendingVerifications(null, 2);

            assertThat(page.data()).hasSize(2);
            assertThat(page.hasMore()).isTrue();
            assertThat(page.nextCursor()).isEqualTo("v2");
        }

        @Test
        @DisplayName("returns empty page when no pending verifications")
        void pendingVerifications_empty() {
            when(queueProjectionService.listPending(null, 3)).thenReturn(Collections.emptyList());

            AdminVerificationPage page = service.pendingVerifications(null, 2);

            assertThat(page.data()).isEmpty();
            assertThat(page.hasMore()).isFalse();
            assertThat(page.nextCursor()).isNull();
        }

        @Test
        @DisplayName("clamps limit to max 100")
        void pendingVerifications_clampsMaxLimit() {
            when(queueProjectionService.listPending(null, 101)).thenReturn(Collections.emptyList());

            AdminVerificationPage page = service.pendingVerifications(null, 200);

            assertThat(page.data()).isEmpty();
        }

        @Test
        @DisplayName("handles decryption failure gracefully by returning null phone")
        void pendingVerifications_decryptionFailure() {
            AdminVerificationQueueRow row = buildQueueRow("v1");
            when(queueProjectionService.listPending(null, 2)).thenReturn(List.of(row));
            when(cryptoService.decrypt("enc-phone")).thenThrow(new RuntimeException("decrypt error"));

            AdminVerificationPage page = service.pendingVerifications(null, 1);

            assertThat(page.data()).hasSize(1);
            assertThat(page.data().getFirst().userPhone()).isNull();
        }

        @Test
        @DisplayName("handles null encrypted phone gracefully")
        void pendingVerifications_nullEncryptedPhone() {
            AdminVerificationQueueRow row = new AdminVerificationQueueRow(
                    "v1", "u1", null, "John", null, null, "PENDING", null, Instant.now(), null);
            when(queueProjectionService.listPending(null, 2)).thenReturn(List.of(row));

            AdminVerificationPage page = service.pendingVerifications(null, 1);

            assertThat(page.data()).hasSize(1);
            assertThat(page.data().getFirst().userPhone()).isNull();
        }

        @Test
        @DisplayName("handles storage URL generation failure gracefully")
        void pendingVerifications_storageUrlFailure() {
            AdminVerificationQueueRow row = buildQueueRow("v1");
            when(queueProjectionService.listPending(null, 2)).thenReturn(List.of(row));
            when(cryptoService.decrypt("enc-phone")).thenReturn("99112233");
            when(storageService.generateDownloadUrl(anyString(), any(StorageKeyPolicy.Namespace.class)))
                    .thenThrow(new RuntimeException("S3 error"));

            AdminVerificationPage page = service.pendingVerifications(null, 1);

            assertThat(page.data()).hasSize(1);
            assertThat(page.data().getFirst().idCardFrontUrl()).isNull();
        }
    }

    @Nested
    @DisplayName("verificationDetail")
    class VerificationDetailTests {

        @Test
        @DisplayName("returns verification detail with audit for ID card URLs")
        void verificationDetail_withIdCards_recordsAudit() {
            VerificationDetail detail = buildDetail("v1", "https://front.url", "https://back.url");
            when(identityQueryPort.getVerificationDetail("v1")).thenReturn(Optional.of(detail));

            Optional<VerificationDetailResponse> result = service.verificationDetail("v1", "admin-1");

            assertThat(result).isPresent();
            assertThat(result.get().id()).isEqualTo("v1");
            verify(adminAuditCommandPort, org.mockito.Mockito.times(2))
                    .recordAdminAction(
                            eq("admin-1"), eq("VERIFICATION_MEDIA_VIEWED"), eq("VERIFICATION"), eq("v1"), anyString());
        }

        @Test
        @DisplayName("does not record audit when no ID card URLs present")
        void verificationDetail_noIdCards_noAudit() {
            VerificationDetail detail = buildDetail("v1", null, null);
            when(identityQueryPort.getVerificationDetail("v1")).thenReturn(Optional.of(detail));

            Optional<VerificationDetailResponse> result = service.verificationDetail("v1", "admin-1");

            assertThat(result).isPresent();
            verify(adminAuditCommandPort, never())
                    .recordAdminAction(anyString(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("records audit only for front when back is null")
        void verificationDetail_onlyFront_recordsOneAudit() {
            VerificationDetail detail = buildDetail("v1", "https://front.url", null);
            when(identityQueryPort.getVerificationDetail("v1")).thenReturn(Optional.of(detail));

            service.verificationDetail("v1", "admin-1");

            verify(adminAuditCommandPort)
                    .recordAdminAction(
                            eq("admin-1"), eq("VERIFICATION_MEDIA_VIEWED"), eq("VERIFICATION"), eq("v1"), anyString());
        }

        @Test
        @DisplayName("returns empty when verification not found")
        void verificationDetail_notFound() {
            when(identityQueryPort.getVerificationDetail("missing")).thenReturn(Optional.empty());

            Optional<VerificationDetailResponse> result = service.verificationDetail("missing", "admin-1");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("detailResponse")
    class DetailResponseTests {

        @Test
        @DisplayName("maps VerificationDetail to VerificationDetailResponse")
        void detailResponse_mapsFields() {
            VerificationDetail detail = buildDetail("v1", "front-url", "back-url");

            VerificationDetailResponse response = service.detailResponse(detail);

            assertThat(response.id()).isEqualTo("v1");
            assertThat(response.userId()).isEqualTo("user-1");
            assertThat(response.userPhone()).isEqualTo("99112233");
            assertThat(response.userName()).isEqualTo("John");
            assertThat(response.status()).isEqualTo("PENDING");
        }
    }

    private AdminVerificationQueueRow buildQueueRow(String id) {
        return new AdminVerificationQueueRow(
                id,
                "user-1",
                "enc-phone",
                "John",
                "uploads/verification/user-1/front.jpg",
                "uploads/verification/user-1/back.jpg",
                "PENDING",
                null,
                Instant.now(),
                null);
    }

    private VerificationDetail buildDetail(String id, String frontUrl, String backUrl) {
        return new VerificationDetail(
                id,
                "user-1",
                "99112233",
                "John",
                frontUrl,
                backUrl,
                "PENDING",
                null,
                Instant.now().toString(),
                null,
                "v1",
                Instant.now(),
                null);
    }
}
