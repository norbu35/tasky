package mn.tasky.review;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.booking.application.BookingService;
import mn.tasky.booking.dto.BookingState;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
import mn.tasky.task.dto.CreateTask;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
class ReviewIntegrationTests extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AuthService authService;

    @Autowired
    private TaskService taskService;

    @Test
    @DisplayName("TID-TASK-040-API-REVIEW-SUBMIT reviews allowed only on completed bookings")
    void reviewsAllowedOnlyOnCompleted() {
        AuthContext customer = authenticate("customer-1");
        AuthContext tasker = authenticate("tasker-1");

        BookingState booking = bookingService.createBooking(
                createTaskForCustomer(customer, "review-submit"), tasker.userId(), customer.userId(), 10000);

        // Try reviewing PENDING booking
        ResponseEntity<Map> failResponse = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/reviews", customer.accessToken(), reviewBody(5, "Great!"));
        assertThat(failResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(failResponse.getBody().get("code")).isEqualTo("BOOKING_NOT_COMPLETED");

        // Complete booking
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Review success
        ResponseEntity<Map> successResponse = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/reviews", customer.accessToken(), reviewBody(5, "Great!"));
        assertThat(successResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

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
                                "review-task-" + descriptionSeed,
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

    @SuppressWarnings("unchecked")
    private String getFirstCategoryId(String token) {
        ResponseEntity<Map> response = getWithAuth("/api/v1/categories", token);
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) response.getBody().get("data");
        return data.get(0).get("id").toString();
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path, HttpMethod.GET, entity, Map.class);
    }

    @Test
    @DisplayName("TID-TASK-040-API-REVIEW-LIST list reviews paginated")
    void listReviews() {
        AuthContext customer = authenticate("customer-2");
        AuthContext tasker = authenticate("tasker-2");

        for (int i = 0; i < 3; i++) {
            BookingState booking = bookingService.createBooking(
                    createTaskForCustomer(customer, "review-list-" + i), tasker.userId(), customer.userId(), 10000);
            bookingService.transitionToPaid(booking.id());
            bookingService.completeBooking(customer.userId(), booking.id());

            postWithAuth(
                    "/api/v1/bookings/" + booking.id() + "/reviews",
                    customer.accessToken(),
                    reviewBody(5, "Comment " + i));
        }

        // List with limit 2
        ResponseEntity<Map> listResponse1 =
                getWithAuth("/api/v1/users/" + tasker.userId() + "/reviews?limit=2", customer.accessToken());
        assertThat(listResponse1.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> data1 = (List<Map>) listResponse1.getBody().get("data");
        assertThat(data1).hasSize(2);

        Map pagination = (Map) listResponse1.getBody().get("cursor");
        String nextCursor = (String) pagination.get("next");
        assertThat(nextCursor).isNotNull();
        assertThat((Boolean) pagination.get("has_more")).isEqualTo(true);

        // List next page
        ResponseEntity<Map> listResponse2 = getWithAuth(
                "/api/v1/users/" + tasker.userId() + "/reviews?limit=2&cursor=" + nextCursor, customer.accessToken());
        assertThat(listResponse2.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> data2 = (List<Map>) listResponse2.getBody().get("data");
        assertThat(data2).hasSize(1);
        assertThat(((Map) listResponse2.getBody().get("cursor")).get("has_more"))
                .isEqualTo(false);
    }

    @Test
    @DisplayName("TID-TASK-040-DOMAIN-PRO-BADGE pro badge follows thresholds")
    void proBadgeThresholds() {
        AuthContext customer = authenticate("customer-3");
        AuthContext tasker = authenticate("tasker-3");

        // Pre-condition: Not Pro
        Optional<UserProfile> initialProfileOpt = authService.getProfile(tasker.userId());
        assertThat(initialProfileOpt).isPresent();
        assertThat(initialProfileOpt.orElseThrow().isPro()).isFalse();

        // 15 Completed Tasks + 5 Star Average (REQ-SAFE-04 threshold)
        for (int i = 0; i < 15; i++) {
            BookingState booking = bookingService.createBooking(
                    createTaskForCustomer(customer, "review-pro-" + i), tasker.userId(), customer.userId(), 10000);
            bookingService.transitionToPaid(booking.id());
            bookingService.completeBooking(customer.userId(), booking.id());

            postWithAuth(
                    "/api/v1/bookings/" + booking.id() + "/reviews",
                    customer.accessToken(),
                    reviewBody(5, "Good job " + i));
        }

        Optional<UserProfile> profileOpt = authService.getProfile(tasker.userId());
        assertThat(profileOpt).isPresent();
        UserProfile profile = profileOpt.orElseThrow();
        assertThat(profile.completedTasks()).isEqualTo(15);
        assertThat(profile.ratingAvg()).isEqualTo(5.0);
        assertThat(profile.isPro()).isTrue();
    }

    /**
     * Review body for customer reviewing tasker: quality + punctuality + communication.
     */
    private Map<String, Object> reviewBody(int rating, String comment) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("qualityRating", rating);
        body.put("punctualityRating", rating);
        body.put("communicationRating", rating);
        body.put("comment", comment);
        return body;
    }

    /**
     * Review body for customer reviewing tasker with individual ratings.
     */
    private Map<String, Object> customerReviewBody(int quality, int punctuality, int communication, String comment) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("qualityRating", quality);
        body.put("punctualityRating", punctuality);
        body.put("communicationRating", communication);
        body.put("comment", comment);
        return body;
    }

    /**
     * Review body for tasker reviewing customer: clarity + respectfulness + punctuality.
     */
    private Map<String, Object> taskerReviewBody(int clarity, int respectfulness, int punctuality, String comment) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clarityRating", clarity);
        body.put("respectfulnessRating", respectfulness);
        body.put("punctualityRating", punctuality);
        body.put("comment", comment);
        return body;
    }

    @Test
    @DisplayName("REQ-SAFE-02 customer reviews tasker with quality/punctuality/communication")
    void customerReviewsTaskerWithCorrectFields() {
        AuthContext customer = authenticate("customer-role-1");
        AuthContext tasker = authenticate("tasker-role-1");

        BookingState booking = bookingService.createBooking(
                createTaskForCustomer(customer, "cust-review-tasker"), tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/reviews",
                customer.accessToken(),
                customerReviewBody(5, 4, 5, "Great tasker!"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        Map body = response.getBody();
        assertThat(body.get("quality_rating")).isEqualTo(5);
        assertThat(body.get("punctuality_rating")).isEqualTo(4);
        assertThat(body.get("communication_rating")).isEqualTo(5);
        assertThat(body.get("clarity_rating")).isNull();
        assertThat(body.get("respectfulness_rating")).isNull();
    }

    @Test
    @DisplayName("REQ-SAFE-02 customer reviews tasker missing punctuality returns 400")
    void customerReviewsTaskerMissingPunctuality() {
        AuthContext customer = authenticate("customer-role-2");
        AuthContext tasker = authenticate("tasker-role-2");

        BookingState booking = bookingService.createBooking(
                createTaskForCustomer(customer, "cust-missing-punct"), tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Send quality and communication but omit punctuality
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("qualityRating", 5);
        body.put("communicationRating", 4);
        body.put("comment", "Missing punctuality");

        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/reviews", customer.accessToken(), body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("code")).isEqualTo("INVALID_RATING");
    }

    @Test
    @DisplayName("REQ-SAFE-02 tasker reviews customer with clarity/respectfulness/punctuality")
    void taskerReviewsCustomerWithCorrectFields() {
        AuthContext customer = authenticate("customer-role-3");
        AuthContext tasker = authenticate("tasker-role-3");

        BookingState booking = bookingService.createBooking(
                createTaskForCustomer(customer, "tasker-review-cust"), tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        ResponseEntity<Map> response = postWithAuth(
                "/api/v1/bookings/" + booking.id() + "/reviews",
                tasker.accessToken(),
                taskerReviewBody(4, 5, 4, "Good customer!"));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        Map body = response.getBody();
        assertThat(body.get("clarity_rating")).isEqualTo(4);
        assertThat(body.get("respectfulness_rating")).isEqualTo(5);
        assertThat(body.get("punctuality_rating")).isEqualTo(4);
        assertThat(body.get("quality_rating")).isNull();
        assertThat(body.get("communication_rating")).isNull();
    }

    @Test
    @DisplayName("REQ-SAFE-02 tasker reviews customer missing clarity returns 400")
    void taskerReviewsCustomerMissingClarity() {
        AuthContext customer = authenticate("customer-role-4");
        AuthContext tasker = authenticate("tasker-role-4");

        BookingState booking = bookingService.createBooking(
                createTaskForCustomer(customer, "tasker-missing-clarity"), tasker.userId(), customer.userId(), 10000);
        bookingService.transitionToPaid(booking.id());
        bookingService.completeBooking(customer.userId(), booking.id());

        // Send respectfulness and punctuality but omit clarity
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("respectfulnessRating", 5);
        body.put("punctualityRating", 4);
        body.put("comment", "Missing clarity");

        ResponseEntity<Map> response =
                postWithAuth("/api/v1/bookings/" + booking.id() + "/reviews", tasker.accessToken(), body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("code")).isEqualTo("INVALID_RATING");
    }

    record AuthContext(String userId, String accessToken) {}
}
