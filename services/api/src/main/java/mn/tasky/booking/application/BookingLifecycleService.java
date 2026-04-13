package mn.tasky.booking.application;

import java.util.Map;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.dto.BookingTransitionResult;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.TaskState;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingLifecycleService {

    private final BookingService bookingService;
    private final BookingTimelineService timelineService;
    private final TaskService taskService;
    private final ModerationService moderationService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final TrustQueryPort trustQueryPort;

    public BookingLifecycleService(
            BookingService bookingService,
            BookingTimelineService timelineService,
            TaskService taskService,
            ModerationService moderationService,
            DomainEventOutboxService domainEventOutboxService,
            TrustQueryPort trustQueryPort) {
        this.bookingService = bookingService;
        this.timelineService = timelineService;
        this.taskService = taskService;
        this.moderationService = moderationService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.trustQueryPort = trustQueryPort;
    }

    @Transactional
    public BookingTransitionResult cancelBooking(String actorUserId, String bookingId) {
        return cancelBooking(actorUserId, bookingId, null);
    }

    @Transactional
    public BookingTransitionResult cancelBooking(String actorUserId, String bookingId, String reason) {
        BookingState booking = bookingService.getBooking(bookingId).orElse(null);
        if (booking == null) {
            return BookingTransitionResult.NOT_FOUND_RESULT;
        }
        if (hasOpenDispute(bookingId)) {
            return BookingTransitionResult.OPEN_DISPUTE_RESULT;
        }

        TaskState task = taskService
                .getTask(booking.taskId())
                .orElseThrow(
                        () -> new IllegalStateException("Task not found when cancelling booking " + bookingId + "."));
        BookingTransitionResult result = bookingService.cancelBooking(actorUserId, bookingId, task.scheduledAt());
        if (!result.isSuccess()) {
            return result;
        }

        BookingState updated = result.booking();
        if (updated.taskerId().equals(actorUserId)) {
            requireTaskUpdate(taskService.reopenTask(updated.taskId()), "reopening", bookingId, updated.taskId());
            boolean isSafetyOrFraud =
                    reason != null && reason.toLowerCase(java.util.Locale.ROOT).contains("safety");
            if (!isSafetyOrFraud) {
                moderationService.addStrike(actorUserId, reason, bookingId);
            }
        } else if (updated.customerId().equals(actorUserId)) {
            requireTaskUpdate(
                    taskService.transitionToCancelled(updated.taskId()), "cancelling", bookingId, updated.taskId());
        }
        timelineService.recordEvent(bookingId, BookingTimelineService.BOOKING_CANCELLED, actorUserId, null);
        return bookingService
                .getBooking(bookingId)
                .map(BookingTransitionResult::success)
                .orElse(result);
    }

    @Transactional
    public BookingTransitionResult completeBooking(String actorUserId, String bookingId) {
        if (hasOpenDispute(bookingId)) {
            return BookingTransitionResult.OPEN_DISPUTE_RESULT;
        }
        BookingTransitionResult result = bookingService.completeBooking(actorUserId, bookingId);
        if (!result.isSuccess()) {
            return result;
        }

        BookingState updated = result.booking();
        requireTaskUpdate(
                taskService.transitionToCompleted(updated.taskId()), "completing", bookingId, updated.taskId());
        timelineService.recordEvent(bookingId, BookingTimelineService.BOOKING_COMPLETED, actorUserId, null);
        domainEventOutboxService.publish(
                OutboxEventTypes.BOOKING_COMPLETED,
                "BOOKING",
                updated.id(),
                Map.of(
                        "booking_id",
                        updated.id(),
                        "task_id",
                        updated.taskId(),
                        "customer_id",
                        updated.customerId(),
                        "tasker_id",
                        updated.taskerId(),
                        "price",
                        updated.price()));
        return bookingService
                .getBooking(bookingId)
                .map(BookingTransitionResult::success)
                .orElse(result);
    }

    private boolean hasOpenDispute(String bookingId) {
        return trustQueryPort.hasOpenDispute(bookingId);
    }

    private void requireTaskUpdate(
            java.util.Optional<TaskState> taskOpt, String action, String bookingId, String taskId) {
        if (taskOpt.isPresent()) {
            return;
        }
        throw new IllegalStateException(
                "Task not found when " + action + " booking " + bookingId + " (taskId=" + taskId + ").");
    }
}
