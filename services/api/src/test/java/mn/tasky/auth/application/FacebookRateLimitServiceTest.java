package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import mn.tasky.auth.RateLimitExceededException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("FacebookRateLimitService")
class FacebookRateLimitServiceTest {

    private FacebookRateLimitService service;

    @BeforeEach
    void setUp() {
        service = new FacebookRateLimitService();
    }

    @Test
    @DisplayName("allows requests under the limit")
    void allowsRequestsUnderLimit() {
        assertThatCode(() -> {
                    for (int i = 0; i < 10; i++) {
                        service.assertAllowed("192.168.1.1");
                    }
                })
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("throws when limit exceeded for same IP")
    void throwsWhenLimitExceeded() {
        for (int i = 0; i < 10; i++) {
            service.assertAllowed("10.0.0.1");
        }

        assertThatThrownBy(() -> service.assertAllowed("10.0.0.1"))
                .isInstanceOf(RateLimitExceededException.class)
                .hasMessageContaining("Too many OAuth attempts");
    }

    @Test
    @DisplayName("tracks limits per IP independently")
    void tracksPerIpIndependently() {
        for (int i = 0; i < 10; i++) {
            service.assertAllowed("10.0.0.1");
        }

        assertThatCode(() -> service.assertAllowed("10.0.0.2")).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("exception has correct error code")
    void exceptionHasCorrectErrorCode() {
        for (int i = 0; i < 10; i++) {
            service.assertAllowed("10.0.0.1");
        }

        assertThatThrownBy(() -> service.assertAllowed("10.0.0.1"))
                .isInstanceOfSatisfying(RateLimitExceededException.class, ex -> {
                    assertThatCode(() -> {
                                throw ex;
                            })
                            .hasMessageContaining("Too many OAuth attempts");
                    org.assertj.core.api.Assertions.assertThat(ex.code()).isEqualTo("OAUTH_RATE_LIMITED");
                });
    }
}
