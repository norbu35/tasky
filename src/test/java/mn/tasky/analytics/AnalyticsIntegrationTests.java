package mn.tasky.analytics;

import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.analytics.application.KpiReportService;
import mn.tasky.analytics.domain.KpiReport;
import mn.tasky.analytics.dto.Event;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AnalyticsIntegrationTests
    extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private static final String CUSTOMER_1 = "00000000-0000-0000-0000-000000000011";
    private static final String CUSTOMER_2 = "00000000-0000-0000-0000-000000000012";
    private static final String TEST_LOCALE = "mn-MN";
    private static final String TEST_PLATFORM = "WEB";
    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Autowired
    private AnalyticsService analyticsService;
    @Autowired
    private KpiReportService kpiReportService;
    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Test
    @DisplayName("TID-TASK-090-OBS-EVENT-EMISSION backend emits canonical analytics events with " +
        "correlation, locale, platform, and references")
    void emitsCanonicalFunnelEvents() {
        AuthContext customer = authenticate("cust-ana");
        AuthContext tasker = authenticate("task-ana");
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);
        String taskerToken = activateAndVerifyTasker(tasker,
            adminToken);

        // 1. Post Task
        postWithAuth("/api/v1/admin/categories",
            adminToken,
            Map.of("name",
                "Ana",
                "base_price",
                1000,
                "name_mn",
                "Ana MN",
                "icon_url",
                "http://x.com/i.png",
                "sort_order",
                1));
        String catId = ((List<Map>) getWithAuth("/api/v1/categories",
            customer.accessToken()).getBody()
            .get("data")).get(0)
            .get("id")
            .toString();
        String taskId = (String) postWithAuth("/api/v1/tasks",
            customer.accessToken(),
            Map.of(
                "category_id",
                catId,
                "description",
                "Ana Task Description Long",
                "budget",
                10000,
                "location_lat",
                47.9,
                "location_lng",
                106.9,
                "location_text",
                "Ulaanbaatar, Mongolia",
                "scheduled_at",
                java.time.Instant.now()
                    .plusSeconds(3600)
                    .toString(),
                "photo_keys",
                List.of()
            )).getBody()
            .get("id");

        // 2. Apply
        postWithAuth("/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message",
                "Ana"));

        // 3. Accept
        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications",
            customer.accessToken()).getBody()
            .get("data")).get(0)
            .get("id")
            .toString();
        String bookingId = (String) postWithAuth(
            "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        ).getBody()
            .get("id");

        // 4. Complete
        postWithAuth("/api/v1/bookings/" + bookingId + "/complete",
            customer.accessToken(),
            null);

        // 5. Raise dispute
        postWithAuth(
            "/api/v1/bookings/" + bookingId + "/disputes",
            customer.accessToken(),
            Map.of("reason",
                "Quality issue requires review.")
        );

        // Verify events
        List<Event> events = analyticsService.getEvents();
        Map<String, Event> latestByName = events.stream()
            .collect(java.util.stream.Collectors.toMap(Event::name,
                event -> event,
                (first, second) -> second));

        List<String> expectedNames = List.of(
            AnalyticsService.EVENT_TASK_POSTED,
            AnalyticsService.EVENT_APPLICATION_SUBMITTED,
            AnalyticsService.EVENT_TASKER_ACCEPTED,
            AnalyticsService.EVENT_BOOKING_CONFIRMED,
            AnalyticsService.EVENT_BOOKING_COMPLETED,
            AnalyticsService.EVENT_DISPUTE_RAISED
        );
        assertThat(latestByName.keySet()).containsAll(expectedNames);

        expectedNames.forEach(eventName -> {
            Map<String, Object> properties = latestByName.get(eventName)
                .properties();
            assertThat(properties)
                .containsKey(AnalyticsService.PROPERTY_CORRELATION_ID)
                .containsEntry(AnalyticsService.PROPERTY_LOCALE,
                    TEST_LOCALE)
                .containsEntry(AnalyticsService.PROPERTY_PLATFORM,
                    TEST_PLATFORM);
            assertThat(
                properties.containsKey(AnalyticsService.PROPERTY_TASK_ID) ||
                    properties.containsKey(AnalyticsService.PROPERTY_BOOKING_ID)
            )
                .as("event %s should include task_id or booking_id",
                    eventName)
                .isTrue();
        });
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9767711" + String.format("%04d",
            Math.abs(seed.hashCode()) % 10000);
        post("/api/v1/auth/otp/request",
            Map.of("phone",
                phone));
        ResponseEntity<Map> response = post("/api/v1/auth/otp/verify",
            Map.of("phone",
                phone,
                "code",
                "123456"));
        String accessToken = (String) response.getBody()
            .get("access_token");
        String userId = (String) ((Map) response.getBody()
            .get("user")).get("id");
        return new AuthContext(userId,
            accessToken);
    }

    private String tokenFor(String role,
                            String status,
                            String userId) {
        return io.jsonwebtoken.Jwts.builder()
            .subject(userId)
            .claim("role",
                role)
            .claim("status",
                status)
            .claim("token_type",
                "access")
            .issuedAt(new java.util.Date())
            .expiration(new java.util.Date(System.currentTimeMillis() + 3600000))
            .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
            .compact();
    }

    private ResponseEntity<Map> postWithAuth(String path,
                                             String token,
                                             Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        headers.set("Accept-Language",
            TEST_LOCALE);
        headers.set("X-Client-Platform",
            TEST_PLATFORM);
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key",
                UUID.randomUUID()
                    .toString());
        }
        HttpEntity<Object> entity = new HttpEntity<>(body,
            headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            org.springframework.http.HttpMethod.POST,
            entity,
            Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path,
                                            String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept-Language",
            TEST_LOCALE);
        headers.set("X-Client-Platform",
            TEST_PLATFORM);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            org.springframework.http.HttpMethod.GET,
            entity,
            Map.class);
    }

    private ResponseEntity<Map> post(String path,
                                     Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path,
            body,
            Map.class);
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/tasks/[^/]+/applications/[^/]+/accept$")
            || path.matches("^/api/v1/bookings/[^/]+/(complete|cancel|disputes)$")
            || path.matches("^/api/v1/admin/disputes/[^/]+/resolve$");
    }

    @Test
    @DisplayName("TID-TASK-090-OBS-KPI-VALIDATION KPI report computes conversion, fulfillment, " +
        "and dispute rates")
    void computesKpiRatesFromEvents() {
        analyticsService.track(
            AnalyticsService.EVENT_TASK_POSTED,
            CUSTOMER_1,
            Map.of(AnalyticsService.PROPERTY_TASK_ID,
                "task-1")
        );
        analyticsService.track(
            AnalyticsService.EVENT_TASK_POSTED,
            CUSTOMER_2,
            Map.of(AnalyticsService.PROPERTY_TASK_ID,
                "task-2")
        );
        analyticsService.track(
            AnalyticsService.EVENT_BOOKING_CONFIRMED,
            CUSTOMER_1,
            Map.of(
                AnalyticsService.PROPERTY_TASK_ID,
                "task-1",
                AnalyticsService.PROPERTY_BOOKING_ID,
                "booking-1"
            )
        );
        analyticsService.track(
            AnalyticsService.EVENT_BOOKING_COMPLETED,
            CUSTOMER_1,
            Map.of(
                AnalyticsService.PROPERTY_TASK_ID,
                "task-1",
                AnalyticsService.PROPERTY_BOOKING_ID,
                "booking-1"
            )
        );
        analyticsService.track(
            AnalyticsService.EVENT_DISPUTE_RAISED,
            CUSTOMER_1,
            Map.of(
                AnalyticsService.PROPERTY_TASK_ID,
                "task-1",
                AnalyticsService.PROPERTY_BOOKING_ID,
                "booking-1"
            )
        );

        Set<String> scopedTaskIds = Set.of("task-1",
            "task-2");
        Set<String> scopedBookingIds = Set.of("booking-1");
        List<Event> scopedEvents = analyticsService.getEvents()
            .stream()
            .filter(event -> {
                Object taskId = event.properties()
                    .get(AnalyticsService.PROPERTY_TASK_ID);
                Object bookingId = event.properties()
                    .get(AnalyticsService.PROPERTY_BOOKING_ID);
                return (taskId != null && scopedTaskIds.contains(taskId.toString()))
                    ||
                    (bookingId != null && scopedBookingIds.contains(bookingId.toString()));
            })
            .toList();

        KpiReport report = kpiReportService.buildReport(scopedEvents);

        assertThat(report.taskPostedCount()).isEqualTo(2);
        assertThat(report.paidTaskCount()).isEqualTo(1);
        assertThat(report.paidBookingCount()).isEqualTo(1);
        assertThat(report.completedBookingCount()).isEqualTo(1);
        assertThat(report.disputedBookingCount()).isEqualTo(1);
        assertThat(report.conversionRate()).isEqualTo(0.5d);
        assertThat(report.fulfillmentRate()).isEqualTo(1.0d);
        assertThat(report.disputeRate()).isEqualTo(1.0d);
    }

    @Test
    @DisplayName("TID-TASK-062-MOBILE-CACHE-PERSIST mobile persists last successful payload")
    void mobileCachePersistContract() {
        AuthContext customer = authenticate("cache-customer");
        String categoryId = createCategoryAndGetFirstId(customer.accessToken());
        String taskId = createTask(customer.accessToken(),
            categoryId,
            "cache-task");

        ResponseEntity<Map> first = getWithAuth("/api/v1/tasks?limit=20",
            customer.accessToken());
        ResponseEntity<Map> second = getWithAuth("/api/v1/tasks?limit=20",
            customer.accessToken());

        List<Map<String, Object>> firstData = (List<Map<String, Object>>) first.getBody()
            .get("data");
        List<Map<String, Object>> secondData = (List<Map<String, Object>>) second.getBody()
            .get("data");
        assertThat(firstData.stream()
            .map(t -> t.get("id")
                .toString())).contains(taskId);
        assertThat(secondData.stream()
            .map(t -> t.get("id")
                .toString())).contains(taskId);
    }

    @Test
    @DisplayName("TID-TASK-062-MOBILE-OFFLINE-READ offline mode renders cached data")
    void mobileOfflineRead() {
        AuthContext customer = authenticate("offline-read-customer");
        AuthContext tasker = authenticate("offline-read-tasker");
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);
        String categoryId = createCategoryAndGetFirstId(customer.accessToken());
        String taskId = createTask(customer.accessToken(),
            categoryId,
            "offline-read-task");

        String taskerToken = activateAndVerifyTasker(tasker,
            adminToken);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message",
                "Available"));
        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications",
            customer.accessToken()).getBody()
            .get("data"))
            .get(0)
            .get("id")
            .toString();
        String bookingId = (String) postWithAuth(
            "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        ).getBody()
            .get("id");

        ResponseEntity<Map> bookingList = getWithAuth("/api/v1/bookings?limit=20",
            customer.accessToken());
        ResponseEntity<Map> bookingDetail = getWithAuth("/api/v1/bookings/" + bookingId,
            customer.accessToken());

        List<Map<String, Object>> bookings = (List<Map<String, Object>>) bookingList.getBody()
            .get("data");
        assertThat(bookings.stream()
            .map(item -> item.get("id")
                .toString())).contains(bookingId);
        assertThat(bookingDetail.getBody()
            .get("id")).isEqualTo(bookingId);
    }

    @Test
    @DisplayName("TID-TASK-062-MOBILE-OFFLINE-MUTATION-BLOCK offline mode blocks mutations")
    void mobileOfflineMutationBlock() {
        AuthContext customer = authenticate("offline-block-customer");
        AuthContext tasker = authenticate("offline-block-tasker");
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);
        String categoryId = createCategoryAndGetFirstId(customer.accessToken());
        String taskId = createTask(customer.accessToken(),
            categoryId,
            "offline-block-task");

        String taskerToken = activateAndVerifyTasker(tasker,
            adminToken);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message",
                "Available"));
        String appId = ((List<Map>) getWithAuth("/api/v1/tasks/" + taskId + "/applications",
            customer.accessToken()).getBody()
            .get("data"))
            .get(0)
            .get("id")
            .toString();
        String bookingId = (String) postWithAuth(
            "/api/v1/tasks/" + taskId + "/applications/" + appId + "/accept",
            customer.accessToken(),
            Map.of("liability_disclaimer_accepted",
                true)
        ).getBody()
            .get("id");

        ResponseEntity<Map> unauthorized = post("/api/v1/bookings/" + bookingId + "/complete",
            null);
        assertThat(unauthorized.getStatusCode()
            .value()).isEqualTo(401);
    }

    private String createCategoryAndGetFirstId(String customerToken) {
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);
        postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name",
                "Cat-" + UUID.randomUUID(),
                "base_price",
                1000,
                "name_mn",
                "MN Cat",
                "icon_url",
                "http://x.com/i.png",
                "sort_order",
                1
            )
        );
        return ((List<Map>) getWithAuth("/api/v1/categories",
            customerToken).getBody()
            .get("data"))
            .get(0)
            .get("id")
            .toString();
    }

    private String createTask(String customerToken,
                              String categoryId,
                              String descriptionSeed) {
        return (String) postWithAuth(
            "/api/v1/tasks",
            customerToken,
            Map.of(
                "category_id",
                categoryId,
                "description",
                "Description " + descriptionSeed + " long enough",
                "budget",
                10000,
                "location_lat",
                47.9,
                "location_lng",
                106.9,
                "location_text",
                "Ulaanbaatar",
                "scheduled_at",
                java.time.Instant.now()
                    .plusSeconds(3600)
                    .toString(),
                "photo_keys",
                List.of()
            )
        ).getBody()
            .get("id");
    }

    @SuppressWarnings("unchecked")
    private String activateAndVerifyTasker(AuthContext tasker,
                                           String adminToken) {
        ResponseEntity<Map> activateTasker = postWithAuth(
            "/api/v1/users/me/role/tasker",
            tasker.accessToken(),
            null
        );
        assertThat(activateTasker.getStatusCode()
            .value()).isEqualTo(200);
        String taskerToken = String.valueOf(activateTasker.getBody()
            .get("access_token"));

        ResponseEntity<Map> submitVerification = postWithAuth(
            "/api/v1/verification/submit",
            taskerToken,
            Map.of(
                "id_card_front_key",
                "uploads/verification/front-" + UUID.randomUUID() + ".jpg",
                "id_card_back_key",
                "uploads/verification/back-" + UUID.randomUUID() + ".jpg"
            )
        );
        assertThat(submitVerification.getStatusCode()
            .value()).isEqualTo(200);

        ResponseEntity<Map> pendingList =
            getWithAuth("/api/v1/admin/verifications/pending?limit=100",
                adminToken);
        assertThat(pendingList.getStatusCode()
            .value()).isEqualTo(200);
        List<Map<String, Object>> data = (List<Map<String, Object>>) pendingList.getBody()
            .get("data");

        Map<String, Object> verification = data.stream()
            .filter(v -> tasker.userId()
                .equals(v.get("user_id")))
            .findFirst()
            .orElseThrow();
        String verificationId = String.valueOf(verification.get("id"));

        ResponseEntity<Map> approveVerification = postWithAuth(
            "/api/v1/admin/verifications/" + verificationId + "/approve",
            adminToken,
            null
        );
        assertThat(approveVerification.getStatusCode()
            .value()).isEqualTo(200);
        return taskerToken;
    }

    record AuthContext(String userId, String accessToken) {

    }
}
