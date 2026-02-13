package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mn.tasky.task.TaskService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class MessagingIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private TaskService taskService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-042-API-CONVERSATION-LIST conversation created on application and visible to participants")
    void conversationCreatedOnApplication() {
        AuthContext customer = authenticate("customer-msg");
        AuthContext tasker = authenticate("tasker-msg");
        String categoryId = "cat-1"; // Assume exists or mocked? No, I need real one. 
        // I'll skip category check logic by mocking or just creating one if needed, but integration test uses real service.
        // TaskService.createTask checks category. I need to insert a category or use existing one.
        // I'll use a hack to create category or assume one exists from previous steps (but DirtiesContext clears it).
        // I'll use Admin API to create category.
        
        String adminToken = tokenFor("ADMIN", "ACTIVE", "admin-1");
        postWithAuth("/api/v1/admin/categories", adminToken, Map.of(
            "name", "Test Cat", 
            "base_price", 5000,
            "name_mn", "Тест",
            "icon_url", "http://example.com/icon.png",
            "sort_order", 1
        ));
        String catId = ((List<Map>) getWithAuth("/api/v1/categories", customer.accessToken()).getBody().get("data")).get(0).get("id").toString();

        // Create Task
        ResponseEntity<Map> taskResponse = postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", catId,
            "description", "Test Task Description Long Enough",
            "budget", 10000,
            "location_lat", 47.9,
            "location_lng", 106.9,
            "location_text", "Ulaanbaatar",
            "scheduled_at", Instant.now().plusSeconds(3600).toString(),
            "photo_keys", List.of()
        ));
        String taskId = (String) taskResponse.getBody().get("id");

        // Activate tasker role
        postWithAuth("/api/v1/users/me/role/tasker", tasker.accessToken(), null);
        // Refresh token to get role
        AuthContext taskerWithRole = authenticate("tasker-msg"); // Re-login to get updated token? No, activate returns new tokens.
        // Actually activateTaskerRole returns tokens. I'll just use authenticate again which should pick up the role if stored.
        // But authenticate creates new user if not exists.
        // I'll just use the token from activate response if I can parse it, or just use `tokenFor` manual.
        String taskerToken = tokenFor("TASKER", "ACTIVE", tasker.userId());

        // Apply
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "I apply"));

        // Check conversations for Customer
        ResponseEntity<Map> conversationsCust = getWithAuth("/api/v1/conversations", customer.accessToken());
        List<Map> listCust = (List<Map>) conversationsCust.getBody().get("data");
        assertThat(listCust).hasSize(1);
        String conversationId = (String) listCust.get(0).get("id");

        // Check conversations for Tasker
        ResponseEntity<Map> conversationsTasker = getWithAuth("/api/v1/conversations", taskerToken);
        List<Map> listTasker = (List<Map>) conversationsTasker.getBody().get("data");
        assertThat(listTasker).hasSize(1);
        assertThat(listTasker.get(0).get("id")).isEqualTo(conversationId);
    }

    @Test
    @DisplayName("TID-TASK-042-API-MESSAGE-SEND send and list messages (TID-TASK-042-API-MESSAGE-LIST)")
    void messageSendAndList() {
        // Setup conversation (reuse logic or mock)
        // I'll do full flow for realism
        AuthContext customer = authenticate("cust-msg-2");
        AuthContext tasker = authenticate("task-msg-2");
        String adminToken = tokenFor("ADMIN", "ACTIVE", "admin-1");
        postWithAuth("/api/v1/admin/categories", adminToken, Map.of(
            "name", "Cat2", 
            "base_price", 5000,
            "name_mn", "Cat2 MN",
            "icon_url", "http://example.com/icon2.png",
            "sort_order", 2
        ));
        String catId = ((List<Map>) getWithAuth("/api/v1/categories", customer.accessToken()).getBody().get("data")).get(0).get("id").toString();
        String taskId = (String) postWithAuth("/api/v1/tasks", customer.accessToken(), Map.of(
            "category_id", catId, 
            "description", "Test Task Description for Messaging", 
            "budget", 10000, 
            "location_lat", 47.9, 
            "location_lng", 106.9, 
            "location_text", "Ulaanbaatar", 
            "scheduled_at", Instant.now().plusSeconds(3600).toString(), 
            "photo_keys", List.of()
        )).getBody().get("id");
        String taskerToken = tokenFor("TASKER", "ACTIVE", tasker.userId());
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Hi"));

        String conversationId = (String) ((List<Map>) getWithAuth("/api/v1/conversations", customer.accessToken()).getBody().get("data")).get(0).get("id");

        // Send 3 messages
        for (int i = 0; i < 3; i++) {
            postWithAuth("/api/v1/conversations/" + conversationId + "/messages", customer.accessToken(), Map.of("content", "Msg " + i));
        }

        // List with limit 2
        // TID-TASK-042-API-MESSAGE-LIST
        ResponseEntity<Map> msgsResponse1 = getWithAuth("/api/v1/conversations/" + conversationId + "/messages?limit=2", taskerToken);
        List<Map> msgs1 = (List<Map>) msgsResponse1.getBody().get("data");
        assertThat(msgs1).hasSize(2);
        
        Map cursor = (Map) msgsResponse1.getBody().get("cursor");
        String next = (String) cursor.get("next");
        assertThat(next).isNotNull();
        assertThat((Boolean) cursor.get("has_more")).isTrue();

        // List next page
        ResponseEntity<Map> msgsResponse2 = getWithAuth("/api/v1/conversations/" + conversationId + "/messages?limit=2&cursor=" + next, taskerToken);
        List<Map> msgs2 = (List<Map>) msgsResponse2.getBody().get("data");
        assertThat(msgs2).hasSize(1);
        assertThat(((Map) msgsResponse2.getBody().get("cursor")).get("has_more")).isEqualTo(false);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9769911" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String tokenFor(String role, String status, String userId) {
        return Jwts.builder()
            .subject(userId)
            .claim("role", role)
            .claim("status", status)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600000))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
            .compact();
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    private ResponseEntity<Map> postWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.POST, entity, Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}
}
