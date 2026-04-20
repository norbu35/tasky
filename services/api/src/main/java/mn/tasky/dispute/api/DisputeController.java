package mn.tasky.dispute.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.runtime.publicapi.composition.DisputePublicCompositionService;
import mn.tasky.runtime.publicapi.composition.DisputeRaiseOutcome;
import mn.tasky.runtime.publicapi.composition.DisputeRaiseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Validated
public class DisputeController {

    private final DisputePublicCompositionService disputePublicCompositionService;
    private final DisputeRaiseService disputeRaiseService;

    public DisputeController(
            DisputePublicCompositionService disputePublicCompositionService, DisputeRaiseService disputeRaiseService) {
        this.disputePublicCompositionService = disputePublicCompositionService;
        this.disputeRaiseService = disputeRaiseService;
    }

    @PostMapping("/bookings/{id}/disputes")
    public ResponseEntity<?> raiseDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody DisputeRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest request) {
        DisputeRaiseOutcome outcome = disputeRaiseService.raiseDispute(principal.userId(), id, body, idempotencyKey);
        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.status(201).body(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(404)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case FORBIDDEN -> ResponseEntity.status(403)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INVALID_REASON, INVALID_STATUS, DISPUTE_WINDOW_EXPIRED -> ResponseEntity.badRequest()
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case DISPUTE_EXISTS -> ResponseEntity.status(409)
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INTERNAL_ERROR -> ResponseEntity.status(500)
                    .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    @GetMapping("/disputes/{id}")
    public ResponseEntity<?> getDispute(
            @AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id, HttpServletRequest request) {
        boolean admin = "ADMIN".equals(principal.role());
        return disputePublicCompositionService
                .disputeDetail(id, principal.userId(), admin)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Dispute not found.", request)));
    }
}
