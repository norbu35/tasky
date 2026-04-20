package mn.tasky.user.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.identity.publicapi.IdentityCommandPort;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.runtime.publicapi.composition.UserProfileCompositionService;
import mn.tasky.runtime.publicapi.composition.UserProfileUpdateOutcome;
import mn.tasky.runtime.publicapi.composition.UserProfileUpdateService;
import mn.tasky.runtime.user.composition.UserAccountDeletionService;
import mn.tasky.user.dto.AvatarUploadUrlRequest;
import mn.tasky.user.dto.UpdateProfileRequest;
import mn.tasky.user.dto.UserStatsResponse;
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

    private final IdentityCommandPort identityCommandPort;
    private final IdentityQueryPort identityQueryPort;
    private final UserProfileCompositionService userProfileCompositionService;
    private final UserProfileUpdateService userProfileUpdateService;
    private final UserAccountDeletionService userAccountDeletionService;

    public UserProfileController(
            IdentityCommandPort identityCommandPort,
            IdentityQueryPort identityQueryPort,
            UserProfileCompositionService userProfileCompositionService,
            UserProfileUpdateService userProfileUpdateService,
            UserAccountDeletionService userAccountDeletionService) {
        this.identityCommandPort = identityCommandPort;
        this.identityQueryPort = identityQueryPort;
        this.userProfileCompositionService = userProfileCompositionService;
        this.userProfileUpdateService = userProfileUpdateService;
        this.userAccountDeletionService = userAccountDeletionService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        return identityQueryPort
                .getProfile(principal.userId())
                .<ResponseEntity<?>>map(
                        profile -> ResponseEntity.ok(userProfileCompositionService.profileResponse(profile)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(errorBody("USER_NOT_FOUND", "Authenticated user could not be resolved.", request)));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest body,
            HttpServletRequest request) {
        UserProfileUpdateOutcome outcome = userProfileUpdateService.updateProfile(
                principal.userId(), body.fullName(), body.avatarUrl(), body.bio());
        return switch (outcome.status()) {
            case SUCCESS -> ResponseEntity.ok(outcome.profile());
            case INVALID_AVATAR_KEY -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody(
                            "INVALID_AVATAR_KEY", "Avatar key must belong to the caller's avatar namespace.", request));
            case USER_NOT_FOUND -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorBody("USER_NOT_FOUND", "Authenticated user could not be resolved.", request));
        };
    }

    @PostMapping("/me/role/tasker")
    public ResponseEntity<?> activateTaskerRole(
            @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        return identityCommandPort
                .activateTaskerRole(principal.userId())
                .<ResponseEntity<?>>map(
                        result -> ResponseEntity.ok(userProfileCompositionService.roleActivationResponse(result)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(errorBody("ROLE_ALREADY_ASSIGNED", "User is already TASKER or ADMIN.", request)));
    }

    @PostMapping("/me/avatar/upload-url")
    public ResponseEntity<?> getAvatarUploadUrl(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody AvatarUploadUrlRequest body,
            HttpServletRequest request) {
        return identityCommandPort
                .createAvatarUploadUrl(principal.userId(), body.contentType())
                .<ResponseEntity<?>>map(
                        upload -> ResponseEntity.ok(userProfileCompositionService.avatarUploadResponse(upload)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(errorBody("USER_NOT_FOUND", "Authenticated user could not be resolved.", request)));
    }

    @GetMapping("/me/stats")
    public ResponseEntity<?> getMyStats(@AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(identityQueryPort
                .getUserStats(principal.userId())
                .orElseGet(() -> new UserStatsResponse(0, 0.0, null, null)));
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyAccount(@AuthenticationPrincipal JwtPrincipal principal) {
        return ResponseEntity.ok(userAccountDeletionService.deleteMyAccount(principal.userId()));
    }
}
