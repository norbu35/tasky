package mn.tasky.automation.job;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Canonical job envelope dispatched to worker consumers.
 * Carries execution context (attempt count, deadline) and the same
 * distributed-tracing fields as {@link mn.tasky.automation.event.AutomationEventEnvelope}
 * so that logs remain traceable across async hops.
 */
public record AutomationJobEnvelope(
        String jobId,
        String jobType,
        Map<String, Object> payload,
        String correlationId,
        String causationId,
        String commandId,
        String workflowId,
        String actorId,
        int attempt,
        int maxRetries,
        Instant createdAt,
        Instant deadline) {

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String jobId;
        private String jobType;
        private Map<String, Object> payload = Map.of();
        private String correlationId;
        private String causationId;
        private String commandId;
        private String workflowId;
        private String actorId;
        private int attempt = 0;
        private int maxRetries = 3;
        private Instant createdAt;
        private Instant deadline;

        public Builder jobId(String id) {
            this.jobId = id;
            return this;
        }

        public Builder jobType(String type) {
            this.jobType = type;
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

        public Builder attempt(int attempt) {
            this.attempt = attempt;
            return this;
        }

        public Builder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        public Builder createdAt(Instant instant) {
            this.createdAt = instant;
            return this;
        }

        public Builder deadline(Instant instant) {
            this.deadline = instant;
            return this;
        }

        public AutomationJobEnvelope build() {
            if (jobId == null) {
                jobId = UUID.randomUUID().toString();
            }
            if (createdAt == null) {
                createdAt = Instant.now();
            }
            if (deadline == null) {
                deadline = createdAt.plusSeconds(300);
            }
            return new AutomationJobEnvelope(
                    jobId,
                    jobType,
                    payload,
                    correlationId,
                    causationId,
                    commandId,
                    workflowId,
                    actorId,
                    attempt,
                    maxRetries,
                    createdAt,
                    deadline);
        }
    }
}
