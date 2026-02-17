package mn.tasky.auth.dto;

import java.time.Instant;

public record RefreshSession(String userId, Instant expiresAt) {

}
