package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.time.Instant;
import mn.tasky.auth.application.FacebookCircuitBreaker;
import mn.tasky.auth.application.FacebookCircuitBreaker.State;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link FacebookCircuitBreaker}.
 *
 * <p>The tests that exercise the failure window manipulate {@code windowStart} directly via
 * reflection to avoid real-time sleeps in the test suite.
 */
class FacebookCircuitBreakerTests {

    private FacebookCircuitBreaker breaker;

    @BeforeEach
    void setUp() {
        breaker = new FacebookCircuitBreaker();
    }

    // ------------------------------------------------------------------
    // 1. Three failures within the window → OPEN
    // ------------------------------------------------------------------

    @Test
    @DisplayName("3 failures within 60s window opens the circuit")
    void threeFailuresWithinWindowOpensCircuit() {
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.OPEN);
        assertThat(breaker.isOpen()).isTrue();
    }

    @Test
    @DisplayName("fewer than 3 failures does not open the circuit")
    void twoFailuresDoesNotOpenCircuit() {
        breaker.recordFailure();
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
        assertThat(breaker.isOpen()).isFalse();
    }

    // ------------------------------------------------------------------
    // 2. Success after OPEN → CLOSED
    // ------------------------------------------------------------------

    @Test
    @DisplayName("recordSuccess after circuit is OPEN closes it")
    void successAfterOpenClosesCircuit() {
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordFailure();
        assertThat(breaker.getState()).isEqualTo(State.OPEN);

        breaker.recordSuccess();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
        assertThat(breaker.isOpen()).isFalse();
    }

    @Test
    @DisplayName("recordSuccess resets failure counter so subsequent failures start fresh")
    void successResetsFailureCounter() {
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordSuccess();

        // Two new failures after reset should not open the circuit.
        breaker.recordFailure();
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    // ------------------------------------------------------------------
    // 3. Failures spread over >60s → window expires → stays CLOSED
    // ------------------------------------------------------------------

    @Test
    @DisplayName("failures whose window has expired do not open the circuit")
    void failuresAfterWindowExpiryDoNotOpenCircuit() throws Exception {
        // Record two failures, then back-date the window start so it appears expired.
        breaker.recordFailure();
        breaker.recordFailure();

        setWindowStart(breaker, Instant.now().minusSeconds(61));

        // Third failure arrives after the window expired → window should reset to count=1.
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
        assertThat(breaker.isOpen()).isFalse();
    }

    @Test
    @DisplayName("three more failures after window reset can still open the circuit")
    void freshBurstAfterWindowResetOpensCircuit() throws Exception {
        breaker.recordFailure();
        breaker.recordFailure();
        setWindowStart(breaker, Instant.now().minusSeconds(61));

        // This resets the window (count=1, new windowStart).
        breaker.recordFailure();
        // Two more within the new window.
        breaker.recordFailure();
        breaker.recordFailure();

        assertThat(breaker.getState()).isEqualTo(State.OPEN);
    }

    // ------------------------------------------------------------------
    // 4. HALF_OPEN transition
    // ------------------------------------------------------------------

    @Test
    @DisplayName("tryHalfOpen transitions OPEN → HALF_OPEN")
    void tryHalfOpenTransitionsFromOpen() {
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordFailure();
        assertThat(breaker.getState()).isEqualTo(State.OPEN);

        breaker.tryHalfOpen();

        assertThat(breaker.getState()).isEqualTo(State.HALF_OPEN);
        assertThat(breaker.isOpen()).isTrue(); // HALF_OPEN is still "open" for callers
    }

    @Test
    @DisplayName("tryHalfOpen is a no-op when circuit is CLOSED")
    void tryHalfOpenIsNoOpWhenClosed() {
        assertThat(breaker.getState()).isEqualTo(State.CLOSED);

        breaker.tryHalfOpen();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    @Test
    @DisplayName("recordSuccess from HALF_OPEN closes the circuit")
    void successFromHalfOpenClosesCircuit() {
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.recordFailure();
        breaker.tryHalfOpen();
        assertThat(breaker.getState()).isEqualTo(State.HALF_OPEN);

        breaker.recordSuccess();

        assertThat(breaker.getState()).isEqualTo(State.CLOSED);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /** Back-doors {@code windowStart} via reflection to avoid sleeping in tests. */
    private static void setWindowStart(FacebookCircuitBreaker target, Instant value) throws Exception {
        Field field = FacebookCircuitBreaker.class.getDeclaredField("windowStart");
        field.setAccessible(true);
        field.set(target, value);
    }
}
