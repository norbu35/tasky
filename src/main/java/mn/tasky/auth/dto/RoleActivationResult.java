package mn.tasky.auth.dto;

import java.util.Map;

public record RoleActivationResult(String accessToken, String refreshToken, Map<String, Object> user) {
}
