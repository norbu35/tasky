package mn.tasky.admin.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/verifications")
@Validated
public class AdminVerificationController {

    private final AuthService authService;

    public AdminVerificationController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPending(
        @RequestParam(value = "limit", defaultValue = "20") int limit
    ) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<AuthService.VerificationDetail> pending = authService.listPendingVerifications(clampedLimit);
        List<VerificationDetailBody> data = pending.stream()
            .map(this::toDetailBody)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                new CursorPagination(null, false)
            )
        );
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(
        @PathVariable String id,
        HttpServletRequest request
    ) {
        return authService.approveVerification(id)
            .<ResponseEntity<?>>map(detail -> ResponseEntity.ok(toDetailBody(detail)))
            .orElseGet(() -> {
                if (authService.verificationExists(id)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(
                        Map.of(
                            "code", "NOT_PENDING",
                            "message", "Verification is not in PENDING status.",
                            "trace_id", resolveTraceId(request)
                        )
                    );
                }
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                        "code", "NOT_FOUND",
                        "message", "Verification not found.",
                        "trace_id", resolveTraceId(request)
                    )
                );
            });
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(
        @PathVariable String id,
        @Valid @RequestBody RejectBody body,
        HttpServletRequest request
    ) {
        return authService.rejectVerification(id, body.reason())
            .<ResponseEntity<?>>map(detail -> ResponseEntity.ok(toDetailBody(detail)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Verification not found or not in PENDING status.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    private VerificationDetailBody toDetailBody(AuthService.VerificationDetail detail) {
        return new VerificationDetailBody(
            detail.id(),
            detail.userId(),
            detail.userPhone(),
            detail.userName(),
            detail.idCardFrontUrl(),
            detail.idCardBackUrl(),
            detail.status(),
            detail.adminNotes(),
            detail.submittedAt(),
            detail.reviewedAt()
        );
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record RejectBody(
        @NotBlank
        String reason
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record VerificationDetailBody(
        String id,
        @JsonProperty("user_id")
        String userId,
        @JsonProperty("user_phone")
        String userPhone,
        @JsonProperty("user_name")
        String userName,
        @JsonProperty("id_card_front_url")
        String idCardFrontUrl,
        @JsonProperty("id_card_back_url")
        String idCardBackUrl,
        String status,
        @JsonProperty("admin_notes")
        String adminNotes,
        @JsonProperty("submitted_at")
        String submittedAt,
        @JsonProperty("reviewed_at")
        String reviewedAt
    ) {
    }
}
