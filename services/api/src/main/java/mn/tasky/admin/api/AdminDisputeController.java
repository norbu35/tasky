package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.admin.dto.ResolveRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminDisputeCompositionService;
import mn.tasky.runtime.adminapi.composition.AdminDisputeResolutionOutcome;
import mn.tasky.runtime.adminapi.composition.AdminDisputeResolutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/disputes")
@Validated
public class AdminDisputeController {

    private final AdminDisputeCompositionService disputeCompositionService;
    private final AdminDisputeResolutionService disputeResolutionService;

    public AdminDisputeController(
            AdminDisputeCompositionService disputeCompositionService,
            AdminDisputeResolutionService disputeResolutionService) {
        this.disputeCompositionService = disputeCompositionService;
        this.disputeResolutionService = disputeResolutionService;
    }

    @GetMapping
    public ResponseEntity<?> listPending(
            @RequestParam(required = false) String cursor, @RequestParam(defaultValue = "50") int limit) {
        var page = disputeCompositionService.pendingDisputes(cursor, limit);
        return ResponseEntity.ok(
                new PagedResponse<>(page.data(), new CursorPagination(page.nextCursor(), page.hasMore())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDispute(@PathVariable String id, HttpServletRequest request) {
        return disputeCompositionService
                .disputeDetail(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Dispute not found.", request)));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<?> resolveDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody ResolveRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        AdminDisputeResolutionOutcome outcome = disputeResolutionService.resolveDispute(
                principal.userId(), id, body.outcome(), body.notes(), idempotencyKey);

        return switch (outcome.status()) {
            case IN_PROGRESS, REPLAY_MISSING -> ResponseEntity.status(409).body(outcome.body());
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Dispute not found.", request));
            case BAD_REQUEST -> ResponseEntity.badRequest().body(outcome.body());
        };
    }
}
