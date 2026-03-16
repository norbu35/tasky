package mn.tasky.wallet.dto;

import java.time.Instant;

public record PayoutRequest(String id, String userId, int amount, String status, Instant createdAt) {}
