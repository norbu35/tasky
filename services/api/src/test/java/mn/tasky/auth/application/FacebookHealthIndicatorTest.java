package mn.tasky.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import mn.tasky.auth.application.FacebookCircuitBreaker.State;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.actuate.health.Status;

@ExtendWith(MockitoExtension.class)
@DisplayName("FacebookHealthIndicator")
class FacebookHealthIndicatorTest {

    @Mock
    private FacebookCircuitBreaker circuitBreaker;

    private FacebookHealthIndicator indicator;

    @BeforeEach
    void setUp() {
        indicator = new FacebookHealthIndicator(circuitBreaker);
    }

    @Test
    @DisplayName("reports UP when circuit is CLOSED")
    void reportsUpWhenClosed() {
        when(circuitBreaker.isOpen()).thenReturn(false);
        when(circuitBreaker.getState()).thenReturn(State.CLOSED);

        var health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("state", "CLOSED");
    }

    @Test
    @DisplayName("reports DOWN when circuit is OPEN")
    void reportsDownWhenOpen() {
        when(circuitBreaker.isOpen()).thenReturn(true);
        when(circuitBreaker.getState()).thenReturn(State.OPEN);

        var health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsEntry("state", "OPEN");
    }

    @Test
    @DisplayName("reports DOWN when circuit is HALF_OPEN")
    void reportsDownWhenHalfOpen() {
        when(circuitBreaker.isOpen()).thenReturn(true);
        when(circuitBreaker.getState()).thenReturn(State.HALF_OPEN);

        var health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsEntry("state", "HALF_OPEN");
    }
}
