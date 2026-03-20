package mn.tasky.common.health;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.jdbi.v3.core.Jdbi;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class OutboxHealthIndicator implements HealthIndicator {

    private static final Duration MAX_LAG = Duration.ofMinutes(5);
    private final Jdbi jdbi;

    public OutboxHealthIndicator(Jdbi jdbi, MeterRegistry meterRegistry) {
        this.jdbi = jdbi;
        Gauge.builder("tasky.outbox.lag_seconds", this, OutboxHealthIndicator::computeLagSeconds)
                .register(meterRegistry);
    }

    double computeLagSeconds() {
        Optional<Instant> oldest = jdbi.withHandle(handle ->
                handle.createQuery(
                                "SELECT MIN(created_at) FROM domain_outbox_events "
                                        + "WHERE status IN ('PENDING', 'PROCESSING') AND available_at <= now()")
                        .mapTo(Instant.class)
                        .findOne());

        if (oldest.isEmpty()) {
            return 0.0;
        }
        return (double) Duration.between(oldest.get(), Instant.now()).getSeconds();
    }

    @Override
    public Health health() {
        double lagSeconds = computeLagSeconds();
        if (lagSeconds == 0.0) {
            return Health.up().withDetail("lag_seconds", 0).build();
        }

        if (lagSeconds > MAX_LAG.getSeconds()) {
            return Health.down()
                    .withDetail("lag_seconds", (long) lagSeconds)
                    .build();
        }
        return Health.up().withDetail("lag_seconds", (long) lagSeconds).build();
    }
}
