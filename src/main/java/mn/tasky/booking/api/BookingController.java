package mn.tasky.booking.api;

import jakarta.servlet.http.HttpServletRequest;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static mn.tasky.booking.api.BookingResponseMapper.withCancellationFee;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyInProgress;
import static mn.tasky.common.api.ApiResponseSupport.idempotencyReplayMissing;
import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

@RestController
@RequestMapping("/api/v1/bookings")
@Validated
public class BookingController {

    private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;
    private final TaskService taskService;
    private final AuthService authService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final NotificationService notificationService;
    private final IdempotencyService idempotencyService;

    public BookingController(
        BookingService bookingService,
        TaskService taskService,
        AuthService authService,
        DomainEventOutboxService domainEventOutboxService,
        NotificationService notificationService,
        IdempotencyService idempotencyService
    ) {
        this.bookingService = bookingService;
        this.taskService = taskService;
        this.authService = authService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.notificationService = notificationService;
        this.idempotencyService = idempotencyService;
    }

    @GetMapping
    public ResponseEntity<?> listBookings(
        @AuthenticationPrincipal JwtPrincipal principal,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "50") int limit
    ) {
        int clampedLimit = Math.max(1,
            Math.min(limit,
                100));
        List<BookingState> bookings = bookingService.listBookings(
            principal.userId(),
            role,
            status,
            cursor,
            clampedLimit + 1
        );
        boolean hasMore = bookings.size() > clampedLimit;
        List<BookingState> pageBookings = hasMore
            ? bookings.subList(0,
            clampedLimit)
            : bookings;

        List<Map<String, Object>> data = pageBookings.stream()
            .map(BookingResponseMapper::withCancellationFee)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                CursorPagination.from(bookings,
                    clampedLimit,
                    BookingState::id)
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
            .filter(b -> b.customerId()
                .equals(principal.userId()) || b.taskerId()
                .equals(principal.userId()))
            .<ResponseEntity<?>>map(booking -> ResponseEntity.ok(withCancellationFee(booking)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(
                    Map.of(
                        "code",
                        "NOT_FOUND",
                        "message",
                        "Booking not found.",
                        "trace_id",
                        resolveTraceId(request)
                    )
                ));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest request
    ) {
        IdempotencyClaim claim = idempotencyService.claim(
            principal.userId(),
            IdempotencyOperations.CANCEL_BOOKING,
            idempotencyKey
        );
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            String bookingId = claim.record()
                .resourceId()
                .toString();
            return bookingService.getBooking(bookingId)
                .<ResponseEntity<?>>map(booking -> ResponseEntity.ok(withCancellationFee(booking)))
                .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            Optional<BookingState> bookingOpt = bookingService.getBooking(id);
            if (bookingOpt.isEmpty()) {
                idempotencyService.abandon(principal.userId(),
                    IdempotencyOperations.CANCEL_BOOKING,
                    idempotencyKey);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                        Map.of(
                            "code",
                            "NOT_FOUND",
                            "message",
                            "Booking not found.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
            }

            BookingState booking = bookingOpt.get();
            Optional<TaskState> taskOpt = taskService.getTask(booking.taskId());
            if (taskOpt.isEmpty()) {
                idempotencyService.abandon(principal.userId(),
                    IdempotencyOperations.CANCEL_BOOKING,
                    idempotencyKey);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
            }

            BookingTransitionResult result = bookingService.cancelBooking(
                principal.userId(),
                id,
                taskOpt.get()
                    .scheduledAt()
            );

            if (result.isSuccess()) {
                if (booking.taskerId()
                    .equals(principal.userId())) {
                    // Tasker cancelled: reopen task and record strike
                    if (taskService.reopenTask(booking.taskId())
                        .isEmpty()) {
                        log.warn("Task not found when reopening after cancellation: bookingId={} " +
                                "taskId={}",
                            booking.id(),
                            booking.taskId());
                    }
                    authService.addStrike(principal.userId());
                } else if (booking.customerId()
                    .equals(principal.userId())) {
                    // Customer cancelled: close task as cancelled.
                    if (taskService.transitionToCancelled(booking.taskId())
                        .isEmpty()) {
                        log.warn("Task not found when cancelling after customer cancellation: " +
                                "bookingId={} taskId={}",
                            booking.id(),
                            booking.taskId());
                    }
                }
                idempotencyService.completeWithResource(
                    principal.userId(),
                    IdempotencyOperations.CANCEL_BOOKING,
                    idempotencyKey,
                    "BOOKING",
                    result.booking()
                        .id()
                );
                return ResponseEntity.ok(withCancellationFee(result.booking()));
            }

            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.CANCEL_BOOKING,
                idempotencyKey);
            return switch (result.errorCode()) {
                case BookingTransitionResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                        Map.of(
                            "code",
                            "NOT_FOUND",
                            "message",
                            "Booking not found.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                case BookingTransitionResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(
                        Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "You do not have permission to cancel this booking.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                case BookingTransitionResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(
                        Map.of(
                            "code",
                            "INVALID_STATUS",
                            "message",
                            "Booking cannot be cancelled in its current status.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.CANCEL_BOOKING,
                idempotencyKey);
            throw exception;
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeBooking(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest request
    ) {
        IdempotencyClaim claim = idempotencyService.claim(
            principal.userId(),
            IdempotencyOperations.COMPLETE_BOOKING,
            idempotencyKey
        );
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            String bookingId = claim.record()
                .resourceId()
                .toString();
            return bookingService.getBooking(bookingId)
                .<ResponseEntity<?>>map(booking -> ResponseEntity.ok(withCancellationFee(booking)))
                .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            BookingTransitionResult result = bookingService.completeBooking(principal.userId(),
                id);

            if (result.isSuccess()) {
                BookingState booking = result.booking();
                // Update task status to COMPLETED
                if (taskService.transitionToCompleted(booking.taskId())
                    .isEmpty()) {
                    log.warn("Task not found when completing booking: bookingId={} taskId={}",
                        booking.id(),
                        booking.taskId());
                }

                domainEventOutboxService.publish(
                    OutboxEventTypes.BOOKING_COMPLETED,
                    "BOOKING",
                    booking.id(),
                    Map.of(
                        "booking_id",
                        booking.id(),
                        "task_id",
                        booking.taskId(),
                        "customer_id",
                        booking.customerId(),
                        "tasker_id",
                        booking.taskerId(),
                        "price",
                        booking.price()
                    )
                );

                idempotencyService.completeWithResource(
                    principal.userId(),
                    IdempotencyOperations.COMPLETE_BOOKING,
                    idempotencyKey,
                    "BOOKING",
                    booking.id()
                );
                return ResponseEntity.ok(withCancellationFee(result.booking()));
            }

            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.COMPLETE_BOOKING,
                idempotencyKey);
            return switch (result.errorCode()) {
                case BookingTransitionResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                        Map.of(
                            "code",
                            "NOT_FOUND",
                            "message",
                            "Booking not found.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                case BookingTransitionResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(
                        Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "Only the customer can complete this booking.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                case BookingTransitionResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(
                        Map.of(
                            "code",
                            "INVALID_STATUS",
                            "message",
                            "Booking must be ASSIGNED to be completed.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.COMPLETE_BOOKING,
                idempotencyKey);
            throw exception;
        }
    }

    @PostMapping("/{id}/mark-done")
    public ResponseEntity<?> markBookingDone(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
        HttpServletRequest request
    ) {
        IdempotencyClaim claim = idempotencyService.claim(
            principal.userId(),
            IdempotencyOperations.MARK_BOOKING_DONE,
            idempotencyKey
        );
        if (claim.status() == IdempotencyClaim.Status.IN_PROGRESS) {
            return idempotencyInProgress(request);
        }
        if (claim.status() == IdempotencyClaim.Status.COMPLETED) {
            if (claim.record() == null || claim.record()
                .resourceId() == null) {
                return idempotencyReplayMissing(request);
            }
            String bookingId = claim.record()
                .resourceId()
                .toString();
            return bookingService.getBooking(bookingId)
                .<ResponseEntity<?>>map(booking -> {
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("booking",
                        withCancellationFee(booking));
                    body.put(
                        "tasker_marked_done_at",
                        bookingService.getTaskerMarkedDoneAt(bookingId)
                            .map(Instant::toString)
                            .orElse(null)
                    );
                    return ResponseEntity.ok(body);
                })
                .orElseGet(() -> idempotencyReplayMissing(request));
        }

        try {
            BookingMarkDoneResult result = bookingService.markBookingDone(principal.userId(),
                id);
            if (result.isSuccess()) {
                if (result.newlyMarked()) {
                    notificationService.sendPush(
                        result.booking()
                            .customerId(),
                        "Tasker marked job complete",
                        "Your tasker marked the booking as done. Please review and confirm " +
                            "completion.",
                        "TASKER_MARKED_COMPLETE"
                    );
                }

                idempotencyService.completeWithResource(
                    principal.userId(),
                    IdempotencyOperations.MARK_BOOKING_DONE,
                    idempotencyKey,
                    "BOOKING",
                    result.booking()
                        .id()
                );
                return ResponseEntity.ok(
                    Map.of(
                        "booking",
                        withCancellationFee(result.booking()),
                        "tasker_marked_done_at",
                        result.markedDoneAt()
                            .toString()
                    )
                );
            }

            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.MARK_BOOKING_DONE,
                idempotencyKey);
            return switch (result.errorCode()) {
                case BookingMarkDoneResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(
                        Map.of(
                            "code",
                            "NOT_FOUND",
                            "message",
                            "Booking not found.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                case BookingMarkDoneResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(
                        Map.of(
                            "code",
                            "FORBIDDEN",
                            "message",
                            "Only the tasker can mark this booking as done.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                case BookingMarkDoneResult.INVALID_TRANSITION -> ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(
                        Map.of(
                            "code",
                            "INVALID_STATUS",
                            "message",
                            "Booking must be ASSIGNED or PAID to mark done.",
                            "trace_id",
                            resolveTraceId(request)
                        )
                    );
                default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
            };
        } catch (RuntimeException exception) {
            idempotencyService.abandon(principal.userId(),
                IdempotencyOperations.MARK_BOOKING_DONE,
                idempotencyKey);
            throw exception;
        }
    }
}
