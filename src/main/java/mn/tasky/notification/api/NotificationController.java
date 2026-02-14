package mn.tasky.notification.api;

import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.application.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/devices")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<?> register(@AuthenticationPrincipal JwtPrincipal principal, @RequestBody DeviceRequest body) {
        notificationService.registerDevice(principal.userId(), body.token(), body.platform());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping
    public ResponseEntity<?> unregister(@AuthenticationPrincipal JwtPrincipal principal, @RequestBody UnregisterRequest body) {
        notificationService.unregisterDevice(principal.userId(), body.token());
        return ResponseEntity.ok().build();
    }

    public record DeviceRequest(String token, String platform) {}
    public record UnregisterRequest(String token) {}
}
