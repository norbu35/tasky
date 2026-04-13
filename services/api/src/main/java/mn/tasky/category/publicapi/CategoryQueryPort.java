package mn.tasky.category.publicapi;

import java.util.Optional;
import mn.tasky.category.dto.CategoryState;

public interface CategoryQueryPort {
    Optional<CategoryState> getCategory(String id);
}
