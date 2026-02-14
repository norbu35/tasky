package mn.tasky.dispute.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.LinkedHashMap;
import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.dispute.application.DisputeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/disputes")
public class DisputeController {

    private final DisputeService disputeService;
    private final AnalyticsService analyticsService;
    private final BookingService bookingService;

    public DisputeController(DisputeService disputeService, AnalyticsService analyticsService, BookingService bookingService) {
        this.disputeService = disputeService;
        this.analyticsService = analyticsService;
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<?> raiseDispute(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody DisputeRequest body) {
        
        var result = disputeService.raiseDispute(principal.userId(), body.bookingId(), body.reason());
        if (!result.isSuccess()) {
            return switch (result.error()) {
                case "BOOKING_NOT_FOUND" -> ResponseEntity.notFound().build();
                case "FORBIDDEN" -> ResponseEntity.status(403).body(Map.of("error", "Only customer can raise dispute"));
                case "INVALID_STATUS" -> ResponseEntity.badRequest().body(Map.of("error", "Booking must be completed to raise dispute"));
                case "DISPUTE_EXISTS" -> ResponseEntity.status(409).body(Map.of("error", "Dispute already exists"));
                default -> ResponseEntity.internalServerError().build();
            };
        }
        
        Map<String, Object> analyticsProperties = new LinkedHashMap<>();
        analyticsProperties.put(AnalyticsService.PROPERTY_BOOKING_ID, body.bookingId());
        analyticsProperties.put("dispute_id", result.dispute().id());
        bookingService.getBooking(body.bookingId())
            .ifPresent(booking -> analyticsProperties.put(AnalyticsService.PROPERTY_TASK_ID, booking.taskId()));
        analyticsService.track(AnalyticsService.EVENT_DISPUTE_RAISED, principal.userId(), analyticsProperties);
        
        return ResponseEntity.status(201).body(toDisputeResponse(result.dispute()));
    }

    private Map<String, Object> toDisputeResponse(DisputeService.Dispute d) {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", d.id());
        res.put("booking_id", d.bookingId());
        res.put("status", d.status());
        res.put("reason", d.reason());
        res.put("created_at", d.createdAt().toString());
        return res;
    }

    public record DisputeRequest(@JsonProperty("booking_id") String bookingId, String reason) {}
}
