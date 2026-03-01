package mn.tasky.auth;

import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "tasky.dev-auth.enabled=true")
class DevAuthIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("TID-TASK-010-DEV-AUTH-BYPASS local dev auth issues a session without OTP " + "challenge")
    void devAuthBypassIssuesSession() {
        String phone = uniquePhone("55");
        ResponseEntity<Map> response = post("/api/v1/auth/dev/login", Map.of("phone", phone, "role", "TASKER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys("access_token", "refresh_token", "user");
        Map<String, Object> user = (Map<String, Object>) response.getBody().get("user");
        assertThat(user.get("phone")).isEqualTo(phone);
        assertThat(user.get("role")).isEqualTo("TASKER");
    }

    private String uniquePhone(String prefix) {
        String digits = UUID.randomUUID().toString().replaceAll("[^0-9]", "") + "0123456789";
        return "+976" + prefix + digits.substring(0, 6);
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @DisplayName("TID-TASK-010-DEV-AUTH-VALIDATION rejects unsupported dev auth roles")
    void devAuthRejectsUnsupportedRoles() {
        String phone = uniquePhone("54");
        ResponseEntity<Map> response = post("/api/v1/auth/dev/login", Map.of("phone", phone, "role", "HACKER"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
