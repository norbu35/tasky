package mn.tasky.category.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.category.application.CategoryService;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.observability.RequestObservabilityFilter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Validated
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/categories")
    public ResponseEntity<?> listActiveCategories(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
        HttpServletRequest request
    ) {
        return listCategories(false, cursor, limit, request);
    }

    @GetMapping("/admin/categories")
    public ResponseEntity<?> listAllCategories(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
        HttpServletRequest request
    ) {
        return listCategories(true, cursor, limit, request);
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<CategoryResponse> createCategory(
        @Valid @RequestBody CreateCategoryBody body
    ) {
        CategoryService.CategoryState created = categoryService.createCategory(
            new CategoryService.CreateCategory(
                body.name(),
                body.nameMn(),
                body.iconUrl(),
                body.sortOrder()
            )
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toCategoryResponse(created));
    }

    @PutMapping("/admin/categories/{id}")
    public ResponseEntity<?> updateCategory(
        @PathVariable String id,
        @Valid @RequestBody UpdateCategoryBody body,
        HttpServletRequest request
    ) {
        return categoryService.updateCategory(
            id,
            new CategoryService.UpdateCategory(
                body.name(),
                body.nameMn(),
                body.iconUrl(),
                body.isActive(),
                body.sortOrder()
            )
        )
            .<ResponseEntity<?>>map(category -> ResponseEntity.ok(toCategoryResponse(category)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of(
                    "code", "CATEGORY_NOT_FOUND",
                    "message", "Category was not found.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    private ResponseEntity<?> listCategories(
        boolean includeInactive,
        String cursor,
        int limit,
        HttpServletRequest request
    ) {
        try {
            CategoryService.CategoryPage page = includeInactive
                ? categoryService.listAllCategories(cursor, limit)
                : categoryService.listActiveCategories(cursor, limit);

            return ResponseEntity.ok(
                new PagedResponse<>(
                    page.data().stream().map(this::toCategoryResponse).toList(),
                    new CursorPagination(page.nextCursor(), page.hasMore())
                )
            );
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                Map.of(
                    "code", "INVALID_CURSOR",
                    "message", "Cursor parameter is invalid.",
                    "trace_id", resolveTraceId(request)
                )
            );
        }
    }

    private CategoryResponse toCategoryResponse(CategoryService.CategoryState category) {
        return new CategoryResponse(
            category.id(),
            category.name(),
            category.nameMn(),
            category.iconUrl(),
            category.isActive(),
            category.sortOrder()
        );
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record CreateCategoryBody(
        @NotBlank
        @Size(max = 120)
        String name,
        @JsonProperty("name_mn")
        @NotBlank
        @Size(max = 120)
        String nameMn,
        @JsonProperty("icon_url")
        @NotBlank
        @Size(max = 512)
        @Pattern(regexp = "^https?://\\S+$")
        String iconUrl,
        @JsonProperty("sort_order")
        @NotNull
        @Min(0)
        Integer sortOrder
    ) {
    }

    public record UpdateCategoryBody(
        @Size(min = 1, max = 120)
        @Pattern(regexp = ".*\\S.*")
        String name,
        @JsonProperty("name_mn")
        @Size(min = 1, max = 120)
        @Pattern(regexp = ".*\\S.*")
        String nameMn,
        @JsonProperty("icon_url")
        @Size(max = 512)
        @Pattern(regexp = "^https?://\\S+$")
        String iconUrl,
        @JsonProperty("is_active")
        Boolean isActive,
        @JsonProperty("sort_order")
        @Min(0)
        Integer sortOrder
    ) {
    }

    public record CategoryResponse(
        String id,
        String name,
        @JsonProperty("name_mn")
        String nameMn,
        @JsonProperty("icon_url")
        String iconUrl,
        @JsonProperty("is_active")
        boolean isActive,
        @JsonProperty("sort_order")
        int sortOrder
    ) {
    }
}
