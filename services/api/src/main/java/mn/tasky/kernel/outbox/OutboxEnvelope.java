package mn.tasky.kernel.outbox;

import java.time.Instant;
import java.util.Map;
import mn.tasky.kernel.context.WorkflowContext;

public record OutboxEnvelope(
        String eventType,
        String aggregateType,
        String aggregateId,
        Map<String, Object> payload,
        WorkflowContext workflowContext,
        Instant occurredAt) {
    public OutboxEnvelope {
        payload = payload == null ? Map.of() : Map.copyOf(payload);
        occurredAt = occurredAt == null ? Instant.now() : occurredAt;
    }
}
