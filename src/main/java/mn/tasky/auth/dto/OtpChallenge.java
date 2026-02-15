package mn.tasky.auth.dto;

import java.time.Instant;

public record OtpChallenge(String code, Instant expiresAt, int attempts) {
}
