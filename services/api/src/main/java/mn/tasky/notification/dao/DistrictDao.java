package mn.tasky.notification.dao;

import java.util.List;
import mn.tasky.notification.dto.District;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.statement.SqlQuery;

public interface DistrictDao {

    @SqlQuery("SELECT id, name, name_mn, slug FROM districts WHERE is_active = true ORDER BY name")
    @RegisterConstructorMapper(District.class)
    List<District> findAll();

    @SqlQuery("SELECT lower(replace(name, ' ', '-')) AS slug FROM categories WHERE is_active = true ORDER BY slug")
    List<String> findAllActiveCategorySlugs();
}
