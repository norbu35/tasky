package mn.tasky.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.api.BookingController;
import mn.tasky.booking.application.BookingLifecycleService;
import mn.tasky.booking.application.BookingScheduleService;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.application.NoShowService;
import mn.tasky.booking.application.RepeatBookingService;
import mn.tasky.booking.dto.BookingMarkDoneResult;
import mn.tasky.booking.dto.BookingScheduleEvent;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.booking.dto.RescheduleRequest;
import mn.tasky.booking.dto.RescheduleRespondRequest;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
    private BookingLifecycleService bookingLifecycleService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private BookingScheduleService scheduleService;

    @Mock
    private NoShowService noShowService;

    @Mock
    private RepeatBookingService repeatBookingService;

    private BookingController controller;

    @BeforeEach
    void setUp() {
        controller = new BookingController(
                bookingService,
                bookingLifecycleService,
                scheduleService,
                noShowService,
                repeatBookingService,
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
        when(bookingLifecycleService.cancelBooking(principal.userId(), "missing-booking"))
                .thenReturn(BookingTransitionResult.NOT_FOUND_RESULT);

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
    @DisplayName("BookingController complete success marks idempotency with booking resource")
    void completeBookingSuccessEmitsSignals() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(13);
        BookingState booking = booking(bookingId, principal.userId(), "tasker-3", "COMPLETED");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-5"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.completeBooking(principal.userId(), bookingId))
                .thenReturn(BookingTransitionResult.success(booking));

        ResponseEntity<?> response = controller.completeBooking(principal, bookingId, "idem-5", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
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
        when(bookingLifecycleService.completeBooking(principal.userId(), "booking-invalid"))
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
        when(bookingLifecycleService.completeBooking(principal.userId(), "booking-missing"))
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
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-11"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.cancelBooking(principal.userId(), bookingId))
                .thenThrow(new IllegalStateException("task missing"));

        assertThatThrownBy(() -> controller.cancelBooking(principal, bookingId, "idem-11", request()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("task missing");
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-11");
    }

    // --- No-show endpoint ---

    @Test
    @DisplayName("BookingController flagNoShow returns in-progress idempotency response")
    void flagNoShowReturnsInProgress() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-1", "idem-ns1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("BookingController flagNoShow replays completed idempotency")
    void flagNoShowReplayCompleted() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(200);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns2"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId))
                .thenReturn(Optional.of(booking(bookingId, principal.userId(), "tasker-ns", "NO_SHOW")));

        ResponseEntity<?> response = controller.flagNoShow(principal, "ignored", "idem-ns2", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("BookingController flagNoShow success returns booking with cancellation fee")
    void flagNoShowSuccess() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(201);
        BookingState noShowBooking = booking(bookingId, principal.userId(), "tasker-ns2", "NO_SHOW");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns3"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow(bookingId, principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.success(noShowBooking));

        ResponseEntity<?> response = controller.flagNoShow(principal, bookingId, "idem-ns3", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(idempotencyService)
                .completeWithResource(
                        principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns3", "BOOKING", bookingId);
    }

    @Test
    @DisplayName("BookingController flagNoShow maps error codes to proper HTTP statuses")
    void flagNoShowErrorCodes() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns4"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("TOO_EARLY"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns", "idem-ns4", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "TOO_EARLY");
        verify(idempotencyService).abandon(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns4");
    }

    @Test
    @DisplayName("BookingController flagNoShow returns FORBIDDEN for non-participant")
    void flagNoShowForbidden() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns5"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns-f", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("FORBIDDEN"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns-f", "idem-ns5", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("BookingController flagNoShow returns NOT_FOUND for missing booking")
    void flagNoShowNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns6"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns-nf", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("NOT_FOUND"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns-nf", "idem-ns6", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("BookingController flagNoShow returns CONFLICT for INVALID_STATUS")
    void flagNoShowInvalidStatus() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns7"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns-is", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("INVALID_STATUS"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns-is", "idem-ns7", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "INVALID_STATUS");
    }

    @Test
    @DisplayName("BookingController flagNoShow returns CONFLICT for NO_SCHEDULE")
    void flagNoShowNoSchedule() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns8"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns-nosch", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("NO_SCHEDULE"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns-nosch", "idem-ns8", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "NO_SCHEDULE");
    }

    @Test
    @DisplayName("BookingController flagNoShow returns CONFLICT for ACTIVITY_DETECTED")
    void flagNoShowActivityDetected() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns9"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns-act", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("ACTIVITY_DETECTED"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns-act", "idem-ns9", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "ACTIVITY_DETECTED");
    }

    @Test
    @DisplayName("BookingController flagNoShow returns CONFLICT for RESCHEDULE_SUPERSEDES")
    void flagNoShowRescheduleSupersedes() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns10"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(noShowService.flagNoShow("booking-ns-rs", principal.userId()))
                .thenReturn(NoShowService.NoShowFlagResult.error("RESCHEDULE_SUPERSEDES"));

        ResponseEntity<?> response = controller.flagNoShow(principal, "booking-ns-rs", "idem-ns10", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "RESCHEDULE_SUPERSEDES");
    }

    // --- Reschedule request endpoint ---

    @Test
    @DisplayName("BookingController requestReschedule returns CREATED on success")
    void requestRescheduleSuccess() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(210);
        Instant proposed = Instant.parse("2026-03-20T10:00:00Z");
        BookingScheduleEvent event = new BookingScheduleEvent(
                uuid(211), bookingId, principal.userId(), "RESCHEDULE_REQUESTED", proposed, "conflict", Instant.now());
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_REQUEST, "idem-rs1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(scheduleService.requestReschedule(bookingId, principal.userId(), proposed, "conflict"))
                .thenReturn(event);

        RescheduleRequest body = new RescheduleRequest("2026-03-20T10:00:00Z", "conflict");
        ResponseEntity<?> response = controller.requestReschedule(principal, bookingId, body, "idem-rs1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id", uuid(211));
    }

    @Test
    @DisplayName("BookingController requestReschedule returns NOT_FOUND on IllegalArgumentException")
    void requestRescheduleNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_REQUEST, "idem-rs2"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(scheduleService.requestReschedule(eq("missing"), eq(principal.userId()), any(), any()))
                .thenThrow(new IllegalArgumentException("Booking not found."));

        RescheduleRequest body = new RescheduleRequest("2026-03-20T10:00:00Z", null);
        ResponseEntity<?> response = controller.requestReschedule(principal, "missing", body, "idem-rs2", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("BookingController requestReschedule returns CONFLICT on IllegalStateException")
    void requestRescheduleInvalidStatus() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_REQUEST, "idem-rs3"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(scheduleService.requestReschedule(eq("booking-x"), eq(principal.userId()), any(), any()))
                .thenThrow(new IllegalStateException("Booking is not in a valid state."));

        RescheduleRequest body = new RescheduleRequest("2026-03-20T10:00:00Z", null);
        ResponseEntity<?> response = controller.requestReschedule(principal, "booking-x", body, "idem-rs3", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("BookingController requestReschedule replays completed idempotency")
    void requestRescheduleReplayCompleted() {
        JwtPrincipal principal = customerPrincipal();
        String eventId = uuid(215);
        BookingScheduleEvent event = new BookingScheduleEvent(
                eventId, uuid(210), principal.userId(), "RESCHEDULE_REQUESTED", Instant.now(), null, Instant.now());
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_REQUEST, "idem-rs4"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(eventId)));
        when(scheduleService.getScheduleEvent(eventId)).thenReturn(Optional.of(event));

        RescheduleRequest body = new RescheduleRequest("2026-03-20T10:00:00Z", null);
        ResponseEntity<?> response = controller.requestReschedule(principal, uuid(210), body, "idem-rs4", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    // --- Reschedule respond endpoint ---

    @Test
    @DisplayName("BookingController respondToReschedule returns OK on success")
    void respondToRescheduleSuccess() {
        JwtPrincipal principal = taskerPrincipal();
        String bookingId = uuid(220);
        String eventId = uuid(221);
        BookingScheduleEvent event = new BookingScheduleEvent(
                eventId, bookingId, principal.userId(), "RESCHEDULE_ACCEPTED", null, null, Instant.now());
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_RESPOND, "idem-rr1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(scheduleService.respondToReschedule(bookingId, eventId, principal.userId(), "ACCEPT"))
                .thenReturn(event);

        RescheduleRespondRequest body = new RescheduleRespondRequest("ACCEPT");
        ResponseEntity<?> response =
                controller.respondToReschedule(principal, bookingId, eventId, body, "idem-rr1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id", eventId);
    }

    @Test
    @DisplayName("BookingController respondToReschedule returns NOT_FOUND on IllegalArgumentException")
    void respondToRescheduleNotFound() {
        JwtPrincipal principal = taskerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_RESPOND, "idem-rr2"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(scheduleService.respondToReschedule("b1", "e1", principal.userId(), "ACCEPT"))
                .thenThrow(new IllegalArgumentException("Event not found."));

        RescheduleRespondRequest body = new RescheduleRespondRequest("ACCEPT");
        ResponseEntity<?> response = controller.respondToReschedule(principal, "b1", "e1", body, "idem-rr2", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("BookingController respondToReschedule returns CONFLICT on IllegalStateException")
    void respondToRescheduleInvalidStatus() {
        JwtPrincipal principal = taskerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.RESCHEDULE_RESPOND, "idem-rr3"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(scheduleService.respondToReschedule("b2", "e2", principal.userId(), "DECLINE"))
                .thenThrow(new IllegalStateException("Already responded."));

        RescheduleRespondRequest body = new RescheduleRespondRequest("DECLINE");
        ResponseEntity<?> response = controller.respondToReschedule(principal, "b2", "e2", body, "idem-rr3", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    // --- Rebook endpoint ---

    @Test
    @DisplayName("BookingController rebook returns CREATED on success")
    void rebookSuccess() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(230);
        TaskState newTask = task(uuid(231), "OPEN");
        when(repeatBookingService.rebook(bookingId, principal.userId()))
                .thenReturn(RepeatBookingService.RebookResult.success(newTask));

        ResponseEntity<?> response = controller.rebook(principal, bookingId, request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("id", uuid(231));
    }

    @Test
    @DisplayName("BookingController rebook returns NOT_FOUND for missing booking")
    void rebookNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(repeatBookingService.rebook("missing", principal.userId()))
                .thenReturn(RepeatBookingService.RebookResult.error(
                        RepeatBookingService.RebookResult.NOT_FOUND, "Booking not found."));

        ResponseEntity<?> response = controller.rebook(principal, "missing", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("BookingController rebook returns CONFLICT for non-completed booking")
    void rebookNotCompleted() {
        JwtPrincipal principal = customerPrincipal();
        when(repeatBookingService.rebook("active", principal.userId()))
                .thenReturn(RepeatBookingService.RebookResult.error(
                        RepeatBookingService.RebookResult.NOT_COMPLETED, "Only completed bookings can be rebooked."));

        ResponseEntity<?> response = controller.rebook(principal, "active", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("BookingController rebook returns FORBIDDEN for non-customer")
    void rebookForbidden() {
        JwtPrincipal principal = taskerPrincipal();
        when(repeatBookingService.rebook("booking-rb", principal.userId()))
                .thenReturn(RepeatBookingService.RebookResult.error(
                        RepeatBookingService.RebookResult.FORBIDDEN, "Only the customer can rebook."));

        ResponseEntity<?> response = controller.rebook(principal, "booking-rb", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("BookingController rebook returns NOT_FOUND for TASK_NOT_FOUND error")
    void rebookTaskNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(repeatBookingService.rebook("booking-tnf", principal.userId()))
                .thenReturn(RepeatBookingService.RebookResult.error(
                        RepeatBookingService.RebookResult.TASK_NOT_FOUND, "Original task not found."));

        ResponseEntity<?> response = controller.rebook(principal, "booking-tnf", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // --- Schedule events endpoint ---

    @Test
    @DisplayName("BookingController getScheduleEvents returns list of events")
    void getScheduleEventsReturnsList() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(240);
        BookingScheduleEvent event = new BookingScheduleEvent(
                uuid(241),
                bookingId,
                principal.userId(),
                "RESCHEDULE_REQUESTED",
                Instant.now(),
                "reason",
                Instant.now());
        when(scheduleService.listScheduleEvents(bookingId, principal.userId())).thenReturn(List.of(event));

        ResponseEntity<?> response = controller.getScheduleEvents(principal, bookingId);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsKey("data");
    }

    // --- Cancel success paths ---

    @Test
    @DisplayName("BookingController cancel success by customer transitions task to cancelled")
    void cancelBookingSuccessByCustomer() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(250);
        BookingState cancelledBooking = booking(bookingId, principal.userId(), "tasker-250", "CANCELLED");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-cs1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.cancelBooking(principal.userId(), bookingId))
                .thenReturn(BookingTransitionResult.success(cancelledBooking));

        ResponseEntity<?> response = controller.cancelBooking(principal, bookingId, "idem-cs1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("BookingController cancel success by tasker reopens task and adds strike")
    void cancelBookingSuccessByTasker() {
        JwtPrincipal principal = taskerPrincipal();
        String bookingId = uuid(251);
        BookingState cancelledBooking = booking(bookingId, "customer-251", principal.userId(), "CANCELLED");
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-cs2"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.cancelBooking(principal.userId(), bookingId))
                .thenReturn(BookingTransitionResult.success(cancelledBooking));

        ResponseEntity<?> response = controller.cancelBooking(principal, bookingId, "idem-cs2", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("BookingController cancel returns FORBIDDEN when service returns FORBIDDEN")
    void cancelBookingForbidden() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(252);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-cs3"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.cancelBooking(principal.userId(), bookingId))
                .thenReturn(BookingTransitionResult.FORBIDDEN_RESULT);

        ResponseEntity<?> response = controller.cancelBooking(principal, bookingId, "idem-cs3", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("BookingController cancel returns CONFLICT for invalid transition")
    void cancelBookingInvalidTransition() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(253);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-cs4"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.cancelBooking(principal.userId(), bookingId))
                .thenReturn(BookingTransitionResult.INVALID_TRANSITION_RESULT);

        ResponseEntity<?> response = controller.cancelBooking(principal, bookingId, "idem-cs4", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    // --- Complete forbidden ---

    @Test
    @DisplayName("BookingController complete returns FORBIDDEN for non-customer")
    void completeBookingForbidden() {
        JwtPrincipal principal = taskerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.COMPLETE_BOOKING, "idem-cf1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));
        when(bookingLifecycleService.completeBooking(principal.userId(), "booking-cf"))
                .thenReturn(BookingTransitionResult.FORBIDDEN_RESULT);

        ResponseEntity<?> response = controller.completeBooking(principal, "booking-cf", "idem-cf1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // --- getBooking not found ---

    @Test
    @DisplayName("BookingController getBooking returns NOT_FOUND for missing booking")
    void getBookingNotFound() {
        JwtPrincipal principal = customerPrincipal();
        when(bookingService.getBooking("missing")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.getBooking(principal, "missing", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("BookingController getBooking returns NOT_FOUND for non-participant")
    void getBookingForbiddenNonParticipant() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(260);
        BookingState booking = booking(bookingId, "other-customer", "other-tasker", "ASSIGNED");
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.of(booking));

        ResponseEntity<?> response = controller.getBooking(principal, bookingId, request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // --- No-show completed replay missing ---

    @Test
    @DisplayName("BookingController flagNoShow returns replay-missing when booking unavailable")
    void flagNoShowReplayMissing() {
        JwtPrincipal principal = customerPrincipal();
        String bookingId = uuid(270);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.NO_SHOW_FLAG, "idem-ns-rm"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(bookingId)));
        when(bookingService.getBooking(bookingId)).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.flagNoShow(principal, "ignored", "idem-ns-rm", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }

    // --- Cancel replay missing with null record ---

    @Test
    @DisplayName("BookingController cancel returns replay-missing when record is null")
    void cancelBookingCompletedReplayMissingNullRecord() {
        JwtPrincipal principal = customerPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.CANCEL_BOOKING, "idem-null"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, null));

        ResponseEntity<?> response = controller.cancelBooking(principal, "ignored", "idem-null", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }
}
