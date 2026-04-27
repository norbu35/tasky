package mn.tasky.projection.publicfeed;

import static mn.tasky.common.persistence.UuidHelper.optional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

@RegisterConstructorMapper(PublicTaskFeedRow.class)
public interface PublicTaskFeedProjectionDao {

    default List<PublicTaskFeedRow> findOpenFeed(
            String categoryId,
            Double lat,
            Double lng,
            Double radiusMeters,
            Instant cursorCreatedAt,
            UUID cursorId,
            int limit) {
        return findOpenFeed(optional(categoryId), lat, lng, radiusMeters, cursorCreatedAt, cursorId, limit);
    }

    @SqlQuery("SELECT id, category_id, category_name, category_name_mn, category_icon_url, "
            + "description, budget, pricing_mode, approximate_location, approximate_lat, approximate_lng, "
            + "status, scheduled_at, created_at "
            + "FROM public_task_feed_projection "
            + "WHERE (CAST(:categoryId AS uuid) IS NULL OR category_id = CAST(:categoryId AS uuid)) "
            + "AND (CASE WHEN CAST(:radiusMeters AS double precision) IS NULL THEN true ELSE "
            + "ST_DWithin(task_location_point::geography, "
            + "ST_SetSRID(ST_MakePoint(CAST(:lng AS double precision), CAST(:lat AS double precision)), "
            + "4326)::geography, CAST(:radiusMeters AS double precision)) END) "
            + "AND (CAST(:cursorCreatedAt AS timestamptz) IS NULL "
            + "OR created_at < CAST(:cursorCreatedAt AS timestamptz) "
            + "OR (created_at = CAST(:cursorCreatedAt AS timestamptz) AND id > CAST(:cursorId AS uuid))) "
            + "ORDER BY created_at DESC, id "
            + "LIMIT CAST(:limit AS integer)")
    List<PublicTaskFeedRow> findOpenFeed(
            @Bind("categoryId") UUID categoryId,
            @Bind("lat") Double lat,
            @Bind("lng") Double lng,
            @Bind("radiusMeters") Double radiusMeters,
            @Bind("cursorCreatedAt") Instant cursorCreatedAt,
            @Bind("cursorId") UUID cursorId,
            @Bind("limit") int limit);
}
