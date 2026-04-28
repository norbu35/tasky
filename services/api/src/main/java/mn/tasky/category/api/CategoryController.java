package mn.tasky.category.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import mn.tasky.category.application.CategorySchemaVersionService;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dto.ActivateSchemaVersionRequest;
import mn.tasky.category.dto.CategoryPage;
import mn.tasky.category.dto.CategoryResponse;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.dto.CreateCategory;
import mn.tasky.category.dto.CreateCategoryRequest;
import mn.tasky.category.dto.CreateSchemaVersionRequest;
import mn.tasky.category.dto.SchemaVersionResponse;
import mn.tasky.category.dto.UpdateCategory;
import mn.tasky.category.dto.UpdateCategoryRequest;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

@RestController
@RequestMapping("/api/v1")
@Validated
public class CategoryController {

    private final CategoryService categoryService;
    private final CategorySchemaVersionService schemaVersionService;
    private final ObjectMapper objectMapper;

    public CategoryController(
            CategoryService categoryService,
            CategorySchemaVersionService schemaVersionService,
            ObjectMapper objectMapper) {
        this.categoryService = categoryService;
        this.schemaVersionService = schemaVersionService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/categories")
    public ResponseEntity<?> listActiveCategories(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            HttpServletRequest request) {
        return listCategories(false, cursor, limit, request);
    }

    private ResponseEntity<?> listCategories(
            boolean includeInactive, String cursor, int limit, HttpServletRequest request) {
        try {
            CategoryPage page = includeInactive
                    ? categoryService.listAllCategories(cursor, limit)
                    : categoryService.listActiveCategories(cursor, limit);

            return ResponseEntity.ok(new PagedResponse<>(
                    page.data().stream().map(this::toCategoryResponse).toList(),
                    new CursorPagination(page.nextCursor(), page.hasMore())));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code",
                            "INVALID_CURSOR",
                            "message",
                            "Cursor parameter is invalid.",
                            "trace_id",
                            resolveTraceId(request)));
        }
    }

    private CategoryResponse toCategoryResponse(CategoryState category) {
        return new CategoryResponse(
                category.id(),
                sanitize(category.name()),
                sanitize(category.nameMn()),
                sanitize(category.iconUrl()),
                category.isActive(),
                category.sortOrder(),
                Boolean.TRUE.equals(category.intakeEnabled()),
                Boolean.TRUE.equals(category.assistedDistributionEnabled()),
                category.intakeSchemaVersion() != null ? category.intakeSchemaVersion() : 0,
                parseJson(category.intakeSchemaJson()));
    }

    private String sanitize(String value) {
        return value == null ? null : HtmlUtils.htmlEscape(value);
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

    @GetMapping("/admin/categories")
    public ResponseEntity<?> listAllCategories(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
            HttpServletRequest request) {
        return listCategories(true, cursor, limit, request);
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest body) {
        CategoryState created = categoryService.createCategory(new CreateCategory(
                body.name(),
                body.nameMn(),
                body.iconUrl(),
                body.sortOrder(),
                body.intakeEnabled(),
                body.assistedDistributionEnabled()));

        return ResponseEntity.status(HttpStatus.CREATED).body(toCategoryResponse(created));
    }

    @PutMapping("/admin/categories/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable String id, @Valid @RequestBody UpdateCategoryRequest body, HttpServletRequest request) {
        return categoryService
                .updateCategory(
                        id,
                        new UpdateCategory(
                                body.name(),
                                body.nameMn(),
                                body.iconUrl(),
                                body.isActive(),
                                body.sortOrder(),
                                body.intakeEnabled(),
                                body.assistedDistributionEnabled()))
                .<ResponseEntity<?>>map(category -> ResponseEntity.ok(toCategoryResponse(category)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "code",
                                "CATEGORY_NOT_FOUND",
                                "message",
                                "Category was not found.",
                                "trace_id",
                                resolveTraceId(request))));
    }

    @GetMapping("/admin/categories/{id}/schemas")
    public ResponseEntity<?> listSchemaVersions(@PathVariable String id) {
        List<SchemaVersionResponse> versions = schemaVersionService.listVersions(id).stream()
                .map(this::toSchemaVersionResponse)
                .toList();
        return ResponseEntity.ok(versions);
    }

    @PostMapping("/admin/categories/{id}/schemas")
    public ResponseEntity<?> createSchemaVersion(
            @PathVariable String id,
            @Valid @RequestBody CreateSchemaVersionRequest body,
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletRequest request) {
        try {
            CategorySchemaVersion created =
                    schemaVersionService.createVersion(id, body.schemaJson(), principal.userId());
            return ResponseEntity.status(HttpStatus.CREATED).body(toSchemaVersionResponse(created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code", "INVALID_SCHEMA",
                            "message", e.getMessage(),
                            "trace_id", resolveTraceId(request)));
        }
    }

    @PostMapping("/admin/categories/{id}/schemas/{version}/activate")
    public ResponseEntity<?> activateSchemaVersion(
            @PathVariable String id,
            @PathVariable int version,
            @Valid @RequestBody ActivateSchemaVersionRequest body,
            HttpServletRequest request) {
        try {
            CategorySchemaVersion activated =
                    switch (body.mode().toUpperCase(Locale.ROOT)) {
                        case "ACTIVE" -> schemaVersionService.activate(id, version);
                        case "CANARY" -> schemaVersionService.canaryActivate(id, version);
                        case "ROLLBACK_TO_LAST_KNOWN_GOOD", "ROLLBACK" -> schemaVersionService.rollbackToLastKnownGood(
                                id);
                        default -> throw new IllegalArgumentException(
                                "Unsupported schema activation mode: " + body.mode());
                    };
            return ResponseEntity.ok(toSchemaVersionResponse(activated));
        } catch (CategorySchemaVersionService.NoFallbackException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code", e.code(),
                            "message", e.getMessage(),
                            "trace_id", resolveTraceId(request)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "code", "SCHEMA_VERSION_NOT_FOUND",
                            "message", e.getMessage(),
                            "trace_id", resolveTraceId(request)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "code", "SCHEMA_ACTIVATION_CONFLICT",
                            "message", e.getMessage(),
                            "trace_id", resolveTraceId(request)));
        }
    }

    private SchemaVersionResponse toSchemaVersionResponse(CategorySchemaVersion sv) {
        return new SchemaVersionResponse(
                sv.id(),
                sv.categoryId(),
                sv.version(),
                sv.schemaJson(),
                sv.status(),
                sv.createdBy(),
                sv.createdAt(),
                sv.activatedAt());
    }
}
