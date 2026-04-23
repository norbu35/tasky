package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.admin.dto.VerificationDetailResponse;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminVerificationDecisionServiceTests {

    @Mock
    private IdentityCommandPort identityCommandPort;

    @Mock
    private IdentityQueryPort identityQueryPort;

    @Mock
    private AdminVerificationCompositionService adminVerificationCompositionService;

    private AdminVerificationDecisionService service;

    @BeforeEach
    void setUp() {
        service = new AdminVerificationDecisionService(
                identityCommandPort, identityQueryPort, adminVerificationCompositionService);
    }

    @Nested
    @DisplayName("approve")
    class ApproveTests {

        @Test
        @DisplayName("approves verification and returns success with detail response")
        void approve_success() {
            VerificationDetail detail = buildDetail("v1");
            VerificationDetailResponse response = buildResponse("v1");
            when(identityCommandPort.approveVerification("v1")).thenReturn(Optional.of(detail));
            when(adminVerificationCompositionService.detailResponse(detail)).thenReturn(response);

            AdminVerificationDecisionOutcome outcome = service.approve("v1");

            assertThat(outcome.status()).isEqualTo(AdminVerificationDecisionOutcome.Status.SUCCESS);
            assertThat(outcome.body()).isEqualTo(response);
            assertThat(outcome.errorCode()).isNull();
            assertThat(outcome.errorMessage()).isNull();
        }

        @Test
        @DisplayName("returns NOT_PENDING when approveVerification returns empty but verification exists")
        void approve_notPending() {
            when(identityCommandPort.approveVerification("v1")).thenReturn(Optional.empty());
            when(identityQueryPort.verificationExists("v1")).thenReturn(true);

            AdminVerificationDecisionOutcome outcome = service.approve("v1");

            assertThat(outcome.status()).isEqualTo(AdminVerificationDecisionOutcome.Status.NOT_PENDING);
            assertThat(outcome.errorCode()).isEqualTo("NOT_PENDING");
            assertThat(outcome.errorMessage()).contains("not in PENDING status");
        }

        @Test
        @DisplayName("returns NOT_FOUND when approveVerification returns empty and verification does not exist")
        void approve_notFound() {
            when(identityCommandPort.approveVerification("v1")).thenReturn(Optional.empty());
            when(identityQueryPort.verificationExists("v1")).thenReturn(false);

            AdminVerificationDecisionOutcome outcome = service.approve("v1");

            assertThat(outcome.status()).isEqualTo(AdminVerificationDecisionOutcome.Status.NOT_FOUND);
            assertThat(outcome.errorCode()).isEqualTo("NOT_FOUND");
            assertThat(outcome.errorMessage()).contains("not found");
        }
    }

    @Nested
    @DisplayName("reject")
    class RejectTests {

        @Test
        @DisplayName("rejects verification and returns success with detail response")
        void reject_success() {
            VerificationDetail detail = buildDetail("v1");
            VerificationDetailResponse response = buildResponse("v1");
            when(identityCommandPort.rejectVerification("v1", "blurry photo")).thenReturn(Optional.of(detail));
            when(adminVerificationCompositionService.detailResponse(detail)).thenReturn(response);

            AdminVerificationDecisionOutcome outcome = service.reject("v1", "blurry photo");

            assertThat(outcome.status()).isEqualTo(AdminVerificationDecisionOutcome.Status.SUCCESS);
            assertThat(outcome.body()).isEqualTo(response);
        }

        @Test
        @DisplayName("returns NOT_FOUND when rejectVerification returns empty")
        void reject_notFound() {
            when(identityCommandPort.rejectVerification("v1", "reason")).thenReturn(Optional.empty());

            AdminVerificationDecisionOutcome outcome = service.reject("v1", "reason");

            assertThat(outcome.status()).isEqualTo(AdminVerificationDecisionOutcome.Status.NOT_FOUND);
            assertThat(outcome.errorCode()).isEqualTo("NOT_FOUND");
            assertThat(outcome.errorMessage()).contains("not found");
        }
    }

    private VerificationDetail buildDetail(String id) {
        return new VerificationDetail(
                id,
                "user-1",
                "99112233",
                "John",
                "front-url",
                "back-url",
                "PENDING",
                null,
                Instant.now().toString(),
                null,
                "v1",
                Instant.now(),
                null);
    }

    private VerificationDetailResponse buildResponse(String id) {
        return new VerificationDetailResponse(
                id,
                "user-1",
                "99112233",
                "John",
                "front-url",
                "back-url",
                "APPROVED",
                null,
                Instant.now().toString(),
                null);
    }
}
