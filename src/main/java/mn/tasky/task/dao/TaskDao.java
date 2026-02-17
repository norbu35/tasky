package mn.tasky.task.dao;

import mn.tasky.task.dto.TaskState;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RegisterConstructorMapper(value = TaskState.class)
public interface TaskDao {

    @SqlUpdate("INSERT INTO tasks (id, customer_id, category_id, description, budget, "
             + "location_lat, location_lng, location_text, status, scheduled_at, created_at, updated_at) "
             + "VALUES (:id, :customerId, :categoryId, :description, :budget, "
             + ":locationLat, :locationLng, :locationText, :status, :scheduledAt, :createdAt, :updatedAt)")
    void insert(@Bind("id") String id,
                @Bind("customerId") String customerId,
                @Bind("categoryId") String categoryId,
                @Bind("description") String description,
                @Bind("budget") int budget,
                @Bind("locationLat") double locationLat,
                @Bind("locationLng") double locationLng,
                @Bind("locationText") String locationText,
                @Bind("status") String status,
                @Bind("scheduledAt") Instant scheduledAt,
                @Bind("createdAt") Instant createdAt,
                @Bind("updatedAt") Instant updatedAt);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            + "location_lat, location_lng, location_text, status, scheduled_at, created_at, updated_at "
            + "FROM tasks WHERE id = :id")
    Optional<TaskState> findById(@Bind("id") String id);

    @SqlUpdate("UPDATE tasks SET status = :status, updated_at = :updatedAt WHERE id = :id")
    void updateStatus(@Bind("id") String id, @Bind("status") String status, @Bind("updatedAt") Instant updatedAt);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            + "location_lat, location_lng, location_text, status, scheduled_at, created_at, updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND (:categoryId IS NULL OR category_id = CAST(:categoryId AS UUID)) "
            + "ORDER BY created_at DESC, id "
            + "OFFSET :offset LIMIT :limit")
    List<TaskState> findOpen(@Bind("categoryId") String categoryId,
                             @Bind("offset") int offset,
                             @Bind("limit") int limit);

    @SqlQuery("SELECT id, customer_id, category_id, description, budget, "
            + "location_lat, location_lng, location_text, status, scheduled_at, created_at, updated_at "
            + "FROM tasks WHERE status = 'OPEN' "
            + "AND (:categoryId IS NULL OR category_id = CAST(:categoryId AS UUID)) "
            + "AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :meters) "
            + "ORDER BY created_at DESC, id "
            + "OFFSET :offset LIMIT :limit")
    List<TaskState> findOpenWithinRadius(@Bind("categoryId") String categoryId,
                                         @Bind("lat") double lat,
                                         @Bind("lng") double lng,
                                         @Bind("meters") double meters,
                                         @Bind("offset") int offset,
                                         @Bind("limit") int limit);
}
