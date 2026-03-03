package mn.tasky.category.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dto.*;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

import java.util.Map;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

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
        HttpServletRequest request) {
        return listCategories(false,
            cursor,
            limit,
            request);
    }

    private ResponseEntity<?> listCategories(
        boolean includeInactive, String cursor, int limit, HttpServletRequest request) {
        try {
            CategoryPage page = includeInactive
                ? categoryService.listAllCategories(cursor,
                limit)
                : categoryService.listActiveCategories(cursor,
                limit);

            return ResponseEntity.ok(new PagedResponse<>(
                page.data()
                    .stream()
                    .map(this::toCategoryResponse)
                    .toList(),
                new CursorPagination(page.nextCursor(),
                    page.hasMore())));
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
            category.sortOrder());
    }

    private String sanitize(String value) {
        return value == null ? null : HtmlUtils.htmlEscape(value);
    }

    @GetMapping("/admin/categories")
    public ResponseEntity<?> listAllCategories(
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit,
        HttpServletRequest request) {
        return listCategories(true,
            cursor,
            limit,
            request);
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest body) {
        CategoryState created = categoryService.createCategory(
            new CreateCategory(body.name(),
                body.nameMn(),
                body.iconUrl(),
                body.sortOrder()));

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(toCategoryResponse(created));
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
                    body.sortOrder()))
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
}
