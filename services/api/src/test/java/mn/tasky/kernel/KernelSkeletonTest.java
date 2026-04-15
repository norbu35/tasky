package mn.tasky.kernel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import mn.tasky.common.CommonToKernelDeprecationPath;
import mn.tasky.kernel.idempotency.IdempotencyKey;
import org.junit.jupiter.api.Test;

class KernelSkeletonTest {

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
}
