package mn.tasky.common.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class AuditEventTest {

    @Test
    void recordAccessorsReturnConstructorValues() {
        Instant now = Instant.now();
        AuditEvent event = new AuditEvent("id-1", "actor-1", "BAN", "user", "res-1", "{}", now);

        assertThat(event.id()).isEqualTo("id-1");
        assertThat(event.actorUserId()).isEqualTo("actor-1");
        assertThat(event.action()).isEqualTo("BAN");
        assertThat(event.resourceType()).isEqualTo("user");
        assertThat(event.resourceId()).isEqualTo("res-1");
        assertThat(event.metadataJson()).isEqualTo("{}");
        assertThat(event.createdAt()).isEqualTo(now);
    }

    @Test
    void equalsAndHashCodeWork() {
        Instant ts = Instant.parse("2025-01-01T00:00:00Z");
        AuditEvent a = new AuditEvent("id", "actor", "ACT", "type", "rid", null, ts);
        AuditEvent b = new AuditEvent("id", "actor", "ACT", "type", "rid", null, ts);

        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    void toStringContainsId() {
        AuditEvent event = new AuditEvent("id-99", "a", "X", "t", "r", null, null);

        assertThat(event.toString()).contains("id-99");
    }
}
