package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import mn.tasky.auth.AuthService;
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
class AdminUserIntegrationTests {

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private AuthService authService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-045-API-ADMIN-USER-SEARCH admin can search users by phone")
    void userSearch() {
        String adminToken = tokenFor("ADMIN", "ACTIVE", "admin-1");
        AuthContext user1 = authenticate("99110001");
        
        ResponseEntity<Map> searchRes = getWithAuth("/api/v1/admin/users/search?phone=99110001", adminToken);
        assertThat(searchRes.getStatusCode().value()).isEqualTo(200);
        List<Map> data = (List<Map>) searchRes.getBody().get("data");
        assertThat(data).anySatisfy(u -> assertThat(u.get("phone")).isEqualTo("+97699110001"));
    }

    @Test
    @DisplayName("TID-TASK-045-API-ADMIN-BAN-UNBAN ban and unban with security enforcement (TID-TASK-045-SEC-BAN-ENFORCEMENT)")
    void banAndUnban() {
        String adminToken = tokenFor("ADMIN", "ACTIVE", "admin-1");
        AuthContext user = authenticate("99110002");

        // 1. Initial access OK
        assertThat(getWithAuth("/api/v1/users/me", user.accessToken()).getStatusCode().value()).isEqualTo(200);

        // 2. Ban user
        ResponseEntity<Map> banRes = postWithAuth("/api/v1/admin/users/" + user.userId() + "/ban", adminToken, Map.of("reason", "Fraud"));
        assertThat(banRes.getStatusCode().value()).isEqualTo(200);

        // 3. Access denied (Security Filter check) - TID-TASK-045-SEC-BAN-ENFORCEMENT
        ResponseEntity<Map> blockedRes = getWithAuth("/api/v1/users/me", user.accessToken());
        assertThat(blockedRes.getStatusCode().value()).isEqualTo(403);
        assertThat(blockedRes.getBody().get("code")).isEqualTo("USER_BANNED");

        // 4. Unban user
        ResponseEntity<Map> unbanRes = postWithAuth("/api/v1/admin/users/" + user.userId() + "/unban", adminToken, Map.of("reason", "Resolved"));
        assertThat(unbanRes.getStatusCode().value()).isEqualTo(200);

        // 5. Access restored
        assertThat(getWithAuth("/api/v1/users/me", user.accessToken()).getStatusCode().value()).isEqualTo(200);
    }

    private AuthContext authenticate(String phonePart) {
        String phone = "+976" + phonePart;
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
