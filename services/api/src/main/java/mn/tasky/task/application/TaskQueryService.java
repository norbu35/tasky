package mn.tasky.task.application;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskPage;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Service for task marketplace queries: listing tasks, owned tasks, and recent locations.
 */
@Service
public class TaskQueryService {

    private static final Set<String> TASK_STATUSES = Set.of("OPEN", "ASSIGNED", "COMPLETED", "CANCELLED");

    private final TaskDao taskDao;
    private final TaskPhotoKeyHelper taskPhotoKeyHelper;

    public TaskQueryService(TaskDao taskDao, TaskPhotoKeyHelper taskPhotoKeyHelper) {
        this.taskDao = taskDao;
        this.taskPhotoKeyHelper = taskPhotoKeyHelper;
    }

    /**
     * Retrieves a task by id and populates photo keys when needed.
     *
     * @param id Task identifier.
     * @return The task if found.
     */
    public Optional<TaskState> getTask(String id) {
        return taskDao.findById(id).map(taskPhotoKeyHelper::populatePhotoKeys);
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
    public TaskPage listTasks(String categoryId, Double lat, Double lng, Double radiusKm, String cursor, int limit) {
        TaskCursor cursorState = decodeCursor(cursor);
        Instant cursorCreatedAt = cursorState != null ? cursorState.createdAt() : null;
        UUID cursorId = cursorState != null ? cursorState.id() : null;

        List<TaskState> tasks;
        if (lat != null && lng != null && radiusKm != null) {
            double meters = radiusKm * 1000;
            tasks = taskDao.findOpenWithinRadius(categoryId, lat, lng, meters, cursorCreatedAt, cursorId, limit + 1);
        } else {
            tasks = taskDao.findOpen(categoryId, cursorCreatedAt, cursorId, limit + 1);
        }

        boolean hasMore = tasks.size() > limit;
        List<TaskState> pageData = hasMore ? tasks.subList(0, limit) : tasks;
        pageData = pageData.stream().map(taskPhotoKeyHelper::populatePhotoKeys).toList();
        String nextCursor = hasMore ? encodeCursor(pageData.getLast()) : null;

        return new TaskPage(List.copyOf(pageData), nextCursor, hasMore);
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
    public TaskPage listMyTasks(String userId, String role, String status, String cursor, int limit) {
        String normalizedRole = normalizeMyTasksRole(role);
        String normalizedStatus = normalizeTaskStatus(status);

        TaskCursor cursorState = decodeCursor(cursor);
        Instant cursorCreatedAt = cursorState != null ? cursorState.createdAt() : null;
        UUID cursorId = cursorState != null ? cursorState.id() : null;

        List<TaskState> tasks = "tasker".equals(normalizedRole)
                ? taskDao.findByTasker(userId, normalizedStatus, cursorCreatedAt, cursorId, limit + 1)
                : taskDao.findByCustomer(userId, normalizedStatus, cursorCreatedAt, cursorId, limit + 1);

        boolean hasMore = tasks.size() > limit;
        List<TaskState> pageData = hasMore ? tasks.subList(0, limit) : tasks;
        pageData = pageData.stream().map(taskPhotoKeyHelper::populatePhotoKeys).toList();
        String nextCursor = hasMore ? encodeCursor(pageData.getLast()) : null;

        return new TaskPage(List.copyOf(pageData), nextCursor, hasMore);
    }

    /**
     * Returns up to {@code maxResults} distinct recent task locations for the given customer.
     * Locations within ~200 m of an already-selected location are skipped (Euclidean approximation).
     */
    public List<RecentLocation> recentLocations(String userId, int maxResults) {
        List<RecentLocation> candidates = taskDao.findRecentLocationCandidates(UUID.fromString(userId));
        List<RecentLocation> accepted = new ArrayList<>();
        for (RecentLocation c : candidates) {
            if (accepted.size() >= maxResults) break;
            boolean tooClose = accepted.stream().anyMatch(a -> isWithin200m(a, c));
            if (!tooClose) {
                accepted.add(c);
            }
        }
        return accepted;
    }

    private TaskCursor decodeCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", 2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Cursor payload is malformed.");
            }
            return new TaskCursor(Instant.parse(parts[0]), UUID.fromString(parts[1]));
        } catch (Exception e) {
            throw new IllegalArgumentException("Cursor is invalid.", e);
        }
    }

    private String encodeCursor(TaskState lastTask) {
        String payload = lastTask.createdAt() + "|" + lastTask.id();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private static boolean isWithin200m(RecentLocation a, RecentLocation b) {
        // At UB latitude (~47.9°), 1° lat ≈ 111 km, 1° lng ≈ 74 km.
        // 200 m ≈ 0.0018° lat, 0.0027° lng. Use squared Euclidean as threshold.
        double dLat = a.locationLat() - b.locationLat();
        double dLng = a.locationLng() - b.locationLng();
        // Threshold: (0.002)^2 = 0.000004 — roughly 200 m at UB latitude
        return (dLat * dLat + dLng * dLng) < 0.000004;
    }

    private String normalizeMyTasksRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "customer";
        }
        String normalized = role.trim().toLowerCase(Locale.ROOT);
        if (!"customer".equals(normalized) && !"tasker".equals(normalized)) {
            throw new IllegalArgumentException("Role filter is invalid.");
        }
        return normalized;
    }

    private String normalizeTaskStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!TASK_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Status filter is invalid.");
        }
        return normalized;
    }

    private record TaskCursor(Instant createdAt, UUID id) {}
}
