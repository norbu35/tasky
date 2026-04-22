package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.admin.dto.BookingOverrideStatusRequest;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminBookingCompositionService;
import mn.tasky.runtime.adminapi.composition.AdminBookingOverrideOutcome;
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
@RequestMapping("/api/v1/admin/bookings")
@Validated
public class AdminBookingController {

    private final AdminBookingCompositionService adminBookingCompositionService;

    public AdminBookingController(AdminBookingCompositionService adminBookingCompositionService) {
        this.adminBookingCompositionService = adminBookingCompositionService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingDetail(@PathVariable String id, HttpServletRequest request) {
        return adminBookingCompositionService
                .bookingDetail(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Booking not found.", request)));
    }

    @PostMapping("/{id}/override-status")
    public ResponseEntity<?> overrideStatus(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody BookingOverrideStatusRequest body,
            HttpServletRequest request) {
        AdminBookingOverrideOutcome outcome = adminBookingCompositionService.overrideBookingStatus(
                principal.userId(), id, body.newStatus(), body.reason(), idempotencyKey);

        return switch (outcome.status()) {
            case IN_PROGRESS -> idempotencyInProgress(request);
            case REPLAY_MISSING -> idempotencyReplayMissing(request);
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case NOT_FOUND -> ResponseEntity.status(404).body(errorBody("NOT_FOUND", "Booking not found.", request));
            case INVALID_TRANSITION -> ResponseEntity.status(409)
                    .body(errorBody("INVALID_TRANSITION", "Invalid status transition.", request));
        };
    }
}
