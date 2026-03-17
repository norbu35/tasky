package mn.tasky.dispute.api;

import static mn.tasky.dispute.api.DisputeResponseMapper.summary;
import static mn.tasky.dispute.api.DisputeResponseMapper.summaryWithEvidence;

import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.DisputeRequest;
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

    private final DisputeService disputeService;
    private final AnalyticsService analyticsService;
    private final BookingService bookingService;
    private final IdempotencyService idempotencyService;

    public DisputeController(
            DisputeService disputeService,
            AnalyticsService analyticsService,
            BookingService bookingService,
            IdempotencyService idempotencyService) {
        this.disputeService = disputeService;
        this.analyticsService = analyticsService;
        this.bookingService = bookingService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping("/bookings/{id}/disputes")
    public ResponseEntity<?> raiseDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody DisputeRequest body,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey) {
        IdempotencyClaim claim =
                idempotencyService.claim(principal.userId(), IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return ResponseEntity.status(409)
                    .body(Map.of(
                            "code",
                            "IDEMPOTENCY_IN_PROGRESS",
                            "message",
                            "An identical request is still being processed."));
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record().resourceId() == null) {
                return ResponseEntity.status(409)
                        .body(Map.of(
                                "code",
                                "IDEMPOTENCY_REPLAY_MISSING",
                                "message",
                                "Previous request exists but replay state could not be " + "loaded."));
            }
            return disputeService
                    .getDispute(claim.record().resourceId().toString())
                    .<ResponseEntity<?>>map(dispute -> ResponseEntity.ok(summary(dispute)))
                    .orElseGet(() -> ResponseEntity.status(409)
                            .body(Map.of(
                                    "code",
                                    "IDEMPOTENCY_REPLAY_MISSING",
                                    "message",
                                    "Previous request exists but replay state could not " + "be loaded.")));
        }

        try {
            var result = disputeService.raiseDispute(principal.userId(), id, body.reason(), body.evidence());
            if (!result.isSuccess()) {
                idempotencyService.abandon(principal.userId(), IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
                return switch (result.error()) {
                    case "BOOKING_NOT_FOUND" -> ResponseEntity.notFound().build();
                    case "FORBIDDEN" -> ResponseEntity.status(403)
                            .body(Map.of(
                                    "code", "FORBIDDEN", "message", "Only booking participants can raise disputes"));
                    case "INVALID_REASON" -> ResponseEntity.badRequest()
                            .body(Map.of("code", "INVALID_REASON", "message", "Dispute reason cannot be empty"));
                    case "INVALID_STATUS" -> ResponseEntity.badRequest()
                            .body(Map.of(
                                    "code",
                                    "INVALID_STATUS",
                                    "message",
                                    "Booking must be ASSIGNED or COMPLETED to raise dispute"));
                    case "DISPUTE_WINDOW_EXPIRED" -> ResponseEntity.badRequest()
                            .body(Map.of(
                                    "code",
                                    "DISPUTE_WINDOW_EXPIRED",
                                    "message",
                                    "Completed bookings can only be disputed within 24 " + "hours"));
                    case "DISPUTE_EXISTS" -> ResponseEntity.status(409)
                            .body(Map.of("code", "DISPUTE_EXISTS", "message", "Dispute already exists"));
                    default -> ResponseEntity.internalServerError().build();
                };
            }

            Map<String, Object> analyticsProperties = new LinkedHashMap<>();
            analyticsProperties.put(AnalyticsService.PROPERTY_BOOKING_ID, id);
            analyticsProperties.put("dispute_id", result.dispute().id());
            bookingService
                    .getBooking(id)
                    .ifPresent(booking -> analyticsProperties.put(AnalyticsService.PROPERTY_TASK_ID, booking.taskId()));
            analyticsService.track(AnalyticsService.EVENT_DISPUTE_RAISED, principal.userId(), analyticsProperties);

            idempotencyService.completeWithResource(
                    principal.userId(),
                    IdempotencyOperations.RAISE_DISPUTE,
                    idempotencyKey,
                    "DISPUTE",
                    result.dispute().id());
            return ResponseEntity.status(201).body(summary(result.dispute()));
        } catch (RuntimeException exception) {
            idempotencyService.abandon(principal.userId(), IdempotencyOperations.RAISE_DISPUTE, idempotencyKey);
            throw exception;
        }
    }

    @GetMapping("/disputes/{id}")
    public ResponseEntity<?> getDispute(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable String id) {
        boolean admin = "ADMIN".equals(principal.role());
        return (admin ? disputeService.getDispute(id) : disputeService.getDisputeForUser(id, principal.userId()))
                .<ResponseEntity<?>>map(d -> ResponseEntity.ok(
                        summaryWithEvidence(d, disputeService.getDisputeEvidence(d.id()))))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
