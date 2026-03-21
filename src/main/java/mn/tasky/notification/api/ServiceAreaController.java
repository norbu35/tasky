package mn.tasky.notification.api;

import java.util.List;
import java.util.Map;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.District;
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

    private final TaskerServiceAreaDao serviceAreaDao;

    public ServiceAreaController(TaskerServiceAreaDao serviceAreaDao) {
        this.serviceAreaDao = serviceAreaDao;
    }

    @GetMapping
    public ResponseEntity<?> getServiceAreas(@AuthenticationPrincipal JwtPrincipal principal) {
        if (!"TASKER".equals(principal.role())) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN"));
        }
        List<District> areas = serviceAreaDao.findByUserId(principal.userId());
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
            @RequestBody Map<String, List<String>> body) {
        if (!"TASKER".equals(principal.role())) {
            return ResponseEntity.status(403).body(Map.of("code", "FORBIDDEN"));
        }
        List<String> slugs = body.getOrDefault("district_slugs", List.of());
        serviceAreaDao.deleteByUserId(principal.userId());
        for (String slug : slugs) {
            serviceAreaDao.insertBySlug(principal.userId(), slug);
        }
        return ResponseEntity.noContent().build();
    }
}
