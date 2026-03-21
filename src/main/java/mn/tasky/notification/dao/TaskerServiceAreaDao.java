package mn.tasky.notification.dao;

import java.util.List;
import java.util.UUID;
import mn.tasky.notification.dto.District;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

public interface TaskerServiceAreaDao {

    default List<District> findByUserId(String userId) {
        return findByUserId(UUID.fromString(userId));
    }

    @SqlQuery("""
        SELECT d.id, d.name, d.name_mn, d.slug
        FROM districts d
        JOIN tasker_service_districts tsd ON tsd.district_id = d.id
        WHERE tsd.user_id = :userId AND d.is_active = true
        ORDER BY d.name
        """)
    @RegisterConstructorMapper(District.class)
    List<District> findByUserId(@Bind("userId") UUID userId);

    default void deleteByUserId(String userId) {
        deleteByUserId(UUID.fromString(userId));
    }

    @SqlUpdate("DELETE FROM tasker_service_districts WHERE user_id = :userId")
    void deleteByUserId(@Bind("userId") UUID userId);

    default void insertBySlug(String userId, String slug) {
        insertBySlug(UUID.fromString(userId), slug);
    }

    @SqlUpdate("""
        INSERT INTO tasker_service_districts (user_id, district_id)
        SELECT :userId, id FROM districts WHERE slug = :slug AND is_active = true
        ON CONFLICT DO NOTHING
        """)
    void insertBySlug(@Bind("userId") UUID userId, @Bind("slug") String slug);
}
