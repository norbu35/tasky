package mn.tasky.notification.api;

import jakarta.validation.Valid;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dto.RegisterDeviceRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications/devices")
@Validated
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<?> register(@AuthenticationPrincipal JwtPrincipal principal, @Valid @RequestBody RegisterDeviceRequest body) {
        notificationService.registerDevice(principal.userId(), body.token(), body.platform());
        return ResponseEntity.ok(Map.of("message", "Device registered successfully."));
    }

    @DeleteMapping("/{token}")
    public ResponseEntity<?> unregister(@AuthenticationPrincipal JwtPrincipal principal, @PathVariable String token) {
        notificationService.unregisterDevice(principal.userId(), token);
        return ResponseEntity.noContent().build();
    }

}
