package mn.tasky.admin.api;

import jakarta.validation.Valid;
import mn.tasky.admin.dto.StrikePolicyRequest;
import mn.tasky.admin.dto.StrikePolicyResponse;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.common.audit.AuditEventDao;
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
@RequestMapping("/api/v1/admin/moderation")
@Validated
public class AdminModerationController {

    private final AuthService authService;
    private final AuditEventDao auditEventDao;

    public AdminModerationController(AuthService authService, AuditEventDao auditEventDao) {
        this.authService = authService;
        this.auditEventDao = auditEventDao;
    }

    @GetMapping("/strike-policy")
    public ResponseEntity<?> getStrikePolicy() {
        return ResponseEntity.ok(toResponse(authService.getModerationPolicy()));
    }

    private StrikePolicyResponse toResponse(ModerationPolicy policy) {
        return new StrikePolicyResponse(
                policy.strikeWindowDays(),
                policy.strikeThreshold(),
                policy.firstSuspensionDays(),
                policy.repeatSuspensionDays(),
                policy.repeatOffenseWindowDays(),
                policy.autoUnsuspendEnabled(),
                policy.updatedAt() != null ? policy.updatedAt().toString() : null);
    }

    @PutMapping("/strike-policy")
    public ResponseEntity<?> updateStrikePolicy(
            @AuthenticationPrincipal JwtPrincipal principal, @Valid @RequestBody StrikePolicyRequest body) {
        if (body.repeatSuspensionDays() < body.firstSuspensionDays()) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                            "code",
                            "INVALID_POLICY",
                            "message",
                            "repeatSuspensionDays must be greater than or equal to " + "firstSuspensionDays"));
        }
        if (body.repeatOffenseWindowDays() < body.strikeWindowDays()) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of(
                            "code",
                            "INVALID_POLICY",
                            "message",
                            "repeatOffenseWindowDays must be greater than or equal to " + "strikeWindowDays"));
        }

        ModerationPolicy updated = authService.updateModerationPolicy(
                body.strikeWindowDays(),
                body.strikeThreshold(),
                body.firstSuspensionDays(),
                body.repeatSuspensionDays(),
                body.repeatOffenseWindowDays(),
                body.autoUnsuspendEnabled());
        auditEventDao.insert(principal.userId(), "MODERATION_POLICY_UPDATED", "MODERATION_POLICY", null, null);
        return ResponseEntity.ok(toResponse(updated));
    }
}
