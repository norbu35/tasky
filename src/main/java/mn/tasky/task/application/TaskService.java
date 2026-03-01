package mn.tasky.task.application;

import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.common.dto.PresignedUpload;
import mn.tasky.common.outbox.DomainEventOutboxService;
import mn.tasky.common.outbox.OutboxEventTypes;
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
import mn.tasky.task.dto.TaskUpdateResult;
import mn.tasky.task.dto.UpdateTask;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Service for task lifecycle operations: creation, listing, applications, acceptance,
 * cancellation, and task-photo upload/access URL generation.
 */
@Service
public class TaskService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Map<String, String> PHOTO_EXTENSION_BY_CONTENT_TYPE = Map.of(
        "image/jpeg",
        "jpg",
        "image/png",
        "png"
    );
    private static final Set<String> TASK_STATUSES = Set.of("OPEN",
        "ASSIGNED",
        "COMPLETED",
        "CANCELLED");

    private final AuthService authService;
    private final CategoryService categoryService;
    private final BookingService bookingService;
    private final MessagingService messagingService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final DomainEventOutboxService domainEventOutboxService;
    private final TaskDao taskDao;
    private final TaskPhotoDao taskPhotoDao;
    private final TaskApplicationDao taskApplicationDao;
    private final String taskPhotoUploadBaseUrl;
    private final long taskPhotoMaxBytes;
    private final long taskPhotoUploadUrlTtlSeconds;
    private final byte[] uploadUrlSigningSecretBytes;
    private final double taskMatchNotificationRadiusKm;
    private final int taskMatchNotificationLimit;

    @SuppressFBWarnings(
        value = "CT_CONSTRUCTOR_THROW",
        justification = "Upload signing secret is mandatory and validated during startup for fail-fast safety."
    )
    public TaskService(
        AuthService authService,
        CategoryService categoryService,
        BookingService bookingService,
        MessagingService messagingService,
        NotificationService notificationService,
        AnalyticsService analyticsService,
        DomainEventOutboxService domainEventOutboxService,
        TaskDao taskDao,
        TaskPhotoDao taskPhotoDao,
        TaskApplicationDao taskApplicationDao,
        @Value("${tasky.storage.task-photo-upload-base-url:https://upload.tasky.local}")
        String taskPhotoUploadBaseUrl,
        @Value("${tasky.storage.task-photo-max-bytes:5242880}") long taskPhotoMaxBytes,
        @Value("${tasky.storage.task-photo-upload-url-ttl-seconds:900}")
        long taskPhotoUploadUrlTtlSeconds,
        @Value("${tasky.storage.upload-signing-secret:${tasky.security.jwt-secret:}}")
        String uploadUrlSigningSecret,
        @Value("${tasky.notifications.task-match-radius-km:10}") double taskMatchNotificationRadiusKm,
        @Value("${tasky.notifications.task-match-limit:50}") int taskMatchNotificationLimit
    ) {
        this.authService = authService;
        this.categoryService = categoryService;
        this.bookingService = bookingService;
        this.messagingService = messagingService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        this.domainEventOutboxService = domainEventOutboxService;
        this.taskDao = taskDao;
        this.taskPhotoDao = taskPhotoDao;
        this.taskApplicationDao = taskApplicationDao;
        this.taskPhotoUploadBaseUrl = taskPhotoUploadBaseUrl;
        this.taskPhotoMaxBytes = taskPhotoMaxBytes;
        this.taskPhotoUploadUrlTtlSeconds = taskPhotoUploadUrlTtlSeconds;
        if (!StringUtils.hasText(uploadUrlSigningSecret)) {
            throw new IllegalStateException("tasky.storage.upload-signing-secret must be " +
                "configured.");
        }
        this.uploadUrlSigningSecretBytes =
            uploadUrlSigningSecret.getBytes(StandardCharsets.UTF_8);
        this.taskMatchNotificationRadiusKm = taskMatchNotificationRadiusKm;
        this.taskMatchNotificationLimit = taskMatchNotificationLimit;
    }

    /**
     * Creates a new task owned by the customer after validating category, schedule,
     * description, and photo constraints.
     * Emits analytics and notifies nearby taskers when successful.
     *
     * @param customerId Task owner identifier.
     * @param command    Task creation payload.
     * @return Success or validation failure details.
     */
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

    /**
     * Retrieves a task by id and populates photo keys when needed.
     *
     * @param id Task identifier.
     * @return The task if found.
     */
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

    /**
     * Sets task status to {@code ASSIGNED} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToAssigned(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId,
            "ASSIGNED",
            Instant.now());
        return taskDao.findById(taskId)
            .map(this::populatePhotoKeys);
    }

    /**
     * Sets task status back to {@code OPEN} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> reopenTask(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId,
            "OPEN",
            Instant.now());
        return taskDao.findById(taskId)
            .map(this::populatePhotoKeys);
    }

    /**
     * Sets task status to {@code COMPLETED} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToCompleted(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId,
            "COMPLETED",
            Instant.now());
        return taskDao.findById(taskId)
            .map(this::populatePhotoKeys);
    }

    /**
     * Sets task status to {@code CANCELLED} when task exists.
     *
     * @param taskId Task identifier.
     * @return Updated task when found.
     */
    public Optional<TaskState> transitionToCancelled(String taskId) {
        Optional<TaskState> existing = taskDao.findById(taskId);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        taskDao.updateStatus(taskId,
            "CANCELLED",
            Instant.now());
        return taskDao.findById(taskId)
            .map(this::populatePhotoKeys);
    }

    /**
     * Lists open tasks with cursor pagination and optional geo-radius filtering.
     *
     * @param categoryId Optional category filter.
     * @param lat        Optional latitude for radius query.
     * @param lng        Optional longitude for radius query.
     * @param radiusKm   Optional radius in kilometers.
     * @param cursor     Optional pagination cursor.
     * @param limit      Page size.
     * @return Paginated task page.
     * @throws IllegalArgumentException when cursor format is invalid.
     */
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
            ? encodeCursor(pageData.getLast())
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

    /**
     * Lists tasks for a user as customer or tasker with optional status filtering.
     * Defaults role to {@code customer} when absent.
     *
     * @param userId User identifier.
     * @param role   Optional role filter: {@code customer} or {@code tasker}.
     * @param status Optional status filter.
     * @param cursor Optional pagination cursor.
     * @param limit  Page size.
     * @return Paginated task page.
     * @throws IllegalArgumentException when role, status, or cursor is invalid.
     */
    public TaskPage listMyTasks(String userId,
                                String role,
                                String status,
                                String cursor,
                                int limit) {
        String normalizedRole = normalizeMyTasksRole(role);
        String normalizedStatus = normalizeTaskStatus(status);

        TaskCursor cursorState = decodeCursor(cursor);
        Instant cursorCreatedAt = cursorState != null
            ? cursorState.createdAt()
            : null;
        UUID cursorId = cursorState != null
            ? cursorState.id()
            : null;

        List<TaskState> tasks = "tasker".equals(normalizedRole)
            ? taskDao.findByTasker(userId,
            normalizedStatus,
            cursorCreatedAt,
            cursorId,
            limit + 1)
            : taskDao.findByCustomer(userId,
            normalizedStatus,
            cursorCreatedAt,
            cursorId,
            limit + 1);

        boolean hasMore = tasks.size() > limit;
        List<TaskState> pageData = hasMore
            ? tasks.subList(0,
            limit)
            : tasks;
        pageData = pageData.stream()
            .map(this::populatePhotoKeys)
            .toList();
        String nextCursor = hasMore
            ? encodeCursor(pageData.getLast())
            : null;

        return new TaskPage(List.copyOf(pageData),
            nextCursor,
            hasMore);
    }

    private String normalizeMyTasksRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "customer";
        }
        String normalized = role.trim()
            .toLowerCase(Locale.ROOT);
        if (!"customer".equals(normalized) && !"tasker".equals(normalized)) {
            throw new IllegalArgumentException("Role filter is invalid.");
        }
        return normalized;
    }

    private String normalizeTaskStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String normalized = status.trim()
            .toUpperCase(Locale.ROOT);
        if (!TASK_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Status filter is invalid.");
        }
        return normalized;
    }

    /**
     * Cancels an open task when requested by its owning customer.
     *
     * @param customerId Customer identifier.
     * @param taskId     Task identifier.
     * @return Result with success or reason for rejection.
     */
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
        if (!"VERIFIED".equals(profile.status())) {
            return TaskApplyResult.FORBIDDEN_RESULT;
        }

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

    /**
     * Lists task applications using default first-page pagination.
     *
     * @param userId Requesting user (must be task owner).
     * @param taskId Task identifier.
     * @return Applications list result.
     */
    public TaskApplicationsListResult listTaskApplications(String userId,
                                                           String taskId) {
        return listTaskApplications(userId,
            taskId,
            null,
            50);
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
    public TaskApplicationsListResult listTaskApplications(String userId,
                                                           String taskId,
                                                           String cursor,
                                                           int limit) {
        Optional<TaskState> taskOpt = taskDao.findById(taskId);
        if (taskOpt.isEmpty()) {
            return TaskApplicationsListResult.NOT_FOUND_RESULT;
        }
        TaskState task = taskOpt.get();

        if (!task.customerId()
            .equals(userId)) {
            return TaskApplicationsListResult.FORBIDDEN_RESULT;
        }

        List<TaskApplicationState> applications = taskApplicationDao.findByTaskId(taskId,
            cursor,
            limit);
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
                applicationId
            )
        );

        return TaskAcceptResult.success(booking);
    }

    /**
     * Creates a signed upload URL for a task photo.
     *
     * @param userId      Requesting user identifier.
     * @param contentType MIME type to upload.
     * @return Signed upload payload when MIME type is supported.
     */
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
        String normalizedBase = normalizeBaseUrl(baseUrl);
        long expiresAt = Instant.now()
            .plusSeconds(ttlSeconds)
            .getEpochSecond();
        String payload = storageKey + "|" + contentType + "|" + maxBytes + "|" + expiresAt;
        String signature = computeUploadSignature(payload);

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
            ttlSeconds +
            "&expires_at=" +
            expiresAt +
            "&signature=" +
            signature;
    }

    private String normalizeBaseUrl(String baseUrl) {
        return baseUrl.endsWith("/")
            ? baseUrl.substring(0,
            baseUrl.length() - 1)
            : baseUrl;
    }

    private String computeUploadSignature(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(uploadUrlSigningSecretBytes,
                HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                builder.append(String.format(Locale.ROOT,
                    "%02x",
                    b));
            }
            return builder.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to sign upload URL payload",
                exception);
        }
    }

    /**
     * Builds read URLs for a list of stored photo keys.
     *
     * @param storageKeys Photo storage keys.
     * @return Access URLs, or empty list when no keys are provided.
     */
    public List<String> buildPhotoAccessUrls(List<String> storageKeys) {
        if (storageKeys == null || storageKeys.isEmpty()) {
            return List.of();
        }
        return storageKeys.stream()
            .map(this::buildPhotoAccessUrl)
            .toList();
    }

    /**
     * Builds a read URL for one stored photo key.
     *
     * @param storageKey Photo storage key.
     * @return Presigned read URL.
     */
    public String buildPhotoAccessUrl(String storageKey) {
        String normalizedBase = normalizeBaseUrl(taskPhotoUploadBaseUrl);
        return normalizedBase +
            "/presigned-get?key=" +
            URLEncoder.encode(storageKey,
                StandardCharsets.UTF_8);
    }

    /**
     * Partially updates an open task owned by the requesting customer.
     * Supports replacing photo keys when provided.
     *
     * @param customerId Task owner identifier.
     * @param taskId     Task identifier.
     * @param command    Partial update payload.
     * @return Updated task or validation/authorization failure details.
     */
    public TaskUpdateResult updateTask(String customerId,
                                       String taskId,
                                       UpdateTask command) {
        Optional<TaskState> existingOpt = taskDao.findById(taskId)
            .map(this::populatePhotoKeys);
        if (existingOpt.isEmpty()) {
            return TaskUpdateResult.NOT_FOUND_RESULT;
        }

        TaskState existing = existingOpt.get();
        if (!existing.customerId()
            .equals(customerId)) {
            return TaskUpdateResult.FORBIDDEN_RESULT;
        }
        if (!"OPEN".equals(existing.status())) {
            return TaskUpdateResult.INVALID_STATUS_RESULT;
        }

        String description = existing.description();
        if (command.description() != null) {
            description = TextSanitizer.plainText(command.description());
            if (!StringUtils.hasText(description)) {
                return TaskUpdateResult.INVALID_DESCRIPTION_RESULT;
            }
        }

        String locationText = existing.locationText();
        if (command.locationText() != null) {
            locationText = TextSanitizer.plainText(command.locationText());
            if (!StringUtils.hasText(locationText)) {
                return TaskUpdateResult.INVALID_LOCATION_RESULT;
            }
        }

        int budget = command.budget() != null
            ? command.budget()
            : existing.budget();
        double locationLat = command.locationLat() != null
            ? command.locationLat()
            : existing.locationLat();
        double locationLng = command.locationLng() != null
            ? command.locationLng()
            : existing.locationLng();

        Instant scheduledAt = existing.scheduledAt();
        if (command.scheduledAt() != null) {
            try {
                scheduledAt = Instant.parse(command.scheduledAt());
            } catch (Exception exception) {
                return TaskUpdateResult.INVALID_SCHEDULE_RESULT;
            }
            if (scheduledAt.isBefore(Instant.now())) {
                return TaskUpdateResult.INVALID_SCHEDULE_RESULT;
            }
        }

        boolean replacePhotos = command.photoKeys() != null;
        List<String> photoKeys = replacePhotos
            ? List.copyOf(command.photoKeys())
            : (existing.photoKeys() == null
            ? List.of()
            : List.copyOf(existing.photoKeys()));
        if (photoKeys.size() > 3) {
            return TaskUpdateResult.TOO_MANY_PHOTOS_RESULT;
        }

        Instant now = Instant.now();
        taskDao.updateDetails(taskId,
            description,
            budget,
            locationLat,
            locationLng,
            locationText,
            scheduledAt,
            now);

        if (replacePhotos) {
            taskPhotoDao.deleteByTaskId(taskId);
            for (int i = 0; i < photoKeys.size(); i++) {
                taskPhotoDao.insert(UUID.randomUUID()
                        .toString(),
                    taskId,
                    photoKeys.get(i),
                    i);
            }
        }

        String finalDescription = description;
        String finalLocationText = locationText;
        Instant finalScheduledAt = scheduledAt;

        TaskState updated = taskDao.findById(taskId)
            .map(this::populatePhotoKeys)
            .orElseGet(() -> new TaskState(
                existing.id(),
                existing.customerId(),
                existing.categoryId(),
                finalDescription,
                budget,
                locationLat,
                locationLng,
                finalLocationText,
                existing.status(),
                finalScheduledAt,
                photoKeys,
                existing.createdAt(),
                now
            ));
        return TaskUpdateResult.success(updated);
    }

    private record TaskCursor(Instant createdAt,
                              UUID id) {

    }
}
