package mn.tasky.admin.api;

import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.admin.dto.UpdateFeatureToggleRequest;
import mn.tasky.common.feature.FeatureToggle;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        return ResponseEntity.ok(Map.of("data", featureToggleService.listAll()));
    }

    @PutMapping
    public ResponseEntity<?> update(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody UpdateFeatureToggleRequest body) {
        FeatureToggle updated = featureToggleService.update(body.featureName(), body.isEnabled(), principal.userId());

        return ResponseEntity.ok(updated);
    }
}
