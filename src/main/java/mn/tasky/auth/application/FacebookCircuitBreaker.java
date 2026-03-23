package mn.tasky.auth.application;

import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/**
 * Thread-safe circuit breaker for Facebook Graph API calls.
 *
 * <p>Transitions CLOSED → OPEN after {@value #FAILURE_THRESHOLD} failures within a
 * {@value #FAILURE_WINDOW_SECONDS}-second sliding window. The window resets whenever
 * {@code consecutiveFailures} is zero (i.e., after a success or after the previous window
 * expired). The {@link FacebookCircuitBreakerProbe} is responsible for attempting a recovery
 * probe every 60 seconds when the breaker is OPEN, transitioning it to HALF_OPEN before the
 * probe attempt and back to CLOSED on success.
 */
@Component
public class FacebookCircuitBreaker {

    public enum State {
        CLOSED,
        OPEN,
        HALF_OPEN
    }

    private static final int FAILURE_THRESHOLD = 3;
    private static final int FAILURE_WINDOW_SECONDS = 60;
    private static final Duration FAILURE_WINDOW = Duration.ofSeconds(FAILURE_WINDOW_SECONDS);

    private final MeterRegistry meterRegistry;

    private State state = State.CLOSED;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private Instant windowStart = Instant.now();

    public FacebookCircuitBreaker(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public State getState() {
        synchronized (this) {
            return state;
        }
    }

    /** Returns {@code true} when the circuit is OPEN or HALF_OPEN — i.e., not fully closed. */
    public boolean isOpen() {
        synchronized (this) {
            return state != State.CLOSED;
        }
    }

    /** Resets the circuit to CLOSED and clears the failure counter. */
    public void recordSuccess() {
        synchronized (this) {
            State oldState = state;
            state = State.CLOSED;
            consecutiveFailures.set(0);
            if (oldState != State.CLOSED) {
                meterRegistry
                        .counter(
                                "tasky.circuit_breaker.state_changes",
                                "from",
                                oldState.name(),
                                "to",
                                State.CLOSED.name())
                        .increment();
            }
        }
    }

    /**
     * Records a single failure. Opens the circuit if {@value #FAILURE_THRESHOLD} failures
     * have occurred within the current failure window. If the window has already expired the
     * counter is reset to 1 and a new window is started, so a stale burst cannot retroactively
     * open the circuit.
     */
    public void recordFailure() {
        synchronized (this) {
            Instant now = Instant.now();

            // Start a fresh window when the counter is at zero (first failure after success/reset).
            if (consecutiveFailures.get() == 0) {
                windowStart = now;
            }

            // Reset window if it expired before incrementing so that an old burst cannot trip the
            // breaker with a single additional failure that falls outside the window.
            if (Duration.between(windowStart, now).compareTo(FAILURE_WINDOW) >= 0) {
                consecutiveFailures.set(1);
                windowStart = now;
                return;
            }

            int failures = consecutiveFailures.incrementAndGet();
            if (failures >= FAILURE_THRESHOLD) {
                State oldState = state;
                state = State.OPEN;
                if (oldState != State.OPEN) {
                    meterRegistry
                            .counter(
                                    "tasky.circuit_breaker.state_changes",
                                    "from",
                                    oldState.name(),
                                    "to",
                                    State.OPEN.name())
                            .increment();
                }
            }
        }
    }

    /** Transitions OPEN -> HALF_OPEN so the probe can attempt a single test call. */
    public void tryHalfOpen() {
        synchronized (this) {
            if (state == State.OPEN) {
                meterRegistry
                        .counter(
                                "tasky.circuit_breaker.state_changes",
                                "from",
                                State.OPEN.name(),
                                "to",
                                State.HALF_OPEN.name())
                        .increment();
                state = State.HALF_OPEN;
            }
        }
    }
}
