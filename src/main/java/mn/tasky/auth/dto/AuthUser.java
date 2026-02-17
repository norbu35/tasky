package mn.tasky.auth.dto;

import java.time.Instant;

public record AuthUser(
        String id,
        String phone,
        String role,
        String status,
        Instant createdAt
) {

}
