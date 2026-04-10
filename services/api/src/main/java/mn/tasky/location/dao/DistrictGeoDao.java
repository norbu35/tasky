package mn.tasky.location.dao;

import java.util.List;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

public interface DistrictGeoDao {

    record DistrictCentroid(String name, String nameMn, double centroidLat, double centroidLng) {}

    @SqlQuery("SELECT name, name_mn, centroid_lat, centroid_lng "
            + "FROM districts WHERE is_active = true "
            + "AND centroid_lat IS NOT NULL AND centroid_lng IS NOT NULL")
    @RegisterConstructorMapper(DistrictCentroid.class)
    List<DistrictCentroid> findAllCentroids();
}
