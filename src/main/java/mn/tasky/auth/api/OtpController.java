package mn.tasky.auth.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.OtpRateLimitService;
import mn.tasky.auth.dto.OtpRequest;
import mn.tasky.auth.dto.OtpVerifyRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/otp")
@Validated
public class OtpController {

    private final OtpRateLimitService otpRateLimitService;
    private final AuthService authService;

    public OtpController(OtpRateLimitService otpRateLimitService,
                         AuthService authService) {
        this.otpRateLimitService = otpRateLimitService;
        this.authService         = authService;
    }

    @PostMapping("/request")
    public Map<String, String> requestOtp(
            @Valid @RequestBody OtpRequest body,
            HttpServletRequest request
    ) {
        otpRateLimitService.assertRequestAllowed(body.phone(),
                                                 resolveClientIp(request));
        String maskedPhone = authService.requestOtp(body.phone());
        return Map.of("message",
                      "OTP sent to " + maskedPhone);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null
                ? request.getRemoteAddr()
                : "unknown";
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest body,
            HttpServletRequest request
    ) {
        otpRateLimitService.assertVerifyAllowed(body.phone(),
                                                resolveClientIp(request));

        return authService.verifyOtp(body.phone(),
                                     body.code())
                .map(session -> ResponseEntity.ok(
                        Map.of(
                                "access_token",
                                session.accessToken(),
                                "refresh_token",
                                session.refreshToken(),
                                "user",
                                session.user()
                        )
                ))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(
                                Map.of(
                                        "code",
                                        "OTP_INVALID",
                                        "message",
                                        "Invalid or expired OTP code.",
                                        "trace_id",
                                        resolveTraceId(request)
                                )
                        ));
    }

}
