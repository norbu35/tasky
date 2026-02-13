package mn.tasky.task;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import mn.tasky.category.CategoryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class TaskService {

    private static final Map<String, String> PHOTO_EXTENSION_BY_CONTENT_TYPE = Map.of(
        "image/jpeg", "jpg",
        "image/png", "png"
    );

    private final CategoryService categoryService;
    private final String taskPhotoUploadBaseUrl;
    private final long taskPhotoMaxBytes;
    private final long taskPhotoUploadUrlTtlSeconds;

    private final ConcurrentHashMap<String, TaskState> tasksById = new ConcurrentHashMap<>();

    public TaskService(
        CategoryService categoryService,
        @Value("${tasky.storage.task-photo-upload-base-url:https://upload.tasky.local}") String taskPhotoUploadBaseUrl,
        @Value("${tasky.storage.task-photo-max-bytes:5242880}") long taskPhotoMaxBytes,
        @Value("${tasky.storage.task-photo-upload-url-ttl-seconds:900}") long taskPhotoUploadUrlTtlSeconds
    ) {
        this.categoryService = categoryService;
        this.taskPhotoUploadBaseUrl = taskPhotoUploadBaseUrl;
        this.taskPhotoMaxBytes = taskPhotoMaxBytes;
        this.taskPhotoUploadUrlTtlSeconds = taskPhotoUploadUrlTtlSeconds;
    }

    public TaskCreateResult createTask(String customerId, CreateTask command) {
        Optional<CategoryService.CategoryState> category = categoryService.getCategory(command.categoryId());
        if (category.isEmpty() || !category.get().isActive()) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_CATEGORY, "Category not found or inactive.");
        }

        if (command.photoKeys().size() > 3) {
            return TaskCreateResult.error(TaskCreateResult.TOO_MANY_PHOTOS, "Maximum 3 photos allowed.");
        }

        Instant scheduledAt;
        try {
            scheduledAt = Instant.parse(command.scheduledAt());
            if (scheduledAt.isBefore(Instant.now())) {
                return TaskCreateResult.error(TaskCreateResult.INVALID_SCHEDULE, "Schedule date must be in the future.");
            }
        } catch (Exception e) {
            return TaskCreateResult.error(TaskCreateResult.INVALID_SCHEDULE, "Invalid schedule date format.");
        }

        String id = UUID.randomUUID().toString();
        TaskState task = new TaskState(
            id,
            customerId,
            command.categoryId(),
            command.description(),
            command.budget(),
            command.locationLat(),
            command.locationLng(),
            command.locationText(),
            "OPEN",
            scheduledAt,
            List.copyOf(command.photoKeys()),
            Instant.now(),
            Instant.now()
        );

        tasksById.put(id, task);
        return TaskCreateResult.success(task);
    }

    public Optional<TaskState> getTask(String id) {
        return Optional.ofNullable(tasksById.get(id));
    }

    public TaskPage listTasks(
        String categoryId,
        Double lat,
        Double lng,
        Double radiusKm,
        String cursor,
        int limit
    ) {
        List<TaskState> filtered = tasksById.values().stream()
            .filter(task -> "OPEN".equals(task.status()))
            .filter(task -> categoryId == null || task.categoryId().equals(categoryId))
            .filter(task -> isWithinDistance(task, lat, lng, radiusKm))
            .sorted(Comparator.comparing(TaskState::createdAt).reversed()
                .thenComparing(TaskState::id))
            .toList();

        int offset = decodeOffset(cursor);
        if (offset > filtered.size()) {
            return new TaskPage(List.of(), null, false);
        }

        int endIndex = Math.min(offset + limit, filtered.size());
        List<TaskState> pageData = filtered.subList(offset, endIndex);
        boolean hasMore = endIndex < filtered.size();
        String nextCursor = hasMore ? encodeOffset(endIndex) : null;

        return new TaskPage(List.copyOf(pageData), nextCursor, hasMore);
    }

    private boolean isWithinDistance(TaskState task, Double lat, Double lng, Double radiusKm) {
        if (lat == null || lng == null || radiusKm == null) {
            return true;
        }

        double distance = calculateDistance(lat, lng, task.locationLat(), task.locationLng());
        return distance <= radiusKm;
    }

    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double earthRadius = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    private int decodeOffset(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return 0;
        }
        try {
            String decoded = new String(
                java.util.Base64.getUrlDecoder().decode(cursor),
                StandardCharsets.UTF_8
            );
            return Integer.parseInt(decoded);
        } catch (Exception e) {
            return 0;
        }
    }

    private String encodeOffset(int offset) {
        return java.util.Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(Integer.toString(offset).getBytes(StandardCharsets.UTF_8));
    }

    public TaskCancelResult cancelTask(String customerId, String taskId) {
        TaskState task = tasksById.get(taskId);
        if (task == null) {
            return TaskCancelResult.NOT_FOUND_RESULT;
        }

        if (!task.customerId().equals(customerId)) {
            return TaskCancelResult.FORBIDDEN_RESULT;
        }

        if (!"OPEN".equals(task.status())) {
            return TaskCancelResult.INVALID_STATUS_RESULT;
        }

        TaskState cancelled = new TaskState(
            task.id(),
            task.customerId(),
            task.categoryId(),
            task.description(),
            task.budget(),
            task.locationLat(),
            task.locationLng(),
            task.locationText(),
            "CANCELLED",
            task.scheduledAt(),
            task.photoKeys(),
            task.createdAt(),
            Instant.now()
        );

        tasksById.put(taskId, cancelled);
        return TaskCancelResult.success(cancelled);
    }

    public Optional<PresignedUpload> createPhotoUploadUrl(String contentType) {
        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        String extension = PHOTO_EXTENSION_BY_CONTENT_TYPE.get(normalizedContentType);
        if (!StringUtils.hasText(extension)) {
            return Optional.empty();
        }

        String storageKey = "uploads/tasks/" +
            UUID.randomUUID() +
            "." +
            extension;

        String uploadUrl = buildPresignedUploadUrl(
            taskPhotoUploadBaseUrl, storageKey, normalizedContentType,
            taskPhotoMaxBytes, taskPhotoUploadUrlTtlSeconds
        );

        return Optional.of(new PresignedUpload(uploadUrl, storageKey));
    }

    private String buildPresignedUploadUrl(
        String baseUrl, String storageKey, String contentType,
        long maxBytes, long ttlSeconds
    ) {
        String normalizedBase = baseUrl.endsWith("/")
            ? baseUrl.substring(0, baseUrl.length() - 1)
            : baseUrl;

        return normalizedBase +
            "/presigned-upload?key=" +
            URLEncoder.encode(storageKey, StandardCharsets.UTF_8) +
            "&content_type=" +
            URLEncoder.encode(contentType, StandardCharsets.UTF_8) +
            "&max_bytes=" +
            maxBytes +
            "&expires_in=" +
            ttlSeconds;
    }

    public record CreateTask(
        String categoryId,
        String description,
        int budget,
        double locationLat,
        double locationLng,
        String locationText,
        String scheduledAt,
        List<String> photoKeys
    ) {
    }

    public record TaskState(
        String id,
        String customerId,
        String categoryId,
        String description,
        int budget,
        double locationLat,
        double locationLng,
        String locationText,
        String status,
        Instant scheduledAt,
        List<String> photoKeys,
        Instant createdAt,
        Instant updatedAt
    ) {
    }

    public record TaskCreateResult(TaskState task, String errorCode, String errorMessage) {
        public static final String INVALID_CATEGORY = "INVALID_CATEGORY";
        public static final String TOO_MANY_PHOTOS = "TOO_MANY_PHOTOS";
        public static final String INVALID_SCHEDULE = "INVALID_SCHEDULE";

        public static TaskCreateResult success(TaskState task) {
            return new TaskCreateResult(task, null, null);
        }

        public static TaskCreateResult error(String code, String message) {
            return new TaskCreateResult(null, code, message);
        }

        public boolean isSuccess() {
            return task != null;
        }
    }

    public record TaskCancelResult(TaskState task, String errorCode) {
        public static final String NOT_FOUND = "NOT_FOUND";
        public static final String FORBIDDEN = "FORBIDDEN";
        public static final String INVALID_STATUS = "INVALID_STATUS";

        public static TaskCancelResult success(TaskState task) {
            return new TaskCancelResult(task, null);
        }

        public static final TaskCancelResult NOT_FOUND_RESULT = new TaskCancelResult(null, NOT_FOUND);
        public static final TaskCancelResult FORBIDDEN_RESULT = new TaskCancelResult(null, FORBIDDEN);
        public static final TaskCancelResult INVALID_STATUS_RESULT = new TaskCancelResult(null, INVALID_STATUS);

        public boolean isSuccess() {
            return task != null;
        }
    }

    public record PresignedUpload(String uploadUrl, String storageKey) {
    }

    public record TaskPage(List<TaskState> data, String nextCursor, boolean hasMore) {
    }
}
