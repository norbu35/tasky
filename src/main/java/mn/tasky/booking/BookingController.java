package mn.tasky.booking;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@Validated
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<?> listBookings(
        @AuthenticationPrincipal JwtPrincipal principal,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status
    ) {
        List<BookingService.BookingState> bookings = bookingService.listBookings(
            principal.userId(),
            role,
            status
        );

        List<Map<String, Object>> data = bookings.stream()
            .map(this::toBookingResponse)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                new CursorPagination(null, false)
            )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        HttpServletRequest request
    ) {
        return bookingService.getBooking(id)
            .filter(b -> b.customerId().equals(principal.userId()) || b.taskerId().equals(principal.userId()))
            .<ResponseEntity<?>>map(booking -> ResponseEntity.ok(toBookingResponse(booking)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        HttpServletRequest request
    ) {
        BookingService.BookingTransitionResult result = bookingService.cancelBooking(principal.userId(), id);

        if (result.isSuccess()) {
            return ResponseEntity.ok(toBookingResponse(result.booking()));
        }

        return switch (result.errorCode()) {
            case BookingService.BookingTransitionResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingService.BookingTransitionResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "You do not have permission to cancel this booking.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingService.BookingTransitionResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                    "code", "INVALID_STATUS",
                    "message", "Booking cannot be cancelled in its current status.",
                    "trace_id", resolveTraceId(request)
                )
            );
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        };
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        HttpServletRequest request
    ) {
        BookingService.BookingTransitionResult result = bookingService.completeBooking(principal.userId(), id);

        if (result.isSuccess()) {
            return ResponseEntity.ok(toBookingResponse(result.booking()));
        }

        return switch (result.errorCode()) {
            case BookingService.BookingTransitionResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingService.BookingTransitionResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "Only the customer can complete this booking.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingService.BookingTransitionResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                    "code", "INVALID_STATUS",
                    "message", "Booking must be PAID to be completed.",
                    "trace_id", resolveTraceId(request)
                )
            );
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        };
    }

    private Map<String, Object> toBookingResponse(BookingService.BookingState booking) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", booking.id());
        response.put("task_id", booking.taskId());
        response.put("tasker_id", booking.taskerId());
        response.put("customer_id", booking.customerId());
        response.put("price", booking.price());
        response.put("status", booking.status());
        response.put("cancellation_fee", booking.cancellationFee());
        response.put("created_at", booking.createdAt().toString());
        response.put("updated_at", booking.updatedAt().toString());
        return response;
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }
}
