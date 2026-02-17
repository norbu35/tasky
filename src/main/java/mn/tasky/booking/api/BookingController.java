package mn.tasky.booking.api;

import jakarta.servlet.http.HttpServletRequest;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.TaskState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@Validated
public class BookingController {

    private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;
    private final TaskService taskService;
    private final AuthService authService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;

    public BookingController(
        BookingService bookingService,
        TaskService taskService,
        AuthService authService,
        NotificationService notificationService,
        AnalyticsService analyticsService
    ) {
        this.bookingService = bookingService;
        this.taskService = taskService;
        this.authService = authService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<?> listBookings(
        @AuthenticationPrincipal JwtPrincipal principal,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "50") int limit
    ) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<BookingState> bookings = bookingService.listBookings(
            principal.userId(),
            role,
            status,
            cursor,
            clampedLimit
        );

        List<Map<String, Object>> data = bookings.stream()
            .map(this::toBookingResponse)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                CursorPagination.from(bookings, clampedLimit, BookingState::id)
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
        Optional<BookingState> bookingOpt = bookingService.getBooking(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }

        BookingState booking = bookingOpt.get();
        Optional<TaskState> taskOpt = taskService.getTask(booking.taskId());
        if (taskOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        BookingTransitionResult result = bookingService.cancelBooking(
            principal.userId(), id, taskOpt.get().scheduledAt()
        );

        if (result.isSuccess()) {
            if (booking.taskerId().equals(principal.userId())) {
                // Tasker cancelled: reopen task and record strike
                if (taskService.reopenTask(booking.taskId()).isEmpty()) {
                    log.warn("Task not found when reopening after cancellation: bookingId={} taskId={}", booking.id(), booking.taskId());
                }
                authService.addStrike(principal.userId());
            }
            return ResponseEntity.ok(toBookingResponse(result.booking()));
        }

        return switch (result.errorCode()) {
            case BookingTransitionResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingTransitionResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "You do not have permission to cancel this booking.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingTransitionResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT).body(
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
        BookingTransitionResult result = bookingService.completeBooking(principal.userId(), id);

        if (result.isSuccess()) {
            BookingState booking = result.booking();
            // Update task status to COMPLETED
            if (taskService.transitionToCompleted(booking.taskId()).isEmpty()) {
                log.warn("Task not found when completing booking: bookingId={} taskId={}", booking.id(), booking.taskId());
            }
            
            notificationService.sendPush(booking.taskerId(), "Job Complete", "The customer has marked the job as complete.", "JOB_COMPLETED");
            analyticsService.track(
                AnalyticsService.EVENT_BOOKING_COMPLETED,
                principal.userId(),
                Map.of(
                    AnalyticsService.PROPERTY_BOOKING_ID, booking.id(),
                    AnalyticsService.PROPERTY_TASK_ID, booking.taskId(),
                    "tasker_id", booking.taskerId()
                )
            );

            return ResponseEntity.ok(toBookingResponse(result.booking()));
        }

        return switch (result.errorCode()) {
            case BookingTransitionResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Booking not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingTransitionResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "Only the customer can complete this booking.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case BookingTransitionResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                    "code", "INVALID_STATUS",
                    "message", "Booking must be ASSIGNED to be completed.",
                    "trace_id", resolveTraceId(request)
                )
            );
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        };
    }

    private Map<String, Object> toBookingResponse(BookingState booking) {
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
