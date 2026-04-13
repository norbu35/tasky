package mn.tasky.runtime.adminapi.composition;

import java.util.Map;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AdminDisputeResolutionService {

    private final TrustCommandPort trustCommandPort;
    private final TrustQueryPort trustQueryPort;
    private final AdminDisputeCompositionService disputeCompositionService;
    private final IdempotencyService idempotencyService;

    public AdminDisputeResolutionService(
            TrustCommandPort trustCommandPort,
            TrustQueryPort trustQueryPort,
            AdminDisputeCompositionService disputeCompositionService,
            IdempotencyService idempotencyService) {
        this.trustCommandPort = trustCommandPort;
        this.trustQueryPort = trustQueryPort;
        this.disputeCompositionService = disputeCompositionService;
        this.idempotencyService = idempotencyService;
    }

    public AdminDisputeResolutionOutcome resolveDispute(
            String adminId, String disputeId, String outcome, String notes, String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(adminId, IdempotencyOperations.RESOLVE_DISPUTE, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return AdminDisputeResolutionOutcome.of(
                    AdminDisputeResolutionOutcome.Status.IN_PROGRESS,
                    Map.of(
                            "code", "IDEMPOTENCY_IN_PROGRESS",
                            "message", "An identical request is still being processed."));
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return replayMissing();
            }
            String replayDisputeId = claim.record().resourceId().toString();
            return trustQueryPort
                    .getDispute(replayDisputeId)
                    .map(dispute -> AdminDisputeResolutionOutcome.of(
                            AdminDisputeResolutionOutcome.Status.SUCCESS,
                            disputeCompositionService.adminDisputeResponse(dispute)))
                    .orElseGet(this::replayMissing);
        }

        try {
            var result = trustCommandPort.resolveDispute(adminId, disputeId, outcome, notes);
            if (!result.isSuccess()) {
                idempotencyService.abandon(adminId, IdempotencyOperations.RESOLVE_DISPUTE, idempotencyKey);
                if ("NOT_FOUND".equals(result.error())) {
                    return AdminDisputeResolutionOutcome.of(AdminDisputeResolutionOutcome.Status.NOT_FOUND, null);
                }
                return AdminDisputeResolutionOutcome.of(
                        AdminDisputeResolutionOutcome.Status.BAD_REQUEST, Map.of("error", result.error()));
            }

            idempotencyService.completeWithResource(
                    adminId,
                    IdempotencyOperations.RESOLVE_DISPUTE,
                    idempotencyKey,
                    "DISPUTE",
                    result.dispute().id());
            return AdminDisputeResolutionOutcome.of(
                    AdminDisputeResolutionOutcome.Status.SUCCESS,
                    disputeCompositionService.adminDisputeResponse(result.dispute()));
        } catch (RuntimeException exception) {
            idempotencyService.abandon(adminId, IdempotencyOperations.RESOLVE_DISPUTE, idempotencyKey);
            throw exception;
        }
    }

    private AdminDisputeResolutionOutcome replayMissing() {
        return AdminDisputeResolutionOutcome.of(
                AdminDisputeResolutionOutcome.Status.REPLAY_MISSING,
                Map.of(
                        "code", "IDEMPOTENCY_REPLAY_MISSING",
                        "message", "Previous request exists but replay state could not be loaded."));
    }
}
