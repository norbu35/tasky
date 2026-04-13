package mn.tasky.runtime.publicapi.composition;

import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
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
    private final AnalyticsService analyticsService;
    private final BookingQueryPort bookingQueryPort;
    private final IdempotencyService idempotencyService;
    private final DisputePublicCompositionService disputePublicCompositionService;

    public DisputeRaiseService(
            TrustCommandPort trustCommandPort,
            TrustQueryPort trustQueryPort,
            AnalyticsService analyticsService,
            BookingQueryPort bookingQueryPort,
            IdempotencyService idempotencyService,
            DisputePublicCompositionService disputePublicCompositionService) {
        this.trustCommandPort = trustCommandPort;
        this.trustQueryPort = trustQueryPort;
        this.analyticsService = analyticsService;
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
            analyticsProperties.put(AnalyticsService.PROPERTY_BOOKING_ID, bookingId);
            analyticsProperties.put("dispute_id", result.dispute().id());
            bookingQueryPort
                    .getBooking(bookingId)
                    .ifPresent(booking -> analyticsProperties.put(AnalyticsService.PROPERTY_TASK_ID, booking.taskId()));
            analyticsService.track(AnalyticsService.EVENT_DISPUTE_RAISED, userId, analyticsProperties);

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
}
