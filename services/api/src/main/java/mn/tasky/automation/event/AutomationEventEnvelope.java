package mn.tasky.automation.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Canonical event envelope published from the outbox path.
 * Carries domain event data plus distributed-tracing context fields so that
 * downstream workers can propagate correlation, causation, and audit trail.
 */
public record AutomationEventEnvelope(
        String eventId,
        String eventType,
        String aggregateType,
        String aggregateId,
        Map<String, Object> payload,
        String correlationId,
        String traceId,
        String causationId,
        String commandId,
        String workflowId,
        String actorId,
        String locale,
        String platform,
        Instant occurredAt,
        String publishedAt) {

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String eventId;
        private String eventType;
        private String aggregateType;
        private String aggregateId;
        private Map<String, Object> payload = Map.of();
        private String correlationId;
        private String traceId;
        private String causationId;
        private String commandId;
        private String workflowId;
        private String actorId;
        private String locale;
        private String platform;
        private Instant occurredAt;

        public Builder eventId(String id) {
            this.eventId = id;
            return this;
        }

        public Builder eventType(String type) {
            this.eventType = type;
            return this;
        }

        public Builder aggregateType(String type) {
            this.aggregateType = type;
            return this;
        }

        public Builder aggregateId(String id) {
            this.aggregateId = id;
            return this;
        }

        public Builder payload(Map<String, Object> payload) {
            this.payload = payload == null ? Map.of() : Map.copyOf(payload);
            return this;
        }

        public Builder correlationId(String id) {
            this.correlationId = id;
            return this;
        }

        public Builder traceId(String id) {
            this.traceId = id;
            return this;
        }

        public Builder causationId(String id) {
            this.causationId = id;
            return this;
        }

        public Builder commandId(String id) {
            this.commandId = id;
            return this;
        }

        public Builder workflowId(String id) {
            this.workflowId = id;
            return this;
        }

        public Builder actorId(String id) {
            this.actorId = id;
            return this;
        }

        public Builder locale(String value) {
            this.locale = value;
            return this;
        }

        public Builder platform(String value) {
            this.platform = value;
            return this;
        }

        public Builder occurredAt(Instant instant) {
            this.occurredAt = instant;
            return this;
        }

        public AutomationEventEnvelope build() {
            if (eventId == null) {
                eventId = UUID.randomUUID().toString();
            }
            if (occurredAt == null) {
                occurredAt = Instant.now();
            }
            return new AutomationEventEnvelope(
                    eventId,
                    eventType,
                    aggregateType,
                    aggregateId,
                    payload,
                    correlationId,
                    traceId,
                    causationId,
                    commandId,
                    workflowId,
                    actorId,
                    locale,
                    platform,
                    occurredAt,
                    Instant.now().toString());
        }
    }
}
