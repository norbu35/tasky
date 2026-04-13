package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.admin.dto.ConciergeAssignRequest;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminTaskConciergeAssignmentOutcome;
import mn.tasky.runtime.adminapi.composition.AdminTaskConciergeAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/tasks")
@Validated
public class AdminTaskController {

    private final AdminTaskConciergeAssignmentService adminTaskConciergeAssignmentService;

    public AdminTaskController(AdminTaskConciergeAssignmentService adminTaskConciergeAssignmentService) {
        this.adminTaskConciergeAssignmentService = adminTaskConciergeAssignmentService;
    }

    @PostMapping("/{id}/concierge-assign")
    public ResponseEntity<?> conciergeAssign(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody ConciergeAssignRequest body,
            HttpServletRequest request) {
        AdminTaskConciergeAssignmentOutcome outcome = adminTaskConciergeAssignmentService.conciergeAssign(
                principal.userId(),
                id,
                body.taskerId(),
                body.overrideReason(),
                Boolean.TRUE.equals(body.liabilityDisclaimerAccepted()),
                idempotencyKey);
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case DISCLAIMER_REQUIRED -> ResponseEntity.badRequest()
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case NOT_FOUND, TASKER_NOT_FOUND -> ResponseEntity.status(404)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case TASK_NOT_OPEN, TASKER_NOT_VERIFIED -> ResponseEntity.status(409)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
        };
    }
}
