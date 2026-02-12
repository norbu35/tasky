package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ExtendWith(OutputCaptureExtension.class)
class ObservabilityIntegrationTests {

    @LocalServerPort
    private int port;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-003-BE-CORRELATION-ID correlation id is logged and prometheus exposes request latency metrics")
    void correlationIdLoggedAndMetricsExposed(CapturedOutput output) {
        String correlationId = "task-003-correlation-id";
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Correlation-Id", correlationId);

        ResponseEntity<String> versionResponse = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            String.class
        );

        assertThat(versionResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(versionResponse.getHeaders().getFirst("X-Correlation-Id")).isEqualTo(correlationId);
        assertThat(versionResponse.getHeaders().getFirst("X-Trace-Id")).isNotBlank();

        ResponseEntity<String> metricsResponse =
            restTemplate.getForEntity("http://localhost:" + port + "/actuator/prometheus", String.class);

        assertThat(metricsResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(metricsResponse.getBody()).contains("http_server_requests_seconds");
        assertThat(output).contains("correlation_id=" + correlationId);
    }

    @Test
    @DisplayName("TID-TASK-003-BE-ERROR-TRACE-ID error responses include trace id")
    void errorResponsesIncludeTraceId() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.add("X-Correlation-Id", "task-003-error-correlation-id");

        ResponseEntity<Map> errorResponse = restTemplate.exchange(
            "http://localhost:" + port + "/api/v1/system/version",
            HttpMethod.POST,
            new HttpEntity<>(headers),
            Map.class
        );

        assertThat(errorResponse.getStatusCode().isError()).isTrue();
        assertThat(errorResponse.getBody()).containsKey("trace_id");
        assertThat(errorResponse.getHeaders().getFirst("X-Trace-Id")).isNotBlank();
    }
}
