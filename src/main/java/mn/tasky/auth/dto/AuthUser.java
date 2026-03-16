package mn.tasky.auth.dto;

import java.time.Instant;

public record AuthUser(
        String id,
        String phone,
        String facebookId,
        String role,
        String status,
        String primaryAuth,
        Instant createdAt,
        Instant updatedAt) {}
