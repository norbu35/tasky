package mn.tasky.admin.api;

import mn.tasky.common.feature.FeatureToggle;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/features/toggles")
@Validated
public class AdminFeatureToggleController {

    private final FeatureToggleService featureToggleService;

    public AdminFeatureToggleController(FeatureToggleService featureToggleService) {
        this.featureToggleService = featureToggleService;
    }

    @GetMapping
    public ResponseEntity<?> listAll() {
        return ResponseEntity.ok(Map.of("data",
            featureToggleService.listAll()));
    }

    @PutMapping
    public ResponseEntity<?> update(
        @AuthenticationPrincipal JwtPrincipal principal,
        @RequestBody Map<String, Object> body) {
        String featureName = (String) body.get("feature_name");
        boolean isEnabled = (Boolean) body.get("is_enabled");

        FeatureToggle updated = featureToggleService.update(
            featureName,
            isEnabled,
            principal.userId());

        return ResponseEntity.ok(updated);
    }
}
