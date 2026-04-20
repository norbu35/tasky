package mn.tasky.admin.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.admin.dto.AdminActionRequest;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.common.api.CursorPagination;
import mn.tasky.common.api.PagedResponse;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.adminapi.composition.AdminUserCompositionService;
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

@RestController
@RequestMapping("/api/v1/admin/users")
@Validated
public class AdminUserController {

    private final AdminUserCompositionService adminUserCompositionService;

    public AdminUserController(AdminUserCompositionService adminUserCompositionService) {
        this.adminUserCompositionService = adminUserCompositionService;
    }

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(required = false) String name,
            @RequestParam(value = "facebook_id", required = false) String facebookId,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "50") int limit,
            HttpServletRequest request) {
        int clampedLimit = Math.max(1, Math.min(limit, 100));
        try {
            UserProfilePage page;
            if (name != null && !name.isBlank()) {
                page = adminUserCompositionService.searchByName(name, cursor, clampedLimit);
            } else if (facebookId != null && !facebookId.isBlank()) {
                page = adminUserCompositionService.searchByFacebookId(facebookId, cursor, clampedLimit);
            } else if (phone != null && !phone.isBlank()) {
                page = adminUserCompositionService.searchByPhone(phone, cursor, clampedLimit);
            } else {
                return ResponseEntity.badRequest()
                        .body(errorBody(
                                "MISSING_SEARCH_PARAM", "Provide at least one of: name, facebook_id, phone.", request));
            }
            CursorPagination pagination = new CursorPagination(page.nextCursor(), page.hasMore());
            return ResponseEntity.ok(new PagedResponse<>(page.data(), pagination));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest()
                    .body(errorBody("INVALID_CURSOR", "Cursor parameter is invalid.", request));
        }
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<?> ban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body,
            HttpServletRequest request) {
        boolean success = adminUserCompositionService.banUser(principal.userId(), id, body.reason());
        if (!success) {
            return ResponseEntity.status(404).body(errorBody("NOT_FOUND", "User not found.", request));
        }
        return ResponseEntity.ok(Map.of("status", "BANNED"));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<?> unban(
            @AuthenticationPrincipal JwtPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody AdminActionRequest body,
            HttpServletRequest request) {
        boolean success = adminUserCompositionService.unbanUser(principal.userId(), id, body.reason());
        if (!success) {
            return ResponseEntity.status(404).body(errorBody("NOT_FOUND", "User not found.", request));
        }
        return ResponseEntity.ok(Map.of("status", "ACTIVE"));
    }
}
