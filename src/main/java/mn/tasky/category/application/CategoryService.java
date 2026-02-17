package mn.tasky.category.application;

import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dto.CategoryPage;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.dto.CreateCategory;
import mn.tasky.category.dto.UpdateCategory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryDao categoryDao;

    public CategoryService(CategoryDao categoryDao) {
        this.categoryDao = categoryDao;
    }

    public CategoryPage listActiveCategories(String cursor,
                                             int limit) {
        return listCategories(false,
                              cursor,
                              limit);
    }

    private CategoryPage listCategories(boolean includeInactive,
                                        String cursor,
                                        int limit) {
        List<CategoryState> sorted = includeInactive
                ? categoryDao.findAll()
                : categoryDao.findActive();

        int offset = decodeOffset(cursor);
        if (offset > sorted.size()) {
            throw new IllegalArgumentException("Cursor offset is out of range.");
        }

        int endIndex = Math.min(offset + limit,
                                sorted.size());
        List<CategoryState> pageData = sorted.subList(offset,
                                                      endIndex);
        boolean hasMore = endIndex < sorted.size();
        String nextCursor = hasMore
                ? encodeOffset(endIndex)
                : null;

        return new CategoryPage(List.copyOf(pageData),
                                nextCursor,
                                hasMore);
    }

    private int decodeOffset(String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return 0;
        }
        try {
            String decoded = new String(
                    Base64.getUrlDecoder()
                            .decode(cursor),
                    java.nio.charset.StandardCharsets.UTF_8
            );
            int offset = Integer.parseInt(decoded);
            if (offset < 0) {
                throw new IllegalArgumentException("Cursor offset cannot be negative.");
            }
            return offset;
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Cursor is invalid.",
                                               exception);
        }
    }

    private String encodeOffset(int offset) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(Integer.toString(offset)
                                        .getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public CategoryPage listAllCategories(String cursor,
                                          int limit) {
        return listCategories(true,
                              cursor,
                              limit);
    }

    public CategoryState createCategory(CreateCategory command) {
        CategoryState created = new CategoryState(
                UUID.randomUUID()
                        .toString(),
                command.name()
                        .trim(),
                command.nameMn()
                        .trim(),
                command.iconUrl()
                        .trim(),
                true,
                command.sortOrder()
        );
        categoryDao.insert(created.id(),
                           created.name(),
                           created.nameMn(),
                           created.iconUrl(),
                           created.isActive(),
                           created.sortOrder());
        return created;
    }

    public Optional<CategoryState> updateCategory(String id,
                                                  UpdateCategory command) {
        Optional<CategoryState> existing = categoryDao.findById(id);
        if (existing.isEmpty()) {
            return Optional.empty();
        }
        CategoryState current = existing.get();
        CategoryState updated = new CategoryState(
                current.id(),
                command.name() != null
                        ? command.name()
                        .trim()
                        : current.name(),
                command.nameMn() != null
                        ? command.nameMn()
                        .trim()
                        : current.nameMn(),
                command.iconUrl() != null
                        ? command.iconUrl()
                        .trim()
                        : current.iconUrl(),
                command.isActive() != null
                        ? command.isActive()
                        : current.isActive(),
                command.sortOrder() != null
                        ? command.sortOrder()
                        : current.sortOrder()
        );
        categoryDao.update(updated.id(),
                           updated.name(),
                           updated.nameMn(),
                           updated.iconUrl(),
                           updated.isActive(),
                           updated.sortOrder());
        return Optional.of(updated);
    }

    public Optional<CategoryState> getCategory(String id) {
        return categoryDao.findById(id);
    }
}
