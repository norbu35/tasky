package mn.tasky.user.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.application.AuthService;
import mn.tasky.common.observability.RequestObservabilityFilter;
import mn.tasky.common.security.JwtPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
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

    public UserProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(
        @AuthenticationPrincipal JwtPrincipal principal,
        HttpServletRequest request
    ) {
        return authService.getProfile(principal.userId())
            .<ResponseEntity<?>>map(profile -> ResponseEntity.ok(toProfileResponse(profile)))
            .orElseGet(() -> unauthorizedResponse(request));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody UpdateProfileBody body,
        HttpServletRequest request
    ) {
        AuthService.ProfileUpdate update = new AuthService.ProfileUpdate(
            body.fullName(),
            body.avatarUrl()
        );

        return authService.updateProfile(principal.userId(), update)
            .<ResponseEntity<?>>map(profile -> ResponseEntity.ok(toProfileResponse(profile)))
            .orElseGet(() -> unauthorizedResponse(request));
    }

    @PostMapping("/me/role/tasker")
    public ResponseEntity<?> activateTaskerRole(
        @AuthenticationPrincipal JwtPrincipal principal,
        HttpServletRequest request
    ) {
        return authService.activateTaskerRole(principal.userId())
            .<ResponseEntity<?>>map(result -> ResponseEntity.ok(
                Map.of(
                    "access_token", result.accessToken(),
                    "refresh_token", result.refreshToken(),
                    "user", result.user()
                )
            ))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of(
                    "code", "ROLE_ALREADY_ASSIGNED",
                    "message", "User is already TASKER or ADMIN.",
                    "trace_id", resolveTraceId(request)
                )
            ));
    }

    @PostMapping("/me/avatar/upload-url")
    public ResponseEntity<?> getAvatarUploadUrl(
        @AuthenticationPrincipal JwtPrincipal principal,
        @Valid @RequestBody AvatarUploadUrlBody body,
        HttpServletRequest request
    ) {
        return authService.createAvatarUploadUrl(principal.userId(), body.contentType())
            .<ResponseEntity<?>>map(upload -> ResponseEntity.ok(
                Map.of(
                    "upload_url", upload.uploadUrl(),
                    "storage_key", upload.storageKey()
                )
            ))
            .orElseGet(() -> unauthorizedResponse(request));
    }

    private ProfileResponse toProfileResponse(AuthService.UserProfile profile) {
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
            profile.createdAt()
        );
    }

    private ResponseEntity<Map<String, String>> unauthorizedResponse(HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
            Map.of(
                "code", "USER_NOT_FOUND",
                "message", "Authenticated user could not be resolved.",
                "trace_id", resolveTraceId(request)
            )
        );
    }

    private String resolveTraceId(HttpServletRequest request) {
        Object traceId = request.getAttribute(RequestObservabilityFilter.TRACE_ID_ATTRIBUTE);
        if (traceId != null) {
            return traceId.toString();
        }
        return UUID.randomUUID().toString();
    }

    public record UpdateProfileBody(
        @JsonProperty("full_name")
        @Size(min = 1, max = 100)
        @Pattern(regexp = ".*\\S.*")
        String fullName,
        @JsonProperty("avatar_url")
        @Size(max = 512)
        @Pattern(regexp = "^(https?://\\S+|uploads/\\S+)$")
        String avatarUrl
    ) {
    }

    public record AvatarUploadUrlBody(
        @JsonProperty("content_type")
        @NotBlank
        @Pattern(
            regexp = "^(image/jpeg|image/png|image/webp)$",
            flags = Pattern.Flag.CASE_INSENSITIVE
        )
        String contentType
    ) {
    }

    public record ProfileResponse(
        String id,
        String phone,
        String role,
        String status,
        @JsonProperty("full_name")
        String fullName,
        @JsonProperty("avatar_url")
        String avatarUrl,
        @JsonProperty("rating_avg")
        double ratingAvg,
        @JsonProperty("completed_tasks")
        int completedTasks,
        @JsonProperty("is_pro")
        boolean isPro,
        @JsonProperty("created_at")
        String createdAt
    ) {
    }
}
