package mn.tasky.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FacebookAuthExceptionUnitTests {

    @Test
    void constructorStoresCodeAndMessage() {
        FacebookAuthException exception = new FacebookAuthException(
            "FACEBOOK_TOKEN_INVALID",
            "Facebook access token is invalid."
        );

        assertThat(exception.code()).isEqualTo("FACEBOOK_TOKEN_INVALID");
        assertThat(exception.getMessage()).isEqualTo("Facebook access token is invalid.");
    }

    @Test
    void constructorWithCausePreservesCause() {
        RuntimeException cause = new RuntimeException("network timeout");
        FacebookAuthException exception = new FacebookAuthException(
            "FACEBOOK_PROFILE_READ_FAILED",
            "Unable to read Facebook profile.",
            cause
        );

        assertThat(exception.code()).isEqualTo("FACEBOOK_PROFILE_READ_FAILED");
        assertThat(exception).hasMessage("Unable to read Facebook profile.")
            .hasCause(cause);
    }
}
