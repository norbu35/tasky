package mn.tasky.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.AuthService;
import mn.tasky.category.CategoryService;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
@Validated
public class TaskController {

    private final TaskService taskService;
    private final CategoryService categoryService;
    private final AuthService authService;

    public TaskController(
        TaskService taskService,
        CategoryService categoryService,
        AuthService authService
    ) {
        this.taskService = taskService;
        this.categoryService = categoryService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<?> listTasks(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lng,
        @RequestParam(value = "radius_km", defaultValue = "10") @Max(50) Double radiusKm,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit
    ) {
        TaskService.TaskPage page = taskService.listTasks(category, lat, lng, radiusKm, cursor, limit);

        List<Map<String, Object>> data = page.data().stream()
            .map(this::toPublicTaskResponse)
            .toList();

        return ResponseEntity.ok(
            new PagedResponse<>(
                data,
                new CursorPagination(page.nextCursor(), page.hasMore())
            )
        );
    }

    @PostMapping("/photos/upload-url")
    public ResponseEntity<?> getPreCreateUploadUrl(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody UploadUrlBody body,
        HttpServletRequest request
    ) {
        return taskService.createPhotoUploadUrl(body.contentType())
            .<ResponseEntity<?>>map(upload -> ResponseEntity.ok(
                Map.of(
                    "upload_url", upload.uploadUrl(),
                    "storage_key", upload.storageKey()
                )
            ))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "code", "INVALID_CONTENT_TYPE",
                    "message", "Unsupported content type. Use image/jpeg or image/png.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    @PostMapping
    public ResponseEntity<?> createTask(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody CreateTaskBody body,
        HttpServletRequest request
    ) {
        if (!"CUSTOMER".equals(principal.role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "Only customers can create tasks.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }

        TaskService.TaskCreateResult result = taskService.createTask(
            principal.userId(),
            new TaskService.CreateTask(
                body.categoryId(),
                body.description(),
                body.budget(),
                body.locationLat(),
                body.locationLng(),
                body.locationText(),
                body.scheduledAt(),
                body.photoKeys() != null ? body.photoKeys() : List.of()
            )
        );

        if (result.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(toTaskResponse(result.task()));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            Map.of(
                "code", result.errorCode(),
                "message", result.errorMessage(),
                "trace_id", resolveTraceId(request)
            )
        );
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTask(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        HttpServletRequest request
    ) {
        TaskService.TaskCancelResult result = taskService.cancelTask(principal.userId(), id);

        if (result.isSuccess()) {
            return ResponseEntity.ok(toTaskResponse(result.task()));
        }

        return switch (result.errorCode()) {
            case TaskService.TaskCancelResult.NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Task not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case TaskService.TaskCancelResult.FORBIDDEN -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "You do not have permission to cancel this task.",
                    "trace_id", resolveTraceId(request)
                )
            );
            case TaskService.TaskCancelResult.INVALID_STATUS -> ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                    "code", "INVALID_STATUS",
                    "message", "Task cannot be cancelled in its current status.",
                    "trace_id", resolveTraceId(request)
                )
            );
            default -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        };
    }

    @PostMapping("/{id}/photos/upload-url")
    public ResponseEntity<?> getPostCreateUploadUrl(
        @AuthenticationPrincipal JwtPrincipal principal,
        @PathVariable String id,
        @Valid @RequestBody UploadUrlBody body,
        HttpServletRequest request
    ) {
        Optional<TaskService.TaskState> taskOpt = taskService.getTask(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "NOT_FOUND",
                    "message", "Task not found.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }

        TaskService.TaskState task = taskOpt.get();
        if (!task.customerId().equals(principal.userId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                Map.of(
                    "code", "FORBIDDEN",
                    "message", "You do not have permission to add photos to this task.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }

        if (task.photoKeys().size() >= 3) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "code", "TOO_MANY_PHOTOS",
                    "message", "Maximum 3 photos per task.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }

        return getPreCreateUploadUrl(principal, body, request);
    }

    private Map<String, Object> toPublicTaskResponse(TaskService.TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", task.id());

        categoryService.getCategory(task.categoryId()).ifPresent(cat ->
            response.put("category", Map.of(
                "id", cat.id(),
                "name", cat.name(),
                "name_mn", cat.nameMn(),
                "icon_url", cat.iconUrl()
            ))
        );

        authService.getProfile(task.customerId()).ifPresent(profile ->
            response.put("customer", Map.of(
                "id", profile.id(),
                "full_name", profile.fullName(),
                "avatar_url", profile.avatarUrl() != null ? profile.avatarUrl() : "",
                "rating_avg", profile.ratingAvg()
            ))
        );

        response.put("description", task.description());
        response.put("budget", task.budget());
        response.put("approximate_location", "Ulaanbaatar, Mongolia (Fuzzed)");
        response.put("approximate_lat", task.locationLat());
        response.put("approximate_lng", task.locationLng());
        response.put("status", task.status());
        response.put("scheduled_at", task.scheduledAt().toString());
        response.put("photo_urls", task.photoKeys()); // Should be URLs but for now keys
        response.put("application_count", 0);
        response.put("created_at", task.createdAt().toString());

        return response;
    }

    private Map<String, Object> toTaskResponse(TaskService.TaskState task) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", task.id());
        response.put("category_id", task.categoryId());
        response.put("customer_id", task.customerId());
        response.put("description", task.description());
        response.put("budget", task.budget());
        response.put("location_lat", task.locationLat());
        response.put("location_lng", task.locationLng());
        response.put("location_text", task.locationText());
        response.put("status", task.status());
        response.put("scheduled_at", task.scheduledAt().toString());
        response.put("photo_keys", task.photoKeys());
        response.put("created_at", task.createdAt().toString());
        response.put("updated_at", task.updatedAt().toString());
        return response;
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record UploadUrlBody(
        @JsonProperty("content_type")
        @NotBlank
        @Pattern(
            regexp = "^(image/jpeg|image/png)$",
            flags = Pattern.Flag.CASE_INSENSITIVE
        )
        String contentType
    ) {
    }

    public record CreateTaskBody(
        @JsonProperty("category_id")
        @NotBlank
        String categoryId,

        @NotBlank
        @Size(min = 10, max = 2000)
        String description,

        @Min(5000)
        int budget,

        @JsonProperty("location_lat")
        @NotNull
        double locationLat,

        @JsonProperty("location_lng")
        @NotNull
        double locationLng,

        @JsonProperty("location_text")
        @NotBlank
        @Size(min = 5, max = 500)
        String locationText,

        @JsonProperty("scheduled_at")
        @NotBlank
        String scheduledAt,

        @JsonProperty("photo_keys")
        @Size(max = 3)
        List<String> photoKeys
    ) {
    }
}
