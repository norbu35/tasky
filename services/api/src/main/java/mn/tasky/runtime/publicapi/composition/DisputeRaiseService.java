package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.dispute.dto.DisputeRequest;
import mn.tasky.trust.publicapi.TrustCommandPort;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Component;

@Component
public class DisputeRaiseService {

    private final TrustCommandPort trustCommandPort;
    private final TrustQueryPort trustQueryPort;
    private final AnalyticsCommandPort analyticsCommandPort;
    private final BookingQueryPort bookingQueryPort;
    private final IdempotencyService idempotencyService;
    private final DisputePublicCompositionService disputePublicCompositionService;

    public DisputeRaiseService(
            TrustCommandPort trustCommandPort,
            TrustQueryPort trustQueryPort,
            AnalyticsCommandPort analyticsCommandPort,
            BookingQueryPort bookingQueryPort,
            IdempotencyService idempotencyService,
            DisputePublicCompositionService disputePublicCompositionService) {
        this.trustCommandPort = trustCommandPort;
        this.trustQueryPort = trustQueryPort;
        this.analyticsCommandPort = analyticsCommandPort;
        this.bookingQueryPort = bookingQueryPort;
        this.idempotencyService = idempotencyService;
        this.disputePublicCompositionService = disputePublicCompositionService;
    }

    public DisputeRaiseOutcome raiseDispute(
            String userId, String bookingId, DisputeRequest body, String idempotencyKey) {
        IdempotencyClaim claim = idempotencyService.claim(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return DisputeRaiseOutcome.inProgress();
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return DisputeRaiseOutcome.replayMissing();
            }
            return trustQueryPort
                    .getDispute(claim.record().resourceId().toString())
                    .map(dispute ->
                            DisputeRaiseOutcome.success(disputePublicCompositionService.disputeSummary(dispute)))
                    .orElseGet(DisputeRaiseOutcome::replayMissing);
        }

        try {
            var result = trustCommandPort.raiseDispute(userId, bookingId, body.reason(), body.evidence());
            if (!result.isSuccess()) {
                idempotencyService.abandon(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
                return switch (result.error()) {
                    case "BOOKING_NOT_FOUND" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.NOT_FOUND, "NOT_FOUND", "Booking not found");
                    case "FORBIDDEN" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.FORBIDDEN,
                            "FORBIDDEN",
                            "Only booking participants can raise disputes");
                    case "INVALID_REASON" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.INVALID_REASON,
                            "INVALID_REASON",
                            "Dispute reason cannot be empty");
                    case "INVALID_EVIDENCE" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.INVALID_EVIDENCE,
                            "INVALID_EVIDENCE",
                            "Evidence artifacts must include a photo storage key or written text payload");
                    case "INVALID_STATUS" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.INVALID_STATUS,
                            "INVALID_STATUS",
                            "Booking must be ASSIGNED or COMPLETED to raise dispute");
                    case "DISPUTE_WINDOW_EXPIRED" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.DISPUTE_WINDOW_EXPIRED,
                            "DISPUTE_WINDOW_EXPIRED",
                            "Completed bookings can only be disputed within 24 hours");
                    case "DISPUTE_EXISTS" -> DisputeRaiseOutcome.failure(
                            DisputeRaiseOutcome.Status.DISPUTE_EXISTS, "DISPUTE_EXISTS", "Dispute already exists");
                    default -> DisputeRaiseOutcome.internalError();
                };
            }

            Map<String, Object> analyticsProperties = new LinkedHashMap<>();
            analyticsProperties.put(AnalyticsCommandPort.PROPERTY_BOOKING_ID, bookingId);
            analyticsProperties.put("dispute_id", result.dispute().id());
            bookingQueryPort
                    .getBooking(bookingId)
                    .ifPresent(booking ->
                            analyticsProperties.put(AnalyticsCommandPort.PROPERTY_TASK_ID, booking.taskId()));
            analyticsCommandPort.track(AnalyticsCommandPort.EVENT_DISPUTE_RAISED, userId, analyticsProperties);

            idempotencyService.completeWithResource(
                    userId,
                    IdempotencyOperations.RAISE_DISPUTE,
                    idempotencyKey,
                    "DISPUTE",
                    result.dispute().id());
            return DisputeRaiseOutcome.success(disputePublicCompositionService.disputeSummary(result.dispute()));
        } catch (RuntimeException exception) {
            idempotencyService.abandon(userId, IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
            throw exception;
        }
    }

    public DisputeEvidenceOutcome addEvidence(String userId, String disputeId, DisputeRequest body) {
        var result = trustCommandPort.addDisputeEvidence(userId, disputeId, body.evidence());
        if (!result.isSuccess()) {
            return switch (result.error()) {
                case "NOT_FOUND" -> DisputeEvidenceOutcome.failure(
                        DisputeEvidenceOutcome.Status.NOT_FOUND, "NOT_FOUND", "Dispute not found");
                case "FORBIDDEN" -> DisputeEvidenceOutcome.failure(
                        DisputeEvidenceOutcome.Status.FORBIDDEN,
                        "FORBIDDEN",
                        "Only booking participants can add dispute evidence");
                case "INVALID_STATUS" -> DisputeEvidenceOutcome.failure(
                        DisputeEvidenceOutcome.Status.INVALID_STATUS,
                        "INVALID_STATUS",
                        "Evidence can only be added to open disputes");
                case "INVALID_EVIDENCE" -> DisputeEvidenceOutcome.failure(
                        DisputeEvidenceOutcome.Status.INVALID_EVIDENCE,
                        "INVALID_EVIDENCE",
                        "At least one valid evidence artifact is required");
                default -> DisputeEvidenceOutcome.internalError();
            };
        }
        return DisputeEvidenceOutcome.success(disputePublicCompositionService.disputeSummaryWithEvidence(
                result.dispute(),
                trustQueryPort.getDisputeEvidence(result.dispute().id())));
    }
}
