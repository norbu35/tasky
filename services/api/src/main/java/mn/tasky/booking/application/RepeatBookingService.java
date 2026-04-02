package mn.tasky.booking.application;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.TaskState;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Handles repeat bookings — creating a new task from a previously completed booking.
 * The new task uses the current active schema version for the category (not the original).
 * Intake answers are carried over as best-effort prefill.
 */
@Service
public class RepeatBookingService {

    private static final Logger log = LoggerFactory.getLogger(RepeatBookingService.class);

    private final BookingService bookingService;
    private final TaskDao taskDao;
    private final CategorySchemaVersionDao categorySchemaVersionDao;

    public RepeatBookingService(
            BookingService bookingService, TaskDao taskDao, CategorySchemaVersionDao categorySchemaVersionDao) {
        this.bookingService = bookingService;
        this.taskDao = taskDao;
        this.categorySchemaVersionDao = categorySchemaVersionDao;
    }

    /**
     * Result of a rebook attempt.
     */
    public record RebookResult(TaskState task, String errorCode, String errorMessage) {

        public static final String NOT_FOUND = "NOT_FOUND";
        public static final String NOT_COMPLETED = "NOT_COMPLETED";
        public static final String FORBIDDEN = "FORBIDDEN";
        public static final String TASK_NOT_FOUND = "TASK_NOT_FOUND";

        public static RebookResult success(TaskState task) {
            return new RebookResult(task, null, null);
        }

        public static RebookResult error(String code, String message) {
            return new RebookResult(null, code, message);
        }

        public boolean isSuccess() {
            return task != null;
        }
    }

    /**
     * Creates a new task from a completed booking. The new task copies category, description,
     * location, budget, and intake answers from the original task. The intake schema version
     * is set to the current active version for the category (not the original). Photos are
     * not carried over. scheduledAt is null so the user must set a new schedule.
     *
     * @param bookingId  The ID of the completed booking.
     * @param customerId The ID of the customer requesting the rebook.
     * @return The result containing the new task or an error.
     */
    public RebookResult rebook(String bookingId, String customerId) {
        Optional<BookingState> bookingOpt = bookingService.getBooking(bookingId);
        if (bookingOpt.isEmpty()) {
            return RebookResult.error(RebookResult.NOT_FOUND, "Booking not found.");
        }

        BookingState booking = bookingOpt.get();
        if (!"COMPLETED".equals(booking.status())) {
            return RebookResult.error(RebookResult.NOT_COMPLETED, "Only completed bookings can be rebooked.");
        }

        if (!booking.customerId().equals(customerId)) {
            return RebookResult.error(RebookResult.FORBIDDEN, "Only the customer can rebook this booking.");
        }

        Optional<TaskState> taskOpt = taskDao.findById(booking.taskId());
        if (taskOpt.isEmpty()) {
            log.error("Original task not found for rebook: bookingId={}, taskId={}", bookingId, booking.taskId());
            return RebookResult.error(RebookResult.TASK_NOT_FOUND, "Original task not found.");
        }

        TaskState originalTask = taskOpt.get();

        // Use the current active schema version, falling back to the original if none active
        Integer currentSchemaVersion = categorySchemaVersionDao
                .findActiveByCategoryId(originalTask.categoryId())
                .map(CategorySchemaVersion::version)
                .orElse(originalTask.intakeSchemaVersion());

        String newId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        taskDao.insert(
                newId,
                customerId,
                originalTask.categoryId(),
                originalTask.description(),
                originalTask.budget(),
                originalTask.locationLat(),
                originalTask.locationLng(),
                originalTask.locationText(),
                "OPEN",
                null, // scheduledAt — user must set new schedule
                originalTask.intakeAnswersJson(),
                currentSchemaVersion,
                null, // scopeSummarySource
                now,
                now);

        TaskState newTask = new TaskState(
                newId,
                customerId,
                originalTask.categoryId(),
                originalTask.description(),
                originalTask.budget(),
                originalTask.locationLat(),
                originalTask.locationLng(),
                originalTask.locationText(),
                "OPEN",
                null, // scheduledAt
                Collections.emptyList(),
                originalTask.intakeAnswersJson(),
                currentSchemaVersion,
                null, // scopeSummarySource
                now,
                now);

        log.info(
                "Rebook successful: bookingId={}, originalTaskId={}, newTaskId={}", bookingId, booking.taskId(), newId);
        return RebookResult.success(newTask);
    }
}
