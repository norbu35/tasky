package mn.tasky.category.application;

import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dto.CategoryPage;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.dto.CreateCategory;
import mn.tasky.category.dto.UpdateCategory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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
        CategoryCursor anchor = resolveCursor(includeInactive,
                                              cursor);
        int fetchLimit = limit + 1;
        List<CategoryState> results;
        if (anchor == null) {
            results = includeInactive
                    ? categoryDao.findAllPage(fetchLimit)
                    : categoryDao.findActivePage(fetchLimit);
        } else {
            results = includeInactive
                    ? categoryDao.findAllPageAfter(anchor.sortOrder(),
                                                   anchor.name(),
                                                   anchor.id(),
                                                   fetchLimit)
                    : categoryDao.findActivePageAfter(anchor.sortOrder(),
                                                      anchor.name(),
                                                      anchor.id(),
                                                      fetchLimit);
        }

        boolean hasMore = results.size() > limit;
        List<CategoryState> pageData = hasMore
                ? results.subList(0,
                                  limit)
                : results;
        String nextCursor = hasMore
                ? pageData.get(pageData.size() - 1)
                        .id()
                : null;

        return new CategoryPage(List.copyOf(pageData),
                                nextCursor,
                                hasMore);
    }

    private CategoryCursor resolveCursor(boolean includeInactive,
                                         String cursor) {
        if (!StringUtils.hasText(cursor)) {
            return null;
        }

        UUID cursorId;
        try {
            cursorId = UUID.fromString(cursor.trim());
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Cursor is invalid.",
                                               exception);
        }

        CategoryState anchor = categoryDao.findById(cursorId)
                .orElseThrow(() -> new IllegalArgumentException("Cursor category was not found."));
        if (!includeInactive && !anchor.isActive()) {
            throw new IllegalArgumentException("Cursor category is not active.");
        }

        return new CategoryCursor(cursorId,
                                  anchor.sortOrder(),
                                  anchor.name());
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

    private record CategoryCursor(UUID id,
                                  int sortOrder,
                                  String name) {
    }
}
