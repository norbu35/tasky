package mn.tasky.kernel.logging;

public enum LogField {
    CORRELATION_ID("correlation_id"),
    TRACE_ID("trace_id"),
    CAUSATION_ID("causation_id"),
    COMMAND_ID("command_id"),
    WORKFLOW_ID("workflow_id"),
    JOB_ID("job_id"),
    ACTOR_ID("actor_id"),
    LOCALE("locale"),
    PLATFORM("platform"),
    RUNTIME_SURFACE("runtime_surface");

    private final String key;

    LogField(String key) {
        this.key = key;
    }

    public String key() {
        return key;
    }
}
