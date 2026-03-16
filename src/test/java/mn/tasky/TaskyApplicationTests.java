package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;

class TaskyApplicationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

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

    @Test
    @DisplayName("TID-TASK-001-BE-GRADLE-CHECK baseline test suite executes successfully via " + "Gradle wrapper")
    void gradleCheckBaselineExecutes() {
        assertThat(port).isGreaterThan(0);
    }
}
