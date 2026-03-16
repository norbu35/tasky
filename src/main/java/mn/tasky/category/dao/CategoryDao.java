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

    default void insert(
        String id, String name, String nameMn, String iconUrl, boolean isActive, int sortOrder,
        Boolean intakeEnabled, Integer intakeSchemaVersion, String intakeSchemaJson,
        Integer lastKnownGoodSchemaVersion) {
        insert(required(id,
                "id"),
            name,
            nameMn,
            iconUrl,
            isActive,
            sortOrder,
            intakeEnabled,
            intakeSchemaVersion,
            intakeSchemaJson,
            lastKnownGoodSchemaVersion);
    }

    @SqlUpdate("INSERT INTO categories (id, name, name_mn, icon_url, is_active, sort_order, "
        + "intake_enabled, intake_schema_version, intake_schema_json, last_known_good_schema_version) "
        + "VALUES (:id, :name, :nameMn, :iconUrl, :isActive, :sortOrder, "
        + "COALESCE(:intakeEnabled, true), :intakeSchemaVersion, "
        + "CAST(:intakeSchemaJson AS jsonb), :lastKnownGoodSchemaVersion)")
    void insert(
        @Bind("id") UUID id,
        @Bind("name") String name,
        @Bind("nameMn") String nameMn,
        @Bind("iconUrl") String iconUrl,
        @Bind("isActive") boolean isActive,
        @Bind("sortOrder") int sortOrder,
        @Bind("intakeEnabled") Boolean intakeEnabled,
        @Bind("intakeSchemaVersion") Integer intakeSchemaVersion,
        @Bind("intakeSchemaJson") String intakeSchemaJson,
        @Bind("lastKnownGoodSchemaVersion") Integer lastKnownGoodSchemaVersion);

    default Optional<CategoryState> findById(String id) {
        return findById(required(id,
            "id"));
    }

    @SqlQuery("SELECT * FROM categories WHERE id = :id")
    Optional<CategoryState> findById(@Bind("id") UUID id);

    @SqlQuery("SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name")
    List<CategoryState> findActive();

    @SqlQuery("SELECT * FROM categories ORDER BY sort_order, name")
    List<CategoryState> findAll();

    @SqlQuery(
        "SELECT * FROM categories " + "WHERE is_active = true " + "ORDER BY sort_order, name, id " + "LIMIT :limit")
    List<CategoryState> findActivePage(@Bind("limit") int limit);

    @SqlQuery("SELECT * FROM categories "
        + "WHERE is_active = true "
        + "AND (sort_order > :cursorSortOrder "
        + "OR (sort_order = :cursorSortOrder AND name > :cursorName) "
        + "OR (sort_order = :cursorSortOrder AND name = :cursorName AND id > :cursorId)) "
        + "ORDER BY sort_order, name, id "
        + "LIMIT :limit")
    List<CategoryState> findActivePageAfter(
        @Bind("cursorSortOrder") int cursorSortOrder,
        @Bind("cursorName") String cursorName,
        @Bind("cursorId") UUID cursorId,
        @Bind("limit") int limit);

    @SqlQuery("SELECT * FROM categories " + "ORDER BY sort_order, name, id " + "LIMIT :limit")
    List<CategoryState> findAllPage(@Bind("limit") int limit);

    @SqlQuery("SELECT * FROM categories "
        + "WHERE (sort_order > :cursorSortOrder "
        + "OR (sort_order = :cursorSortOrder AND name > :cursorName) "
        + "OR (sort_order = :cursorSortOrder AND name = :cursorName AND id > :cursorId)) "
        + "ORDER BY sort_order, name, id "
        + "LIMIT :limit")
    List<CategoryState> findAllPageAfter(
        @Bind("cursorSortOrder") int cursorSortOrder,
        @Bind("cursorName") String cursorName,
        @Bind("cursorId") UUID cursorId,
        @Bind("limit") int limit);

    @SqlQuery("SELECT COUNT(*) FROM categories WHERE is_active = true")
    int countActive();

    @SqlQuery("SELECT COUNT(*) FROM categories")
    int countAll();

    default void update(
        String id, String name, String nameMn, String iconUrl, boolean isActive, int sortOrder,
        Boolean intakeEnabled, Integer intakeSchemaVersion, String intakeSchemaJson,
        Integer lastKnownGoodSchemaVersion) {
        update(required(id,
                "id"),
            name,
            nameMn,
            iconUrl,
            isActive,
            sortOrder,
            intakeEnabled,
            intakeSchemaVersion,
            intakeSchemaJson,
            lastKnownGoodSchemaVersion);
    }

    @SqlUpdate("UPDATE categories SET name = :name, name_mn = :nameMn, icon_url = :iconUrl, "
        + "is_active = :isActive, sort_order = :sortOrder, "
        + "intake_enabled = COALESCE(:intakeEnabled, intake_enabled), "
        + "intake_schema_version = :intakeSchemaVersion, "
        + "intake_schema_json = CAST(:intakeSchemaJson AS jsonb), "
        + "last_known_good_schema_version = :lastKnownGoodSchemaVersion "
        + "WHERE id = :id")
    void update(
        @Bind("id") UUID id,
        @Bind("name") String name,
        @Bind("nameMn") String nameMn,
        @Bind("iconUrl") String iconUrl,
        @Bind("isActive") boolean isActive,
        @Bind("sortOrder") int sortOrder,
        @Bind("intakeEnabled") Boolean intakeEnabled,
        @Bind("intakeSchemaVersion") Integer intakeSchemaVersion,
        @Bind("intakeSchemaJson") String intakeSchemaJson,
        @Bind("lastKnownGoodSchemaVersion") Integer lastKnownGoodSchemaVersion);
}
