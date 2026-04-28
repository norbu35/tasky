package mn.tasky.runtime.adminapi.composition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import mn.tasky.admin.dto.StrikePolicyResponse;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminModerationCompositionServiceTests {

    @Mock
    private IdentityQueryPort identityQueryPort;

    private AdminModerationCompositionService service;

    @BeforeEach
    void setUp() {
        service = new AdminModerationCompositionService(identityQueryPort);
    }

    @Nested
    @DisplayName("currentStrikePolicy")
    class CurrentStrikePolicyTests {

        @Test
        @DisplayName("returns current moderation policy mapped to StrikePolicyResponse")
        void currentStrikePolicy_returnsMappedResponse() {
            ModerationPolicy policy =
                    new ModerationPolicy(30, 3, 7, 14, 180, true, Instant.parse("2025-01-01T00:00:00Z"));
            when(identityQueryPort.getModerationPolicy()).thenReturn(policy);

            StrikePolicyResponse response = service.currentStrikePolicy();

            assertThat(response.strikeWindowDays()).isEqualTo(30);
            assertThat(response.strikeThreshold()).isEqualTo(3);
            assertThat(response.firstSuspensionDays()).isEqualTo(7);
            assertThat(response.repeatSuspensionDays()).isEqualTo(14);
            assertThat(response.repeatOffenseWindowDays()).isEqualTo(180);
            assertThat(response.autoUnsuspendEnabled()).isTrue();
            assertThat(response.updatedAt()).isEqualTo("2025-01-01T00:00:00Z");
        }

        @Test
        @DisplayName("handles null updatedAt in policy")
        void currentStrikePolicy_nullUpdatedAt() {
            ModerationPolicy policy = new ModerationPolicy(30, 3, 7, 14, 180, true, null);
            when(identityQueryPort.getModerationPolicy()).thenReturn(policy);

            StrikePolicyResponse response = service.currentStrikePolicy();

            assertThat(response.updatedAt()).isNull();
        }
    }

    @Nested
    @DisplayName("strikePolicyResponse")
    class StrikePolicyResponseTests {

        @Test
        @DisplayName("maps ModerationPolicy to StrikePolicyResponse")
        void strikePolicyResponse_mapsFields() {
            ModerationPolicy policy = ModerationPolicy.DEFAULT;

            StrikePolicyResponse response = service.strikePolicyResponse(policy);

            assertThat(response.strikeWindowDays()).isEqualTo(policy.strikeWindowDays());
            assertThat(response.strikeThreshold()).isEqualTo(policy.strikeThreshold());
            assertThat(response.firstSuspensionDays()).isEqualTo(policy.firstSuspensionDays());
            assertThat(response.repeatSuspensionDays()).isEqualTo(policy.repeatSuspensionDays());
            assertThat(response.repeatOffenseWindowDays()).isEqualTo(policy.repeatOffenseWindowDays());
            assertThat(response.autoUnsuspendEnabled()).isEqualTo(policy.autoUnsuspendEnabled());
        }
    }
}
