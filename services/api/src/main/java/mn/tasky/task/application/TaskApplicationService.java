package mn.tasky.task.application;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.dto.BookingIntentCreateResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.booking.publicapi.BookingCommandPort;
import mn.tasky.booking.publicapi.BookingIntentCommandPort;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.PricingMode;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskState;
import mn.tasky.task.dto.TaskWithdrawResult;
import mn.tasky.trust.publicapi.TrustQueryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskApplicationService {
    private static final Logger log = LoggerFactory.getLogger(TaskApplicationService.class);
    private static final long SELECTION_WINDOW_HOURS = 4;
    private final IdentityQueryPort identityQueryPort;
    private final BookingCommandPort bookingCommandPort;
    private final BookingIntentCommandPort bookingIntentCommandPort;
    private final NotificationCommandPort notificationCommandPort;
    private final AnalyticsCommandPort analyticsCommandPort;
    private final DomainEventOutboxService domainEventOutboxService;
    private final TaskDao taskDao;
    private final TaskApplicationDao taskApplicationDao;
    private final TrustQueryPort trustQueryPort;

    public TaskApplicationService(
            IdentityQueryPort identityQueryPort,
            BookingCommandPort bookingCommandPort,
            BookingIntentCommandPort bookingIntentCommandPort,
            NotificationCommandPort notificationCommandPort,
            AnalyticsCommandPort analyticsCommandPort,
            DomainEventOutboxService domainEventOutboxService,
            TrustQueryPort trustQueryPort,
            TaskDao taskDao,
            TaskApplicationDao taskApplicationDao) {
        this.identityQueryPort = identityQueryPort;
        this.bookingCommandPort = bookingCommandPort;
        this.bookingIntentCommandPort = bookingIntentCommandPort;
        this.notificationCommandPort = notificationCommandPort;
        this.analyticsCommandPort = analyticsCommandPort;
        this.domainEventOutboxService = domainEventOutboxService;
        this.trustQueryPort = trustQueryPort;
        this.taskDao = taskDao;
        this.taskApplicationDao = taskApplicationDao;
    }

    public TaskApplyResult applyToTask(
            String taskerId, String taskerRole, String taskId, String message, Integer quotePrice) {
        if (trustQueryPort.isUserLocked(taskerId)) {
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
        Optional<UserProfile> profileOpt = identityQueryPort.getProfile(taskerId);
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
        if (!isQuoteMode && quotePrice != null) {
            return new TaskApplyResult(null, TaskApplyResult.BUDGET_PRICE_NOT_ALLOWED);
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
        notificationCommandPort.sendPush(
                task.customerId(), "New Applicant", "A tasker has applied to your task.", "TASKER_APPLIED");
        analyticsCommandPort.track(
                "APPLICATION_SUBMITTED", taskerId, Map.of("task_id", taskId, "application_id", application.id()));
        analyticsCommandPort.track(
                "QUALIFIED_APPLICATION",
                taskerId,
                Map.of(
                        "task_id",
                        taskId,
                        "tasker_id",
                        taskerId,
                        "category_id",
                        task.categoryId(),
                        "pricing_mode",
                        task.pricingMode()));
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
    public TaskAcceptResult confirmAcceptance(String taskerId, String taskId, String applicationId) {
        Optional<TaskApplicationState> selectedOpt = taskApplicationDao.findByTaskerAndId(taskerId, applicationId);
        if (selectedOpt.isEmpty()) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskApplicationState selected = selectedOpt.get();
        if (!taskId.equals(selected.taskId())) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        if (!"SELECTED".equals(selected.status())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
        Instant now = Instant.now();
        if (selected.respondByAt() != null && now.isAfter(selected.respondByAt())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
        Optional<BookingIntentState> intentOpt =
                bookingIntentCommandPort.findPendingApplicationSelectionIntent(taskId, applicationId, now);
        if (intentOpt.isEmpty()) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();
        if (taskApplicationDao.hasAccepted(selected.taskId())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }
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
        taskApplicationDao.updateStatus(selected.id(), "ACCEPTED");
        taskApplicationDao.rejectOthers(selected.taskId(), selected.id());
        taskDao.updateStatus(task.id(), "ASSIGNED", now);
        bookingIntentCommandPort.markIntentConfirmed(intentOpt.get().id(), booking.id(), now);
        domainEventOutboxService.publish(
                OutboxEventTypes.TASK_APPLICATION_ACCEPTED,
                "BOOKING",
                booking.id(),
                Map.of(
                        "task_id",
                        task.id(),
                        "booking_id",
                        booking.id(),
                        "customer_id",
                        task.customerId(),
                        "tasker_id",
                        selected.taskerId(),
                        "application_id",
                        applicationId));
        notificationCommandPort.sendPush(
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
                    notificationCommandPort.sendPush(
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
        if (!"APPLIED".equals(application.status())) {
            return TaskWithdrawResult.INVALID_STATUS_RESULT;
        }
        taskApplicationDao.updateStatus(application.id(), "WITHDRAWN");
        Optional<TaskState> taskOpt = taskDao.findById(application.taskId());
        taskOpt.ifPresent(task -> notificationCommandPort.sendPush(
                task.customerId(),
                "Applicant withdrew",
                "A tasker has withdrawn their application from your task.",
                "APPLICANT_WITHDREW"));
        analyticsCommandPort.track(
                "APPLICATION_WITHDRAWN",
                taskerId,
                Map.of("task_id", application.taskId(), "application_id", applicationId, "was_selected", false));
        TaskApplicationState updated =
                taskApplicationDao.findById(applicationId).orElse(application);
        return TaskWithdrawResult.success(updated);
    }

    @Transactional
    public BookingIntentCreateResult acceptApplication(
            String customerId, String taskId, String applicationId, boolean liabilityDisclaimerAccepted) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return BookingIntentCreateResult.error(BookingIntentCreateResult.NOT_FOUND, "Task not found.");
        }
        TaskState task = taskOpt.get();
        if (!task.customerId().equals(customerId)) {
            return BookingIntentCreateResult.error(
                    BookingIntentCreateResult.FORBIDDEN, "Only the task owner can select applicants.");
        }
        if (!"OPEN".equals(task.status())) {
            return BookingIntentCreateResult.error(BookingIntentCreateResult.TASK_NOT_OPEN, "Task is no longer open.");
        }
        if (!liabilityDisclaimerAccepted) {
            return BookingIntentCreateResult.error(
                    BookingIntentCreateResult.DISCLAIMER_REQUIRED, "Liability disclaimer must be accepted.");
        }
        if (taskApplicationDao.hasAccepted(taskId)) {
            return BookingIntentCreateResult.error(
                    BookingIntentCreateResult.CONFLICT, "Application already processed or task assigned.");
        }
        Instant now = Instant.now();
        taskApplicationDao.expireSelectedForTask(taskId, now);
        bookingIntentCommandPort.expirePendingApplicationSelectionForTask(taskId, now);
        if (taskApplicationDao.hasActiveSelection(taskId, now)) {
            return BookingIntentCreateResult.error(
                    BookingIntentCreateResult.CONFLICT, "A pending selection already exists for this task.");
        }
        Optional<TaskApplicationState> selectedOpt = taskApplicationDao.findById(applicationId);
        if (selectedOpt.isEmpty() || !taskId.equals(selectedOpt.get().taskId())) {
            return BookingIntentCreateResult.error(
                    BookingIntentCreateResult.NOT_FOUND, "Task or application not found.");
        }
        TaskApplicationState selected = selectedOpt.get();
        if (!"APPLIED".equals(selected.status())) {
            return BookingIntentCreateResult.error(
                    BookingIntentCreateResult.CONFLICT, "Application already processed or task assigned.");
        }
        Instant respondBy = now.plusSeconds(SELECTION_WINDOW_HOURS * 3600);
        BookingIntentCreateResult intentResult = bookingIntentCommandPort.createApplicationSelectionIntent(
                customerId, taskId, applicationId, selected.taskerId(), respondBy);
        if (!intentResult.isSuccess()) {
            return intentResult;
        }
        taskApplicationDao.updateSelection(selected.id(), "SELECTED", now, respondBy);
        notificationCommandPort.sendPush(
                selected.taskerId(),
                "You've been selected!",
                "A customer has selected you for their task. You have 4 hours to confirm.",
                "TASKER_SELECTED");
        analyticsCommandPort.track(
                "APPLICATION_SELECTED",
                customerId,
                Map.of(
                        "task_id",
                        taskId,
                        "application_id",
                        applicationId,
                        "tasker_id",
                        selected.taskerId(),
                        "category_id",
                        task.categoryId()));
        return intentResult;
    }
}
