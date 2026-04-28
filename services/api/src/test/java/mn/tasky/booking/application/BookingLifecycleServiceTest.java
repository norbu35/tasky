package mn.tasky.booking.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.application.TaskLifecycleService;
import mn.tasky.task.application.TaskQueryService;
import mn.tasky.task.dto.TaskState;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingLifecycleServiceTest {

    @Mock
    private BookingService bookingService;

    @Mock
    private BookingTimelineService timelineService;

    @Mock
    private TaskQueryService taskQueryService;

    @Mock
    private TaskLifecycleService taskLifecycleService;

    @Mock
    private ModerationService moderationService;

    @Mock
    private DomainEventOutboxService domainEventOutboxService;

    @Mock
    private TrustQueryPort trustQueryPort;

    @Mock
    private ReviewEnforcementService reviewEnforcementService;

    @Mock
    private NotificationService notificationService;

    private BookingLifecycleService service;
    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new BookingLifecycleService(
                bookingService,
                timelineService,
                taskQueryService,
                taskLifecycleService,
                moderationService,
                domainEventOutboxService,
                trustQueryPort,
                reviewEnforcementService,
                notificationService);
    }

    private BookingState assignedBooking(String bookingId, String taskId, String customerId, String taskerId) {
        return new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                1000,
                "ASSIGNED",
                null,
                false,
                now,
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
    }

    private BookingState cancelledBooking(String bookingId, String taskId, String customerId, String taskerId) {
        return new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                1000,
                "CANCELLED",
                null,
                false,
                now,
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
    }

    private BookingState completedBooking(String bookingId, String taskId, String customerId, String taskerId) {
        return new BookingState(
                bookingId,
                taskId,
                taskerId,
                customerId,
                1000,
                "COMPLETED",
                null,
                false,
                now,
                "DIRECT",
                false,
                null,
                0,
                null,
                now,
                now);
    }

    private TaskState openTask(String taskId) {
        return openTask(taskId, now);
    }

    private TaskState openTask(String taskId, Instant scheduledAt) {
        return new TaskState(
                taskId,
                "c1",
                "cat1",
                "desc",
                5000,
                47.9,
                106.9,
                "UB",
                "OPEN",
                scheduledAt,
                "BUDGET",
                null,
                null,
                null,
                null,
                now,
                now);
    }

    private TaskState assignedTask(String taskId) {
        return assignedTask(taskId, now);
    }

    private TaskState assignedTask(String taskId, Instant scheduledAt) {
        return new TaskState(
                taskId,
                "c1",
                "cat1",
                "desc",
                5000,
                47.9,
                106.9,
                "UB",
                "ASSIGNED",
                scheduledAt,
                "BUDGET",
                null,
                null,
                null,
                null,
                now,
                now);
    }

    // --- cancelBooking (2-arg) ---

    @Test
    void cancelBooking_notFound() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.empty());
        BookingTransitionResult result = service.cancelBooking("c1", "b1");
        assertThat(result).isEqualTo(BookingTransitionResult.NOT_FOUND_RESULT);
    }

    @Test
    void cancelBooking_openDispute_returnsOpenDispute() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(true);

        BookingTransitionResult result = service.cancelBooking("c1", "b1");
        assertThat(result).isEqualTo(BookingTransitionResult.OPEN_DISPUTE_RESULT);
    }

    @Test
    void cancelBooking_taskerCancel_reopensTask() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState cancelled = cancelledBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking), Optional.of(cancelled));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1")).thenReturn(Optional.of(assignedTask("t1")));
        when(bookingService.cancelBooking(eq("tk1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.success(cancelled));
        when(taskLifecycleService.reopenTask("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.cancelBooking("tk1", "b1", "schedule conflict");
        assertThat(result.isSuccess()).isTrue();
        verify(taskLifecycleService).reopenTask("t1");
        verify(moderationService).addStrike(eq("tk1"), eq("TASKER_CANCELLATION"), eq("b1"));
        verify(reviewEnforcementService).createCasesForBooking(eq("b1"), eq("c1"), eq("tk1"), eq("BOOKING_CANCELLED"));
        verify(timelineService)
                .recordEvent(eq("b1"), eq(BookingTimelineService.BOOKING_CANCELLED), eq("tk1"), eq(null));
    }

    @Test
    void cancelBooking_taskerCancel_notifiesCustomerThatTaskIsOpenAgain() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState cancelled = cancelledBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking), Optional.of(cancelled));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1")).thenReturn(Optional.of(assignedTask("t1")));
        when(bookingService.cancelBooking(eq("tk1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.success(cancelled));
        when(taskLifecycleService.reopenTask("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.cancelBooking("tk1", "b1", "schedule conflict");

        assertThat(result.isSuccess()).isTrue();
        verify(notificationService)
                .sendPushWithEventKey(
                        eq("c1"),
                        eq("Tasker cancelled"),
                        eq("Your task is open again. Review the original task and choose another tasker."),
                        eq("TASKER_CANCELLED_BOOKING"),
                        eq("TASKER_CANCELLED_BOOKING_b1"));
    }

    @Test
    void cancelBooking_taskerCancel_safetyReason_noStrike() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState cancelled = cancelledBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking), Optional.of(cancelled));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1")).thenReturn(Optional.of(assignedTask("t1")));
        when(bookingService.cancelBooking(eq("tk1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.success(cancelled));
        when(taskLifecycleService.reopenTask("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.cancelBooking("tk1", "b1", "[SAFETY_FRAUD] risk signal");
        assertThat(result.isSuccess()).isTrue();
        verify(taskLifecycleService).reopenTask("t1");
        verify(moderationService, never()).addStrike(anyString(), anyString(), anyString());
        verify(reviewEnforcementService, never())
                .createCasesForBooking(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void cancelBooking_customerLateCancel_transitionsTaskToCancelled_andCreatesReviewDebt() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState cancelled = cancelledBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking), Optional.of(cancelled));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1"))
                .thenReturn(Optional.of(assignedTask("t1", Instant.now().minusSeconds(30 * 60))));
        when(bookingService.cancelBooking(eq("c1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.success(cancelled));
        when(taskLifecycleService.transitionToCancelled("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.cancelBooking("c1", "b1");
        assertThat(result.isSuccess()).isTrue();
        verify(taskLifecycleService).transitionToCancelled("t1");
        verify(reviewEnforcementService).createCasesForBooking(eq("b1"), eq("c1"), eq("tk1"), eq("BOOKING_CANCELLED"));
        verify(timelineService).recordEvent(eq("b1"), eq(BookingTimelineService.BOOKING_CANCELLED), eq("c1"), eq(null));
    }

    @Test
    void cancelBooking_customerEarlyCancel_transitionsTaskToCancelled_withoutReviewDebt() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState cancelled = cancelledBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking), Optional.of(cancelled));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1"))
                .thenReturn(Optional.of(assignedTask("t1", Instant.now().plusSeconds(24 * 60 * 60))));
        when(bookingService.cancelBooking(eq("c1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.success(cancelled));
        when(taskLifecycleService.transitionToCancelled("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.cancelBooking("c1", "b1");
        assertThat(result.isSuccess()).isTrue();
        verify(taskLifecycleService).transitionToCancelled("t1");
        verify(reviewEnforcementService, never())
                .createCasesForBooking(anyString(), anyString(), anyString(), anyString());
        verify(timelineService).recordEvent(eq("b1"), eq(BookingTimelineService.BOOKING_CANCELLED), eq("c1"), eq(null));
    }

    @Test
    void cancelBooking_bookingServiceFails_returnsError() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1")).thenReturn(Optional.of(assignedTask("t1")));
        when(bookingService.cancelBooking(eq("c1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.FORBIDDEN_RESULT);

        BookingTransitionResult result = service.cancelBooking("c1", "b1");
        assertThat(result.isSuccess()).isFalse();
    }

    @Test
    void cancelBooking_taskNotFound_throws() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelBooking("c1", "b1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Task not found");
    }

    @Test
    void cancelBooking_taskReopenFails_throws() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState cancelled = cancelledBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(taskQueryService.getTask("t1")).thenReturn(Optional.of(assignedTask("t1")));
        when(bookingService.cancelBooking(eq("tk1"), eq("b1"), any()))
                .thenReturn(BookingTransitionResult.success(cancelled));
        when(taskLifecycleService.reopenTask("t1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelBooking("tk1", "b1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("reopening");
    }

    // --- completeBooking ---

    @Test
    void completeBooking_notFound() {
        when(bookingService.getBooking("b1")).thenReturn(Optional.empty());
        BookingTransitionResult result = service.completeBooking("c1", "b1");
        assertThat(result).isEqualTo(BookingTransitionResult.NOT_FOUND_RESULT);
    }

    @Test
    void completeBooking_openDispute_returnsOpenDispute() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(true);

        BookingTransitionResult result = service.completeBooking("c1", "b1");
        assertThat(result).isEqualTo(BookingTransitionResult.OPEN_DISPUTE_RESULT);
    }

    @Test
    void completeBooking_disputedBooking_noDisputeCheckPasses() {
        BookingState disputed = new BookingState(
                "b1", "t1", "tk1", "c1", 1000, "DISPUTED", null, false, now, "DIRECT", false, null, 0, null, now, now);
        BookingState completed = completedBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(disputed), Optional.of(completed));
        when(bookingService.completeBooking("c1", "b1")).thenReturn(BookingTransitionResult.success(completed));
        when(taskLifecycleService.transitionToCompleted("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.completeBooking("c1", "b1");
        assertThat(result.isSuccess()).isTrue();
    }

    @Test
    void completeBooking_success() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState completed = completedBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking), Optional.of(completed));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(bookingService.completeBooking("c1", "b1")).thenReturn(BookingTransitionResult.success(completed));
        when(taskLifecycleService.transitionToCompleted("t1")).thenReturn(Optional.of(openTask("t1")));

        BookingTransitionResult result = service.completeBooking("c1", "b1");
        assertThat(result.isSuccess()).isTrue();
        verify(taskLifecycleService).transitionToCompleted("t1");
        verify(timelineService).recordEvent(eq("b1"), eq(BookingTimelineService.BOOKING_COMPLETED), eq("c1"), eq(null));
        verify(domainEventOutboxService).publish(eq("BOOKING_COMPLETED"), eq("BOOKING"), eq("b1"), any(Map.class));
    }

    @Test
    void completeBooking_bookingServiceFails_returnsError() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(bookingService.completeBooking("c1", "b1")).thenReturn(BookingTransitionResult.FORBIDDEN_RESULT);

        BookingTransitionResult result = service.completeBooking("c1", "b1");
        assertThat(result.isSuccess()).isFalse();
    }

    @Test
    void completeBooking_taskTransitionFails_throws() {
        BookingState booking = assignedBooking("b1", "t1", "c1", "tk1");
        BookingState completed = completedBooking("b1", "t1", "c1", "tk1");

        when(bookingService.getBooking("b1")).thenReturn(Optional.of(booking));
        when(trustQueryPort.hasOpenDispute("b1")).thenReturn(false);
        when(bookingService.completeBooking("c1", "b1")).thenReturn(BookingTransitionResult.success(completed));
        when(taskLifecycleService.transitionToCompleted("t1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.completeBooking("c1", "b1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("completing");
    }
}
