package mn.tasky.common;

import java.util.List;

/**
 * Documentation-only migration map for responsibilities currently living in {@code mn.tasky.common} that should move
 * into the Tasky v2 kernel and runtime planes over subsequent tranches.
 */
public final class CommonToKernelDeprecationPath {
    private static final List<Entry> ENTRIES = List.of(
            new Entry(
                    "mn.tasky.common.observability",
                    "mn.tasky.kernel.context + mn.tasky.kernel.logging",
                    "Promote request/workflow/job context contracts and canonical log fields "
                            + "before moving filter implementations."),
            new Entry(
                    "mn.tasky.common.idempotency",
                    "mn.tasky.kernel.idempotency",
                    "Move idempotency key contracts and orchestration seams "
                            + "before relocating the current service and DAO."),
            new Entry(
                    "mn.tasky.common.outbox",
                    "mn.tasky.kernel.outbox + mn.tasky.automation",
                    "Lift canonical event envelopes into kernel first, "
                            + "then migrate processors and broker-facing handlers."),
            new Entry(
                    "mn.tasky.common.config",
                    "mn.tasky.kernel + mn.tasky.runtime.*",
                    "Keep shared framework wiring narrow in kernel "
                            + "and move surface-owned composition into runtime packages."));

    private CommonToKernelDeprecationPath() {}

    public static List<Entry> entries() {
        return ENTRIES;
    }

    public record Entry(String currentArea, String targetArea, String note) {}
}
