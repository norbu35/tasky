package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.admin.dto.RejectVerificationRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminVerificationCompositionService;
import mn.tasky.runtime.adminapi.composition.AdminVerificationDecisionOutcome;
import mn.tasky.runtime.adminapi.composition.AdminVerificationDecisionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    private final AdminVerificationCompositionService adminVerificationCompositionService;
    private final AdminVerificationDecisionService adminVerificationDecisionService;

    public AdminVerificationController(
            AdminVerificationCompositionService adminVerificationCompositionService,
            AdminVerificationDecisionService adminVerificationDecisionService) {
        this.adminVerificationCompositionService = adminVerificationCompositionService;
        this.adminVerificationDecisionService = adminVerificationDecisionService;
    }

    @GetMapping("/pending")
    public ResponseEntity<?> listPending(
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        var page = adminVerificationCompositionService.pendingVerifications(cursor, limit);
        return ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDetail(
            @PathVariable String id, @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        return adminVerificationCompositionService
                .verificationDetail(id, principal.userId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "code",
                                "NOT_FOUND",
                                "message",
                                "Verification not found.",
                                "trace_id",
                                resolveTraceId(request))));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        AdminVerificationDecisionOutcome outcome = adminVerificationDecisionService.approve(id);
        return switch (outcome.status()) {
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case NOT_PENDING -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code",
                            outcome.errorCode(),
                            "message",
                            outcome.errorMessage(),
                            "trace_id",
                            resolveTraceId(request)));
            case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code",
                            outcome.errorCode(),
                            "message",
                            outcome.errorMessage(),
                            "trace_id",
                            resolveTraceId(request)));
        };
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody RejectVerificationRequest body,
            HttpServletRequest request) {
        AdminVerificationDecisionOutcome outcome = adminVerificationDecisionService.reject(id, body.reason());
        return switch (outcome.status()) {
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case NOT_PENDING, NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "code",
                            outcome.errorCode(),
                            "message",
                            outcome.errorMessage(),
                            "trace_id",
                            resolveTraceId(request)));
        };
    }
}
