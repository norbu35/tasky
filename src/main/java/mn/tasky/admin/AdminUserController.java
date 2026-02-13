package mn.tasky.admin;

import java.util.List;
import java.util.Map;
import mn.tasky.auth.AuthService;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final AuthService authService;

    public AdminUserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam String phone) {
        List<AuthService.UserProfile> users = authService.searchUsersByPhone(phone);
        return ResponseEntity.ok(Map.of("data", users));
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<?> ban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestBody AdminActionRequest body) {
        boolean success = authService.banUser(principal.userId(), id, body.reason());
        if (!success) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("status", "BANNED"));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<?> unban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @RequestBody AdminActionRequest body) {
        boolean success = authService.unbanUser(principal.userId(), id, body.reason());
        if (!success) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("status", "ACTIVE"));
    }

    public record AdminActionRequest(String reason) {}
}
