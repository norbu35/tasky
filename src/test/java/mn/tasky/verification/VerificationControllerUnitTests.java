package mn.tasky.verification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.verification.api.VerificationController;
import mn.tasky.verification.dto.VerificationStatusApiResponse;
import mn.tasky.verification.dto.VerificationSubmitRequest;
import mn.tasky.verification.dto.VerificationUploadUrlRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

@ExtendWith(MockitoExtension.class)
class VerificationControllerUnitTests {

    @Mock
    private AuthService authService;

    private VerificationController controller;

    @BeforeEach
    void setUp() {
        controller = new VerificationController(authService);
    }

    @Test
    void getUploadUrlReturnsBadRequestForUnsupportedContentType() {
        JwtPrincipal principal = principal();
        when(authService.createVerificationUploadUrl(principal.userId(), "image/webp"))
                .thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getUploadUrl(
                principal, new VerificationUploadUrlRequest("image/webp"), new MockHttpServletRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "INVALID_CONTENT_TYPE");
    }

    private JwtPrincipal principal() {
        return new JwtPrincipal(uuid(1), "TASKER", "ACTIVE");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d", suffix);
    }

    @Test
    void getUploadUrlReturnsPresignedPayloadWhenValid() {
        JwtPrincipal principal = principal();
        when(authService.createVerificationUploadUrl(principal.userId(), "image/jpeg"))
                .thenReturn(Optional.of(
                        new PresignedUpload("https://upload.example.com", "uploads/verification/front.jpg")));

        ResponseEntity<?> response =
                controller.getUploadUrl(principal, new VerificationUploadUrlRequest("image/jpeg"), requestWithTrace());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody())
                .containsEntry("storage_key", "uploads/verification" + "/front.jpg");
    }

    private MockHttpServletRequest requestWithTrace() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE, "trace-verification");
        return request;
    }

    @Test
    void submitVerificationHandlesNotTaskerOutcome() {
        JwtPrincipal principal = principal();
        when(authService.submitVerification(principal.userId(), "front", "back", "1.0"))
                .thenReturn(new VerificationSubmitResult(VerificationSubmitResult.NOT_TASKER, null));

        ResponseEntity<?> response = controller.submitVerification(
                principal, new VerificationSubmitRequest("front", "back", "1.0", true), requestWithTrace());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "NOT_TASKER");
    }

    @Test
    void getStatusReturnsMappedVerificationPayload() {
        JwtPrincipal principal = principal();
        when(authService.getVerificationStatus(principal.userId()))
                .thenReturn(new VerificationStatusResponse("PENDING", null, "2026-02-17T00:00:00Z", null));

        ResponseEntity<?> response = controller.getStatus(principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        VerificationStatusApiResponse body = (VerificationStatusApiResponse) response.getBody();
        assertThat(body.status()).isEqualTo("PENDING");
    }
}
