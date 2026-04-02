package mn.tasky.category.dao;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.category.dto.CategorySchemaVersion;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(CategorySchemaVersion.class)
public interface CategorySchemaVersionDao {

    default void insert(String id, String categoryId, int version, String schemaJson, String status, String createdBy) {
        insert(
                required(id, "id"),
                required(categoryId, "categoryId"),
                version,
                schemaJson,
                status,
                required(createdBy, "createdBy"));
    }

    @SqlUpdate("INSERT INTO category_schema_versions (id, category_id, version, schema_json, status, created_by) "
            + "VALUES (:id, :categoryId, :version, CAST(:schemaJson AS jsonb), :status, :createdBy)")
    void insert(
            @Bind("id") UUID id,
            @Bind("categoryId") UUID categoryId,
            @Bind("version") int version,
            @Bind("schemaJson") String schemaJson,
            @Bind("status") String status,
            @Bind("createdBy") UUID createdBy);

    default List<CategorySchemaVersion> findByCategoryId(String categoryId) {
        return findByCategoryId(required(categoryId, "categoryId"));
    }

    @SqlQuery("SELECT id, category_id, version, schema_json, status, is_last_known_good, "
            + "created_by, created_at, activated_at "
            + "FROM category_schema_versions WHERE category_id = :categoryId "
            + "ORDER BY version DESC")
    List<CategorySchemaVersion> findByCategoryId(@Bind("categoryId") UUID categoryId);

    default Optional<CategorySchemaVersion> findByCategoryIdAndVersion(String categoryId, int version) {
        return findByCategoryIdAndVersion(required(categoryId, "categoryId"), version);
    }

    @SqlQuery("SELECT id, category_id, version, schema_json, status, is_last_known_good, "
            + "created_by, created_at, activated_at "
            + "FROM category_schema_versions WHERE category_id = :categoryId AND version = :version")
    Optional<CategorySchemaVersion> findByCategoryIdAndVersion(
            @Bind("categoryId") UUID categoryId, @Bind("version") int version);

    default Optional<CategorySchemaVersion> findActiveByCategoryId(String categoryId) {
        return findActiveByCategoryId(required(categoryId, "categoryId"));
    }

    @SqlQuery("SELECT id, category_id, version, schema_json, status, is_last_known_good, "
            + "created_by, created_at, activated_at "
            + "FROM category_schema_versions WHERE category_id = :categoryId AND status = 'ACTIVE' "
            + "LIMIT 1")
    Optional<CategorySchemaVersion> findActiveByCategoryId(@Bind("categoryId") UUID categoryId);

    default void updateStatus(String id, String status) {
        updateStatus(required(id, "id"), status);
    }

    @SqlUpdate("UPDATE category_schema_versions SET status = :status WHERE id = :id")
    void updateStatus(@Bind("id") UUID id, @Bind("status") String status);

    default void clearLastKnownGood(String categoryId) {
        clearLastKnownGood(required(categoryId, "categoryId"));
    }

    @SqlUpdate("UPDATE category_schema_versions SET is_last_known_good = false " + "WHERE category_id = :categoryId")
    void clearLastKnownGood(@Bind("categoryId") UUID categoryId);

    default void markLastKnownGood(String id) {
        markLastKnownGood(required(id, "id"));
    }

    @SqlUpdate("UPDATE category_schema_versions SET is_last_known_good = true WHERE id = :id")
    void markLastKnownGood(@Bind("id") UUID id);

    default Optional<Integer> findMaxVersion(String categoryId) {
        return findMaxVersion(required(categoryId, "categoryId"));
    }

    @SqlQuery("SELECT MAX(version) FROM category_schema_versions WHERE category_id = :categoryId")
    Optional<Integer> findMaxVersion(@Bind("categoryId") UUID categoryId);

    default Optional<CategorySchemaVersion> findLastKnownGoodByCategoryId(String categoryId) {
        return findLastKnownGoodByCategoryId(required(categoryId, "categoryId"));
    }

    @SqlQuery("SELECT id, category_id, version, schema_json, status, is_last_known_good, "
            + "created_by, created_at, activated_at "
            + "FROM category_schema_versions WHERE category_id = :categoryId AND is_last_known_good = true "
            + "LIMIT 1")
    Optional<CategorySchemaVersion> findLastKnownGoodByCategoryId(@Bind("categoryId") UUID categoryId);

    default void updateStatusAndActivatedAt(String id, String status) {
        updateStatusAndActivatedAt(required(id, "id"), status);
    }

    @SqlUpdate("UPDATE category_schema_versions SET status = :status, activated_at = NOW() WHERE id = :id")
    void updateStatusAndActivatedAt(@Bind("id") UUID id, @Bind("status") String status);
}
