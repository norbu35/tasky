package mn.tasky.category.application.query;

import java.util.Optional;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import org.springframework.stereotype.Service;

@Service
public class CategoryQueryHandler implements CategoryQueryPort {

    private final CategoryService categoryService;
    private final CategorySchemaVersionDao categorySchemaVersionDao;

    public CategoryQueryHandler(CategoryService categoryService, CategorySchemaVersionDao categorySchemaVersionDao) {
        this.categoryService = categoryService;
        this.categorySchemaVersionDao = categorySchemaVersionDao;
    }

    @Override
    public Optional<CategoryState> getCategory(String id) {
        return categoryService.getCategory(id);
    }

    @Override
    public Optional<CategorySchemaVersion> getSchemaVersion(String categoryId, int version) {
        return categorySchemaVersionDao.findByCategoryIdAndVersion(categoryId, version);
    }

    @Override
    public Optional<CategorySchemaVersion> getActiveSchemaVersion(String categoryId) {
        return categorySchemaVersionDao.findActiveByCategoryId(categoryId);
    }
}
