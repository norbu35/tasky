package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TaskyApplicationTests {

    @LocalServerPort
    private int port;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-001-BE-HEALTH-CHECK actuator health endpoint responds")
    void healthEndpointResponds() {
        ResponseEntity<String> response =
            restTemplate.getForEntity("http://localhost:" + port + "/actuator/health", String.class);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("TID-TASK-001-ENV-DOCKER-UP system version endpoint responds")
    void versionEndpointResponds() {
        ResponseEntity<String> response =
            restTemplate.getForEntity("http://localhost:" + port + "/api/v1/system/version", String.class);
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).contains("api_version");
    }
}
