package mn.tasky.wallet.dto;

import jakarta.validation.constraints.Size;
import java.time.Instant;

public record PayoutRequest(
        @Size(max = 512) String id,
        @Size(max = 512) String userId,
        int amount,
        @Size(max = 64) String status,
        Instant createdAt) {}
