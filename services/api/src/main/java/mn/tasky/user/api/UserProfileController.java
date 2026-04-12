package mn.tasky.user.api;

import static mn.tasky.common.api.ApiResponseSupport.resolveTraceId;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.Map;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.common.storage.StorageKeyPolicy;
import mn.tasky.user.dto.AvatarUploadUrlRequest;
import mn.tasky.user.dto.ProfileResponse;
import mn.tasky.user.dto.UpdateProfileRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Validated
public class UserProfileController {

    private final AuthService authService;
    private final UserDao userDao;
    private final AuditEventDao auditEventDao;
    private final StorageKeyPolicy storageKeyPolicy;

    public UserProfileController(
            AuthService authService, UserDao userDao, AuditEventDao auditEventDao, StorageKeyPolicy storageKeyPolicy) {
        this.authService = authService;
        this.userDao = userDao;
        this.auditEventDao = auditEventDao;
        this.storageKeyPolicy = storageKeyPolicy;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        return authService
                .getProfile(principal.userId())
                .<ResponseEntity<?>>map(profile -> ResponseEntity.ok(toProfileResponse(profile)))
                .orElseGet(() -> unauthorizedResponse(request));
    }

    private ProfileResponse toProfileResponse(UserProfile profile) {
        return new ProfileResponse(
                profile.id(),
                profile.phone(),
                profile.role(),
                profile.status(),
                profile.fullName(),
                profile.avatarUrl(),
                profile.ratingAvg(),
                profile.completedTasks(),
                profile.isPro(),
                profile.createdAt());
    }

    private ResponseEntity<Map<String, String>> unauthorizedResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "code",
                        "USER_NOT_FOUND",
                        "message",
                        "Authenticated user could not be resolved.",
                        "trace_id",
                        resolveTraceId(request)));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest body,
            HttpServletRequest request) {
        if (body.avatarUrl() != null) {
            try {
                storageKeyPolicy.validateOwnedKey(
                        extractAvatarStorageKey(body.avatarUrl()),
                        StorageKeyPolicy.Namespace.AVATAR,
                        principal.userId());
            } catch (IllegalArgumentException exception) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "code",
                                "INVALID_AVATAR_KEY",
                                "message",
                                "Avatar key must belong to the caller's avatar namespace.",
                                "trace_id",
                                resolveTraceId(request)));
            }
        }

        ProfileUpdate update = new ProfileUpdate(body.fullName(), body.avatarUrl());

        return authService
                .updateProfile(principal.userId(), update)
                .<ResponseEntity<?>>map(profile -> ResponseEntity.ok(toProfileResponse(profile)))
                .orElseGet(() -> unauthorizedResponse(request));
    }

    @PostMapping("/me/role/tasker")
    public ResponseEntity<?> activateTaskerRole(
            @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        return authService
                .activateTaskerRole(principal.userId())
                .<ResponseEntity<?>>map(result -> ResponseEntity.ok(Map.of(
                        "access_token",
                        result.accessToken(),
                        "refresh_token",
                        result.refreshToken(),
                        "user",
                        result.user())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of(
                                "code",
                                "ROLE_ALREADY_ASSIGNED",
                                "message",
                                "User is already TASKER or ADMIN.",
                                "trace_id",
                                resolveTraceId(request))));
    }

    @PostMapping("/me/avatar/upload-url")
    public ResponseEntity<?> getAvatarUploadUrl(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody AvatarUploadUrlRequest body,
            HttpServletRequest request) {
        return authService
                .createAvatarUploadUrl(principal.userId(), body.contentType())
                .<ResponseEntity<?>>map(upload ->
                        ResponseEntity.ok(Map.of("upload_url", upload.uploadUrl(), "storage_key", upload.storageKey())))
                .orElseGet(() -> unauthorizedResponse(request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(@AuthenticationPrincipal JwtPrincipal principal) {
        userDao.updateStatus(principal.userId(), "DELETED");

        auditEventDao.insert(
                principal.userId(),
                "USER_SELF_DELETE_REQUEST",
                "USER",
                principal.userId(),
                "{\"reason\":\"USER_SELF_DELETE_REQUEST\"}");

        return ResponseEntity.ok(
                Map.of("message", "Account deletion requested. Data will be removed after 90-day retention period."));
    }

    private String extractAvatarStorageKey(String avatarUrl) {
        if (avatarUrl.startsWith("uploads/")) {
            return avatarUrl;
        }

        URI uri = URI.create(avatarUrl);
        String host = uri.getHost();
        if (!"cdn.tasky.mn".equals(host) && !"cdn.tasky.local".equals(host)) {
            throw new IllegalArgumentException("Invalid avatar URL");
        }

        String path = uri.getPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Invalid avatar URL");
        }

        return path.startsWith("/") ? path.substring(1) : path;
    }
}
