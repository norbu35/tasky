package mn.tasky.category.dao;

import mn.tasky.category.dto.CategoryState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static mn.tasky.common.persistence.UuidHelper.required;

@RegisterConstructorMapper(CategoryState.class)
public interface CategoryDao {

    @SqlUpdate("INSERT INTO categories (id, name, name_mn, icon_url, is_active, sort_order) "
             + "VALUES (:id, :name, :nameMn, :iconUrl, :isActive, :sortOrder)")
    void insert(@Bind("id") UUID id,
                @Bind("name") String name,
                @Bind("nameMn") String nameMn,
                @Bind("iconUrl") String iconUrl,
                @Bind("isActive") boolean isActive,
                @Bind("sortOrder") int sortOrder);

    default void insert(String id,
                        String name,
                        String nameMn,
                        String iconUrl,
                        boolean isActive,
                        int sortOrder) {
        insert(required(id, "id"), name, nameMn, iconUrl, isActive, sortOrder);
    }

    @SqlQuery("SELECT * FROM categories WHERE id = :id")
    Optional<CategoryState> findById(@Bind("id") UUID id);

    default Optional<CategoryState> findById(String id) {
        return findById(required(id, "id"));
    }

    @SqlQuery("SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name")
    List<CategoryState> findActive();

    @SqlQuery("SELECT * FROM categories ORDER BY sort_order, name")
    List<CategoryState> findAll();

    @SqlQuery("SELECT COUNT(*) FROM categories WHERE is_active = true")
    int countActive();

    @SqlQuery("SELECT COUNT(*) FROM categories")
    int countAll();

    @SqlUpdate("UPDATE categories SET name = :name, name_mn = :nameMn, icon_url = :iconUrl, "
             + "is_active = :isActive, sort_order = :sortOrder WHERE id = :id")
    void update(@Bind("id") UUID id,
                @Bind("name") String name,
                @Bind("nameMn") String nameMn,
                @Bind("iconUrl") String iconUrl,
                @Bind("isActive") boolean isActive,
                @Bind("sortOrder") int sortOrder);

    default void update(String id,
                        String name,
                        String nameMn,
                        String iconUrl,
                        boolean isActive,
                        int sortOrder) {
        update(required(id, "id"), name, nameMn, iconUrl, isActive, sortOrder);
    }
}
