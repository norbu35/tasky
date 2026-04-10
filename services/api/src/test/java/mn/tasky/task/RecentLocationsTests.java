package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@SuppressWarnings({"rawtypes", "unchecked"})
class RecentLocationsTests extends IntegrationTestBase {

    private final TestRestTemplate http = new TestRestTemplate();

    @LocalServerPort
    private int port;

    private String custToken;
    private String categoryId;

    @BeforeEach
    void auth() {
        custToken = devLogin("+97692000010", "CUSTOMER");
        Map cats = getWithToken("/api/v1/categories").getBody();
        categoryId = ((Map) ((List) cats.get("data")).get(0)).get("id").toString();
    }

    @Test
    @DisplayName("Returns empty array for customer with no tasks")
    void emptyForNewCustomer() {
        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).isEmpty();
    }

    @Test
    @DisplayName("Returns distinct locations from task history")
    void returnsDistinctLocations() {
        createTask(47.9133, 106.8684, "Bayangol location");
        createTask(47.9322, 106.9856, "Bayanzurkh location");
        createTask(47.8766, 106.9782, "Khan-Uul location");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).hasSize(3);
        assertThat(locations.get(0)).containsKeys("location_lat", "location_lng", "location_text");
    }

    @Test
    @DisplayName("Deduplicates nearby locations")
    void deduplicatesNearby() {
        createTask(47.9133, 106.8684, "Bayangol A");
        createTask(47.9134, 106.8685, "Bayangol B");
        createTask(47.9135, 106.8686, "Bayangol C");
        createTask(47.8766, 106.9782, "Khan-Uul");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).hasSize(2);
    }

    @Test
    @DisplayName("Caps at 3 results")
    void capsAtThree() {
        createTask(47.9133, 106.8684, "Loc 1");
        createTask(47.9322, 106.9856, "Loc 2");
        createTask(47.8766, 106.9782, "Loc 3");
        createTask(47.7531, 107.3484, "Loc 4");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        assertThat(locations).hasSize(3);
    }

    @Test
    @DisplayName("Excludes cancelled tasks")
    void excludesCancelledTasks() {
        // Create a task and verify it appears
        String taskId = createTask(47.9133, 106.8684, "Cancelled location");
        ResponseEntity<Map> beforeCancel = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> beforeLocations = (List<Map>) beforeCancel.getBody().get("locations");
        assertThat(beforeLocations).hasSize(1);

        // Cancel the task
        postWithToken("/api/v1/tasks/" + taskId + "/cancel", Map.of());

        // Create a second task at a different location (this one stays OPEN)
        createTask(47.9322, 106.9856, "Active location");

        ResponseEntity<Map> resp = getWithToken("/api/v1/tasks/mine/recent-locations");
        List<Map> locations = (List<Map>) resp.getBody().get("locations");
        // Cancelled task excluded, only the active one remains
        assertThat(locations).hasSize(1);
        assertThat((String) locations.get(0).get("location_text")).isEqualTo("Active location");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String createTask(double lat, double lng, String locationText) {
        Map body = Map.of(
                "category_id", categoryId,
                "description", "Test task for recent locations feature",
                "budget", 50000,
                "location_lat", lat,
                "location_lng", lng,
                "location_text", locationText,
                "scheduled_at", Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                "intake_answers", Map.of(
                        "property_type", "Apartment",
                        "size_or_rooms", 2,
                        "cleaning_type", "Standard",
                        "supplies_provided", true),
                "intake_schema_version", 1);
        ResponseEntity<Map> resp = postWithToken("/api/v1/tasks", body);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resp.getBody().get("id").toString();
    }

    private String devLogin(String phone, String role) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> resp = http.postForEntity(url("/api/v1/auth/dev/login"),
                new HttpEntity<>(Map.of("phone", phone, "role", role), h), Map.class);
        return (String) resp.getBody().get("access_token");
    }

    private ResponseEntity<Map> getWithToken(String path) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(custToken);
        return http.exchange(url(path), HttpMethod.GET, new HttpEntity<>(h), Map.class);
    }

    private ResponseEntity<Map> postWithToken(String path, Map body) {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(custToken);
        h.setContentType(MediaType.APPLICATION_JSON);
        return http.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, h), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
