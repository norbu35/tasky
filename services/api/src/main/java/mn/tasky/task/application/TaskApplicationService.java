package mn.tasky.task.application;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for task application lifecycle operations: apply, list applications, accept.
 */
@Service
public class TaskApplicationService {

    private final UserProfileService userProfileService;
    private final BookingCommandPort bookingCommandPort;
    private final MessagingService messagingService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final TaskDao taskDao;
    private final TaskApplicationDao taskApplicationDao;
    private final ReviewEnforcementService reviewEnforcementService;

    public TaskApplicationService(
            UserProfileService userProfileService,
            BookingCommandPort bookingCommandPort,
            MessagingService messagingService,
            NotificationService notificationService,
            AnalyticsService analyticsService,
            DomainEventOutboxService domainEventOutboxService,
            ReviewEnforcementService reviewEnforcementService,
            TaskDao taskDao,
            TaskApplicationDao taskApplicationDao) {
        this.userProfileService = userProfileService;
        this.bookingCommandPort = bookingCommandPort;
        this.messagingService = messagingService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.reviewEnforcementService = reviewEnforcementService;
        this.taskDao = taskDao;
        this.taskApplicationDao = taskApplicationDao;
    }

    /**
     * Submits a task application for a verified tasker.
     * Rejects non-taskers, self-application, non-open tasks, and duplicate applications.
     *
     * @param taskerId   Tasker identifier.
     * @param taskerRole Caller role expected to be {@code TASKER}.
     * @param taskId     Target task identifier.
     * @param message    Optional application message.
     * @return Result containing created application or error state.
     */
    public TaskApplyResult applyToTask(String taskerId, String taskerRole, String taskId, String message) {
        if (reviewEnforcementService.isUserLocked(taskerId)) {
            return new TaskApplyResult(null, TaskApplyResult.REVIEW_LOCK_ACTIVE);
        }

        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskApplyResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!"TASKER".equals(taskerRole) || task.customerId().equals(taskerId)) {
            return TaskApplyResult.FORBIDDEN_RESULT;
        }

        if (!"OPEN".equals(task.status()) || taskApplicationDao.hasAccepted(taskId)) {
            return TaskApplyResult.TASK_NOT_OPEN_RESULT;
        }

        Optional<UserProfile> profileOpt = userProfileService.getProfile(taskerId);
        if (profileOpt.isEmpty()) {
            return TaskApplyResult.FORBIDDEN_RESULT;
        }
        UserProfile profile = profileOpt.get();
        if (!"VERIFIED".equals(profile.status())) {
            return TaskApplyResult.FORBIDDEN_RESULT;
        }

        if (taskApplicationDao.existsByTaskIdAndTaskerId(taskId, taskerId)) {
            return TaskApplyResult.DUPLICATE_APPLICATION_RESULT;
        }

        String applicationId = UUID.randomUUID().toString();
        String sanitizedMessage = TextSanitizer.plainText(message);
        taskApplicationDao.insert(applicationId, taskId, taskerId, sanitizedMessage, "APPLIED", Instant.now());

        TaskApplicationState application = new TaskApplicationState(
                applicationId,
                taskId,
                taskerId,
                profile.fullName(),
                profile.avatarUrl(),
                profile.ratingAvg(),
                profile.completedTasks(),
                profile.isPro(),
                sanitizedMessage,
                "APPLIED",
                null,
                null,
                null,
                null,
                Instant.now());

        String conversationId = messagingService.startConversation(taskId, taskerId, task.customerId());
        notificationService.sendPush(
                task.customerId(), "New Applicant", "A tasker has applied to your task.", "TASKER_APPLIED");
        analyticsService.track(
                AnalyticsService.EVENT_APPLICATION_SUBMITTED,
                taskerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        taskId,
                        "application_id",
                        application.id(),
                        "conversation_id",
                        conversationId));

        return TaskApplyResult.success(application);
    }

    /**
     * Lists task applications using default first-page pagination.
     *
     * @param userId Requesting user (must be task owner).
     * @param taskId Task identifier.
     * @return Applications list result.
     */
    public TaskApplicationsListResult listTaskApplications(String userId, String taskId) {
        return listTaskApplications(userId, taskId, null, 50);
    }

    /**
     * Lists task applications for a task owned by the requesting user.
     *
     * @param userId Requesting user (must be task owner).
     * @param taskId Task identifier.
     * @param cursor Optional pagination cursor.
     * @param limit  Page size.
     * @return Applications list result.
     */
    public TaskApplicationsListResult listTaskApplications(String userId, String taskId, String cursor, int limit) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskApplicationsListResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId().equals(userId)) {
            return TaskApplicationsListResult.FORBIDDEN_RESULT;
        }

        List<TaskApplicationState> applications = taskApplicationDao.findByTaskId(taskId, cursor, limit);
        return TaskApplicationsListResult.success(List.copyOf(applications));
    }

    /**
     * Counts applications submitted for a task.
     *
     * @param taskId Task identifier.
     * @return Number of applications.
     */
    public int countApplications(String taskId) {
        return taskApplicationDao.countByTaskId(taskId);
    }

    /**
     * Accepts a pending application for an open task and creates the booking.
     * Marks selected application accepted, rejects others, assigns task, and enqueues
     * downstream side effects (conversation bootstrap, notifications, analytics) via outbox.
     *
     * @param customerId                  Task owner identifier.
     * @param taskId                      Task identifier.
     * @param applicationId               Application identifier.
     * @param liabilityDisclaimerAccepted Whether disclaimer was accepted.
     * @return Acceptance result with booking on success.
     */
    @Transactional
    public TaskAcceptResult acceptApplication(
            String customerId, String taskId, String applicationId, boolean liabilityDisclaimerAccepted) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId().equals(customerId)) {
            return TaskAcceptResult.FORBIDDEN_RESULT;
        }

        if (!"OPEN".equals(task.status())) {
            return TaskAcceptResult.TASK_NOT_OPEN_RESULT;
        }

        if (!liabilityDisclaimerAccepted) {
            return TaskAcceptResult.DISCLAIMER_REQUIRED_RESULT;
        }

        if (taskApplicationDao.hasAccepted(taskId)) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }

        Optional<TaskApplicationState> selectedOpt = taskApplicationDao.findById(applicationId);
        if (selectedOpt.isEmpty() || !taskId.equals(selectedOpt.get().taskId())) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskApplicationState selected = selectedOpt.get();
        if (!"APPLIED".equals(selected.status())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }

        taskApplicationDao.updateStatus(selected.id(), "ACCEPTED");
        taskApplicationDao.rejectOthers(taskId, selected.id());

        BookingState booking = bookingCommandPort.createBooking(
                task.id(), selected.taskerId(), task.customerId(), task.budget(), true, task.scheduledAt());
        taskDao.updateStatus(task.id(), "ASSIGNED", Instant.now());

        domainEventOutboxService.publish(
                OutboxEventTypes.TASK_APPLICATION_ACCEPTED,
                "BOOKING",
                booking.id(),
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        task.id(),
                        AnalyticsService.PROPERTY_BOOKING_ID,
                        booking.id(),
                        "customer_id",
                        customerId,
                        "tasker_id",
                        selected.taskerId(),
                        "application_id",
                        applicationId));

        return TaskAcceptResult.success(booking);
    }
}
