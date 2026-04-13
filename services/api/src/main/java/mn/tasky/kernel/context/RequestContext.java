package mn.tasky.kernel.context;

public record RequestContext(
        String correlationId, String traceId, String commandId, String actorId, String locale, String platform) {}
