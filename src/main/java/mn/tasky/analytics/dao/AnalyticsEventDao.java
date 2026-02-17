package mn.tasky.analytics.dao;

import static mn.tasky.common.persistence.UuidHelper.optional;
import static mn.tasky.common.persistence.UuidHelper.required;

import mn.tasky.analytics.dto.Event;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RegisterConstructorMapper(Event.class)
public interface AnalyticsEventDao {

    default void insert(String id,
                        String name,
                        String userId,
                        String properties,
                        Instant timestamp) {
        insert(required(id,
                        "id"),
               name,
               optional(userId),
               properties,
               timestamp);
    }

    @SqlUpdate("INSERT INTO analytics_events (id, name, user_id, properties, timestamp) "
            + "VALUES (:id, :name, :userId, CAST(:properties AS JSONB), :timestamp)")
    void insert(@Bind("id") UUID id,
                @Bind("name") String name,
                @Bind("userId") UUID userId,
                @Bind("properties") String properties,
                @Bind("timestamp") Instant timestamp);

    @SqlQuery("SELECT id, name, user_id, properties, timestamp FROM analytics_events ORDER BY " +
            "timestamp DESC")
    List<Event> findAll();
}
