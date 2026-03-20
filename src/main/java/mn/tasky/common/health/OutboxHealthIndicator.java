package mn.tasky.common.health;

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

    public OutboxHealthIndicator(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    @Override
    public Health health() {
        Optional<Instant> oldest = jdbi.withHandle(handle ->
                handle.createQuery(
                                "SELECT MIN(created_at) FROM domain_outbox_events "
                                        + "WHERE status IN ('PENDING', 'PROCESSING') AND available_at <= now()")
                        .mapTo(Instant.class)
                        .findOne());

        if (oldest.isEmpty()) {
            return Health.up().withDetail("lag_seconds", 0).build();
        }

        long lagSeconds = Duration.between(oldest.get(), Instant.now()).getSeconds();
        if (lagSeconds > MAX_LAG.getSeconds()) {
            return Health.down()
                    .withDetail("lag_seconds", lagSeconds)
                    .withDetail("oldest_pending", oldest.get().toString())
                    .build();
        }
        return Health.up().withDetail("lag_seconds", lagSeconds).build();
    }
}
