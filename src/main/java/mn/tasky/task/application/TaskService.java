package mn.tasky.task.application;

import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.validation.TextSanitizer;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskAcceptResult;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskApplicationsListResult;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCancelResult;
import mn.tasky.task.dto.TaskCreateResult;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class TaskService {

    private static final Map<String, String> PHOTO_EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg",
            "jpg",
            "image/png",
            "png"
    );

    private final AuthService authService;
    private final CategoryService categoryService;
    private final BookingService bookingService;
    private final MessagingService messagingService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final TaskDao taskDao;
    private final TaskPhotoDao taskPhotoDao;
    private final TaskApplicationDao taskApplicationDao;
    private final String taskPhotoUploadBaseUrl;
    private final long taskPhotoMaxBytes;
    private final long taskPhotoUploadUrlTtlSeconds;
    private final double taskMatchNotificationRadiusKm;
    private final int taskMatchNotificationLimit;

    public TaskService(
            AuthService authService,
            CategoryService categoryService,
            BookingService bookingService,
            MessagingService messagingService,
            NotificationService notificationService,
            AnalyticsService analyticsService,
            TaskDao taskDao,
            TaskPhotoDao taskPhotoDao,
            TaskApplicationDao taskApplicationDao,
            @Value("${tasky.storage.task-photo-upload-base-url:https://upload.tasky.local}") String taskPhotoUploadBaseUrl,
            @Value("${tasky.storage.task-photo-max-bytes:5242880}") long taskPhotoMaxBytes,
            @Value("${tasky.storage.task-photo-upload-url-ttl-seconds:900}") long taskPhotoUploadUrlTtlSeconds,
            @Value("${tasky.notifications.task-match-radius-km:10}") double taskMatchNotificationRadiusKm,
            @Value("${tasky.notifications.task-match-limit:50}") int taskMatchNotificationLimit
    ) {
        this.authService                   = authService;
        this.categoryService               = categoryService;
        this.bookingService                = bookingService;
        this.messagingService              = messagingService;
        this.notificationService           = notificationService;
        this.analyticsService              = analyticsService;
        this.taskDao                       = taskDao;
        this.taskPhotoDao                  = taskPhotoDao;
        this.taskApplicationDao            = taskApplicationDao;
        this.taskPhotoUploadBaseUrl        = taskPhotoUploadBaseUrl;
        this.taskPhotoMaxBytes             = taskPhotoMaxBytes;
        this.taskPhotoUploadUrlTtlSeconds  = taskPhotoUploadUrlTtlSeconds;
        this.taskMatchNotificationRadiusKm = taskMatchNotificationRadiusKm;
        this.taskMatchNotificationLimit    = taskMatchNotificationLimit;
    }

    public TaskCreateResult createTask(String customerId,
                                       CreateTask command) {
        Optional<CategoryState> category = categoryService.getCategory(command.categoryId());
        if (category.isEmpty() || !category.get()
                .isActive()) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_CATEGORY,
                                          "Category not found or inactive.");
        }

        if (command.photoKeys()
                .size() > 3) {
            return TaskCreateResult.error(TaskCreateResult.TOO_MANY_PHOTOS,
                                          "Maximum 3 photos allowed.");
        }

        String sanitizedDescription = TextSanitizer.plainText(command.description());
        String sanitizedLocationText = TextSanitizer.plainText(command.locationText());
        if (!StringUtils.hasText(sanitizedDescription)) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_DESCRIPTION,
                                          "Description cannot be empty.");
        }

        Instant scheduledAt;
        try {
            scheduledAt = Instant.parse(command.scheduledAt());
            if (scheduledAt.isBefore(Instant.now())) {
                return TaskCreateResult.error(TaskCreateResult.INVALID_SCHEDULE,
                                              "Schedule date must be in the future.");
            }
        } catch (Exception e) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_SCHEDULE,
                                          "Invalid schedule date format.");
        }

        String id = UUID.randomUUID()
                .toString();
        Instant now = Instant.now();

        taskDao.insert(id,
                       customerId,
                       command.categoryId(),
                       sanitizedDescription,
                       command.budget(),
                       command.locationLat(),
                       command.locationLng(),
                       sanitizedLocationText,
                       "OPEN",
                       scheduledAt,
                       now,
                       now);

        // Insert photo keys
        List<String> photoKeys = List.copyOf(command.photoKeys());
        for (int i = 0; i < photoKeys.size(); i++) {
            taskPhotoDao.insert(UUID.randomUUID()
                                        .toString(),
                                id,
                                photoKeys.get(i),
                                i);
        }

        TaskState task = new TaskState(id,
                                       customerId,
                                       command.categoryId(),
                                       sanitizedDescription,
                                       command.budget(),
                                       command.locationLat(),
                                       command.locationLng(),
                                       sanitizedLocationText,
                                       "OPEN",
                                       scheduledAt,
                                       photoKeys,
                                       now,
                                       now);

        analyticsService.track(
                AnalyticsService.EVENT_TASK_POSTED,
                customerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        id,
                        "category_id",
                        command.categoryId()
                )
        );

        notifyNearbyTaskers(task);
        return TaskCreateResult.success(task);
    }

    private void notifyNearbyTaskers(TaskState task) {
        double radiusMeters = taskMatchNotificationRadiusKm * 1000.0d;
        List<String> candidates = taskApplicationDao.findNearbyTaskerCandidates(
                task.categoryId(),
                task.locationLat(),
                task.locationLng(),
                radiusMeters,
                task.customerId(),
                taskMatchNotificationLimit
        );
        for (String taskerId : candidates) {
            notificationService.sendPush(
                    taskerId,
                    "New task nearby",
                    "A new task matching your recent work area is available.",
                    "MATCHING_TASK_NEARBY"
            );
        }
    }

    public Optional<TaskState> getTask(String id) {
        return taskDao.findById(id)
                .map(this::populatePhotoKeys);
    }

    private TaskState populatePhotoKeys(TaskState task) {
        if (task.photoKeys() != null && !task.photoKeys()
                .isEmpty()) {
            return task;
        }
        List<String> keys = taskPhotoDao.findKeysByTaskId(task.id());
        return new TaskState(
                task.id(),
                task.customerId(),
                task.categoryId(),
                task.description(),
                task.budget(),
                task.locationLat(),
                task.locationLng(),
                task.locationText(),
                task.status(),
                task.scheduledAt(),
                keys,
                task.createdAt(),
                task.updatedAt()
        );
    }

    public Optional<TaskState> transitionToAssigned(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) return Optional.empty();
        taskDao.updateStatus(taskId,
                             "ASSIGNED",
                             Instant.now());
        return taskDao.findById(taskId)
                .map(this::populatePhotoKeys);
    }

    public Optional<TaskState> reopenTask(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) return Optional.empty();
        taskDao.updateStatus(taskId,
                             "OPEN",
                             Instant.now());
        return taskDao.findById(taskId)
                .map(this::populatePhotoKeys);
    }

    public Optional<TaskState> transitionToCompleted(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) return Optional.empty();
        taskDao.updateStatus(taskId,
                             "COMPLETED",
                             Instant.now());
        return taskDao.findById(taskId)
                .map(this::populatePhotoKeys);
    }

    public TaskPage listTasks(
            String categoryId,
            Double lat,
            Double lng,
            Double radiusKm,
            String cursor,
            int limit
    ) {
        TaskCursor cursorState = decodeCursor(cursor);
        Instant cursorCreatedAt = cursorState != null
                ? cursorState.createdAt()
                : null;
        UUID cursorId = cursorState != null
                ? cursorState.id()
                : null;

        List<TaskState> tasks;
        if (lat != null && lng != null && radiusKm != null) {
            double meters = radiusKm * 1000;
            tasks = taskDao.findOpenWithinRadius(categoryId,
                                                 lat,
                                                 lng,
                                                 meters,
                                                 cursorCreatedAt,
                                                 cursorId,
                                                 limit + 1);
        } else {
            tasks = taskDao.findOpen(categoryId,
                                     cursorCreatedAt,
                                     cursorId,
                                     limit + 1);
        }

        boolean hasMore = tasks.size() > limit;
        List<TaskState> pageData = hasMore
                ? tasks.subList(0,
                                limit)
                : tasks;
        pageData = pageData.stream()
                .map(this::populatePhotoKeys)
                .toList();
        String nextCursor = hasMore
                ? encodeCursor(pageData.get(pageData.size() - 1))
                : null;

        return new TaskPage(List.copyOf(pageData),
                            nextCursor,
                            hasMore);
    }

    private TaskCursor decodeCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }
        try {
            String decoded = new String(
                    Base64.getUrlDecoder()
                            .decode(cursor),
                    StandardCharsets.UTF_8
            );
            String[] parts = decoded.split("\\|",
                                           2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Cursor payload is malformed.");
            }
            return new TaskCursor(Instant.parse(parts[0]),
                                  UUID.fromString(parts[1]));
        } catch (Exception e) {
            throw new IllegalArgumentException("Cursor is invalid.",
                                               e);
        }
    }

    private String encodeCursor(TaskState lastTask) {
        String payload = lastTask.createdAt() + "|" + lastTask.id();
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    public TaskCancelResult cancelTask(String customerId,
                                       String taskId) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskCancelResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId()
                .equals(customerId)) {
            return TaskCancelResult.FORBIDDEN_RESULT;
        }

        if (!"OPEN".equals(task.status())) {
            return TaskCancelResult.INVALID_STATUS_RESULT;
        }

        taskDao.updateStatus(taskId,
                             "CANCELLED",
                             Instant.now());
        TaskState cancelled = taskDao.findById(taskId)
                .map(this::populatePhotoKeys)
                .orElse(task);
        return TaskCancelResult.success(cancelled);
    }

    public TaskApplyResult applyToTask(String taskerId,
                                       String taskerRole,
                                       String taskId,
                                       String message) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskApplyResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!"TASKER".equals(taskerRole) || task.customerId()
                .equals(taskerId)) {
            return TaskApplyResult.FORBIDDEN_RESULT;
        }

        if (!"OPEN".equals(task.status()) || taskApplicationDao.hasAccepted(taskId)) {
            return TaskApplyResult.TASK_NOT_OPEN_RESULT;
        }

        Optional<UserProfile> profileOpt = authService.getProfile(taskerId);
        if (profileOpt.isEmpty()) {
            return TaskApplyResult.FORBIDDEN_RESULT;
        }
        UserProfile profile = profileOpt.get();

        if (taskApplicationDao.existsByTaskIdAndTaskerId(taskId,
                                                         taskerId)) {
            return TaskApplyResult.DUPLICATE_APPLICATION_RESULT;
        }

        String applicationId = UUID.randomUUID()
                .toString();
        String sanitizedMessage = TextSanitizer.plainText(message);
        taskApplicationDao.insert(applicationId,
                                  taskId,
                                  taskerId,
                                  sanitizedMessage,
                                  "PENDING",
                                  Instant.now());

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
                "PENDING",
                Instant.now()
        );

        String conversationId = messagingService.startConversation(taskId,
                                                                   taskerId,
                                                                   task.customerId());
        notificationService.sendPush(task.customerId(),
                                     "New Applicant",
                                     "A tasker has applied to your task.",
                                     "TASKER_APPLIED");
        analyticsService.track(
                AnalyticsService.EVENT_APPLICATION_SUBMITTED,
                taskerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        taskId,
                        "application_id",
                        application.id(),
                        "conversation_id",
                        conversationId
                )
        );

        return TaskApplyResult.success(application);
    }

    public TaskApplicationsListResult listTaskApplications(String userId,
                                                           String taskId) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskApplicationsListResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId()
                .equals(userId)) {
            return TaskApplicationsListResult.FORBIDDEN_RESULT;
        }

        List<TaskApplicationState> applications = taskApplicationDao.findByTaskId(taskId);
        return TaskApplicationsListResult.success(List.copyOf(applications));
    }

    public TaskAcceptResult acceptApplication(
            String customerId,
            String taskId,
            String applicationId,
            boolean liabilityDisclaimerAccepted
    ) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId()
                .equals(customerId)) {
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
        if (selectedOpt.isEmpty() || !taskId.equals(selectedOpt.get()
                                                            .taskId())) {
            return TaskAcceptResult.NOT_FOUND_RESULT;
        }
        TaskApplicationState selected = selectedOpt.get();
        if (!"PENDING".equals(selected.status())) {
            return TaskAcceptResult.CONFLICT_RESULT;
        }

        taskApplicationDao.updateStatus(selected.id(),
                                        "ACCEPTED");
        taskApplicationDao.rejectOthers(taskId,
                                        selected.id());

        BookingState booking = bookingService.createBooking(
                task.id(),
                selected.taskerId(),
                task.customerId(),
                task.budget(),
                true
        );
        taskDao.updateStatus(task.id(),
                             "ASSIGNED",
                             Instant.now());

        String conversationId = messagingService.startConversation(task.id(),
                                                                   selected.taskerId(),
                                                                   task.customerId());
        notificationService.sendPush(selected.taskerId(),
                                     "You are hired!",
                                     "Your application has been accepted.",
                                     "HIRED");
        analyticsService.track(
                AnalyticsService.EVENT_TASKER_ACCEPTED,
                customerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        task.id(),
                        AnalyticsService.PROPERTY_BOOKING_ID,
                        booking.id(),
                        "tasker_id",
                        selected.taskerId(),
                        "application_id",
                        applicationId,
                        "conversation_id",
                        conversationId
                )
        );
        analyticsService.track(
                AnalyticsService.EVENT_BOOKING_CONFIRMED,
                customerId,
                Map.of(
                        AnalyticsService.PROPERTY_TASK_ID,
                        task.id(),
                        AnalyticsService.PROPERTY_BOOKING_ID,
                        booking.id(),
                        "tasker_id",
                        selected.taskerId(),
                        "application_id",
                        applicationId
                )
        );

        return TaskAcceptResult.success(booking);
    }

    public Optional<PresignedUpload> createPhotoUploadUrl(String userId,
                                                          String contentType) {
        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = PHOTO_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = "uploads/tasks/" +
                userId +
                "/" +
                UUID.randomUUID() +
                "." +
                extension;

        String uploadUrl = buildPresignedUploadUrl(
                taskPhotoUploadBaseUrl,
                storageKey,
                normalizedContentType,
                taskPhotoMaxBytes,
                taskPhotoUploadUrlTtlSeconds
        );

        return Optional.of(new PresignedUpload(uploadUrl,
                                               storageKey));
    }

    private String buildPresignedUploadUrl(
            String baseUrl,
            String storageKey,
            String contentType,
            long maxBytes,
            long ttlSeconds
    ) {
        String normalizedBase = baseUrl.endsWith("/")
                ? baseUrl.substring(0,
                                    baseUrl.length() - 1)
                : baseUrl;

        return normalizedBase +
                "/presigned-upload?key=" +
                URLEncoder.encode(storageKey,
                                  StandardCharsets.UTF_8) +
                "&content_type=" +
                URLEncoder.encode(contentType,
                                  StandardCharsets.UTF_8) +
                "&max_bytes=" +
                maxBytes +
                "&expires_in=" +
                ttlSeconds;
    }

    private record TaskCursor(Instant createdAt,
                              UUID id) {
    }
}
