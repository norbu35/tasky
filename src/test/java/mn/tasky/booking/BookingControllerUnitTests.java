package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.booking.api.BookingController;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.BookingTimelineService;
import mn.tasky.booking.application.NoShowService;
import mn.tasky.booking.application.RepeatBookingService;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

@ExtendWith(MockitoExtension.class)
class BookingControllerUnitTests {

    private static final String TRACE_ID = "trace-booking-controller";

    @Mock
    private BookingService bookingService;

    @Mock
    private TaskService taskService;

    @Mock
    private AuthService authService;

    @Mock
    private DomainEventOutboxService domainEventOutboxService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private BookingScheduleService scheduleService;

    @Mock
    private BookingTimelineService timelineService;

    @Mock
    private NoShowService noShowService;

    @Mock
    private RepeatBookingService repeatBookingService;

    private BookingController controller;

    @BeforeEach
    void setUp() {
        controller = new BookingController(
                bookingService,
                scheduleService,
                timelineService,
                noShowService,
                repeatBookingService,
                taskService,
                authService,
                domainEventOutboxService,
                notificationService,
                idempotencyService);
    }

    @Test
    @DisplayName("BookingController cancel returns in-progress idempotency response")
    void cancelBookingReturnsInProgress() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

        ResponseEntity<?> response = controller.cancelBooking(principal, "booking-1", "idem-1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_IN_PROGRESS");
    }

    private JwtPrincipal customerPrincipal() {
        return new JwtPrincipal("customer-123", "CUSTOMER", "ACTIVE");
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE, TRACE_ID);
        return request;
    }

    @Test
    @DisplayName("BookingController cancel replays persisted result when idempotency is completed")
    void cancelBookingCompletedReplayReturnsBooking() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(11);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-2"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId))
                .thenReturn(Optional.of(booking(bookingId, principal.userId(), "tasker-1", "CANCELLED")));

        ResponseEntity<?> response = controller.cancelBooking(principal, "ignored", "idem-2", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id", bookingId);
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d", suffix);
    }

    private IdempotencyRecord completedRecord(String resourceId) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new IdempotencyRecord(
                UUID.fromString(uuid(40)),
                UUID.fromString(uuid(41)),
                "OP",
                "idem",
                "COMPLETED",
                "BOOKING",
                UUID.fromString(resourceId),
                now,
                now);
    }

    private BookingState booking(String id, String customerId, String taskerId, String status) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new BookingState(
                id, uuid(30), taskerId, customerId, 50000, status, null, true, null, "DIRECT", false, null, now, now);
    }

    @Test
    @DisplayName("BookingController cancel returns replay-missing when completed replay resource " + "cannot be loaded")
    void cancelBookingCompletedReplayMissingWhenBookingUnavailable() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(111);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-2b"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.cancelBooking(principal, "ignored", "idem-2b", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }

    @Test
    @DisplayName("BookingController cancel returns not found when booking does not exist")
    void cancelBookingReturnsNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-3"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.getBooking("missing-booking")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.cancelBooking(principal, "missing-booking", "idem-3", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat((Map<String, Object>) response.getBody())
                .containsEntry("code", "NOT_FOUND")
                .containsEntry("trace_id", TRACE_ID);
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-3");
    }

    @Test
    @DisplayName("BookingController complete replays persisted state")
    void completeBookingCompletedReplayReturnsBooking() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(12);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-4"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId))
                .thenReturn(Optional.of(booking(bookingId, principal.userId(), "tasker-2", "COMPLETED")));

        ResponseEntity<?> response = controller.completeBooking(principal, "ignored", "idem-4", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody())
                .containsEntry("id", bookingId)
                .containsEntry("status", "COMPLETED");
    }

    @Test
    @DisplayName(
            "BookingController complete returns replay-missing when completed replay " + "resource cannot be loaded")
    void completeBookingCompletedReplayMissingWhenBookingUnavailable() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(121);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-4b"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.completeBooking(principal, "ignored", "idem-4b", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }

    @Test
    @DisplayName("BookingController complete success emits booking completion outbox event")
    void completeBookingSuccessEmitsSignals() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(13);
        BookingState booking = booking(bookingId, principal.userId(), "tasker-3", "COMPLETED");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-5"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.completeBooking(principal.userId(), bookingId))
                .thenReturn(BookingTransitionResult.success(booking));
        when(taskService.transitionToCompleted(booking.taskId()))
                .thenReturn(Optional.of(task(booking.taskId(), "COMPLETED")));

        ResponseEntity<?> response = controller.completeBooking(principal, bookingId, "idem-5", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(domainEventOutboxService)
                .publish(eq(OutboxEventTypes.BOOKING_COMPLETED), eq("BOOKING"), eq(bookingId), payloadCaptor.capture());
        assertThat(payloadCaptor.getValue())
                .containsEntry("booking_id", bookingId)
                .containsEntry("task_id", booking.taskId())
                .containsEntry("customer_id", principal.userId())
                .containsEntry("tasker_id", "tasker-3")
                .containsEntry("price", 50000);
        verify(idempotencyService)
                .completeWithResource(
                        principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-5", "BOOKING", bookingId);
    }

    private TaskState task(String taskId, String status) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new TaskState(
                taskId,
                "customer-123",
                uuid(31),
                "Task",
                50000,
                47.9,
                106.9,
                "Ulaanbaatar",
                status,
                now.plusSeconds(3600),
                List.of(),
                null,
                null,
                null,
                now,
                now);
    }

    @Test
    @DisplayName("BookingController complete handles invalid status transitions")
    void completeBookingInvalidTransition() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-6"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.completeBooking(principal.userId(), "booking-invalid"))
                .thenReturn(BookingTransitionResult.INVALID_TRANSITION_RESULT);

        ResponseEntity<?> response = controller.completeBooking(principal, "booking-invalid", "idem-6", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "INVALID_STATUS");
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-6");
    }

    @Test
    @DisplayName("BookingController complete maps not-found transition result")
    void completeBookingNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-6b"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.completeBooking(principal.userId(), "booking-missing"))
                .thenReturn(BookingTransitionResult.NOT_FOUND_RESULT);

        ResponseEntity<?> response = controller.completeBooking(principal, "booking-missing", "idem-6b", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("BookingController mark-done replays stored response including timestamp")
    void markDoneCompletedReplayReturnsSignalTimestamp() {
        JwtPrincipal principal = taskerPrincipal();
        String bookingId = uuid(14);
        Instant markedDoneAt = Instant.parse("2026-02-17T00:00:00Z");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-7"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId))
                .thenReturn(Optional.of(booking(bookingId, "customer-1", principal.userId(), "PAID")));
        when(bookingService.getTaskerMarkedDoneAt(bookingId)).thenReturn(Optional.of(markedDoneAt));

        ResponseEntity<?> response = controller.markBookingDone(principal, "ignored", "idem-7", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody())
                .containsEntry("tasker_marked_done_at", markedDoneAt.toString());
    }

    private JwtPrincipal taskerPrincipal() {
        return new JwtPrincipal("tasker-123", "TASKER", "ACTIVE");
    }

    @Test
    @DisplayName(
            "BookingController mark-done returns replay-missing when completed replay " + "resource cannot be loaded")
    void markDoneCompletedReplayMissingWhenBookingUnavailable() {
        JwtPrincipal principal = taskerPrincipal();
        String bookingId = uuid(141);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-7b"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.markBookingDone(principal, "ignored", "idem-7b", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }

    @Test
    @DisplayName("BookingController mark-done success returns booking envelope")
    void markDoneSuccessReturnsEnvelope() {
        JwtPrincipal principal = taskerPrincipal();
        String bookingId = uuid(15);
        BookingState booking = booking(bookingId, "customer-2", principal.userId(), "ASSIGNED");
        Instant markedDoneAt = Instant.parse("2026-02-17T01:00:00Z");

        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-8"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.markBookingDone(principal.userId(), bookingId))
                .thenReturn(BookingMarkDoneResult.success(booking, markedDoneAt, true));

        ResponseEntity<?> response = controller.markBookingDone(principal, bookingId, "idem-8", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody())
                .containsEntry("tasker_marked_done_at", markedDoneAt.toString())
                .containsKey("booking");
        verify(notificationService)
                .sendPush(
                        eq("customer-2"),
                        eq("Tasker marked job complete"),
                        eq("Your tasker marked the booking as done. Please " + "review and confirm " + "completion."),
                        eq("TASKER_MARKED_COMPLETE"));
        verify(idempotencyService)
                .completeWithResource(
                        principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-8", "BOOKING", bookingId);
    }

    @Test
    @DisplayName("BookingController mark-done handles forbidden actor")
    void markDoneForbidden() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-9"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.markBookingDone(principal.userId(), "booking-forbidden"))
                .thenReturn(BookingMarkDoneResult.FORBIDDEN_RESULT);

        ResponseEntity<?> response = controller.markBookingDone(principal, "booking-forbidden", "idem-9", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "FORBIDDEN");
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-9");
    }

    @Test
    @DisplayName("BookingController mark-done maps invalid transition result")
    void markDoneInvalidTransition() {
        JwtPrincipal principal = taskerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-10"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.markBookingDone(principal.userId(), "booking-invalid"))
                .thenReturn(BookingMarkDoneResult.INVALID_TRANSITION_RESULT);

        ResponseEntity<?> response = controller.markBookingDone(principal, "booking-invalid", "idem-10", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "INVALID_STATUS");
    }

    @Test
    @DisplayName("BookingController listBookings returns paged response with cancellation fee")
    void listBookingsReturnsCancellationFee() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(170);
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        BookingState booking = new BookingState(
                bookingId,
                uuid(30),
                "tasker-170",
                principal.userId(),
                50000,
                "ASSIGNED",
                null,
                true,
                now.plusSeconds(3600),
                "ESCROW",
                false,
                now,
                now,
                now);
        when(bookingService.listBookings(principal.userId(), "CUSTOMER", "ASSIGNED", null, 51))
                .thenReturn(List.of(booking));

        ResponseEntity<?> response = controller.listBookings(principal, "CUSTOMER", "ASSIGNED", null, 50);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("BookingController getBooking returns booking with settlement mode and schedule fields")
    void getBookingReturnsNewFields() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(171);
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        BookingState booking = new BookingState(
                bookingId,
                uuid(30),
                "tasker-171",
                principal.userId(),
                50000,
                "ASSIGNED",
                null,
                true,
                now.plusSeconds(3600),
                "ESCROW",
                true,
                now,
                now,
                now);
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));

        ResponseEntity<?> response = controller.getBooking(principal, bookingId, request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertThat(body).containsEntry("id", bookingId);
        assertThat(body).containsEntry("status", "ASSIGNED");
    }

    @Test
    @DisplayName("BookingController mark-done maps not-found transition result")
    void markDoneNotFound() {
        JwtPrincipal principal = taskerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-nf"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.markBookingDone(principal.userId(), "booking-missing"))
                .thenReturn(BookingMarkDoneResult.NOT_FOUND_RESULT);

        ResponseEntity<?> response = controller.markBookingDone(principal, "booking-missing", "idem-nf", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "NOT_FOUND");
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.MARK_BOOKING_DONE, "idem-nf");
    }

    @Test
    @DisplayName("BookingController cancel returns internal error when associated task cannot be " + "loaded")
    void cancelBookingTaskLookupFailure() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(160);
        BookingState booking = booking(bookingId, principal.userId(), "tasker-160", "ASSIGNED");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-11"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));
        when(taskService.getTask(booking.taskId())).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.cancelBooking(principal, bookingId, "idem-11", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-11");
    }
}
