package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import mn.tasky.admin.dto.VerificationDetailResponse;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
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

    @Mock
    private NotificationCommandPort notificationCommandPort;

    private AdminVerificationDecisionService service;

    @BeforeEach
    void setUp() {
        service = new AdminVerificationDecisionService(
                identityCommandPort, identityQueryPort, adminVerificationCompositionService, notificationCommandPort);
    }

    @Nested
    @DisplayName("approve")
    class ApproveTests {

        @Test
        @DisplayName("approves verification and returns success with detail response")
        void approve_success() {
            VerificationDetail detail = buildDetail("v1", "APPROVED");
            VerificationDetailResponse response = buildResponse("v1", "APPROVED");
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
            VerificationDetail detail = buildDetail("v1", "REJECTED");
            VerificationDetailResponse response = buildResponse("v1", "REJECTED");
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

    @Test
    @DisplayName("SCN-NOTIF-006: Verification decision notification is sent to the affected tasker")
    void verificationDecisionNotificationIsSentToAffectedTasker() {
        VerificationDetail approvedDetail = buildDetail("approved-v1", "APPROVED");
        VerificationDetail rejectedDetail = buildDetail("rejected-v1", "REJECTED");
        when(identityCommandPort.approveVerification("approved-v1")).thenReturn(Optional.of(approvedDetail));
        when(identityCommandPort.rejectVerification("rejected-v1", "blurry photo"))
                .thenReturn(Optional.of(rejectedDetail));
        when(adminVerificationCompositionService.detailResponse(approvedDetail))
                .thenReturn(buildResponse("approved-v1", "APPROVED"));
        when(adminVerificationCompositionService.detailResponse(rejectedDetail))
                .thenReturn(buildResponse("rejected-v1", "REJECTED"));

        service.approve("approved-v1");
        service.reject("rejected-v1", "blurry photo");

        verify(notificationCommandPort)
                .sendPushWithEventKey(
                        eq("user-1"),
                        eq("Verification approved"),
                        contains("approved"),
                        eq("VERIFICATION_DECISION"),
                        eq("verification-decision:approved-v1:APPROVED"));
        verify(notificationCommandPort)
                .sendPushWithEventKey(
                        eq("user-1"),
                        eq("Verification rejected"),
                        contains("rejected"),
                        eq("VERIFICATION_DECISION"),
                        eq("verification-decision:rejected-v1:REJECTED"));
    }

    private VerificationDetail buildDetail(String id, String status) {
        return new VerificationDetail(
                id,
                "user-1",
                "99112233",
                "John",
                "front-url",
                "back-url",
                status,
                null,
                Instant.now().toString(),
                null,
                "v1",
                Instant.now(),
                null);
    }

    private VerificationDetailResponse buildResponse(String id, String status) {
        return new VerificationDetailResponse(
                id,
                "user-1",
                "99112233",
                "John",
                "front-url",
                "back-url",
                status,
                null,
                Instant.now().toString(),
                null,
                Instant.now().plusSeconds(86_400).toString());
    }
}
