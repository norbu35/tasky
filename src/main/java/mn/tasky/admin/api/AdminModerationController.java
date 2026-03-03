package mn.tasky.admin.api;

import jakarta.validation.Valid;
import mn.tasky.admin.dto.StrikePolicyRequest;
import mn.tasky.admin.dto.StrikePolicyResponse;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.ModerationPolicy;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/moderation")
@Validated
public class AdminModerationController {

    private final AuthService authService;

    public AdminModerationController(AuthService authService) {
        this.authService = authService;
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
            policy.updatedAt() != null ? policy.updatedAt()
                .toString() : null);
    }

    @PutMapping("/strike-policy")
    public ResponseEntity<?> updateStrikePolicy(@Valid @RequestBody StrikePolicyRequest body) {
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
        return ResponseEntity.ok(toResponse(updated));
    }
}
