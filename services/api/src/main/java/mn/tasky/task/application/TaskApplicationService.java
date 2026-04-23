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
import mn.tasky.notification.application.NotificationService;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.PricingMode;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskSelectResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskWithdrawResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskApplicationService {
    private static final Logger log = LoggerFactory.getLogger(TaskApplicationService.class);
    private static final long SELECTION_WINDOW_HOURS = 4;
    private final UserProfileService userProfileService;
    private final BookingCommandPort bookingCommandPort;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final TaskDao taskDao;
    private final TaskApplicationDao taskApplicationDao;
    private final ReviewEnforcementService reviewEnforcementService;

    public TaskApplicationService(
            UserProfileService userProfileService,
            BookingCommandPort bookingCommandPort,
            NotificationService notificationService,
            AnalyticsService analyticsService,
            DomainEventOutboxService domainEventOutboxService,
            ReviewEnforcementService reviewEnforcementService,
            TaskDao taskDao,
            TaskApplicationDao taskApplicationDao) {
        this.userProfileService = userProfileService;
        this.bookingCommandPort = bookingCommandPort;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.reviewEnforcementService = reviewEnforcementService;
        this.taskDao = taskDao;
        this.taskApplicationDao = taskApplicationDao;
    }

    public TaskApplyResult applyToTask(
            String taskerId, String taskerRole, String taskId, String message, Integer quotePrice) {
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
        boolean isQuoteMode = PricingMode.QUOTE.name().equals(task.pricingMode());
        if (isQuoteMode && quotePrice == null) {
            return new TaskApplyResult(null, TaskApplyResult.QUOTE_PRICE_REQUIRED);
        }
        String applicationId = UUID.randomUUID().toString();
        String sanitizedMessage = TextSanitizer.plainText(message);
        taskApplicationDao.insert(
                applicationId, taskId, taskerId, sanitizedMessage, quotePrice, "APPLIED", Instant.now());
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
                quotePrice,
                "APPLIED",
                null,
                null,
                null,
                null,
                Instant.now());
        notificationService.sendPush(
                task.customerId(), "New Applicant", "A tasker has applied to your task.", "TASKER_APPLIED");
        analyticsService.track(
                AnalyticsService.EVENT_APPLICATION_SUBMITTED,
                taskerId,
                Map.of(AnalyticsService.PROPERTY_TASK_ID, taskId, "application_id", application.id()));
        return TaskApplyResult.success(application);
    }

    public TaskApplicationsListResult listTaskApplications(String userId, String taskId) {
        return listTaskApplications(userId, taskId, null, 50);
    }

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

    public int countApplications(String taskId) {
        return taskApplicationDao.countByTaskId(taskId);
    }

    @Transactional
    public TaskSelectResult selectApplication(String customerId, String taskId, String applicationId) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskSelectResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();
        if (!task.customerId().equals(customerId)) {
            return TaskSelectResult.FORBIDDEN_RESULT;
        }
        if (!"OPEN".equals(task.status())) {
            return TaskSelectResult.TASK_NOT_OPEN_RESULT;
        }
        if (taskApplicationDao.hasAccepted(taskId)) {
            return TaskSelectResult.CONFLICT_RESULT;
        }
        Optional<TaskApplicationState> selectedOpt = taskApplicationDao.findById(applicationId);
        if (selectedOpt.isEmpty() || !taskId.equals(selectedOpt.get().taskId())) {
            return TaskSelectResult.NOT_FOUND_RESULT;
        }
        TaskApplicationState selected = selectedOpt.get();
        if (!"APPLIED".equals(selected.status())) {
            return TaskSelectResult.CONFLICT_RESULT;
        }
        Instant now = Instant.now();
        Instant respondBy = now.plusSeconds(SELECTION_WINDOW_HOURS * 3600);
        taskApplicationDao.updateSelection(selected.id(), "SELECTED", now, respondBy);
        notificationService.sendPush(
                selected.taskerId(),
                "You've been selected!",
                "A customer has selected you for their task. You have 4 hours to confirm.",
                "TASKER_SELECTED");
        analyticsService.track(
                "APPLICATION_SELECTED",
                customerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        taskId,
                        "application_id",
                        applicationId,
                        "tasker_id",
                        selected.taskerId()));
        TaskApplicationState updated =
                taskApplicationDao.findById(applicationId).orElse(selected);
        return TaskSelectResult.success(updated);
    }

    @Transactional
    public TaskAcceptResult confirmAcceptance(String taskerId, String applicationId) {
        Optional<TaskApplicationState> selectedOpt = taskApplicationDao.findByTaskerAndId(taskerId, applicationId);
        if (selectedOpt.isEmpty()) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskApplicationState selected = selectedOpt.get();
        if (!"SELECTED".equals(selected.status())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
        if (selected.respondByAt() != null && Instant.now().isAfter(selected.respondByAt())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
        Optional<TaskState> taskOpt = taskDao.findById(selected.taskId());
        if (taskOpt.isEmpty()) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();
        if (taskApplicationDao.hasAccepted(selected.taskId())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
        taskApplicationDao.updateStatus(selected.id(), "ACCEPTED");
        taskApplicationDao.rejectOthers(selected.taskId(), selected.id());
        int bookingPrice;
        if (PricingMode.QUOTE.name().equals(task.pricingMode())) {
            if (selected.quotePrice() == null) {
                return new TaskAcceptResult(null, "QUOTE_PRICE_MISSING");
            }
            bookingPrice = selected.quotePrice();
        } else {
            bookingPrice = task.budget() != null ? task.budget() : 0;
        }
        BookingState booking = bookingCommandPort.createBooking(
                task.id(), selected.taskerId(), task.customerId(), bookingPrice, true, task.scheduledAt());
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
                        task.customerId(),
                        "tasker_id",
                        selected.taskerId(),
                        "application_id",
                        applicationId));
        notificationService.sendPush(
                task.customerId(),
                "Tasker confirmed!",
                "The tasker has accepted your task. Your booking is confirmed.",
                "BOOKING_CONFIRMED");
        return TaskAcceptResult.success(booking);
    }

    @Transactional
    public void expireStaleSelections() {
        List<TaskApplicationState> expired = taskApplicationDao.findSelectedExpired(Instant.now(), 100);
        for (TaskApplicationState application : expired) {
            try {
                taskApplicationDao.updateStatus(application.id(), "EXPIRED");
                Optional<TaskState> taskOpt = taskDao.findById(application.taskId());
                if (taskOpt.isPresent()) {
                    notificationService.sendPush(
                            taskOpt.get().customerId(),
                            "Selection expired",
                            "The tasker did not confirm in time. You can select another applicant.",
                            "SELECTION_EXPIRED");
                }
                log.info(
                        "Expired stale selection: applicationId={}, taskId={}", application.id(), application.taskId());
            } catch (Exception e) {
                log.error("Error expiring selection for application {}", application.id(), e);
            }
        }
    }

    @Transactional
    public TaskWithdrawResult withdrawApplication(String taskerId, String applicationId) {
        Optional<TaskApplicationState> appOpt = taskApplicationDao.findByTaskerAndId(taskerId, applicationId);
        if (appOpt.isEmpty()) {
            return TaskWithdrawResult.NOT_FOUND_RESULT;
        }
        TaskApplicationState application = appOpt.get();
        if (!"APPLIED".equals(application.status()) && !"SELECTED".equals(application.status())) {
            return TaskWithdrawResult.INVALID_STATUS_RESULT;
        }
        taskApplicationDao.updateStatus(application.id(), "WITHDRAWN");
        boolean wasSelected = "SELECTED".equals(application.status());
        if (wasSelected) {
            taskDao.updateStatus(application.taskId(), "OPEN", Instant.now());
            Optional<TaskState> taskOpt = taskDao.findById(application.taskId());
            taskOpt.ifPresent(task -> notificationService.sendPush(
                    task.customerId(),
                    "Applicant withdrew",
                    "A selected tasker has withdrawn from your task. You can select another applicant.",
                    "APPLICANT_WITHDREW"));
        } else {
            Optional<TaskState> taskOpt = taskDao.findById(application.taskId());
            taskOpt.ifPresent(task -> notificationService.sendPush(
                    task.customerId(),
                    "Applicant withdrew",
                    "A tasker has withdrawn their application from your task.",
                    "APPLICANT_WITHDREW"));
        }
        analyticsService.track(
                "APPLICATION_WITHDRAWN",
                taskerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        application.taskId(),
                        "application_id",
                        applicationId,
                        "was_selected",
                        wasSelected));
        TaskApplicationState updated =
                taskApplicationDao.findById(applicationId).orElse(application);
        return TaskWithdrawResult.success(updated);
    }

    @Transactional
    @Deprecated
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
        int bookingPrice;
        if (PricingMode.QUOTE.name().equals(task.pricingMode())) {
            if (selected.quotePrice() == null) {
                return new TaskAcceptResult(null, "QUOTE_PRICE_MISSING");
            }
            bookingPrice = selected.quotePrice();
        } else {
            bookingPrice = task.budget() != null ? task.budget() : 0;
        }
        BookingState booking = bookingCommandPort.createBooking(
                task.id(), selected.taskerId(), task.customerId(), bookingPrice, true, task.scheduledAt());
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
