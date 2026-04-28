package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Map;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.verification.dto.VerificationStatusApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("VerificationPublicCompositionService")
class VerificationPublicCompositionServiceTests {

    @Mock
    private IdentityQueryPort identityQueryPort;

    private VerificationPublicCompositionService service;

    @BeforeEach
    void setUp() {
        service = new VerificationPublicCompositionService(identityQueryPort);
    }

    @Nested
    @DisplayName("uploadUrlResponse")
    class UploadUrlResponse {

        @Test
        @DisplayName("maps PresignedUpload fields to response map")
        void mapsPresignedUpload() {
            PresignedUpload upload = new PresignedUpload("https://s3.example.com/presign", "verifications/id.png");

            Map<String, Object> response = service.uploadUrlResponse(upload);

            assertThat(response).containsEntry("upload_url", "https://s3.example.com/presign");
            assertThat(response).containsEntry("storage_key", "verifications/id.png");
        }
    }

    @Nested
    @DisplayName("verificationStatus")
    class VerificationStatus {

        @Test
        @DisplayName("delegates to identityQueryPort and maps response")
        void delegatesAndMaps() {
            VerificationStatusResponse status =
                    new VerificationStatusResponse("SUBMITTED", "Awaiting review", "2025-01-01T00:00:00Z", null);
            when(identityQueryPort.getVerificationStatus("user-1")).thenReturn(status);

            VerificationStatusApiResponse response = service.verificationStatus("user-1");

            assertThat(response.status()).isEqualTo("SUBMITTED");
            assertThat(response.adminNotes()).isEqualTo("Awaiting review");
            assertThat(response.submittedAt()).isEqualTo("2025-01-01T00:00:00Z");
            assertThat(response.reviewedAt()).isNull();
        }

        @Test
        @DisplayName("returns reviewed status with reviewed_at field")
        void returnsReviewedStatus() {
            VerificationStatusResponse status = new VerificationStatusResponse(
                    "APPROVED", "All clear", "2025-01-01T00:00:00Z", "2025-01-02T00:00:00Z");
            when(identityQueryPort.getVerificationStatus("user-2")).thenReturn(status);

            VerificationStatusApiResponse response = service.verificationStatus("user-2");

            assertThat(response.status()).isEqualTo("APPROVED");
            assertThat(response.reviewedAt()).isEqualTo("2025-01-02T00:00:00Z");
        }
    }

    @Nested
    @DisplayName("statusResponse")
    class StatusResponse {

        @Test
        @DisplayName("maps VerificationStatusResponse to VerificationStatusApiResponse")
        void mapsDirectly() {
            VerificationStatusResponse status = new VerificationStatusResponse(
                    "REJECTED", "Blurry image", "2025-03-01T00:00:00Z", "2025-03-02T00:00:00Z");

            VerificationStatusApiResponse response = service.statusResponse(status);

            assertThat(response.status()).isEqualTo("REJECTED");
            assertThat(response.adminNotes()).isEqualTo("Blurry image");
            assertThat(response.submittedAt()).isEqualTo("2025-03-01T00:00:00Z");
            assertThat(response.reviewedAt()).isEqualTo("2025-03-02T00:00:00Z");
        }
    }
}
