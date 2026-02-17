package mn.tasky.common.security.dto;

import java.time.Instant;

public record ParsedRefreshToken(String userId, String tokenId, Instant expiresAt) {

}
