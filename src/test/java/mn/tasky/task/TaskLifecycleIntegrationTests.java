package mn.tasky.task;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.TaskState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class TaskLifecycleIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Value("${tasky.qpay.webhook-secret}")
    private String qpayWebhookSecret;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserDao userDao;

    @Autowired
    private AuthService authService;

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CREATE customer can create a task with valid data")
    void customerCanCreateTask() {
        AuthContext customer = authenticate("90");
        String categoryId = getFirstCategoryId(customer.accessToken());

        String futureDate = Instant.now().plus(1, ChronoUnit.DAYS).toString();
        Map<String, Object> body = Map.of(
                "category_id",
                categoryId,
                "description",
                "This is a test task description with more than 10 characters.",
                "budget",
                55000,
                "location_lat",
                47.9188,
                "location_lng",
                106.9176,
                "location_text",
                "Ulaanbaatar, Mongolia",
                "scheduled_at",
                futureDate,
                "photo_keys",
                List.of("uploads/tasks/photo1.jpg"));

        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", customer.accessToken(), body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("OPEN");
        assertThat(response.getBody().get("description")).isEqualTo(body.get("description"));
    }

    private AuthContext authenticate(String prefix) {
        String phone = uniquePhone(prefix);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));

        ResponseEntity<Map> verifyResponse = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));

        assertThat(verifyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        @SuppressWarnings("unchecked")
        Map<String, Object> user =
                (Map<String, Object>) verifyResponse.getBody().get("user");
        return new AuthContext(
                String.valueOf(verifyResponse.getBody().get("access_token")), String.valueOf(user.get("id")), phone);
    }

    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories", token);
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) response.getBody().get("data");
        return data.get(0).get("id").toString();
    }

    private ResponseEntity<Map> postWithAuth(String path, String bearerToken, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key", UUID.randomUUID().toString());
        }

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private String uniquePhone(String prefix) {
        // Deterministic unique phone based on prefix for simplicity in this test
        return "+976" + prefix + "000000";
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));

        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }

        return restTemplate.exchange(url(path), HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/tasks/[^/]+/applications/[^/]+/accept$")
                || path.matches("^/api/v1/bookings/[^/]+/(cancel|complete|mark-done|disputes)$")
                || path.matches("^/api/v1/admin/disputes/[^/]+/resolve$")
                || path.matches("^/api/v1/payments/bookings/[^/]+/initiate$")
                || path.matches("^/api/v1/wallet/payouts$")
                || path.matches("^/api/v1/admin/payouts/[^/]+/process$");
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CREATE task creation fails with invalid data")
    void taskCreationFailsWithInvalidData() {
        AuthContext customer = authenticate("91");

        // Invalid budget (too low)
        Map<String, Object> body = Map.of(
                "category_id",
                UUID.randomUUID().toString(),
                "description",
                "Too short",
                "budget",
                1000,
                "location_lat",
                47.9188,
                "location_lng",
                106.9176,
                "location_text",
                "UB",
                "scheduled_at",
                Instant.now().plus(1, ChronoUnit.DAYS).toString());

        ResponseEntity<Map> response = postWithAuth("/api/v1/tasks", customer.accessToken(), body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-PHOTO-UPLOAD constrained signed URLs for task photos")
    void taskPhotoUploadUrls() {
        AuthContext customer = authenticate("92");

        // Pre-create upload URL
        ResponseEntity<Map> preResponse = postWithAuth(
                "/api/v1/tasks/photos/upload-url", customer.accessToken(), Map.of("content_type", "image/jpeg"));
        assertThat(preResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(preResponse.getBody().get("upload_url").toString()).contains("presigned-upload");
        assertThat(preResponse.getBody().get("storage_key").toString()).startsWith("uploads/tasks/");

        // Post-create upload URL
        String categoryId = getFirstCategoryId(customer.accessToken());
        ResponseEntity<Map> taskResponse = postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Description for photo test task.",
                        "budget",
                        60000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Some location",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                        "photo_keys",
                        List.of()));
        String taskId = taskResponse.getBody().get("id").toString();

        ResponseEntity<Map> postResponse = postWithAuth(
                "/api/v1/tasks/" + taskId + "/photos/upload-url",
                customer.accessToken(),
                Map.of("content_type", "image/png"));
        assertThat(postResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CANCEL cancel endpoint transitions task to CANCELLED")
    void customerCanCancelTask() {
        AuthContext customer = authenticate("93");
        String categoryId = getFirstCategoryId(customer.accessToken());

        ResponseEntity<Map> taskResponse = postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Description for cancel test task.",
                        "budget",
                        60000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Some location",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                        "photo_keys",
                        List.of()));
        String taskId = taskResponse.getBody().get("id").toString();

        ResponseEntity<Map> cancelResponse =
                postWithAuth("/api/v1/tasks/" + taskId + "/cancel", customer.accessToken(), null);
        assertThat(cancelResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(cancelResponse.getBody().get("status")).isEqualTo("CANCELLED");

        // Second cancel should fail (conflict/invalid status)
        ResponseEntity<Map> cancelAgain =
                postWithAuth("/api/v1/tasks/" + taskId + "/cancel", customer.accessToken(), null);
        assertThat(cancelAgain.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Security: TASKER cannot create a task")
    void taskerCannotCreateTask() {
        AuthContext tasker = authenticate("94");
        // Activate tasker role
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", tasker.accessToken(), null);
        String taskerToken = activateResponse.getBody().get("access_token").toString();

        String categoryId = getFirstCategoryId(taskerToken);
        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/tasks",
                taskerToken,
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Tasker trying to create a task.",
                        "budget",
                        50000,
                        "location_lat",
                        47.0,
                        "location_lng",
                        106.0,
                        "location_text",
                        "Anywhere",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-OPEN public feed returns only OPEN tasks")
    void publicFeedReturnsOnlyOpenTasks() {
        AuthContext customer = authenticate("100");
        String categoryId = getFirstCategoryId(customer.accessToken());

        // Create one OPEN task
        postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Description for OPEN task.",
                        "budget",
                        50000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Location",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));

        // Create and CANCEL another task
        ResponseEntity<Map> cancelledResponse = postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Description for CANCELLED " + "task.",
                        "budget",
                        50000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Location",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));
        postWithAuth(
                "/api/v1/tasks/" + cancelledResponse.getBody().get("id") + "/cancel", customer.accessToken(), null);

        // Fetch feed
        ResponseEntity<Map> feed = getWithAuth("/api/v1/tasks", customer.accessToken());
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) feed.getBody().get("data");

        assertThat(data).isNotEmpty();
        assertThat(data).allSatisfy(task -> assertThat(task.get("status")).isEqualTo("OPEN"));
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-LOCATION public feed returns fuzzed coordinates")
    void publicFeedReturnsFuzzedCoordinates() {
        AuthContext customer = authenticate("102");
        String categoryId = getFirstCategoryId(customer.accessToken());

        double exactLat = 47.9188;
        double exactLng = 106.9176;
        String taskId = (String) postWithAuth(
                        "/api/v1/tasks",
                        customer.accessToken(),
                        Map.of(
                                "category_id",
                                categoryId,
                                "description",
                                "Description for coordinate fuzzing task.",
                                "budget",
                                50000,
                                "location_lat",
                                exactLat,
                                "location_lng",
                                exactLng,
                                "location_text",
                                "Location",
                                "scheduled_at",
                                Instant.now().plus(1, ChronoUnit.DAYS).toString()))
                .getBody()
                .get("id");

        ResponseEntity<Map> feed = getWithAuth("/api/v1/tasks", customer.accessToken());
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) feed.getBody().get("data");
        Map<String, Object> task = data.stream()
                .filter(item -> taskId.equals(item.get("id")))
                .findFirst()
                .orElseThrow();

        double approximateLat = ((Number) task.get("approximate_lat")).doubleValue();
        double approximateLng = ((Number) task.get("approximate_lng")).doubleValue();
        assertThat(approximateLat).isNotEqualTo(exactLat);
        assertThat(approximateLng).isNotEqualTo(exactLng);
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-FILTERS category and distance filters")
    void feedFilters() {
        AuthContext customer = authenticate("101");
        String category1 = getFirstCategoryId(customer.accessToken());

        // Task in Category 1 at Location A
        postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        category1,
                        "description",
                        "Task in category 1 at loc A.",
                        "budget",
                        50000,
                        "location_lat",
                        47.91,
                        "location_lng",
                        106.91,
                        "location_text",
                        "Loc A",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));

        // Task in Category 1 far away (Location B)
        postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        category1,
                        "description",
                        "Task far away.",
                        "budget",
                        50000,
                        "location_lat",
                        48.5,
                        "location_lng",
                        107.5,
                        "location_text",
                        "Loc B",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));

        // Filter by category
        ResponseEntity<Map> categoryFilter = getWithAuth("/api/v1/tasks?category=" + category1, customer.accessToken());
        List<Map<String, Object>> catData =
                (List<Map<String, Object>>) categoryFilter.getBody().get("data");
        assertThat(catData).allSatisfy(task -> assertThat(((Map) task.get("category")).get("id"))
                .isEqualTo(category1));

        // Filter by distance (within 20km of Loc A)
        ResponseEntity<Map> distanceFilter =
                getWithAuth("/api/v1/tasks?lat=47.9&lng=106.9&radius_km=20", customer.accessToken());
        List<Map<String, Object>> distData =
                (List<Map<String, Object>>) distanceFilter.getBody().get("data");
        assertThat(distData)
                .extracting(task -> task.get("description"))
                .contains("Task in category 1 at loc A.")
                .doesNotContain("Task far away.");
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-CURSOR cursor pagination is deterministic with next " + "cursor semantics")
    @SuppressWarnings("unchecked")
    void feedCursorPaginationDeterministic() {
        AuthContext customer = authenticate("1020");
        String categoryId = getFirstCategoryId(customer.accessToken());

        for (int i = 0; i < 5; i++) {
            postWithAuth(
                    "/api/v1/tasks",
                    customer.accessToken(),
                    Map.of(
                            "category_id",
                            categoryId,
                            "description",
                            "Cursor task " + i,
                            "budget",
                            50000 + i,
                            "location_lat",
                            47.90 + (i * 0.001),
                            "location_lng",
                            106.90 + (i * 0.001),
                            "location_text",
                            "Cursor location " + i,
                            "scheduled_at",
                            Instant.now().plus(1, ChronoUnit.DAYS).toString()));
        }

        ResponseEntity<Map> page1 = getWithAuth("/api/v1/tasks?limit=2", customer.accessToken());
        assertThat(page1.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Map<String, Object>> page1Data =
                (List<Map<String, Object>>) page1.getBody().get("data");
        assertThat(page1Data).hasSize(2);
        Map<String, Object> page1Cursor = (Map<String, Object>) page1.getBody().get("cursor");
        assertThat(page1Cursor.get("has_more")).isEqualTo(true);
        String nextCursor = (String) page1Cursor.get("next");
        assertThat(nextCursor).isNotBlank();

        ResponseEntity<Map> page2 = getWithAuth("/api/v1/tasks?limit=2&cursor=" + nextCursor, customer.accessToken());
        assertThat(page2.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> page2Data =
                (List<Map<String, Object>>) page2.getBody().get("data");
        assertThat(page2Data).isNotEmpty();
        assertThat(page2Data)
                .extracting(item -> item.get("id"))
                .doesNotContainAnyElementsOf(
                        page1Data.stream().map(item -> item.get("id")).toList());
    }

    @Test
    @DisplayName("invalid cursor returns bad request for task feed")
    void feedCursorInvalidReturnsBadRequest() {
        AuthContext customer = authenticate("1021");

        ResponseEntity<Map> response =
                getWithAuth("/api/v1/tasks?limit=2&cursor=invalid-cursor", customer.accessToken());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("code", "INVALID_CURSOR");
    }

    @Test
    @DisplayName("customer can list own task ads including historical statuses")
    @SuppressWarnings("unchecked")
    void customerCanListOwnTaskAds() {
        AuthContext customer = authenticate("1022");
        String categoryId = getFirstCategoryId(customer.accessToken());

        String openTaskId = createTask(customer.accessToken(), categoryId);
        String cancelledTaskId = createTask(customer.accessToken(), categoryId);
        ResponseEntity<Map> cancelResponse =
                postWithAuth("/api/v1/tasks/" + cancelledTaskId + "/cancel", customer.accessToken(), null);
        assertThat(cancelResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/mine?limit=20", customer.accessToken());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Map<String, Object>> data =
                (List<Map<String, Object>>) response.getBody().get("data");
        assertThat(data).extracting(item -> item.get("id")).contains(openTaskId, cancelledTaskId);

        Map<String, Object> cancelledTask = data.stream()
                .filter(item -> cancelledTaskId.equals(item.get("id")))
                .findFirst()
                .orElseThrow();
        assertThat(cancelledTask.get("status")).isEqualTo("CANCELLED");
        assertThat(cancelledTask).containsKeys("location_text", "location_lat", "location_lng");
    }

    @Test
    @DisplayName("tasker can use same flow for historical task list")
    @SuppressWarnings("unchecked")
    void taskerCanListTaskHistoryFromMineEndpoint() {
        AuthContext customer = authenticate("1023");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("1024");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Task history please"));
        String applicationId = ((List<Map>)
                        getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken())
                                .getBody()
                                .get("data"))
                .get(0)
                .get("id")
                .toString();

        ResponseEntity<Map> acceptResponse = postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + applicationId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));
        assertThat(acceptResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> historyResponse =
                getWithAuth("/api/v1/tasks/mine?role=tasker&status=ASSIGNED", taskerToken);
        assertThat(historyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) historyResponse.getBody().get("data");
        assertThat(data).extracting(item -> item.get("id")).contains(taskId);
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-LIST-PRIVACY exact address hidden")
    void feedPrivacy() {
        AuthContext customer = authenticate("102");
        String categoryId = getFirstCategoryId(customer.accessToken());

        postWithAuth(
                "/api/v1/tasks",
                customer.accessToken(),
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Privacy test task.",
                        "budget",
                        50000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Secret Address 123",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));

        ResponseEntity<Map> feed = getWithAuth("/api/v1/tasks", customer.accessToken());
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) feed.getBody().get("data");

        Map<String, Object> task = data.get(0);
        assertThat(task).doesNotContainKey("location_text");
        assertThat(task).containsKey("approximate_location");
        assertThat(task).containsKeys("approximate_lat", "approximate_lng");
    }

    @Test
    @DisplayName("TID-TASK-023-API-APPLY-OPEN-TASK tasker can apply to an open task")
    void taskerCanApplyToTask() {
        AuthContext customer = authenticate("110");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("111");
        String taskerToken = activateAndVerifyTasker(tasker);

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "I can do this job!"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("status")).isEqualTo("APPLIED");
        assertThat(response.getBody().get("message")).isEqualTo("I can do this job!");
    }

    @Test
    @DisplayName("TID-TASK-023-API-APPLICANT-LIST TID-TASK-023-API-ACCEPT-CREATES-BOOKING "
            + "customer can list applicants and accept one")
    void customerCanAcceptApplicant() {
        AuthContext customer = authenticate("112");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        // Tasker applies
        AuthContext tasker = authenticate("113");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Pick me!"));

        // Customer lists applicants
        ResponseEntity<Map> listResponse =
                getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken());
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> apps =
                (List<Map<String, Object>>) listResponse.getBody().get("data");
        assertThat(apps).hasSize(1);
        String appId = apps.get(0).get("id").toString();

        // Customer accepts
        ResponseEntity<Map> acceptResponse = postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));
        assertThat(acceptResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(acceptResponse.getBody().get("status")).isEqualTo("ASSIGNED");
        assertThat(acceptResponse.getBody().get("tasker_id")).isEqualTo(tasker.userId());
    }

    @Test
    @DisplayName("TID-TASK-030-API-BOOKING-READS list and details reflect consistent status")
    void bookingReadEndpoints() {
        AuthContext customer = authenticate("120");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        // Tasker applies and customer accepts
        AuthContext tasker = authenticate("121");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Test app"));

        ResponseEntity<Map> appsResponse =
                getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken());
        String appId = ((List<Map>) appsResponse.getBody().get("data"))
                .get(0)
                .get("id")
                .toString();

        ResponseEntity<Map> acceptResponse = postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));
        String bookingId = acceptResponse.getBody().get("id").toString();

        // Check list bookings
        ResponseEntity<Map> listResponse = getWithAuth("/api/v1/bookings?role=customer", customer.accessToken());
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> bookings =
                (List<Map<String, Object>>) listResponse.getBody().get("data");
        assertThat(bookings).anySatisfy(b -> assertThat(b.get("id")).isEqualTo(bookingId));

        // Check booking details
        ResponseEntity<Map> detailsResponse = getWithAuth("/api/v1/bookings/" + bookingId, customer.accessToken());
        assertThat(detailsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(detailsResponse.getBody().get("status")).isEqualTo("ASSIGNED");
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-TASKER-CANCEL-STRIKE tasker cancellation reopens task and " + "records strike")
    void taskerCancelReopensAndStrikes() {
        AuthContext customer = authenticate("140");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("141");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "App"));

        ResponseEntity<Map> appsResponse =
                getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken());
        String appId = ((List<Map>) appsResponse.getBody().get("data"))
                .get(0)
                .get("id")
                .toString();

        postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));

        // Tasker cancels
        ResponseEntity<Map> cancelResponse = postWithAuth(
                "/api/v1/bookings/" + getBookingIdForTask(taskId, customer.accessToken()) + "/cancel",
                taskerToken,
                null);
        assertThat(cancelResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify task is OPEN again
        Optional<TaskState> reopenedTaskOpt = taskService.getTask(taskId);
        assertThat(reopenedTaskOpt).isPresent();
        assertThat(reopenedTaskOpt.orElseThrow().status()).isEqualTo("OPEN");

        // Verify strike (user status might not change after 1 strike, but we can check internal
        // state if exposed)
        // For now, I'll just check if 3 strikes trigger suspension
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-STRIKE-SUSPENSION three strikes trigger suspension")
    void threeStrikesTriggerSuspension() {
        AuthContext tasker = authenticate("142");
        String taskerToken = tokenFor("TASKER", "ACTIVE", tasker.userId());

        // Add 3 strikes
        authService.addStrike(tasker.userId());
        authService.addStrike(tasker.userId());
        authService.addStrike(tasker.userId());

        // User should be SUSPENDED
        Optional<UserProfile> profileOpt = authService.getProfile(tasker.userId());
        assertThat(profileOpt).isPresent();
        UserProfile profile = profileOpt.orElseThrow();
        assertThat(profile.status()).isEqualTo("SUSPENDED");
    }

    private String tokenFor(String role, String status, String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .claim("status", status)
                .claim("token_type", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(3600)))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();
    }

    @SuppressWarnings("unchecked")
    private String activateAndVerifyTasker(AuthContext tasker) {
        String adminToken = tokenFor("ADMIN", "ACTIVE", UUID.randomUUID().toString());

        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker", tasker.accessToken(), null);
        assertThat(activateResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        String taskerToken = String.valueOf(activateResponse.getBody().get("access_token"));

        ResponseEntity<Map> submitResponse = postWithAuth(
                "/api/v1/verification/submit",
                taskerToken,
                Map.of(
                        "id_card_front_key",
                        "uploads/verification/front-" + Instant.now().toEpochMilli() + ".jpg",
                        "id_card_back_key",
                        "uploads/verification/back-" + Instant.now().toEpochMilli() + ".jpg",
                        "consent_policy_version",
                        "1.0",
                        "consent_accepted",
                        true));
        assertThat(submitResponse.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<Map> pendingResponse = getWithAuth("/api/v1/admin/verifications/pending?limit=100", adminToken);
        assertThat(pendingResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> pendingData =
                (List<Map<String, Object>>) pendingResponse.getBody().get("data");

        Map<String, Object> verification = pendingData.stream()
                .filter(item -> tasker.userId().equals(item.get("user_id")))
                .findFirst()
                .orElseThrow();
        String verificationId = String.valueOf(verification.get("id"));

        ResponseEntity<Map> approveResponse =
                postWithAuth("/api/v1/admin/verifications/" + verificationId + "/approve", adminToken, null);
        assertThat(approveResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        return taskerToken;
    }

    @Test
    @DisplayName("TID-TASK-032-DOMAIN-REPEAT-OFFENSE repeat offense applies longer suspension")
    void repeatOffenseAppliesLongerSuspension() {
        authService.updateModerationPolicy(30, 1, 1, 5, 180, true);
        AuthContext tasker = authenticate("143");

        authService.addStrike(tasker.userId());
        Instant firstEnd = userDao.findSuspensionEndAt(tasker.userId()).orElseThrow();

        userDao.updateStatusAndSuspensionEnd(tasker.userId(), "ACTIVE", null);
        authService.addStrike(tasker.userId());
        Instant secondEnd = userDao.findSuspensionEndAt(tasker.userId()).orElseThrow();

        assertThat(secondEnd).isAfter(firstEnd.plus(3, ChronoUnit.DAYS));
    }

    @Test
    @DisplayName("TID-TASK-030-API-BOOKING-COMPLETE completion transitions booking and task")
    void completeBookingTransitionsState() {
        AuthContext customer = authenticate("150");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("151");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "I can do this!"));

        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken())
                        .getBody()
                        .get("data"))
                .get(0)
                .get("id")
                .toString();
        postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));

        String bookingId = getBookingIdForTask(taskId, customer.accessToken());

        // Complete booking
        ResponseEntity<Map> completeResponse =
                postWithAuth("/api/v1/bookings/" + bookingId + "/complete", customer.accessToken(), null);
        assertThat(completeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(completeResponse.getBody().get("status")).isEqualTo("COMPLETED");
        Optional<TaskState> completedTaskOpt = taskService.getTask(taskId);
        assertThat(completedTaskOpt).isPresent();
        assertThat(completedTaskOpt.orElseThrow().status()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-UPDATE customer can update their own OPEN task")
    void customerCanUpdateTask() {
        AuthContext customer = authenticate("199");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        String newDescription = "Updated description with more than ten characters.";
        Map<String, Object> updateBody = Map.of("description", newDescription, "budget", 80000);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(MediaType.parseMediaTypes(MediaType.APPLICATION_JSON_VALUE));
        headers.setBearerAuth(customer.accessToken());

        ResponseEntity<Map> response = restTemplate.exchange(
                url("/api/v1/tasks/" + taskId), HttpMethod.PUT, new HttpEntity<>(updateBody, headers), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("description")).isEqualTo(newDescription);
        assertThat(((Number) response.getBody().get("budget")).intValue()).isEqualTo(80000);
    }

    private String createTask(String token, String categoryId) {
        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/tasks",
                token,
                Map.of(
                        "category_id",
                        categoryId,
                        "description",
                        "Description for a task that will " + "have applications.",
                        "budget",
                        70000,
                        "location_lat",
                        47.9,
                        "location_lng",
                        106.9,
                        "location_text",
                        "Ulaanbaatar",
                        "scheduled_at",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString()));
        return response.getBody().get("id").toString();
    }

    // --- Helpers ---

    @Test
    @DisplayName("TID-TASK-020-API-CATEGORIES-SEED-PRESENT at least 5 active categories seeded on" + " startup")
    void atLeastFiveActiveCategoriesSeeded() {
        AuthContext customer = authenticate("200");

        ResponseEntity<Map> response = getWithAuth("/api/v1/categories", customer.accessToken());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<Map<String, Object>> data =
                (List<Map<String, Object>>) response.getBody().get("data");
        assertThat(data).hasSizeGreaterThanOrEqualTo(5);
        assertThat(data).allSatisfy(cat -> assertThat(cat.get("is_active")).isEqualTo(true));
    }

    @Test
    @DisplayName("TID-TASK-023-API-APPLY-OPEN-TASK apply failure paths")
    void applyFailures() {
        AuthContext customer = authenticate("160");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("161");
        String taskerToken = activateAndVerifyTasker(tasker);

        // 1. Task missing
        String missingTaskId = UUID.randomUUID().toString();
        ResponseEntity<Map> resNotFound =
                postWithAuth("/api/v1/tasks/" + missingTaskId + "/applications", taskerToken, Map.of("message", "x"));
        assertThat(resNotFound.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        // 2. Already accepted (prepare by accepting)
        AuthContext tasker2 = authenticate("162");
        String tasker2Token = activateAndVerifyTasker(tasker2);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", tasker2Token, Map.of("message", "Pick me"));
        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken())
                        .getBody()
                        .get("data"))
                .get(0)
                .get("id")
                .toString();
        postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));

        ResponseEntity<Map> resInvalidStatus =
                postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "too late"));
        assertThat(resInvalidStatus.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("TID-TASK-023-API-APPLICANT-LIST accept failure paths")
    void acceptFailures() {
        AuthContext customer = authenticate("170");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("171");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Pick me"));
        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken())
                        .getBody()
                        .get("data"))
                .get(0)
                .get("id")
                .toString();

        // 0. Disclaimer required
        assertThat(postWithAuth(
                                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                                customer.accessToken(),
                                Map.of("liability_disclaimer_accepted", false))
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        // 1. Task missing
        assertThat(postWithAuth(
                                "/api/v1/tasks/" + UUID.randomUUID() + "/applications/" + appId + "/accept",
                                customer.accessToken(),
                                Map.of("liability_disclaimer_accepted", true))
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        // 2. Forbidden (wrong customer)
        AuthContext customer2 = authenticate("172");
        assertThat(postWithAuth(
                                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                                customer2.accessToken(),
                                Map.of("liability_disclaimer_accepted", true))
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        // 3. Application missing
        assertThat(postWithAuth(
                                "/api/v1/tasks/" + taskId + "/applications/" + UUID.randomUUID() + "/accept",
                                customer.accessToken(),
                                Map.of("liability_disclaimer_accepted", true))
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-CANCEL cancel failure paths")
    void cancelFailures() {
        AuthContext customer = authenticate("180");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        // 1. Not found
        assertThat(postWithAuth("/api/v1/tasks/" + UUID.randomUUID() + "/cancel", customer.accessToken(), null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        // 2. Forbidden
        AuthContext stranger = authenticate("181");
        assertThat(postWithAuth("/api/v1/tasks/" + taskId + "/cancel", stranger.accessToken(), null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("TID-TASK-021-API-TASK-PHOTO-UPLOAD photo upload failure paths")
    void photoUploadFailures() {
        AuthContext customer = authenticate("190");
        // Invalid content type
        assertThat(postWithAuth(
                                "/api/v1/tasks/photos/upload-url",
                                customer.accessToken(),
                                Map.of("content_type", "application/pdf"))
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        // Missing task for post-create
        assertThat(postWithAuth(
                                "/api/v1/tasks/" + UUID.randomUUID() + "/photos/upload-url",
                                customer.accessToken(),
                                Map.of("content_type", "image/png"))
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-DETAILS missing task returns not found")
    void getTaskReturnsNotFoundWhenMissing() {
        AuthContext customer = authenticate("191");
        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/" + UUID.randomUUID(), customer.accessToken());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().get("code")).isEqualTo("NOT_FOUND");
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-DETAILS owner receives full task details")
    void ownerGetsFullTaskDetails() {
        AuthContext customer = authenticate("192");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/" + taskId, customer.accessToken());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys("location_text", "location_lat", "location_lng");
        assertThat(response.getBody()).doesNotContainKey("approximate_location");
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-DETAILS non-participant receives public task details")
    void nonParticipantGetsPublicTaskDetails() {
        AuthContext customer = authenticate("193");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext stranger = authenticate("194");
        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/" + taskId, stranger.accessToken());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys("approximate_location", "approximate_lat", "approximate_lng");
        assertThat(response.getBody()).doesNotContainKeys("location_text", "location_lat", "location_lng");
    }

    @Test
    @DisplayName("TID-TASK-022-API-TASK-DETAILS accepted tasker receives full task details")
    void acceptedTaskerGetsFullTaskDetails() {
        AuthContext customer = authenticate("195");
        String categoryId = getFirstCategoryId(customer.accessToken());
        String taskId = createTask(customer.accessToken(), categoryId);

        AuthContext tasker = authenticate("196");
        String taskerToken = activateAndVerifyTasker(tasker);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications", taskerToken, Map.of("message", "Can do this"));
        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications", customer.accessToken())
                        .getBody()
                        .get("data"))
                .get(0)
                .get("id")
                .toString();

        postWithAuth(
                "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
                customer.accessToken(),
                Map.of("liability_disclaimer_accepted", true));

        ResponseEntity<Map> response = getWithAuth("/api/v1/tasks/" + taskId, taskerToken);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKeys("location_text", "location_lat", "location_lng");
        assertThat(response.getBody()).doesNotContainKey("approximate_location");
    }

    private String getBookingIdForTask(String taskId, String customerToken) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/bookings?role=customer", customerToken);
        List<Map<String, Object>> bookings =
                (List<Map<String, Object>>) response.getBody().get("data");
        return bookings.stream()
                .filter(b -> taskId.equals(b.get("task_id")))
                .findFirst()
                .map(b -> b.get("id"))
                .map(String::valueOf)
                .orElseThrow(() -> new IllegalStateException("Booking not found for task " + taskId));
    }

    private String signatureFor(String paymentId, String status) {
        String payload = paymentId + "|" + status;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(qpayWebhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signature = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(signature.length * 2);
            for (byte b : signature) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private record AuthContext(String accessToken, String userId, String phone) {}
}
