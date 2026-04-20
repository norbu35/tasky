package mn.tasky.dispute.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import mn.tasky.api.generated.DisputesApi;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.runtime.publicapi.composition.DisputePublicCompositionService;
import mn.tasky.runtime.publicapi.composition.DisputeRaiseOutcome;
import mn.tasky.runtime.publicapi.composition.DisputeRaiseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/api/v1")
@Validated
@SuppressWarnings("unchecked")
public class DisputeController implements DisputesApi {

    private final DisputePublicCompositionService disputePublicCompositionService;
    private final DisputeRaiseService disputeRaiseService;

    public DisputeController(
            DisputePublicCompositionService disputePublicCompositionService, DisputeRaiseService disputeRaiseService) {
        this.disputePublicCompositionService = disputePublicCompositionService;
        this.disputeRaiseService = disputeRaiseService;
    }

    @Override
    @GetMapping("/disputes/{id}")
    public ResponseEntity<mn.tasky.api.generated.model.Dispute> getDispute(@PathVariable("id") UUID id) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        boolean admin = "ADMIN".equals(principal.role());
        return disputePublicCompositionService
                .disputeDetail(id.toString(), principal.userId(), admin)
                .<ResponseEntity<mn.tasky.api.generated.model.Dispute>>map(
                        body -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>)
                                (ResponseEntity<?>) ResponseEntity.ok(body))
                .orElseGet(() -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>) (ResponseEntity<?>)
                        ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Dispute not found.", request)));
    }

    @Override
    @PostMapping(
            value = "/bookings/{id}/disputes",
            consumes = {"application/json"})
    public ResponseEntity<mn.tasky.api.generated.model.Dispute> raiseDispute(
            @PathVariable("id") UUID id,
            @RequestHeader(value = "Idempotency-Key", required = true) UUID idempotencyKey,
            @Valid @RequestBody mn.tasky.api.generated.model.RaiseDisputeRequest raiseDisputeRequest) {
        JwtPrincipal principal = getPrincipal();
        HttpServletRequest request = getRequest();
        DisputeRequest domainBody = new DisputeRequest(
                raiseDisputeRequest.getReason(),
                raiseDisputeRequest.getEvidence().stream()
                        .map(e -> new DisputeRequest.EvidenceItem(
                                e.getType().getValue(), e.getStorageKey(), e.getTextPayload()))
                        .toList());
        DisputeRaiseOutcome outcome = disputeRaiseService.raiseDispute(
                principal.userId(), id.toString(), domainBody, idempotencyKey.toString());
        return switch (outcome.status()) {
            case IN_PROGRESS -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>)
                    (ResponseEntity<?>) idempotencyInProgress(request);
            case REPLAY_MISSING -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>)
                    (ResponseEntity<?>) idempotencyReplayMissing(request);
            case SUCCESS -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>)
                    (ResponseEntity<?>) ResponseEntity.status(201).body(outcome.body());
            case NOT_FOUND -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>) (ResponseEntity<?>)
                    ResponseEntity.status(404).body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case FORBIDDEN -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>) (ResponseEntity<?>)
                    ResponseEntity.status(403).body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INVALID_REASON, INVALID_STATUS, DISPUTE_WINDOW_EXPIRED -> (ResponseEntity<
                            mn.tasky.api.generated.model.Dispute>)
                    (ResponseEntity<?>) ResponseEntity.badRequest()
                            .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case DISPUTE_EXISTS -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>) (ResponseEntity<?>)
                    ResponseEntity.status(409).body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
            case INTERNAL_ERROR -> (ResponseEntity<mn.tasky.api.generated.model.Dispute>)
                    (ResponseEntity<?>) ResponseEntity.status(500)
                            .body(errorBody("INTERNAL_ERROR", "An unexpected error occurred.", request));
        };
    }

    private JwtPrincipal getPrincipal() {
        return (JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private HttpServletRequest getRequest() {
        return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    }
}
