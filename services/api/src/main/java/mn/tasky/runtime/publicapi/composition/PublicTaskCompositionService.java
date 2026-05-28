package mn.tasky.runtime.publicapi.composition;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.IntStream;
import mn.tasky.booking.publicapi.BookingQueryPort;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.location.publicapi.LocationQueryPort;
import mn.tasky.marketplace.publicapi.MarketplaceQueryPort;
import mn.tasky.task.dto.RecentLocation;
import mn.tasky.task.dto.TaskApplicationState;
import mn.tasky.task.dto.TaskState;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class PublicTaskCompositionService {

    private final MarketplaceQueryPort marketplaceQueryPort;
    private final BookingQueryPort bookingQueryPort;
    private final CategoryQueryPort categoryQueryPort;
    private final IdentityQueryPort identityQueryPort;
    private final ObjectMapper objectMapper;
    private final LocationQueryPort locationQueryPort;

    public PublicTaskCompositionService(
            MarketplaceQueryPort marketplaceQueryPort,
            BookingQueryPort bookingQueryPort,
            CategoryQueryPort categoryQueryPort,
            IdentityQueryPort identityQueryPort,
            ObjectMapper objectMapper,
            LocationQueryPort locationQueryPort) {
        this.marketplaceQueryPort = marketplaceQueryPort;
        this.bookingQueryPort = bookingQueryPort;
        this.categoryQueryPort = categoryQueryPort;
        this.identityQueryPort = identityQueryPort;
        this.objectMapper = objectMapper;
        this.locationQueryPort = locationQueryPort;
    }

    public List<Map<String, Object>> toPublicTaskResponses(List<TaskState> tasks) {
        return tasks.stream().map(this::toPublicTaskResponse).toList();
    }

    public List<Map<String, Object>> toOwnedTaskResponses(List<TaskState> tasks) {
        return tasks.stream().map(this::toOwnedTaskResponse).toList();
    }

    public Map<String, Object> toTaskResponseForViewer(TaskState task, String viewerUserId) {
        if (task.customerId().equals(viewerUserId) || hasBookedTaskerView(task.id(), viewerUserId)) {
            return toOwnedTaskResponse(task);
        }
        return toPublicTaskResponse(task);
    }

    public List<Map<String, Object>> toTaskApplicationResponses(List<TaskApplicationState> applications) {
        return applications.stream().map(this::toTaskApplicationResponse).toList();
    }

    public Map<String, Object> recentLocationsResponse(List<RecentLocation> locations) {
        List<Map<String, Object>> data = locations.stream()
                .map(location -> Map.<String, Object>of(
                        "location_lat", location.locationLat(),
                        "location_lng", location.locationLng(),
                        "location_text", location.locationText()))
                .toList();
        return Map.of("locations", data);
    }

    private boolean hasBookedTaskerView(String taskId, String viewerUserId) {
        return bookingQueryPort.listBookings(viewerUserId, "tasker", null).stream()
                .anyMatch(booking -> booking.taskId().equals(taskId)
                        && ("ASSIGNED".equals(booking.status())
                                || "PAID".equals(booking.status())
                                || "COMPLETED".equals(booking.status())));
    }

    private Map<String, Object> toPublicTaskResponse(TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        var approx = locationQueryPort.reverseGeocode(task.locationLat(), task.locationLng());
        response.put("id", task.id());

        categoryQueryPort
                .getCategory(task.categoryId())
                .ifPresent(category -> response.put("category", toCategoryPayload(category)));

        identityQueryPort
                .getProfile(task.customerId())
                .ifPresent(profile -> response.put(
                        "customer",
                        Map.of(
                                "id",
                                profile.id(),
                                "full_name",
                                profile.fullName(),
                                "avatar_url",
                                profile.avatarUrl() != null ? profile.avatarUrl() : "",
                                "rating_avg",
                                profile.ratingAvg() != null ? profile.ratingAvg() : "")));

        response.put("description", task.description());
        response.put("budget", task.budget());
        response.put("pricing_mode", task.pricingMode());
        response.put("approximate_location", approx.formattedAddress());
        response.put("approximate_lat", approx.approximateLat());
        response.put("approximate_lng", approx.approximateLng());
        response.put("status", task.status());
        response.put(
                "scheduled_at", task.scheduledAt() != null ? task.scheduledAt().toString() : null);
        List<String> photoKeys = task.photoKeys() == null ? List.of() : task.photoKeys();
        response.put("photo_urls", marketplaceQueryPort.buildPhotoAccessUrls(photoKeys, task.customerId()));
        response.put("application_count", marketplaceQueryPort.countApplications(task.id()));
        response.put("created_at", task.createdAt().toString());
        return response;
    }

    public Map<String, Object> toOwnedTaskResponse(TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        List<String> rawPhotoKeys = task.photoKeys();
        List<String> photoKeys = rawPhotoKeys == null ? List.of() : rawPhotoKeys;
        List<Map<String, Object>> photos = IntStream.range(0, photoKeys.size())
                .mapToObj(index -> toOwnedPhotoResponse(photoKeys.get(index), index, task.customerId()))
                .flatMap(Optional::stream)
                .toList();
        List<String> visiblePhotoKeys = photos.stream()
                .map(photo -> String.valueOf(photo.get("storage_key")))
                .toList();

        response.put("id", task.id());
        response.put("category_id", task.categoryId());
        categoryQueryPort
                .getCategory(task.categoryId())
                .ifPresent(category -> response.put("category", toCategoryPayload(category)));
        response.put("customer_id", task.customerId());
        response.put("description", task.description());
        response.put("budget", task.budget());
        response.put("pricing_mode", task.pricingMode());
        response.put("location_lat", task.locationLat());
        response.put("location_lng", task.locationLng());
        response.put("location_text", task.locationText());
        response.put("status", task.status());
        response.put(
                "scheduled_at", task.scheduledAt() != null ? task.scheduledAt().toString() : null);
        response.put("intake_answers", parseJsonOrEmptyObject(task.intakeAnswersJson()));
        response.put("intake_schema_version", task.intakeSchemaVersion() != null ? task.intakeSchemaVersion() : 0);
        response.put("scope_summary_source", task.scopeSummarySource());
        response.put("photos", photos);
        response.put("photo_keys", visiblePhotoKeys);
        response.put("created_at", task.createdAt().toString());
        response.put("updated_at", task.updatedAt().toString());
        return response;
    }

    public Map<String, Object> toTaskApplicationResponse(TaskApplicationState application) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", application.id());
        response.put("task_id", application.taskId());
        response.put(
                "tasker",
                Map.of(
                        "id", application.taskerId(),
                        "full_name", application.taskerFullName(),
                        "avatar_url", application.taskerAvatarUrl() != null ? application.taskerAvatarUrl() : "",
                        "rating_avg", application.taskerRatingAvg(),
                        "completed_tasks", application.taskerCompletedTasks(),
                        "is_pro", application.taskerIsPro()));
        response.put("message", application.message());
        response.put("quote_price", application.quotePrice());
        response.put("status", application.status());
        response.put("created_at", application.createdAt().toString());
        return response;
    }

    private Optional<Map<String, Object>> toOwnedPhotoResponse(String storageKey, int sortOrder, String customerId) {
        return marketplaceQueryPort
                .buildOwnedPhotoAccessUrl(storageKey, customerId)
                .map(url -> {
                    Map<String, Object> photo = new LinkedHashMap<>();
                    photo.put("storage_key", storageKey);
                    photo.put("url", url);
                    photo.put("sort_order", sortOrder);
                    return photo;
                });
    }

    private Map<String, Object> toCategoryPayload(CategoryState category) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", category.id());
        response.put("name", sanitize(category.name()));
        response.put("name_mn", sanitize(category.nameMn()));
        response.put("icon_url", sanitize(category.iconUrl()));
        response.put("is_active", category.isActive());
        response.put("sort_order", category.sortOrder());
        response.put("intake_enabled", Boolean.TRUE.equals(category.intakeEnabled()));
        response.put(
                "intake_schema_version", category.intakeSchemaVersion() != null ? category.intakeSchemaVersion() : 0);
        response.put("intake_schema_json", parseJson(category.intakeSchemaJson()));
        return response;
    }

    private Object parseJsonOrEmptyObject(String value) {
        Object parsed = parseJson(value);
        return parsed != null ? parsed : Map.of();
    }

    private Object parseJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(value, Object.class);
        } catch (IOException exception) {
            return null;
        }
    }

    private String sanitize(String value) {
        return value == null ? null : HtmlUtils.htmlEscape(value);
    }
}
