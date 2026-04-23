package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThat;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.lang.reflect.Field;
import java.time.Instant;
import mn.tasky.auth.application.FacebookCircuitBreaker.State;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link FacebookCircuitBreaker} in the application package.
 *
 * <p>Complements the existing {@code FacebookCircuitBreakerTests} in the auth package
 * with additional scenarios focusing on edge cases.
 */
@DisplayName("FacebookCircuitBreaker (application)")
class FacebookCircuitBreakerTest {

    private FacebookCircuitBreaker breaker;

    @BeforeEach
    void setUp() {
        breaker = new FacebookCircuitBreaker(new SimpleMeterRegistry());
    }

    @Test
    @DisplayName("starts in CLOSED state")
    void startsClosed() {
        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
        assertThat(breaker.isOpen()).isFalse();
    }

    @Test
    @DisplayName("recordSuccess when already CLOSED is a no-op")
    void successWhenClosedIsNoOp() {
        breaker.recordSuccess();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    @Test
    @DisplayName("single failure does not open the circuit")
    void singleFailureDoesNotOpen() {
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    @Test
    @DisplayName("window expiry resets counter to 1 on next failure")
    void windowExpiryResetsCounter() throws Exception {
        breaker.recordFailure();
        breaker.recordFailure();
        setWindowStart(breaker, Instant.now().minusSeconds(61));

        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    @Test
    @DisplayName("failure after success resets window start")
    void failureAfterSuccessResetsWindow() {
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordSuccess();

        breaker.recordFailure();
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    private static void setWindowStart(FacebookCircuitBreaker target, Instant value) throws Exception {
        Field field = FacebookCircuitBreaker.class.getDeclaredField("windowStart");
        field.setAccessible(true);
        field.set(target, value);
    }
}
