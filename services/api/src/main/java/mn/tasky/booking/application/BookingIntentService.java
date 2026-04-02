package mn.tasky.booking.application;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dao.BookingIntentDao;
import mn.tasky.booking.dto.BookingIntentState;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BookingIntentService {

    public static final String SOURCE_REBOOK = "REBOOK";
    public static final String SOURCE_INSTANT_MATCH = "INSTANT_MATCH";

    private final BookingIntentDao bookingIntentDao;
    private final BookingService bookingService;
    private final TaskDao taskDao;

    public BookingIntentService(BookingIntentDao bookingIntentDao, BookingService bookingService, TaskDao taskDao) {
        this.bookingIntentDao = bookingIntentDao;
        this.bookingService = bookingService;
        this.taskDao = taskDao;
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

    public record ConfirmResult(BookingState booking, String errorCode, String errorMessage) {
        public static final String NOT_FOUND = "NOT_FOUND";
        public static final String FORBIDDEN = "FORBIDDEN";
        public static final String DISCLAIMER_REQUIRED = "DISCLAIMER_REQUIRED";
        public static final String TASK_NOT_OPEN = "TASK_NOT_OPEN";
        public static final String CONFLICT = "CONFLICT";
        public static final String DEFERRED = "DEFERRED";

        static ConfirmResult success(BookingState booking) {
            return new ConfirmResult(booking, null, null);
        }

        static ConfirmResult error(String errorCode, String errorMessage) {
            return new ConfirmResult(null, errorCode, errorMessage);
        }

        public boolean isSuccess() {
            return booking != null;
        }
    }

    @Transactional
    public CreateResult createIntent(
            String customerId, String taskId, String source, String taskerId, String originalBookingId, String offerId) {
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
                offerId,
                null,
                now,
                now);
        return bookingIntentDao.findById(intentId)
                .map(CreateResult::success)
                .orElseGet(() -> CreateResult.error(CreateResult.NOT_FOUND, "Booking intent was not persisted."));
    }

    public Optional<BookingIntentState> getIntent(String intentId) {
        return bookingIntentDao.findById(intentId);
    }

    @Transactional
    public ConfirmResult confirmIntent(String customerId, String intentId, boolean liabilityDisclaimerAccepted) {
        Optional<BookingIntentState> intentOpt = bookingIntentDao.findById(intentId);
        if (intentOpt.isEmpty()) {
            return ConfirmResult.error(ConfirmResult.NOT_FOUND, "Booking intent not found.");
        }

        BookingIntentState intent = intentOpt.get();
        if (!customerId.equals(intent.customerId())) {
            return ConfirmResult.error(ConfirmResult.FORBIDDEN, "Only booking intent owner can confirm.");
        }
        if (!liabilityDisclaimerAccepted) {
            return ConfirmResult.error(
                    ConfirmResult.DISCLAIMER_REQUIRED, "Liability disclaimer must be accepted to confirm booking.");
        }
        if (SOURCE_INSTANT_MATCH.equals(intent.source())) {
            return ConfirmResult.error(ConfirmResult.DEFERRED, "Instant match booking intents are not implemented.");
        }
        if ("CONFIRMED".equals(intent.status()) && intent.confirmedBookingId() != null) {
            Optional<BookingState> existingBooking = bookingService.getBooking(intent.confirmedBookingId());
            return existingBooking
                    .map(ConfirmResult::success)
                    .orElseGet(() -> ConfirmResult.error(ConfirmResult.CONFLICT, "Confirmed booking no longer exists."));
        }
        if (!"PENDING".equals(intent.status())) {
            return ConfirmResult.error(ConfirmResult.CONFLICT, "Booking intent cannot be confirmed from current status.");
        }

        Optional<TaskState> taskOpt = taskDao.findById(intent.taskId());
        if (taskOpt.isEmpty()) {
            return ConfirmResult.error(ConfirmResult.NOT_FOUND, "Task not found.");
        }
        TaskState task = taskOpt.get();
        if (!"OPEN".equals(task.status())) {
            return ConfirmResult.error(ConfirmResult.TASK_NOT_OPEN, "Task is not OPEN.");
        }

        BookingState booking = bookingService.createBooking(
                task.id(), intent.taskerId(), customerId, task.budget(), true, task.scheduledAt());
        taskDao.updateStatus(task.id(), "ASSIGNED", Instant.now());
        Instant now = Instant.now();
        bookingIntentDao.markConfirmed(intent.id(), booking.id(), now, now);
        return ConfirmResult.success(booking);
    }
}
