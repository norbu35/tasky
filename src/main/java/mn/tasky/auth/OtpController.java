package mn.tasky.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/otp")
@Validated
public class OtpController {

    private final OtpRateLimitService otpRateLimitService;

    public OtpController(OtpRateLimitService otpRateLimitService) {
        this.otpRateLimitService = otpRateLimitService;
    }

    @PostMapping("/request")
    public Map<String, String> requestOtp(
        @Valid @RequestBody OtpRequestBody body,
        HttpServletRequest request
    ) {
        otpRateLimitService.assertRequestAllowed(body.phone(), resolveClientIp(request));
        return Map.of("message", "OTP sent to " + maskPhone(body.phone()));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(
        @Valid @RequestBody OtpVerifyBody body,
        HttpServletRequest request
    ) {
        otpRateLimitService.assertVerifyAllowed(body.phone(), resolveClientIp(request));

        if (!"123456".equals(body.code())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("code", "OTP_INVALID", "message", "Invalid OTP code."));
        }

        return ResponseEntity.ok(
            Map.of(
                "access_token", "stub-access-token",
                "refresh_token", "stub-refresh-token",
                "user", Map.of(
                    "id", UUID.randomUUID().toString(),
                    "phone", body.phone(),
                    "role", "CUSTOMER",
                    "status", "PENDING"
                )
            )
        );
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private String maskPhone(String phone) {
        if (phone.length() <= 4) {
            return "****";
        }
        return phone.substring(0, Math.min(6, phone.length())) + "****";
    }

    public record OtpRequestBody(@NotBlank String phone) {
    }

    public record OtpVerifyBody(@NotBlank String phone, @NotBlank String code) {
    }
}
