package mn.tasky.common.feature;

import java.time.Instant;

public record FeatureToggle(
        String id,
        String featureName,
        boolean isEnabled,
        Instant activatedAt,
        Instant deactivatedAt,
        String updatedBy,
        Instant updatedAt) {}
