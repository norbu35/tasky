package mn.tasky.notification.api;

import static mn.tasky.common.api.ApiResponseSupport.errorBody;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.dto.District;
import mn.tasky.notification.publicapi.NotificationCommandPort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/taskers/me/service-areas")
public class ServiceAreaController {

    private final NotificationCommandPort notificationCommandPort;

    public ServiceAreaController(NotificationCommandPort notificationCommandPort) {
        this.notificationCommandPort = notificationCommandPort;
    }

    @GetMapping
    public ResponseEntity<?> getServiceAreas(
            @AuthenticationPrincipal JwtPrincipal principal, HttpServletRequest request) {
        if (!"TASKER".equals(principal.role())) {
            return ResponseEntity.status(403).body(errorBody("FORBIDDEN", "Tasker role required.", request));
        }
        List<District> areas = notificationCommandPort.getServiceAreas(principal.userId());
        List<Map<String, Object>> data = areas.stream()
                .map(d -> Map.<String, Object>of(
                        "id", d.id(),
                        "name", d.name(),
                        "name_mn", d.nameMn(),
                        "slug", d.slug()))
                .toList();
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PutMapping
    public ResponseEntity<?> setServiceAreas(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestBody Map<String, List<String>> body,
            HttpServletRequest request) {
        if (!"TASKER".equals(principal.role())) {
            return ResponseEntity.status(403).body(errorBody("FORBIDDEN", "Tasker role required.", request));
        }
        List<String> slugs = body.getOrDefault("district_slugs", List.of());
        notificationCommandPort.setServiceAreas(principal.userId(), slugs);
        return ResponseEntity.noContent().build();
    }
}
