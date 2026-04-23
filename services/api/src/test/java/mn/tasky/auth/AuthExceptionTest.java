package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Auth exceptions")
class AuthExceptionTest {

    @Nested
    @DisplayName("AccountRestrictedException")
    class AccountRestricted {

        @Test
        @DisplayName("carries message")
        void carriesMessage() {
            AccountRestrictedException ex = new AccountRestrictedException("Account suspended");

            assertThat(ex.getMessage()).isEqualTo("Account suspended");
        }

        @Test
        @DisplayName("is a RuntimeException")
        void isRuntimeException() {
            AccountRestrictedException ex = new AccountRestrictedException("msg");

            assertThat(ex).isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("FacebookAuthException")
    class FacebookAuth {

        @Test
        @DisplayName("carries code and message")
        void carriesCodeAndMessage() {
            FacebookAuthException ex = new FacebookAuthException("TOKEN_INVALID", "Invalid token");

            assertThat(ex.code()).isEqualTo("TOKEN_INVALID");
            assertThat(ex.getMessage()).isEqualTo("Invalid token");
        }

        @Test
        @DisplayName("carries cause")
        void carriesCause() {
            RuntimeException cause = new RuntimeException("connection reset");
            FacebookAuthException ex = new FacebookAuthException("PROVIDER_ERROR", "Provider failed", cause);

            assertThat(ex.code()).isEqualTo("PROVIDER_ERROR");
            assertThat(ex.getMessage()).isEqualTo("Provider failed");
            assertThat(ex.getCause()).isSameAs(cause);
        }

        @Test
        @DisplayName("is a RuntimeException")
        void isRuntimeException() {
            FacebookAuthException ex = new FacebookAuthException("CODE", "msg");

            assertThat(ex).isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("RateLimitExceededException")
    class RateLimitExceeded {

        @Test
        @DisplayName("carries code and message")
        void carriesCodeAndMessage() {
            RateLimitExceededException ex = new RateLimitExceededException("OTP_RATE_LIMITED", "Slow down");

            assertThat(ex.code()).isEqualTo("OTP_RATE_LIMITED");
            assertThat(ex.getMessage()).isEqualTo("Slow down");
        }

        @Test
        @DisplayName("is a RuntimeException")
        void isRuntimeException() {
            RateLimitExceededException ex = new RateLimitExceededException("CODE", "msg");

            assertThat(ex).isInstanceOf(RuntimeException.class);
        }
    }
}
