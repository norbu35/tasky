package mn.tasky.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ServiceAreaIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("TASKER can PUT district slugs then GET them back")
    void taskerServiceAreaCrud() {
        AuthContext tasker = devLogin("+97699000001", "TASKER");

        // PUT two district slugs
        ResponseEntity<Map> putRes = putWithAuth(
                "/api/v1/taskers/me/service-areas",
                tasker.accessToken(),
                Map.of("district_slugs", List.of("bayangol", "sukhbaatar")));
        assertThat(putRes.getStatusCode().value()).isEqualTo(204);

        // GET and verify two districts returned
        ResponseEntity<Map> getRes = getWithAuth("/api/v1/taskers/me/service-areas", tasker.accessToken());
        assertThat(getRes.getStatusCode().value()).isEqualTo(200);

        List<Map<String, Object>> data = (List<Map<String, Object>>) getRes.getBody().get("data");
        assertThat(data).hasSize(2);
        List<String> slugs = data.stream().map(d -> (String) d.get("slug")).toList();
        assertThat(slugs).containsExactlyInAnyOrder("bayangol", "sukhbaatar");
    }

    @Test
    @DisplayName("CUSTOMER gets 403 on GET /api/v1/taskers/me/service-areas")
    void customerForbidden() {
        AuthContext customer = devLogin("+97699000002", "CUSTOMER");

        ResponseEntity<Map> getRes = getWithAuth("/api/v1/taskers/me/service-areas", customer.accessToken());
        assertThat(getRes.getStatusCode().value()).isEqualTo(403);
    }

    private AuthContext devLogin(String phone, String role) {
        ResponseEntity<Map> response = post(
                "/api/v1/auth/dev/login", Map.of("phone", phone, "role", role));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    private ResponseEntity<Map> putWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.PUT, entity, Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    record AuthContext(String userId, String accessToken) {}
}
