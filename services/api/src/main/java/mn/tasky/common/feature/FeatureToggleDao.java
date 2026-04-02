package mn.tasky.common.feature;

import static mn.tasky.common.persistence.UuidHelper.required;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

@RegisterConstructorMapper(FeatureToggle.class)
public interface FeatureToggleDao {

    @SqlQuery("SELECT id, feature_name, is_enabled, activated_at, deactivated_at, updated_by, updated_at "
            + "FROM feature_toggles ORDER BY feature_name")
    List<FeatureToggle> findAll();

    @SqlQuery("SELECT id, feature_name, is_enabled, activated_at, deactivated_at, updated_by, updated_at "
            + "FROM feature_toggles WHERE feature_name = :featureName")
    Optional<FeatureToggle> findByName(@Bind("featureName") String featureName);

    default void update(String featureName, boolean enabled, String updatedBy) {
        update(featureName, enabled, required(updatedBy, "updatedBy"));
    }

    @SqlUpdate("UPDATE feature_toggles SET is_enabled = :enabled, "
            + "activated_at = CASE WHEN :enabled THEN now() ELSE activated_at END, "
            + "deactivated_at = CASE WHEN NOT :enabled THEN now() ELSE deactivated_at END, "
            + "updated_by = :updatedBy, updated_at = now() "
            + "WHERE feature_name = :featureName")
    void update(
            @Bind("featureName") String featureName,
            @Bind("enabled") boolean enabled,
            @Bind("updatedBy") UUID updatedBy);
}
