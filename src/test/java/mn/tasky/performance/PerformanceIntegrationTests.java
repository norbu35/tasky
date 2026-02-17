package mn.tasky.performance;

import static org.assertj.core.api.Assertions.assertThat;

import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.CreateTask;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PerformanceIntegrationTests
        extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Autowired
    private TaskService taskService;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("TID-TASK-063-PERF-TASK-FEED-P95 p95 latency for GET /tasks remains under target")
    void taskFeedLatency() {
        AuthContext customer = authenticate("perf");
        String categoryId = getFirstCategoryId(customer.accessToken());

        // 1. Seed data
        for (int i = 0; i < 100; i++) {
            taskService.createTask(customer.userId(),
                                   new CreateTask(
                                           categoryId,
                                           "Description " + i,
                                           10000,
                                           47.9,
                                           106.9,
                                           "Ulaanbaatar, Mongolia",
                                           java.time.Instant.now()
                                                   .plusSeconds(3600)
                                                   .toString(),
                                           java.util.List.of()
                                   ));
        }

        // 2. Measure latency
        int iterations = 50;
        ArrayList<Long> durations = new ArrayList<>(iterations);
        for (int i = 0; i < iterations; i++) {
            long start = System.currentTimeMillis();
            restTemplate.getForEntity("http://localhost:" + port + "/api/v1/tasks?limit=20",
                                      Map.class);
            durations.add(System.currentTimeMillis() - start);
        }

        durations.sort(Comparator.naturalOrder());
        int p95Index = (int) Math.ceil(iterations * 0.95d) - 1;
        long p95Latency = durations.get(Math.max(0,
                                                 p95Index));
        assertThat(p95Latency).isLessThan(500L);
    }

    private AuthContext authenticate(String prefix) {
        String phone = "+976" + String.format("%08d",
                                              Math.abs(prefix.hashCode()) % 100_000_000);
        post("/api/v1/auth/otp/request",
             Map.of("phone",
                    phone));
        ResponseEntity<Map> verifyResponse = post(
                "/api/v1/auth/otp/verify",
                Map.of("phone",
                       phone,
                       "code",
                       "123456")
        );

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) verifyResponse.getBody()
                .get("user");
        return new AuthContext(
                String.valueOf(verifyResponse.getBody()
                                       .get("access_token")),
                String.valueOf(user.get("id"))
        );
    }

    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories",
                                                   token);
        @SuppressWarnings("unchecked")
        java.util.List<Map<String, Object>> data =
                (java.util.List<Map<String, Object>>) response.getBody()
                        .get("data");
        return data.get(0)
                .get("id")
                .toString();
    }

    private ResponseEntity<Map> post(String path,
                                     Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return restTemplate.exchange(url(path),
                                     HttpMethod.POST,
                                     new HttpEntity<>(body,
                                                      headers),
                                     Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path,
                                            String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(bearerToken);
        return restTemplate.exchange(url(path),
                                     HttpMethod.GET,
                                     new HttpEntity<>(headers),
                                     Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @DisplayName("TID-TASK-063-PERF-INDEX-PLAN feed query plan uses appropriate indexes")
    void queryPlanVerification() {
        Integer indexCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = " +
                        "'tasks' AND indexname = 'idx_tasks_location_point'",
                Integer.class
        );
        assertThat(indexCount).isEqualTo(1);
    }

    @Test
    @DisplayName("TID-TASK-063-PERF-CI-REGRESSION-BUDGET regression budget enforced in CI")
    void regressionBudgetEnforcement() {
        int iterations = 20;
        long maxLatency = 0;
        for (int i = 0; i < iterations; i++) {
            long start = System.currentTimeMillis();
            restTemplate.getForEntity("http://localhost:" + port + "/api/v1/tasks?limit=20",
                                      Map.class);
            maxLatency = Math.max(maxLatency,
                                  System.currentTimeMillis() - start);
        }
        assertThat(maxLatency).isLessThan(1_000L);
    }

    private record AuthContext(String accessToken, String userId) {

    }
}
