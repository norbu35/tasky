package mn.tasky.task.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import mn.tasky.task.dto.TaskState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RegisterConstructorMapper(value = TaskState.class)
public interface TaskDao {

    default void insert(String id,
                        String customerId,
                        String categoryId,
                        String description,
                        int budget,
                        double locationLat,
                        double locationLng,
                        String locationText,
                        String status,
                        Instant scheduledAt,
                        Instant createdAt,
                        Instant updatedAt) {
        insert(
                required(id,
                         "id"),
                required(customerId,
                         "customerId"),
                required(categoryId,
                         "categoryId"),
                description,
                budget,
                locationLat,
                locationLng,
                locationText,
                status,
                scheduledAt,
                createdAt,
                updatedAt
        );
    }

    @SqlUpdate("INSERT INTO tasks (id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at) "
            + "VALUES (:id, :customerId, :categoryId, :description, :budget, "
            +
            ":locationLat, :locationLng, :locationText, :status, :scheduledAt, :createdAt, " +
            ":updatedAt)")
    void insert(@Bind("id") UUID id,
                @Bind("customerId") UUID customerId,
                @Bind("categoryId") UUID categoryId,
                @Bind("description") String description,
                @Bind("budget") int budget,
                @Bind("locationLat") double locationLat,
                @Bind("locationLng") double locationLng,
                @Bind("locationText") String locationText,
                @Bind("status") String status,
                @Bind("scheduledAt") Instant scheduledAt,
                @Bind("createdAt") Instant createdAt,
                @Bind("updatedAt") Instant updatedAt);

    default Optional<TaskState> findById(String id) {
        return findById(required(id,
                                 "id"));
    }

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE id = :id")
    Optional<TaskState> findById(@Bind("id") UUID id);

    default void updateStatus(String id,
                              String status,
                              Instant updatedAt) {
        updateStatus(required(id,
                              "id"),
                     status,
                     updatedAt);
    }

    @SqlUpdate("UPDATE tasks SET status = :status, updated_at = :updatedAt WHERE id = :id")
    void updateStatus(@Bind("id") UUID id,
                      @Bind("status") String status,
                      @Bind("updatedAt") Instant updatedAt);

    default List<TaskState> findOpen(String categoryId,
                                     Instant cursorCreatedAt,
                                     UUID cursorId,
                                     int limit) {
        return findOpen(optional(categoryId),
                        cursorCreatedAt,
                        cursorId,
                        limit);
    }

    default List<TaskState> findOpen(UUID categoryId,
                                     Instant cursorCreatedAt,
                                     UUID cursorId,
                                     int limit) {
        if (categoryId == null) {
            return cursorCreatedAt == null
                    ? findOpenAll(limit)
                    : findOpenAllAfter(cursorCreatedAt,
                                       cursorId,
                                       limit);
        }
        return cursorCreatedAt == null
                ? findOpenByCategory(categoryId,
                                     limit)
                : findOpenByCategoryAfter(categoryId,
                                          cursorCreatedAt,
                                          cursorId,
                                          limit);
    }

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenAll(@Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND category_id = :categoryId "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenByCategory(@Bind("categoryId") UUID categoryId,
                                       @Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND (created_at < :cursorCreatedAt "
            + "OR (created_at = :cursorCreatedAt AND id > :cursorId)) "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenAllAfter(@Bind("cursorCreatedAt") Instant cursorCreatedAt,
                                     @Bind("cursorId") UUID cursorId,
                                     @Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND category_id = :categoryId "
            + "AND (created_at < :cursorCreatedAt "
            + "OR (created_at = :cursorCreatedAt AND id > :cursorId)) "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenByCategoryAfter(@Bind("categoryId") UUID categoryId,
                                            @Bind("cursorCreatedAt") Instant cursorCreatedAt,
                                            @Bind("cursorId") UUID cursorId,
                                            @Bind("limit") int limit);

    default List<TaskState> findOpenWithinRadius(String categoryId,
                                                 double lat,
                                                 double lng,
                                                 double meters,
                                                 Instant cursorCreatedAt,
                                                 UUID cursorId,
                                                 int limit) {
        return findOpenWithinRadius(optional(categoryId),
                                    lat,
                                    lng,
                                    meters,
                                    cursorCreatedAt,
                                    cursorId,
                                    limit);
    }

    default List<TaskState> findOpenWithinRadius(UUID categoryId,
                                                 double lat,
                                                 double lng,
                                                 double meters,
                                                 Instant cursorCreatedAt,
                                                 UUID cursorId,
                                                 int limit) {
        if (categoryId == null) {
            return cursorCreatedAt == null
                    ? findOpenWithinRadiusAll(lat,
                                              lng,
                                              meters,
                                              limit)
                    : findOpenWithinRadiusAllAfter(lat,
                                                   lng,
                                                   meters,
                                                   cursorCreatedAt,
                                                   cursorId,
                                                   limit);
        }
        return cursorCreatedAt == null
                ? findOpenWithinRadiusByCategory(categoryId,
                                                 lat,
                                                 lng,
                                                 meters,
                                                 limit)
                : findOpenWithinRadiusByCategoryAfter(categoryId,
                                                      lat,
                                                      lng,
                                                      meters,
                                                      cursorCreatedAt,
                                                      cursorId,
                                                      limit);
    }

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            +
            "AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)" +
            "::geography, :meters) "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenWithinRadiusAll(@Bind("lat") double lat,
                                            @Bind("lng") double lng,
                                            @Bind("meters") double meters,
                                            @Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND category_id = :categoryId "
            +
            "AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)" +
            "::geography, :meters) "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenWithinRadiusByCategory(@Bind("categoryId") UUID categoryId,
                                                   @Bind("lat") double lat,
                                                   @Bind("lng") double lng,
                                                   @Bind("meters") double meters,
                                                   @Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)" +
            "::geography, :meters) "
            + "AND (created_at < :cursorCreatedAt "
            + "OR (created_at = :cursorCreatedAt AND id > :cursorId)) "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenWithinRadiusAllAfter(@Bind("lat") double lat,
                                                 @Bind("lng") double lng,
                                                 @Bind("meters") double meters,
                                                 @Bind("cursorCreatedAt") Instant cursorCreatedAt,
                                                 @Bind("cursorId") UUID cursorId,
                                                 @Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            +
            "location_lat, location_lng, location_text, status, scheduled_at, created_at, " +
            "updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND category_id = :categoryId "
            + "AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)" +
            "::geography, :meters) "
            + "AND (created_at < :cursorCreatedAt "
            + "OR (created_at = :cursorCreatedAt AND id > :cursorId)) "
            + "ORDER BY created_at DESC, id ASC "
            + "LIMIT :limit")
    List<TaskState> findOpenWithinRadiusByCategoryAfter(@Bind("categoryId") UUID categoryId,
                                                        @Bind("lat") double lat,
                                                        @Bind("lng") double lng,
                                                        @Bind("meters") double meters,
                                                        @Bind("cursorCreatedAt") Instant cursorCreatedAt,
                                                        @Bind("cursorId") UUID cursorId,
                                                        @Bind("limit") int limit);
}
