package mn.tasky.auth.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.auth.application.OtpRateLimitService;
import mn.tasky.auth.dto.OtpRequest;
import mn.tasky.auth.dto.OtpVerifyRequest;
import mn.tasky.common.security.ClientIpResolver;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.runtime.publicapi.composition.OtpPublicCompositionService;
import org.springframework.beans.factory.annotation.Value;
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
    private final IdentityCommandPort identityCommandPort;
    private final ClientIpResolver clientIpResolver;
    private final boolean otpEnabled;
    private final OtpPublicCompositionService otpPublicCompositionService;

    public OtpController(
            OtpRateLimitService otpRateLimitService,
            IdentityCommandPort identityCommandPort,
            ClientIpResolver clientIpResolver,
            @Value("${tasky.otp.enabled:false}") boolean otpEnabled,
            OtpPublicCompositionService otpPublicCompositionService) {
        this.otpRateLimitService = otpRateLimitService;
        this.identityCommandPort = identityCommandPort;
        this.clientIpResolver = clientIpResolver;
        this.otpEnabled = otpEnabled;
        this.otpPublicCompositionService = otpPublicCompositionService;
    }

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestOtp(
            @Valid @RequestBody OtpRequest body, HttpServletRequest request) {
        if (!otpEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FEATURE_DISABLED",
                            "message",
                            "OTP authentication is disabled for current rollout phase.",
                            "trace_id",
                            resolveTraceId(request)));
        }
        otpRateLimitService.assertRequestAllowed(body.phone(), clientIpResolver.resolve(request));
        String maskedPhone = identityCommandPort.requestOtp(body.phone());
        return ResponseEntity.ok(otpPublicCompositionService.otpSentResponse(maskedPhone));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest body, HttpServletRequest request) {
        if (!otpEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "code",
                            "FEATURE_DISABLED",
                            "message",
                            "OTP authentication is disabled for current rollout phase.",
                            "trace_id",
                            resolveTraceId(request)));
        }
        otpRateLimitService.assertVerifyAllowed(body.phone(), clientIpResolver.resolve(request));

        return identityCommandPort
                .verifyOtp(body.phone(), body.code(), body.facebookAccessToken())
                .map(session -> ResponseEntity.ok(otpPublicCompositionService.authSessionResponse(session)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "code",
                                "OTP_INVALID",
                                "message",
                                "Invalid or expired OTP code.",
                                "trace_id",
                                resolveTraceId(request))));
    }
}
