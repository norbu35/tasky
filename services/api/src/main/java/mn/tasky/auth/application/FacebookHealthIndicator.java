package mn.tasky.auth.application;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Exposes Facebook OAuth circuit-breaker state on the Spring Boot Actuator health endpoint.
 *
 * <p>Reports DOWN when the circuit is OPEN or HALF_OPEN (i.e., Facebook Graph API calls are
 * being blocked or tentatively tested), and UP when the circuit is fully CLOSED.
 */
@Component
public class FacebookHealthIndicator implements HealthIndicator {

    private final FacebookCircuitBreaker circuitBreaker;

    public FacebookHealthIndicator(FacebookCircuitBreaker circuitBreaker) {
        this.circuitBreaker = circuitBreaker;
    }

    @Override
    public Health health() {
        return circuitBreaker.isOpen()
                ? Health.down()
                        .withDetail("state", circuitBreaker.getState().name())
                        .build()
                : Health.up()
                        .withDetail("state", circuitBreaker.getState().name())
                        .build();
    }
}
