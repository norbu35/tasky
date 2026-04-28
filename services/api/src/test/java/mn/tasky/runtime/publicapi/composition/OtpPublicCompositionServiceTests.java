package mn.tasky.runtime.publicapi.composition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import mn.tasky.auth.dto.AuthSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("OtpPublicCompositionService")
class OtpPublicCompositionServiceTests {

    private OtpPublicCompositionService service;

    @BeforeEach
    void setUp() {
        service = new OtpPublicCompositionService();
    }

    @Nested
    @DisplayName("otpSentResponse")
    class OtpSentResponse {

        @Test
        @DisplayName("returns message with masked phone number")
        void returnsMessageWithMaskedPhone() {
            Map<String, Object> response = service.otpSentResponse("+976****2233");

            assertThat(response).containsEntry("message", "OTP sent to +976****2233");
        }

        @Test
        @DisplayName("returns message with different masked patterns")
        void returnsDifferentMaskPatterns() {
            Map<String, Object> response = service.otpSentResponse("****1234");

            assertThat(response).containsEntry("message", "OTP sent to ****1234");
        }
    }

    @Nested
    @DisplayName("authSessionResponse")
    class AuthSessionResponse {

        @Test
        @DisplayName("maps AuthSession fields to response map")
        void mapsAllFields() {
            Map<String, Object> userData = Map.of("id", "u-1", "role", "CUSTOMER");
            AuthSession session = new AuthSession("access-tok-123", "refresh-tok-456", userData);

            Map<String, Object> response = service.authSessionResponse(session);

            assertThat(response).containsEntry("access_token", "access-tok-123");
            assertThat(response).containsEntry("refresh_token", "refresh-tok-456");
            assertThat(response).containsEntry("user", userData);
        }
    }
}
