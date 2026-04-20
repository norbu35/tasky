package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.admin.dto.StrikePolicyRequest;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminModerationCompositionService;
import mn.tasky.runtime.adminapi.composition.AdminModerationPolicyUpdateOutcome;
import mn.tasky.runtime.adminapi.composition.AdminModerationPolicyUpdateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/moderation")
@Validated
public class AdminModerationController {

    private final AdminModerationCompositionService adminModerationCompositionService;
    private final AdminModerationPolicyUpdateService adminModerationPolicyUpdateService;

    public AdminModerationController(
            AdminModerationCompositionService adminModerationCompositionService,
            AdminModerationPolicyUpdateService adminModerationPolicyUpdateService) {
        this.adminModerationCompositionService = adminModerationCompositionService;
        this.adminModerationPolicyUpdateService = adminModerationPolicyUpdateService;
    }

    @GetMapping("/strike-policy")
    public ResponseEntity<?> getStrikePolicy() {
        return ResponseEntity.ok(adminModerationCompositionService.currentStrikePolicy());
    }

    @PutMapping("/strike-policy")
    public ResponseEntity<?> updateStrikePolicy(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody StrikePolicyRequest body,
            HttpServletRequest request) {
        AdminModerationPolicyUpdateOutcome outcome =
                adminModerationPolicyUpdateService.updatePolicy(principal.userId(), body);
        return switch (outcome.status()) {
            case SUCCESS -> ResponseEntity.ok(outcome.body());
            case INVALID_POLICY -> ResponseEntity.badRequest()
                    .body(errorBody(outcome.errorCode(), outcome.errorMessage(), request));
        };
    }
}
