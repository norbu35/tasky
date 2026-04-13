package mn.tasky.kernel.context;

public record JobContext(
        String correlationId,
        String causationId,
        String commandId,
        String workflowId,
        String jobId,
        String actorId,
        int attempt) {}
