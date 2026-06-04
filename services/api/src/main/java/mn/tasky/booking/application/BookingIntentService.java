package mn.tasky.booking.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.booking.dao.BookingIntentDao;
import mn.tasky.booking.dto.BookingIntentConfirmResult;
import mn.tasky.booking.dto.BookingIntentDeclineResult;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.PricingMode;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BookingIntentService {

    public static final String SOURCE_REBOOK = "REBOOK";
    public static final String SOURCE_INSTANT_MATCH = "INSTANT_MATCH";
    public static final String SOURCE_APPLICATION_SELECTION = "APPLICATION_SELECTION";

    private final BookingIntentDao bookingIntentDao;
    private final BookingService bookingService;
    private final TaskDao taskDao;
    private final TaskApplicationDao taskApplicationDao;
    private final NotificationService notificationService;
    private final DomainEventOutboxService domainEventOutboxService;

    public BookingIntentService(
            BookingIntentDao bookingIntentDao,
            BookingService bookingService,
            TaskDao taskDao,
            TaskApplicationDao taskApplicationDao,
            NotificationService notificationService,
            DomainEventOutboxService domainEventOutboxService) {
        this.bookingIntentDao = bookingIntentDao;
        this.bookingService = bookingService;
        this.taskDao = taskDao;
        this.taskApplicationDao = taskApplicationDao;
        this.notificationService = notificationService;
        this.domainEventOutboxService = domainEventOutboxService;
    }

    public record CreateResult(BookingIntentState intent, String errorCode, String errorMessage) {
        public static final String NOT_FOUND = "NOT_FOUND";
        public static final String FORBIDDEN = "FORBIDDEN";
        public static final String INVALID_SOURCE = "INVALID_SOURCE";
        public static final String NOT_COMPLETED = "NOT_COMPLETED";
        public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
        public static final String INVALID_REQUEST = "INVALID_REQUEST";
        public static final String DEFERRED = "DEFERRED";
        public static final String CONFLICT = "CONFLICT";

        static CreateResult success(BookingIntentState intent) {
            return new CreateResult(intent, null, null);
        }

        static CreateResult error(String errorCode, String errorMessage) {
            return new CreateResult(null, errorCode, errorMessage);
        }

        public boolean isSuccess() {
            return intent != null;
        }
    }

    @Transactional
    public CreateResult createApplicationSelectionIntent(
            String customerId, String taskId, String applicationId, String taskerId, Instant expiresAt) {
        if (!StringUtils.hasText(applicationId) || !StringUtils.hasText(taskerId)) {
            return CreateResult.error(CreateResult.INVALID_REQUEST, "Missing booking intent request fields.");
        }

        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return CreateResult.error(CreateResult.NOT_FOUND, "Task not found.");
        }
        TaskState task = taskOpt.get();
        if (!customerId.equals(task.customerId())) {
            return CreateResult.error(CreateResult.FORBIDDEN, "Only the task owner can create booking intents.");
        }
        if (!"OPEN".equals(task.status())) {
            return CreateResult.error(CreateResult.TASK_NOT_OPEN, "Task is not OPEN.");
        }

        Instant now = Instant.now();
        bookingIntentDao.expirePendingApplicationSelectionForTask(taskId, now);
        if (bookingIntentDao
                .findPendingApplicationSelectionByTaskId(taskId, now)
                .isPresent()) {
            return CreateResult.error(
                    CreateResult.CONFLICT, "A pending application selection already exists for this task.");
        }

        String intentId = UUID.randomUUID().toString();
        bookingIntentDao.insert(
                intentId,
                taskId,
                taskerId,
                customerId,
                SOURCE_APPLICATION_SELECTION,
                "PENDING",
                applicationId,
                null,
                null,
                expiresAt,
                now,
                now);
        return bookingIntentDao
                .findById(intentId)
                .map(CreateResult::success)
                .orElseGet(() -> CreateResult.error(CreateResult.NOT_FOUND, "Booking intent was not persisted."));
    }

    @Transactional
    public CreateResult createIntent(
            String customerId, String taskId, String source, String taskerId, String originalBookingId) {
        if (!StringUtils.hasText(source) || !StringUtils.hasText(taskerId)) {
            return CreateResult.error(CreateResult.INVALID_REQUEST, "Missing booking intent request fields.");
        }

        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return CreateResult.error(CreateResult.NOT_FOUND, "Task not found.");
        }
        TaskState task = taskOpt.get();
        if (!customerId.equals(task.customerId())) {
            return CreateResult.error(CreateResult.FORBIDDEN, "Only the task owner can create booking intents.");
        }
        if (!"OPEN".equals(task.status())) {
            return CreateResult.error(CreateResult.TASK_NOT_OPEN, "Task is not OPEN.");
        }

        if (SOURCE_INSTANT_MATCH.equals(source)) {
            return CreateResult.error(CreateResult.DEFERRED, "Instant match booking intents are not implemented.");
        }
        if (!SOURCE_REBOOK.equals(source)) {
            return CreateResult.error(CreateResult.INVALID_SOURCE, "Unsupported booking intent source.");
        }
        if (!StringUtils.hasText(originalBookingId)) {
            return CreateResult.error(CreateResult.INVALID_REQUEST, "original_booking_id is required for REBOOK.");
        }
        Optional<BookingState> originalBookingOpt = bookingService.getBooking(originalBookingId);
        if (originalBookingOpt.isEmpty()) {
            return CreateResult.error(CreateResult.NOT_FOUND, "Original booking not found.");
        }
        BookingState originalBooking = originalBookingOpt.get();
        if (!customerId.equals(originalBooking.customerId())) {
            return CreateResult.error(CreateResult.FORBIDDEN, "Only booking owner can create rebook intent.");
        }
        if (!"COMPLETED".equals(originalBooking.status())) {
            return CreateResult.error(CreateResult.NOT_COMPLETED, "Only completed bookings can create rebook intents.");
        }
        if (!taskerId.equals(originalBooking.taskerId())) {
            return CreateResult.error(CreateResult.CONFLICT, "Tasker does not match original booking.");
        }

        String intentId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        bookingIntentDao.insert(
                intentId,
                taskId,
                taskerId,
                customerId,
                SOURCE_REBOOK,
                "PENDING",
                originalBookingId,
                null,
                null,
                now,
                now);
        return bookingIntentDao
                .findById(intentId)
                .map(CreateResult::success)
                .orElseGet(() -> CreateResult.error(CreateResult.NOT_FOUND, "Booking intent was not persisted."));
    }

    public Optional<BookingIntentState> getIntent(String intentId) {
        return bookingIntentDao.findById(intentId);
    }

    @Transactional
    public BookingIntentConfirmResult confirmIntent(String taskerId, String intentId) {
        Optional<BookingIntentState> intentOpt = bookingIntentDao.findById(intentId);
        if (intentOpt.isEmpty()) {
            return BookingIntentConfirmResult.error(BookingIntentConfirmResult.NOT_FOUND, "Booking intent not found.");
        }

        BookingIntentState intent = intentOpt.get();
        if (!taskerId.equals(intent.taskerId())) {
            return BookingIntentConfirmResult.error(
                    BookingIntentConfirmResult.FORBIDDEN, "Only the selected tasker can confirm this booking intent.");
        }
        if (SOURCE_INSTANT_MATCH.equals(intent.source())) {
            return BookingIntentConfirmResult.error(
                    BookingIntentConfirmResult.DEFERRED, "Instant match booking intents are not implemented.");
        }
        if ("CONFIRMED".equals(intent.status()) && intent.confirmedBookingId() != null) {
            Optional<BookingState> existingBooking = bookingService.getBooking(intent.confirmedBookingId());
            return existingBooking
                    .map(BookingIntentConfirmResult::success)
                    .orElseGet(() -> BookingIntentConfirmResult.error(
                            BookingIntentConfirmResult.CONFLICT, "Confirmed booking no longer exists."));
        }
        if (!"PENDING".equals(intent.status())) {
            return BookingIntentConfirmResult.error(
                    BookingIntentConfirmResult.CONFLICT, "Booking intent cannot be confirmed from current status.");
        }

        Optional<TaskState> taskOpt = taskDao.findById(intent.taskId());
        if (taskOpt.isEmpty()) {
            return BookingIntentConfirmResult.error(BookingIntentConfirmResult.NOT_FOUND, "Task not found.");
        }
        TaskState task = taskOpt.get();
        if (!"OPEN".equals(task.status())) {
            return BookingIntentConfirmResult.error(BookingIntentConfirmResult.TASK_NOT_OPEN, "Task is not OPEN.");
        }
        Instant now = Instant.now();
        if (intent.expiresAt() != null && now.isAfter(intent.expiresAt())) {
            bookingIntentDao.markExpired(intent.id(), now);
            return BookingIntentConfirmResult.error(
                    BookingIntentConfirmResult.CONFLICT, "Booking intent acceptance window has expired.");
        }

        TaskApplicationState selectedApplication = null;
        int bookingPrice = task.budget() != null ? task.budget() : 0;
        if (SOURCE_APPLICATION_SELECTION.equals(intent.source())) {
            if (!StringUtils.hasText(intent.selectedApplicationId())) {
                return BookingIntentConfirmResult.error(
                        BookingIntentConfirmResult.CONFLICT, "Booking intent is missing selected application.");
            }
            Optional<TaskApplicationState> applicationOpt =
                    taskApplicationDao.findByTaskerAndId(taskerId, intent.selectedApplicationId());
            if (applicationOpt.isEmpty()
                    || !task.id().equals(applicationOpt.get().taskId())) {
                return BookingIntentConfirmResult.error(
                        BookingIntentConfirmResult.NOT_FOUND, "Selected application not found.");
            }
            selectedApplication = applicationOpt.get();
            if (!"SELECTED".equals(selectedApplication.status())) {
                return BookingIntentConfirmResult.error(
                        BookingIntentConfirmResult.CONFLICT, "Selected application cannot be confirmed.");
            }
            if (selectedApplication.respondByAt() != null && now.isAfter(selectedApplication.respondByAt())) {
                taskApplicationDao.updateStatus(selectedApplication.id(), "EXPIRED");
                bookingIntentDao.markExpired(intent.id(), now);
                return BookingIntentConfirmResult.error(
                        BookingIntentConfirmResult.CONFLICT, "Booking intent acceptance window has expired.");
            }
            boolean quoteMode = PricingMode.QUOTE.name().equals(task.pricingMode());
            if (quoteMode && selectedApplication.quotePrice() == null) {
                return BookingIntentConfirmResult.error(
                        BookingIntentConfirmResult.CONFLICT, "Selected application is missing quote price.");
            }
            if (quoteMode) {
                bookingPrice = selectedApplication.quotePrice();
            }
        }

        BookingState booking = bookingService.createBooking(
                task.id(), intent.taskerId(), intent.customerId(), bookingPrice, true, task.scheduledAt());
        if (selectedApplication != null) {
            taskApplicationDao.updateStatus(selectedApplication.id(), "ACCEPTED");
            taskApplicationDao.rejectOthers(task.id(), selectedApplication.id());
        }
        taskDao.updateStatus(task.id(), "ASSIGNED", now);
        bookingIntentDao.markConfirmed(intent.id(), booking.id(), now, now);
        if (selectedApplication != null) {
            domainEventOutboxService.publish(
                    OutboxEventTypes.TASK_APPLICATION_ACCEPTED,
                    "BOOKING",
                    booking.id(),
                    java.util.Map.of(
                            AnalyticsService.PROPERTY_TASK_ID,
                            task.id(),
                            AnalyticsService.PROPERTY_BOOKING_ID,
                            booking.id(),
                            "customer_id",
                            intent.customerId(),
                            "tasker_id",
                            intent.taskerId(),
                            "application_id",
                            selectedApplication.id()));
        }
        notificationService.sendPush(
                intent.customerId(),
                "Booking confirmed",
                "The selected tasker accepted your booking request.",
                "BOOKING_CONFIRMED");
        notificationService.sendPush(
                intent.taskerId(),
                "Booking confirmed",
                "Your booking is confirmed. Review the locked price and scope before the job.",
                "BOOKING_CONFIRMED");
        return BookingIntentConfirmResult.success(booking);
    }

    @Transactional
    public BookingIntentDeclineResult declineIntent(String taskerId, String intentId) {
        Optional<BookingIntentState> intentOpt = bookingIntentDao.findById(intentId);
        if (intentOpt.isEmpty()) {
            return BookingIntentDeclineResult.error(BookingIntentDeclineResult.NOT_FOUND, "Booking intent not found.");
        }

        BookingIntentState intent = intentOpt.get();
        if (!taskerId.equals(intent.taskerId())) {
            return BookingIntentDeclineResult.error(
                    BookingIntentDeclineResult.FORBIDDEN, "Only the selected tasker can decline this booking intent.");
        }
        if (SOURCE_INSTANT_MATCH.equals(intent.source())) {
            return BookingIntentDeclineResult.error(
                    BookingIntentDeclineResult.DEFERRED, "Instant match booking intents are not implemented.");
        }
        if ("DECLINED".equals(intent.status())) {
            return BookingIntentDeclineResult.success(intent);
        }
        if (!"PENDING".equals(intent.status())) {
            return BookingIntentDeclineResult.error(
                    BookingIntentDeclineResult.CONFLICT, "Booking intent cannot be declined from current status.");
        }
        Instant now = Instant.now();
        if (intent.expiresAt() != null && now.isAfter(intent.expiresAt())) {
            bookingIntentDao.markExpired(intent.id(), now);
            return BookingIntentDeclineResult.error(
                    BookingIntentDeclineResult.CONFLICT, "Booking intent acceptance window has expired.");
        }

        if (SOURCE_APPLICATION_SELECTION.equals(intent.source())) {
            if (!StringUtils.hasText(intent.selectedApplicationId())) {
                return BookingIntentDeclineResult.error(
                        BookingIntentDeclineResult.CONFLICT, "Booking intent is missing selected application.");
            }
            Optional<TaskApplicationState> applicationOpt =
                    taskApplicationDao.findByTaskerAndId(taskerId, intent.selectedApplicationId());
            if (applicationOpt.isEmpty()
                    || !intent.taskId().equals(applicationOpt.get().taskId())) {
                return BookingIntentDeclineResult.error(
                        BookingIntentDeclineResult.NOT_FOUND, "Selected application not found.");
            }
            TaskApplicationState selectedApplication = applicationOpt.get();
            if (!"SELECTED".equals(selectedApplication.status())) {
                return BookingIntentDeclineResult.error(
                        BookingIntentDeclineResult.CONFLICT, "Selected application cannot be declined.");
            }
            taskApplicationDao.updateStatus(selectedApplication.id(), "DECLINED");
            taskDao.updateStatus(intent.taskId(), "OPEN", now);
        }

        bookingIntentDao.markDeclined(intent.id(), now);
        notificationService.sendPush(
                intent.customerId(),
                "Tasker declined",
                "The selected tasker declined your booking request. You can choose another applicant.",
                "BOOKING_INTENT_DECLINED");
        return bookingIntentDao
                .findById(intent.id())
                .map(BookingIntentDeclineResult::success)
                .orElseGet(() -> BookingIntentDeclineResult.error(
                        BookingIntentDeclineResult.NOT_FOUND, "Booking intent not found."));
    }

    public Optional<BookingIntentState> findPendingApplicationSelectionIntent(
            String taskId, String applicationId, Instant now) {
        return bookingIntentDao.findPendingApplicationSelectionByApplicationId(taskId, applicationId, now);
    }

    public int expirePendingApplicationSelectionForTask(String taskId, Instant now) {
        return bookingIntentDao.expirePendingApplicationSelectionForTask(taskId, now);
    }

    public void markIntentConfirmed(String intentId, String bookingId, Instant confirmedAt) {
        bookingIntentDao.markConfirmed(intentId, bookingId, confirmedAt, confirmedAt);
    }

    public void markIntentDeclined(String intentId, Instant declinedAt) {
        bookingIntentDao.markDeclined(intentId, declinedAt);
    }
}
