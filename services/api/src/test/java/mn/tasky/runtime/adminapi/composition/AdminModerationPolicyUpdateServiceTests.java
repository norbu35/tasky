package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import mn.tasky.admin.dto.StrikePolicyRequest;
import mn.tasky.admin.dto.StrikePolicyResponse;
import mn.tasky.admin.publicapi.AdminAuditCommandPort;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminModerationPolicyUpdateServiceTests {

    @Mock
    private IdentityCommandPort identityCommandPort;

    @Mock
    private AdminAuditCommandPort adminAuditCommandPort;

    @Mock
    private AdminModerationCompositionService adminModerationCompositionService;

    private AdminModerationPolicyUpdateService service;

    @BeforeEach
    void setUp() {
        service = new AdminModerationPolicyUpdateService(
                identityCommandPort, adminAuditCommandPort, adminModerationCompositionService);
    }

    @Nested
    @DisplayName("updatePolicy")
    class UpdatePolicyTests {

        @Test
        @DisplayName("updates policy successfully and records audit")
        void updatePolicy_success() {
            StrikePolicyRequest request = new StrikePolicyRequest(30, 3, 7, 14, 180, true);
            ModerationPolicy updated = new ModerationPolicy(30, 3, 7, 14, 180, true, Instant.now());
            StrikePolicyResponse expectedResponse = new StrikePolicyResponse(
                    30, 3, 7, 14, 180, true, Instant.now().toString());

            when(identityCommandPort.updateModerationPolicy(30, 3, 7, 14, 180, true))
                    .thenReturn(updated);
            when(adminModerationCompositionService.strikePolicyResponse(updated))
                    .thenReturn(expectedResponse);

            AdminModerationPolicyUpdateOutcome outcome = service.updatePolicy("admin-1", request);

            assertThat(outcome.status()).isEqualTo(AdminModerationPolicyUpdateOutcome.Status.SUCCESS);
            assertThat(outcome.body()).isEqualTo(expectedResponse);
            verify(adminAuditCommandPort)
                    .recordAdminAction("admin-1", "MODERATION_POLICY_UPDATED", "MODERATION_POLICY", null, null);
        }

        @Test
        @DisplayName("rejects when repeatSuspensionDays less than firstSuspensionDays")
        void updatePolicy_rejectsRepeatLessThanFirst() {
            StrikePolicyRequest request = new StrikePolicyRequest(30, 3, 14, 7, 180, true);

            AdminModerationPolicyUpdateOutcome outcome = service.updatePolicy("admin-1", request);

            assertThat(outcome.status()).isEqualTo(AdminModerationPolicyUpdateOutcome.Status.INVALID_POLICY);
            assertThat(outcome.errorMessage()).contains("repeatSuspensionDays");
            verify(identityCommandPort, never()).updateModerationPolicy(30, 3, 14, 7, 180, true);
            verify(adminAuditCommandPort, never())
                    .recordAdminAction(anyString(), anyString(), anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("rejects when repeatOffenseWindowDays less than strikeWindowDays")
        void updatePolicy_rejectsRepeatOffenseLessThanStrikeWindow() {
            StrikePolicyRequest request = new StrikePolicyRequest(180, 3, 7, 14, 30, true);

            AdminModerationPolicyUpdateOutcome outcome = service.updatePolicy("admin-1", request);

            assertThat(outcome.status()).isEqualTo(AdminModerationPolicyUpdateOutcome.Status.INVALID_POLICY);
            assertThat(outcome.errorMessage()).contains("repeatOffenseWindowDays");
            verify(identityCommandPort, never()).updateModerationPolicy(180, 3, 7, 14, 30, true);
        }

        @Test
        @DisplayName("allows equal repeatSuspensionDays and firstSuspensionDays")
        void updatePolicy_allowsEqualValues() {
            StrikePolicyRequest request = new StrikePolicyRequest(30, 3, 14, 14, 180, true);
            ModerationPolicy updated = new ModerationPolicy(30, 3, 14, 14, 180, true, Instant.now());
            StrikePolicyResponse expectedResponse = new StrikePolicyResponse(
                    30, 3, 14, 14, 180, true, Instant.now().toString());

            when(identityCommandPort.updateModerationPolicy(30, 3, 14, 14, 180, true))
                    .thenReturn(updated);
            when(adminModerationCompositionService.strikePolicyResponse(updated))
                    .thenReturn(expectedResponse);

            AdminModerationPolicyUpdateOutcome outcome = service.updatePolicy("admin-1", request);

            assertThat(outcome.status()).isEqualTo(AdminModerationPolicyUpdateOutcome.Status.SUCCESS);
        }
    }
}
