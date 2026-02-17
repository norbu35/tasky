package mn.tasky.analytics.dao;

import mn.tasky.analytics.dto.Event;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.time.Instant;
import java.util.List;

@RegisterConstructorMapper(Event.class)
public interface AnalyticsEventDao {

    @SqlUpdate("INSERT INTO analytics_events (id, name, user_id, properties, timestamp) "
             + "VALUES (CAST(:id AS UUID), :name, :userId, CAST(:properties AS JSONB), :timestamp)")
    void insert(@Bind("id") String id,
                @Bind("name") String name,
                @Bind("userId") String userId,
                @Bind("properties") String properties,
                @Bind("timestamp") Instant timestamp);

    @SqlQuery("SELECT id, name, user_id, properties, timestamp FROM analytics_events ORDER BY timestamp DESC")
    List<Event> findAll();
}
