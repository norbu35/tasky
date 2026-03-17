package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskRescueEventDao;
import mn.tasky.task.scheduling.RescueScheduler;
import org.jdbi.v3.core.Jdbi;
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
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@SuppressWarnings({"rawtypes", "unchecked", "ConstantConditions"})
class RescueFlowIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private TaskDao taskDao;

    @Autowired
    private TaskRescueEventDao taskRescueEventDao;

    @Autowired
    private RescueScheduler rescueScheduler;

    @Autowired
    private Jdbi jdbi;

    @Test
    @DisplayName("TIERS-007: Rescue triggers for old task with zero applications")
    void rescueTriggerForOldTaskWithNoApplications() {
        AuthContext customer = authenticate("rescue-cust");

        String taskId = createTask(customer.accessToken());

        // Backdate created_at to exceed the 120-minute threshold
        Instant oldCreatedAt = Instant.now().minus(3, ChronoUnit.HOURS);
        backdateTaskCreatedAt(taskId, oldCreatedAt);

        assertThat(taskRescueEventDao.existsByTaskId(taskId)).isFalse();

        // Run rescue processing directly
        rescueScheduler.checkRescue();

        // Verify rescue event was created
        assertThat(taskRescueEventDao.existsByTaskId(taskId)).isTrue();
    }

    @Test
    @DisplayName("TIERS-007: Rescue does not trigger twice for same task")
    void rescueDoesNotTriggerTwice() {
        AuthContext customer = authenticate("rescue-twice-cust");

        String taskId = createTask(customer.accessToken());
        Instant oldCreatedAt = Instant.now().minus(3, ChronoUnit.HOURS);
        backdateTaskCreatedAt(taskId, oldCreatedAt);

        // Run rescue twice
        rescueScheduler.checkRescue();
        assertThat(taskRescueEventDao.existsByTaskId(taskId)).isTrue();

        // Second run should be idempotent — no duplicate, no exception
        rescueScheduler.checkRescue();
        assertThat(taskRescueEventDao.existsByTaskId(taskId)).isTrue();
    }

    private void backdateTaskCreatedAt(String taskId, Instant oldTime) {
        jdbi.useHandle(
                handle -> handle.createUpdate("UPDATE tasks SET created_at = :createdAt WHERE id = CAST(:id AS uuid)")
                        .bind("createdAt", oldTime)
                        .bind("id", taskId)
                        .execute());
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9768811" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String createTask(String token) {
        String catId = ((List<Map>)
                        getWithAuth("/api/v1/categories", token).getBody().get("data"))
                .getFirst()
                .get("id")
                .toString();
        ResponseEntity<Map> res = postWithAuth(
                "/api/v1/tasks",
                token,
                Map.of(
                        "category_id",
                        catId,
                        "description",
                        "Rescue flow test task",
                        "budget",
                        50000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Ulaanbaatar",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));
        return res.getBody().get("id").toString();
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
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

    record AuthContext(String userId, String accessToken) {}
}
