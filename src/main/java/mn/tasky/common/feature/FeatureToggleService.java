package mn.tasky.common.feature;

import java.util.List;
import mn.tasky.common.audit.AuditEventDao;
import org.springframework.stereotype.Service;

@Service
public class FeatureToggleService {

    private final FeatureToggleDao featureToggleDao;
    private final AuditEventDao auditEventDao;

    public FeatureToggleService(FeatureToggleDao featureToggleDao, AuditEventDao auditEventDao) {
        this.featureToggleDao = featureToggleDao;
        this.auditEventDao = auditEventDao;
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
                "{\"feature_name\":\"" + featureName + "\",\"is_enabled\":" + enabled + "}");

        return featureToggleDao
                .findByName(featureName)
                .orElseThrow(() -> new IllegalArgumentException("Feature toggle not found: " + featureName));
    }
}
