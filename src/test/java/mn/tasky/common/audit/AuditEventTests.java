package mn.tasky.common.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AuditEventTests {

    @Test
    @DisplayName("AuditEvent record accessors return constructed values")
    void recordAccessorsReturnConstructedValues() {
        Instant now = Instant.parse("2026-03-17T10:00:00Z");
        AuditEvent event =
                new AuditEvent("evt-1", "actor-user-1", "TASK_CREATED", "TASK", "resource-1", "{\"key\":\"val\"}", now);

        assertThat(event.id()).isEqualTo("evt-1");
        assertThat(event.actorUserId()).isEqualTo("actor-user-1");
        assertThat(event.action()).isEqualTo("TASK_CREATED");
        assertThat(event.resourceType()).isEqualTo("TASK");
        assertThat(event.resourceId()).isEqualTo("resource-1");
        assertThat(event.metadataJson()).isEqualTo("{\"key\":\"val\"}");
        assertThat(event.createdAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("AuditEvent supports null optional fields")
    void nullOptionalFields() {
        AuditEvent event = new AuditEvent("evt-2", null, "USER_LOGIN", "USER", null, null, null);

        assertThat(event.id()).isEqualTo("evt-2");
        assertThat(event.actorUserId()).isNull();
        assertThat(event.resourceId()).isNull();
        assertThat(event.metadataJson()).isNull();
        assertThat(event.createdAt()).isNull();
    }

    @Test
    @DisplayName("AuditEvent equals and hashCode based on all fields")
    void equalsAndHashCode() {
        Instant now = Instant.now();
        AuditEvent a = new AuditEvent("id", "actor", "ACT", "RES", "rid", "{}", now);
        AuditEvent b = new AuditEvent("id", "actor", "ACT", "RES", "rid", "{}", now);

        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    @DisplayName("AuditEvent toString includes field values")
    void toStringIncludesFields() {
        AuditEvent event = new AuditEvent("evt-3", "actor", "DELETE", "TASK", "r1", null, null);

        String str = event.toString();
        assertThat(str).contains("evt-3");
        assertThat(str).contains("DELETE");
        assertThat(str).contains("TASK");
    }
}
