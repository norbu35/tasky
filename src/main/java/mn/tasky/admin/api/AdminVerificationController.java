package mn.tasky.admin.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.admin.dto.RejectVerificationRequest;
import mn.tasky.admin.dto.VerificationDetailResponse;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        List<VerificationDetail> pending = authService.listPendingVerifications(clampedLimit);
        List<VerificationDetailResponse> data = pending.stream()
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
        @Valid @RequestBody RejectVerificationRequest body,
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

    private VerificationDetailResponse toDetailBody(VerificationDetail detail) {
        return new VerificationDetailResponse(
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

}
