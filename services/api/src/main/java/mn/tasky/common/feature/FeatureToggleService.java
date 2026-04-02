package mn.tasky.common.feature;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Service;

@Service
public class FeatureToggleService {

    private final FeatureToggleDao featureToggleDao;
    private final AuditEventDao auditEventDao;
    private final ObjectMapper objectMapper;

    public FeatureToggleService(
            FeatureToggleDao featureToggleDao, AuditEventDao auditEventDao, ObjectMapper objectMapper) {
        this.featureToggleDao = featureToggleDao;
        this.auditEventDao = auditEventDao;
        this.objectMapper = objectMapper;
    }

    public List<FeatureToggle> listAll() {
        return featureToggleDao.findAll();
    }

    public boolean isEnabled(String featureName) {
        return featureToggleDao
                .findByName(featureName)
                .map(FeatureToggle::isEnabled)
                .orElse(false);
    }

    public FeatureToggle update(String featureName, boolean enabled, String actorUserId) {
        featureToggleDao.update(featureName, enabled, actorUserId);

        auditEventDao.insert(
                actorUserId,
                "FEATURE_TOGGLE_UPDATED",
                "FEATURE_TOGGLE",
                null,
                safeJson(Map.of("feature_name", featureName, "is_enabled", enabled)));

        return featureToggleDao
                .findByName(featureName)
                .orElseThrow(() -> new IllegalArgumentException("Feature toggle not found: " + featureName));
    }

    private String safeJson(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            return "{}";
        }
    }
}
