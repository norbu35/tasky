package mn.tasky.security.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/security")
public class SecurityScopeController {

    @GetMapping("/customer/ping")
    public Map<String, String> customerPing() {
        return Map.of("scope",
            "customer");
    }

    @GetMapping("/tasker/ping")
    public Map<String, String> taskerPing() {
        return Map.of("scope",
            "tasker");
    }

    @GetMapping("/admin/ping")
    public Map<String, String> adminPing() {
        return Map.of("scope",
            "admin");
    }
}
