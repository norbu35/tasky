package mn.tasky.dispute.api;

import jakarta.validation.Valid;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.application.DisputeService;
import mn.tasky.dispute.dto.Dispute;
import mn.tasky.dispute.dto.DisputeRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Validated
public class DisputeController {

    private final DisputeService disputeService;
    private final AnalyticsService analyticsService;
    private final BookingService bookingService;

    public DisputeController(DisputeService disputeService, AnalyticsService analyticsService, BookingService bookingService) {
        this.disputeService = disputeService;
        this.analyticsService = analyticsService;
        this.bookingService = bookingService;
    }

    @PostMapping("/bookings/{id}/disputes")
    public ResponseEntity<?> raiseDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody DisputeRequest body) {
        
        var result = disputeService.raiseDispute(principal.userId(), id, body.reason());
        if (!result.isSuccess()) {
            return switch (result.error()) {
                case "BOOKING_NOT_FOUND" -> ResponseEntity.notFound().build();
                case "FORBIDDEN" -> ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN", "message", "Only booking participants can raise disputes"));
                case "INVALID_REASON" -> ResponseEntity.badRequest().body(Map.of("code", "INVALID_REASON", "message", "Dispute reason cannot be empty"));
                case "INVALID_STATUS" -> ResponseEntity.badRequest().body(Map.of("code", "INVALID_STATUS", "message", "Booking must be ASSIGNED or COMPLETED to raise dispute"));
                case "DISPUTE_WINDOW_EXPIRED" -> ResponseEntity.badRequest().body(
                    Map.of("code", "DISPUTE_WINDOW_EXPIRED", "message", "Completed bookings can only be disputed within 24 hours")
                );
                case "DISPUTE_EXISTS" -> ResponseEntity.status(409).body(Map.of("code", "DISPUTE_EXISTS", "message", "Dispute already exists"));
                default -> ResponseEntity.internalServerError().build();
            };
        }
        
        Map<String, Object> analyticsProperties = new LinkedHashMap<>();
        analyticsProperties.put(AnalyticsService.PROPERTY_BOOKING_ID, id);
        analyticsProperties.put("dispute_id", result.dispute().id());
        bookingService.getBooking(id)
            .ifPresent(booking -> analyticsProperties.put(AnalyticsService.PROPERTY_TASK_ID, booking.taskId()));
        analyticsService.track(AnalyticsService.EVENT_DISPUTE_RAISED, principal.userId(), analyticsProperties);
        
        return ResponseEntity.status(201).body(toDisputeResponse(result.dispute()));
    }

    @GetMapping("/disputes/{id}")
    public ResponseEntity<?> getDispute(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id
    ) {
        boolean admin = "ADMIN".equals(principal.role());
        return (admin ? disputeService.getDispute(id) : disputeService.getDisputeForUser(id, principal.userId()))
            .<ResponseEntity<?>>map(d -> ResponseEntity.ok(toDisputeResponse(d)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private Map<String, Object> toDisputeResponse(Dispute d) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", d.id());
        res.put("booking_id", d.bookingId());
        res.put("status", d.status());
        res.put("reason", d.reason());
        res.put("created_at", d.createdAt().toString());
        return res;
    }
}
