package mn.tasky.runtime.publicapi.composition;

import java.util.Map;
import mn.tasky.auth.dto.AuthSession;
import org.springframework.stereotype.Component;

@Component
public class OtpPublicCompositionService {

    public Map<String, Object> otpSentResponse(String maskedPhone) {
        return Map.of("message", "OTP sent to " + maskedPhone);
    }

    public Map<String, Object> authSessionResponse(AuthSession session) {
        return Map.of(
                "access_token", session.accessToken(), "refresh_token", session.refreshToken(), "user", session.user());
    }
}
