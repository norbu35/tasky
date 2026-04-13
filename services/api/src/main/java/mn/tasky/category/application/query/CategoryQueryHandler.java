package mn.tasky.category.application.query;

import java.util.Optional;
import mn.tasky.category.application.CategoryService;
import mn.tasky.category.dto.CategoryState;
import mn.tasky.category.publicapi.CategoryQueryPort;
import org.springframework.stereotype.Service;

@Service
public class CategoryQueryHandler implements CategoryQueryPort {

    private final CategoryService categoryService;

    public CategoryQueryHandler(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @Override
    public Optional<CategoryState> getCategory(String id) {
        return categoryService.getCategory(id);
    }
}
