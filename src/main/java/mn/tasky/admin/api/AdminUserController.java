package mn.tasky.admin.api;

import jakarta.validation.Valid;
import mn.tasky.admin.dto.AdminActionRequest;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfilePage;
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

import java.util.Map;

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
        int clampedLimit = Math.max(1,
                                    Math.min(limit,
                                             100));
        try {
            UserProfilePage page = authService.searchUsersByPhone(phone,
                                                                  cursor,
                                                                  clampedLimit);
            CursorPagination pagination = new CursorPagination(page.nextCursor(),
                                                               page.hasMore());
            return ResponseEntity.ok(new PagedResponse<>(page.data(),
                                                         pagination));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(Map.of("code",
                                 "INVALID_CURSOR",
                                 "message",
                                 "Cursor parameter is invalid."));
        }
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<?> ban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body) {
        boolean success = authService.banUser(principal.userId(),
                                              id,
                                              body.reason());
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("status",
                                        "BANNED"));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<?> unban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body) {
        boolean success = authService.unbanUser(principal.userId(),
                                                id,
                                                body.reason());
        if (!success) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("status",
                                        "ACTIVE"));
    }
}
