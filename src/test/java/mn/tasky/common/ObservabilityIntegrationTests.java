package mn.tasky.common;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class ObservabilityIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Test
    @DisplayName("TID-TASK-003-BE-CORRELATION-ID correlation id is logged and propagated")
    void correlationIdLoggedAndPropagated(CapturedOutput output) {
        String correlationId = "task-003-correlation-id";
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Correlation-Id",
            correlationId);

        ResponseEntity<String> versionResponse = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            String.class);

        assertThat(versionResponse.getStatusCode()
            .is2xxSuccessful()).isTrue();
        assertThat(versionResponse.getHeaders()
            .getFirst("X-Correlation-Id")).isEqualTo(correlationId);
        assertThat(versionResponse.getHeaders()
            .getFirst("X-Trace-Id")).isNotBlank();
        assertThat(output).contains("correlation_id=" + correlationId);
    }

    @Test
    @DisplayName("TID-TASK-003-BE-PROMETHEUS-METRICS prometheus endpoint exposes request latency " + "metrics")
    void prometheusEndpointExposesHttpLatencyMetrics() {
        ResponseEntity<String> versionResponse =
            restTemplate.getForEntity("http://localhost:" + port + "/api/v1/system/version",
                String.class);
        assertThat(versionResponse.getStatusCode()
            .is2xxSuccessful()).isTrue();

        ResponseEntity<String> unauthenticatedMetricsResponse =
            restTemplate.getForEntity("http://localhost:" + port + "/actuator/prometheus",
                String.class);
        assertThat(unauthenticatedMetricsResponse.getStatusCode()
            .value()).isEqualTo(401);

        Map<String, Object> loginRequest = Map.of("phone",
            "+97699119911",
            "role",
            "ADMIN");
        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(
            "http://localhost:" + port + "/api/v1/auth/dev/login",
            loginRequest,
            Map.class);
        assertThat(loginResponse.getStatusCode()
            .is2xxSuccessful()).isTrue();
        String accessToken = (String) loginResponse.getBody()
            .get("access_token");
        assertThat(accessToken).isNotBlank();

        HttpHeaders metricsHeaders = new HttpHeaders();
        metricsHeaders.setBearerAuth(accessToken);
        ResponseEntity<String> metricsResponse = restTemplate.exchange(
            "http://localhost:" + port + "/actuator/prometheus",
            HttpMethod.GET,
            new HttpEntity<>(metricsHeaders),
            String.class);

        assertThat(metricsResponse.getStatusCode()
            .is2xxSuccessful()).isTrue();
        assertThat(metricsResponse.getBody()).contains("http_server_requests_seconds");
    }

    @Test
    @DisplayName("TID-TASK-003-BE-ERROR-TRACE-ID error responses include trace id")
    void errorResponsesIncludeTraceId() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.add("X-Correlation-Id",
            "task-003-error-correlation-id");

        ResponseEntity<Map> errorResponse = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
            HttpMethod.POST,
            new HttpEntity<>(headers),
            Map.class);

        assertThat(errorResponse.getStatusCode()
            .isError()).isTrue();
        assertThat(errorResponse.getBody()).containsKey("trace_id");
        assertThat(errorResponse.getHeaders()
            .getFirst("X-Trace-Id")).isNotBlank();
    }
}
