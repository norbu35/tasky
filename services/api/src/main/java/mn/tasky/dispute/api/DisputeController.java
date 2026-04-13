package mn.tasky.dispute.api;

import jakarta.validation.Valid;
import java.util.Map;
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
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey) {
        DisputeRaiseOutcome outcome = disputeRaiseService.raiseDispute(principal.userId(), id, body, idempotencyKey);
        return switch (outcome.status()) {
            case IN_PROGRESS -> ResponseEntity.status(409)
                    .body(Map.of(
                            "code",
                            "IDEMPOTENCY_IN_PROGRESS",
                            "message",
                            "An identical request is still being processed."));
            case REPLAY_MISSING -> ResponseEntity.status(409)
                    .body(Map.of(
                            "code",
                            "IDEMPOTENCY_REPLAY_MISSING",
                            "message",
                            "Previous request exists but replay state could not be loaded."));
            case SUCCESS -> ResponseEntity.status(201).body(outcome.body());
            case NOT_FOUND -> ResponseEntity.notFound().build();
            case FORBIDDEN -> ResponseEntity.status(403)
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case INVALID_REASON, INVALID_STATUS, DISPUTE_WINDOW_EXPIRED -> ResponseEntity.badRequest()
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case DISPUTE_EXISTS -> ResponseEntity.status(409)
                    .body(Map.of("code", outcome.errorCode(), "message", outcome.errorMessage()));
            case INTERNAL_ERROR -> ResponseEntity.internalServerError().build();
        };
    }

    @GetMapping("/disputes/{id}")
    public ResponseEntity<?> getDispute(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id) {
        boolean admin = "ADMIN".equals(principal.role());
        return disputePublicCompositionService
                .disputeDetail(id, principal.userId(), admin)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
