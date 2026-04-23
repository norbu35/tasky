package mn.tasky.kernel.context;

import java.util.Map;
import org.slf4j.MDC;
import org.springframework.util.StringUtils;

/**
 * Centralized utility for propagating tracing context across request, workflow, job,
 * and provider boundaries. All MDC operations for the canonical context fields
 * (correlation_id, trace_id, causation_id, command_id, workflow_id, job_id, actor_id,
 * locale, platform, runtime_surface) must go through this class.
 */
public final class ContextPropagator {

    private ContextPropagator() {}

    // MDC keys — single source of truth, aligned with LogField and persisted outbox columns
    public static final String MDC_CORRELATION_ID = "correlation_id";
    public static final String MDC_TRACE_ID = "trace_id";
    public static final String MDC_CAUSATION_ID = "causation_id";
    public static final String MDC_COMMAND_ID = "command_id";
    public static final String MDC_WORKFLOW_ID = "workflow_id";
    public static final String MDC_ACTOR_ID = "actor_id";
    public static final String MDC_LOCALE = "locale";
    public static final String MDC_PLATFORM = "platform";

    /**
     * Populate MDC from a RequestContext (HTTP request boundary).
     */
    public static void propagate(RequestContext ctx) {
        putIfPresent(MDC_CORRELATION_ID, ctx.correlationId());
        putIfPresent(MDC_TRACE_ID, ctx.traceId());
        putIfPresent(MDC_COMMAND_ID, ctx.commandId());
        putIfPresent(MDC_ACTOR_ID, ctx.actorId());
        putIfPresent(MDC_LOCALE, ctx.locale());
        putIfPresent(MDC_PLATFORM, ctx.platform());
    }

    /**
     * Populate MDC from a WorkflowContext (async workflow boundary).
     */
    public static void propagate(WorkflowContext ctx) {
        putIfPresent(MDC_CORRELATION_ID, ctx.correlationId());
        putIfPresent(MDC_CAUSATION_ID, ctx.causationId());
        putIfPresent(MDC_COMMAND_ID, ctx.commandId());
        putIfPresent(MDC_WORKFLOW_ID, ctx.workflowId());
        putIfPresent(MDC_ACTOR_ID, ctx.actorId());
    }

    /**
     * Populate MDC from a JobContext (job execution boundary).
     */
    public static void propagate(JobContext ctx) {
        propagate(new WorkflowContext(
                ctx.correlationId(), ctx.causationId(), ctx.commandId(), ctx.workflowId(), ctx.actorId()));
    }

    /**
     * Convert a RequestContext to a WorkflowContext for async handoff.
     */
    public static WorkflowContext toWorkflow(RequestContext ctx, String causationId, String workflowId) {
        return new WorkflowContext(
                ctx.correlationId(),
                causationId != null ? causationId : ctx.commandId(),
                ctx.commandId(),
                workflowId,
                ctx.actorId());
    }

    /**
     * Convert a WorkflowContext to a JobContext for job execution.
     */
    public static JobContext toJob(WorkflowContext workflowCtx, String jobId, int attempt) {
        return new JobContext(
                workflowCtx.correlationId(),
                workflowCtx.causationId(),
                workflowCtx.commandId(),
                workflowCtx.workflowId(),
                jobId,
                workflowCtx.actorId(),
                attempt);
    }

    /**
     * Read the current MDC state into a map (useful for serialization into outbox/envelopes).
     */
    public static Map<String, String> captureMdc() {
        return MDC.getCopyOfContextMap();
    }

    /**
     * Extract a value from the captured MDC map (safe for null/missing entries).
     */
    public static String fromMdc(Map<String, String> mdc, String key) {
        if (mdc == null) {
            return null;
        }
        String value = mdc.get(key);
        return StringUtils.hasText(value) ? value : null;
    }

    /**
     * Clear all canonical context keys from MDC.
     */
    public static void clear() {
        MDC.remove(MDC_CORRELATION_ID);
        MDC.remove(MDC_TRACE_ID);
        MDC.remove(MDC_CAUSATION_ID);
        MDC.remove(MDC_COMMAND_ID);
        MDC.remove(MDC_WORKFLOW_ID);
        MDC.remove(MDC_ACTOR_ID);
        MDC.remove(MDC_LOCALE);
        MDC.remove(MDC_PLATFORM);
    }

    private static void putIfPresent(String key, String value) {
        if (StringUtils.hasText(value)) {
            MDC.put(key, value);
        }
    }
}
