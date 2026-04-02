package mn.tasky.wallet.dto;

import java.time.Instant;

public record LedgerEntry(
        String id, String userId, int amount, String type, String referenceId, String description, Instant createdAt) {}
