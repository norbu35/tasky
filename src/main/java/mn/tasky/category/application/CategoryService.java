package mn.tasky.category.application;

import mn.tasky.category.dto.CategoryPage;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.dto.CreateCategory;
import mn.tasky.category.dto.UpdateCategory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CategoryService {

    private static final Comparator<CategoryState> SORT_ORDER =
        Comparator.comparingInt(CategoryState::sortOrder)
            .thenComparing(CategoryState::name);

    private final ConcurrentHashMap<String, CategoryState> categoriesById = new ConcurrentHashMap<>();

    public CategoryService() {
        seedCategory("Cleaning", "Цэвэрлэгээ", "https://cdn.tasky.local/icons/cleaning.png", 10);
        seedCategory("Plumbing", "Сантехник", "https://cdn.tasky.local/icons/plumbing.png", 20);
        seedCategory("Moving", "Нүүлгэлт", "https://cdn.tasky.local/icons/moving.png", 30);
    }

    public CategoryPage listActiveCategories(String cursor, int limit) {
        return listCategories(false, cursor, limit);
    }

    public CategoryPage listAllCategories(String cursor, int limit) {
        return listCategories(true, cursor, limit);
    }

    public CategoryState createCategory(CreateCategory command) {
        CategoryState created = new CategoryState(
            UUID.randomUUID().toString(),
            command.name().trim(),
            command.nameMn().trim(),
            command.iconUrl().trim(),
            true,
            command.sortOrder()
        );
        categoriesById.put(created.id(), created);
        return created;
    }

    public Optional<CategoryState> updateCategory(String id, UpdateCategory command) {
        CategoryState updated = categoriesById.computeIfPresent(id, (ignored, current) ->
            new CategoryState(
                current.id(),
                command.name() != null ? command.name().trim() : current.name(),
                command.nameMn() != null ? command.nameMn().trim() : current.nameMn(),
                command.iconUrl() != null ? command.iconUrl().trim() : current.iconUrl(),
                command.isActive() != null ? command.isActive() : current.isActive(),
                command.sortOrder() != null ? command.sortOrder() : current.sortOrder()
            )
        );
        return Optional.ofNullable(updated);
    }

    public Optional<CategoryState> getCategory(String id) {
        return Optional.ofNullable(categoriesById.get(id));
    }

    private CategoryPage listCategories(boolean includeInactive, String cursor, int limit) {
        List<CategoryState> sorted = categoriesById.values().stream()
            .filter(category -> includeInactive || category.isActive())
            .sorted(SORT_ORDER)
            .toList();

        int offset = decodeOffset(cursor);
        if (offset > sorted.size()) {
            throw new IllegalArgumentException("Cursor offset is out of range.");
        }

        int endIndex = Math.min(offset + limit, sorted.size());
        List<CategoryState> pageData = sorted.subList(offset, endIndex);
        boolean hasMore = endIndex < sorted.size();
        String nextCursor = hasMore ? encodeOffset(endIndex) : null;

        return new CategoryPage(List.copyOf(pageData), nextCursor, hasMore);
    }

    private int decodeOffset(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return 0;
        }
        try {
            String decoded = new String(
                Base64.getUrlDecoder().decode(cursor),
                StandardCharsets.UTF_8
            );
            int offset = Integer.parseInt(decoded);
            if (offset < 0) {
                throw new IllegalArgumentException("Cursor offset cannot be negative.");
            }
            return offset;
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Cursor is invalid.", exception);
        }
    }

    private String encodeOffset(int offset) {
        return Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(Integer.toString(offset).getBytes(StandardCharsets.UTF_8));
    }

    private void seedCategory(String name, String nameMn, String iconUrl, int sortOrder) {
        CategoryState seeded = new CategoryState(
            UUID.randomUUID().toString(),
            name,
            nameMn,
            iconUrl,
            true,
            sortOrder
        );
        categoriesById.put(seeded.id(), seeded);
    }
}
