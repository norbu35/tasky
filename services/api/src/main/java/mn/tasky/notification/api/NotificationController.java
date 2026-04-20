package mn.tasky.notification.api;

import jakarta.validation.Valid;
import java.util.Map;
import mn.tasky.api.generated.NotificationsApi;
import mn.tasky.api.generated.model.RegisterDevice200Response;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.runtime.publicapi.composition.NotificationCompositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/devices")
@Validated
@SuppressWarnings("unchecked")
public class NotificationController implements NotificationsApi {

    private final NotificationCompositionService notificationCompositionService;

    public NotificationController(NotificationCompositionService notificationCompositionService) {
        this.notificationCompositionService = notificationCompositionService;
    }

    @Override
    @PostMapping(consumes = {"application/json"})
    public ResponseEntity<RegisterDevice200Response> registerDevice(
            @Valid @RequestBody mn.tasky.api.generated.model.RegisterDeviceRequest registerDeviceRequest) {
        JwtPrincipal principal = getPrincipal();
        var domainReq = new mn.tasky.notification.dto.RegisterDeviceRequest(
                registerDeviceRequest.getToken(),
                registerDeviceRequest.getPlatform().getValue());
        notificationCompositionService.registerDevice(principal.userId(), domainReq);
        return (ResponseEntity<RegisterDevice200Response>)
                (ResponseEntity<?>) ResponseEntity.ok(Map.of("message", "Device registered successfully."));
    }

    @Override
    @DeleteMapping("/{token}")
    public ResponseEntity<Void> unregisterDevice(@PathVariable("token") String token) {
        JwtPrincipal principal = getPrincipal();
        notificationCompositionService.unregisterDevice(principal.userId(), token);
        return ResponseEntity.noContent().build();
    }

    private JwtPrincipal getPrincipal() {
        return (JwtPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
