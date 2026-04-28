package mn.tasky.category.publicapi;

import java.util.Optional;
import mn.tasky.category.dto.CategorySchemaVersion;
import mn.tasky.category.dto.CategoryState;

public interface CategoryQueryPort {
    Optional<CategoryState> getCategory(String id);

    Optional<CategorySchemaVersion> getSchemaVersion(String categoryId, int version);

    Optional<CategorySchemaVersion> getActiveSchemaVersion(String categoryId);
}
