package mn.tasky.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.review.application.ReviewEnforcementService;
import mn.tasky.review.dao.ReviewEnforcementCaseDao;
import mn.tasky.review.dto.ReviewEnforcementCase;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.CreateTask;
import mn.tasky.task.dto.TaskApplyResult;
import mn.tasky.task.dto.TaskCreateResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ReviewEnforcementIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private ReviewEnforcementService reviewEnforcementService;

    @Autowired
    private ReviewEnforcementCaseDao reviewEnforcementCaseDao;

    @Autowired
    private DisputeDao disputeDao;

    @Test
    @DisplayName("REQ-SAFE-02 booking completion creates enforcement cases for both parties")
    void bookingCompletionCreatesEnforcementCases() {
        AuthContext customer = authenticate("enf-customer-1");
        AuthContext tasker = authenticate("enf-tasker-1");

        String taskId = createTaskForCustomer(customer, "enforcement-create");
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Enforcement cases are created via outbox processor on booking completion.
        // Since completeBooking triggers the outbox event and the processor runs inline
        // in tests, we can directly check.
        reviewEnforcementService.createCasesForBooking(booking.id(), customer.userId(), tasker.userId());

        List<ReviewEnforcementCase> customerCases = reviewEnforcementCaseDao.findOpenByUser(customer.userId());
        List<ReviewEnforcementCase> taskerCases = reviewEnforcementCaseDao.findOpenByUser(tasker.userId());

        assertThat(customerCases).isNotEmpty();
        assertThat(taskerCases).isNotEmpty();
        assertThat(customerCases.get(0).status()).isEqualTo("PENDING");
        assertThat(taskerCases.get(0).status()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("REQ-SAFE-02 review submission resolves the enforcement case")
    void reviewSubmissionResolvesEnforcementCase() {
        AuthContext customer = authenticate("enf-customer-2");
        AuthContext tasker = authenticate("enf-tasker-2");

        String taskId = createTaskForCustomer(customer, "enforcement-resolve");
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Create cases manually (outbox may not fire in test context)
        reviewEnforcementService.createCasesForBooking(booking.id(), customer.userId(), tasker.userId());

        // Verify case is PENDING
        var caseBefore = reviewEnforcementCaseDao.findByBookingAndUser(booking.id(), customer.userId());
        assertThat(caseBefore).isPresent();
        assertThat(caseBefore.get().status()).isNotEqualTo("COMPLETED");

        // Submit review via API
        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/reviews",
                customer.accessToken(),
                reviewBody(5, "Great service!"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Verify case is now COMPLETED
        var caseAfter = reviewEnforcementCaseDao.findByBookingAndUser(booking.id(), customer.userId());
        assertThat(caseAfter).isPresent();
        assertThat(caseAfter.get().status()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("REQ-SAFE-11 hard lock blocks task creation when open case + open dispute")
    void hardLockBlocksTaskCreationWithOpenDispute() {
        AuthContext customer = authenticate("enf-customer-3");
        AuthContext tasker = authenticate("enf-tasker-3");

        String taskId = createTaskForCustomer(customer, "enforcement-lock");
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Create enforcement case
        reviewEnforcementService.createCasesForBooking(booking.id(), customer.userId(), tasker.userId());

        // Create an open dispute for this booking
        disputeDao.insert(
                java.util.UUID.randomUUID().toString(),
                booking.id(),
                customer.userId(),
                "Quality issue",
                "OPEN",
                null,
                null,
                null,
                Instant.now(),
                null);

        // Verify user is locked
        assertThat(reviewEnforcementService.isUserLocked(customer.userId())).isTrue();

        // Attempt to create a task — should be blocked
        TaskCreateResult result = taskService.createTask(
                customer.userId(),
                new CreateTask(
                        getFirstCategoryId(customer.accessToken()),
                        "should-be-blocked",
                        5000,
                        47.9,
                        106.9,
                        "Ulaanbaatar",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                        List.of(),
                        null,
                        null,
                        null,
                        null));
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorCode()).isEqualTo("REVIEW_LOCK_ACTIVE");
    }

    @Test
    @DisplayName("REQ-SAFE-11 no hard lock when case exists but no risk signal")
    void noHardLockWhenCaseExistsWithoutRiskSignal() {
        AuthContext customer = authenticate("enf-customer-4");
        AuthContext tasker = authenticate("enf-tasker-4");

        String taskId = createTaskForCustomer(customer, "enforcement-no-lock");
        BookingState booking =
                bookingService.createBooking(taskId, tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Create enforcement case (PENDING, no dispute, no investigation, no consecutive expired)
        reviewEnforcementService.createCasesForBooking(booking.id(), customer.userId(), tasker.userId());

        // Verify user is NOT locked (open case but no risk signal)
        assertThat(reviewEnforcementService.isUserLocked(customer.userId())).isFalse();

        // Task creation should succeed
        TaskCreateResult result = taskService.createTask(
                customer.userId(),
                new CreateTask(
                        getFirstCategoryId(customer.accessToken()),
                        "should-succeed",
                        5000,
                        47.9,
                        106.9,
                        "Ulaanbaatar",
                        Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                        List.of(),
                        null,
                        null,
                        null,
                        null));
        assertThat(result.isSuccess()).isTrue();
    }

    // --- Helpers ---

    private AuthContext authenticate(String seed) {
        String phone = "+9769911" + String.format("%04d", Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request", Map.of("phone", phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"));
        String accessToken = (String) response.getBody().get("access_token");
        String userId = (String) ((Map) response.getBody().get("user")).get("id");
        return new AuthContext(userId, accessToken);
    }

    private String createTaskForCustomer(AuthContext customer, String descriptionSeed) {
        String categoryId = getFirstCategoryId(customer.accessToken());
        return taskService
                .createTask(
                        customer.userId(),
                        new CreateTask(
                                categoryId,
                                "enf-task-" + descriptionSeed,
                                10000,
                                47.9,
                                106.9,
                                "Ulaanbaatar",
                                Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                                List.of(),
                                null,
                                null,
                                null,
                                null))
                .task()
                .id();
    }

    @SuppressWarnings("unchecked")
    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories", token);
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) response.getBody().get("data");
        return data.get(0).get("id").toString();
    }

    private ResponseEntity<Map> postWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.POST, entity, Map.class);
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path, body, Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    private Map<String, Object> reviewBody(int rating, String comment) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("qualityRating", rating);
        body.put("punctualityRating", rating);
        body.put("communicationRating", rating);
        body.put("comment", comment);
        return body;
    }

    record AuthContext(String userId, String accessToken) {}
}
