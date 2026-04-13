package mn.tasky.kernel.context;

public record WorkflowContext(
        String correlationId, String causationId, String commandId, String workflowId, String actorId) {}
