package mn.tasky.security.api;

import java.util.Map;
import mn.tasky.api.generated.SecurityApi;
import mn.tasky.api.generated.model.PingAdmin200Response;
import mn.tasky.api.generated.model.PingCustomer200Response;
import mn.tasky.api.generated.model.PingTasker200Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/security")
@SuppressWarnings("unchecked")
public class SecurityScopeController implements SecurityApi {

    @Override
    @GetMapping("/customer/ping")
    public ResponseEntity<PingCustomer200Response> pingCustomer() {
        return (ResponseEntity<PingCustomer200Response>)
                (ResponseEntity<?>) ResponseEntity.ok(Map.of("scope", "customer"));
    }

    @Override
    @GetMapping("/tasker/ping")
    public ResponseEntity<PingTasker200Response> pingTasker() {
        return (ResponseEntity<PingTasker200Response>) (ResponseEntity<?>) ResponseEntity.ok(Map.of("scope", "tasker"));
    }

    @Override
    @GetMapping("/admin/ping")
    public ResponseEntity<PingAdmin200Response> pingAdmin() {
        return (ResponseEntity<PingAdmin200Response>) (ResponseEntity<?>) ResponseEntity.ok(Map.of("scope", "admin"));
    }
}
