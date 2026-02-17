package mn.tasky.admin.api;

import jakarta.validation.Valid;
import mn.tasky.admin.dto.AdminActionRequest;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Comparator;

@RestController
@RequestMapping("/api/v1/admin/users")
@Validated
public class AdminUserController {

    private final AuthService authService;

    public AdminUserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<?> search(
        @RequestParam String phone,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "50") int limit
    ) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        List<UserProfile> users = authService.searchUsersByPhone(phone).stream()
            .sorted(Comparator.comparing(UserProfile::id))
            .toList();

        int start = 0;
        if (cursor != null && !cursor.isBlank()) {
            for (int i = 0; i < users.size(); i++) {
                if (cursor.equals(users.get(i).id())) {
                    start = i + 1;
                    break;
                }
            }
        }

        int end = Math.min(start + clampedLimit, users.size());
        List<UserProfile> page = users.subList(start, end);
        boolean hasMore = end < users.size();
        String next = hasMore && !page.isEmpty() ? page.getLast().id() : null;
        CursorPagination pagination = new CursorPagination(next, hasMore);
        return ResponseEntity.ok(new PagedResponse<>(page, pagination));
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<?> ban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body) {
        boolean success = authService.banUser(principal.userId(), id, body.reason());
        if (!success) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("status", "BANNED"));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<?> unban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body) {
        boolean success = authService.unbanUser(principal.userId(), id, body.reason());
        if (!success) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("status", "ACTIVE"));
    }
}
