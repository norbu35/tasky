package mn.tasky.common.security.dto;

import java.time.Instant;

public record RefreshToken(String token, String tokenId, Instant expiresAt) {
}
