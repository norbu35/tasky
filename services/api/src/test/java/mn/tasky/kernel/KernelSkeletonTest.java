package mn.tasky.kernel;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.List;
import mn.tasky.common.CommonToKernelDeprecationPath;
import mn.tasky.kernel.context.JobContext;
import mn.tasky.kernel.context.RequestContext;
import mn.tasky.kernel.context.WorkflowContext;
import mn.tasky.kernel.error.KernelError;
import mn.tasky.kernel.idempotency.IdempotencyKey;
import mn.tasky.kernel.logging.LogField;
import mn.tasky.kernel.outbox.OutboxEnvelope;
import org.junit.jupiter.api.Test;

class KernelSkeletonTest {

    @Test
    void contextRecordsExposeCanonicalExecutionFields() {
        assertRecordComponents(
                RequestContext.class, "correlationId", "traceId", "commandId", "actorId", "locale", "platform");
        assertRecordComponents(
                WorkflowContext.class, "correlationId", "causationId", "commandId", "workflowId", "actorId");
        assertRecordComponents(
                JobContext.class,
                "correlationId",
                "causationId",
                "commandId",
                "workflowId",
                "jobId",
                "actorId",
                "attempt");
    }

    @Test
    void canonicalStructuredLogFieldsAreDefined() {
        List<String> keys = Arrays.stream(LogField.values()).map(LogField::key).toList();
        assertTrue(keys.contains("correlation_id"));
        assertTrue(keys.contains("trace_id"));
        assertTrue(keys.contains("causation_id"));
        assertTrue(keys.contains("command_id"));
        assertTrue(keys.contains("workflow_id"));
        assertTrue(keys.contains("job_id"));
        assertTrue(keys.contains("actor_id"));
        assertTrue(keys.contains("runtime_surface"));
    }

    @Test
    void kernelSkeletonIncludesErrorAndOutboxEnvelopes() {
        assertRecordComponents(KernelError.class, "code", "message", "traceId", "retryable");
        assertRecordComponents(
                OutboxEnvelope.class,
                "eventType",
                "aggregateType",
                "aggregateId",
                "payload",
                "workflowContext",
                "occurredAt");
    }

    @Test
    void idempotencyKeyNormalizesAndValidatesInput() {
        assertEquals("demo-key", IdempotencyKey.of("  demo-key  ").value());
        assertThrows(IllegalArgumentException.class, () -> IdempotencyKey.of(" "));
        assertThrows(IllegalArgumentException.class, () -> IdempotencyKey.of("x".repeat(129)));
    }

    @Test
    void commonDeprecationPathDocumentsKernelMigrationTargets() {
        List<CommonToKernelDeprecationPath.Entry> entries = CommonToKernelDeprecationPath.entries();
        assertTrue(entries.stream().anyMatch(entry -> entry.currentArea().equals("mn.tasky.common.observability")));
        assertTrue(entries.stream().anyMatch(entry -> entry.currentArea().equals("mn.tasky.common.idempotency")));
        assertTrue(entries.stream().anyMatch(entry -> entry.currentArea().equals("mn.tasky.common.outbox")));
        assertTrue(entries.stream().anyMatch(entry -> entry.currentArea().equals("mn.tasky.common.config")));
    }

    private static void assertRecordComponents(Class<?> type, String... expectedComponentNames) {
        assertTrue(type.isRecord(), () -> type.getSimpleName() + " must be a record");
        RecordComponent[] components = type.getRecordComponents();
        assertArrayEquals(
                expectedComponentNames,
                Arrays.stream(components).map(RecordComponent::getName).toArray(String[]::new));
    }
}
