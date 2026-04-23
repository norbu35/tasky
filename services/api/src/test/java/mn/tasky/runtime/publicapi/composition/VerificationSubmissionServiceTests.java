package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.verification.dto.VerificationStatusApiResponse;
import mn.tasky.verification.dto.VerificationSubmitRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class VerificationSubmissionServiceTests {

    @Mock
    private IdentityCommandPort identityCommandPort;

    @Mock
    private StorageKeyPolicy storageKeyPolicy;

    @Mock
    private VerificationPublicCompositionService verificationPublicCompositionService;

    private VerificationSubmissionService service;

    private final String userId = "user-001";

    private VerificationSubmitRequest defaultRequest() {
        return new VerificationSubmitRequest(
                "uploads/verification/user-001/front.jpg", "uploads/verification/user-001/back.jpg", "v1", true);
    }

    @BeforeEach
    void setUp() {
        service = new VerificationSubmissionService(
                identityCommandPort, storageKeyPolicy, verificationPublicCompositionService);
    }

    @Nested
    @DisplayName("submitVerification")
    class SubmitVerification {

        @Test
        @DisplayName("Successful submission returns SUCCESS")
        void success() {
            VerificationStatusResponse statusResponse =
                    new VerificationStatusResponse("PENDING", null, "2025-01-01T00:00:00Z", null);
            VerificationStatusApiResponse apiResponse =
                    new VerificationStatusApiResponse("PENDING", null, "2025-01-01T00:00:00Z", null);

            when(identityCommandPort.submitVerification(
                            userId,
                            "uploads/verification/user-001/front.jpg",
                            "uploads/verification/user-001/back.jpg",
                            "v1"))
                    .thenReturn(new VerificationSubmitResult(VerificationSubmitResult.SUCCESS, statusResponse));
            when(verificationPublicCompositionService.statusResponse(statusResponse))
                    .thenReturn(apiResponse);

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.SUCCESS);
            assertThat(outcome.body()).isEqualTo(apiResponse);
        }

        @Test
        @DisplayName("Consent not accepted returns CONSENT_REQUIRED")
        void consentNotAccepted() {
            VerificationSubmitRequest request = new VerificationSubmitRequest(
                    "uploads/verification/user-001/front.jpg", "uploads/verification/user-001/back.jpg", "v1", false);

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, request);

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.CONSENT_REQUIRED);
            assertThat(outcome.errorCode()).isEqualTo("CONSENT_REQUIRED");
            verify(identityCommandPort, never()).submitVerification(any(), any(), any(), any());
        }

        @Test
        @DisplayName("Null consent accepted returns CONSENT_REQUIRED")
        void nullConsent() {
            VerificationSubmitRequest request = new VerificationSubmitRequest(
                    "uploads/verification/user-001/front.jpg", "uploads/verification/user-001/back.jpg", "v1", null);

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, request);

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.CONSENT_REQUIRED);
        }

        @Test
        @DisplayName("Invalid storage key returns INVALID_VERIFICATION_KEY")
        void invalidStorageKey() {
            doThrow(new IllegalArgumentException("Invalid storage key"))
                    .when(storageKeyPolicy)
                    .validateOwnedKey(
                            "uploads/verification/user-001/front.jpg", StorageKeyPolicy.Namespace.VERIFICATION, userId);

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.INVALID_VERIFICATION_KEY);
            assertThat(outcome.errorCode()).isEqualTo("INVALID_VERIFICATION_KEY");
            verify(identityCommandPort, never()).submitVerification(any(), any(), any(), any());
        }

        @Test
        @DisplayName("CONFLICT result returns CONFLICT outcome")
        void conflict() {
            when(identityCommandPort.submitVerification(
                            userId,
                            "uploads/verification/user-001/front.jpg",
                            "uploads/verification/user-001/back.jpg",
                            "v1"))
                    .thenReturn(new VerificationSubmitResult(VerificationSubmitResult.CONFLICT, null));

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.CONFLICT);
            assertThat(outcome.errorCode()).isEqualTo("VERIFICATION_ALREADY_SUBMITTED");
        }

        @Test
        @DisplayName("NOT_TASKER result returns NOT_TASKER outcome")
        void notTasker() {
            when(identityCommandPort.submitVerification(
                            userId,
                            "uploads/verification/user-001/front.jpg",
                            "uploads/verification/user-001/back.jpg",
                            "v1"))
                    .thenReturn(new VerificationSubmitResult(VerificationSubmitResult.NOT_TASKER, null));

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.NOT_TASKER);
            assertThat(outcome.errorCode()).isEqualTo("NOT_TASKER");
        }

        @Test
        @DisplayName("USER_NOT_FOUND result returns USER_NOT_FOUND outcome")
        void userNotFound() {
            when(identityCommandPort.submitVerification(
                            userId,
                            "uploads/verification/user-001/front.jpg",
                            "uploads/verification/user-001/back.jpg",
                            "v1"))
                    .thenReturn(new VerificationSubmitResult(VerificationSubmitResult.USER_NOT_FOUND, null));

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.USER_NOT_FOUND);
            assertThat(outcome.errorCode()).isEqualTo("USER_NOT_FOUND");
        }

        @Test
        @DisplayName("Unknown result outcome returns USER_NOT_FOUND as default")
        void unknownOutcome() {
            when(identityCommandPort.submitVerification(
                            userId,
                            "uploads/verification/user-001/front.jpg",
                            "uploads/verification/user-001/back.jpg",
                            "v1"))
                    .thenReturn(new VerificationSubmitResult("SOMETHING_ELSE", null));

            VerificationSubmissionOutcome outcome = service.submitVerification(userId, defaultRequest());

            assertThat(outcome.status()).isEqualTo(VerificationSubmissionOutcome.Status.USER_NOT_FOUND);
        }
    }
}
