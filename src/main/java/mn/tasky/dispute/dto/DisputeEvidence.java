package mn.tasky.dispute.dto;

import java.time.Instant;
import org.springframework.lang.Nullable;

public record DisputeEvidence(
        String id,
        String disputeId,
        String type,
        @Nullable String storageKey,
        @Nullable String textPayload,
        Instant createdAt) {}
