package mn.tasky.payment;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.wallet.application.WalletService;
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
import org.springframework.test.context.TestPropertySource;

import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@TestPropertySource(properties = "tasky.features.monetization-enabled=true")
class PayoutIntegrationTests
    extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;
    @Autowired
    private WalletService walletService;
    @Autowired
    private CategoryDao categoryDao;
    @Autowired
    private TaskDao taskDao;
    @Autowired
    private BookingDao bookingDao;

    @Test
    @DisplayName("TID-TASK-034-API-PAYOUT-REQUEST tasker can request payout up to available " +
        "balance")
    void taskerCanRequestPayout() {
        AuthContext tasker = authenticate("payout-1");
        AuthContext customer = authenticate("payout-customer-1");
        String taskerToken = tokenFor("TASKER",
            "ACTIVE",
            tasker.userId());

        // Credit wallet first
        walletService.creditTaskCompletion(tasker.userId(),
            createBooking(customer.userId(),
                tasker.userId()),
            10000,
            0.1); // 9000 credit

        // Request payout
        ResponseEntity<Map> response = postWithAuth("/api/v1/wallet/payouts",
            taskerToken,
            Map.of("amount",
                5000));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()
            .get("status")).isEqualTo("PENDING");

        // Verify balance reflects pending
        ResponseEntity<Map> balanceResponse = getWithAuth("/api/v1/wallet",
            taskerToken);
        assertThat(((Number) balanceResponse.getBody()
            .get("balance")).intValue()).isEqualTo(4000);
        assertThat(((Number) balanceResponse.getBody()
            .get("pending_payout")).intValue()).isEqualTo(5000);
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9767711" + String.format("%04d",
            Math.abs(seed.hashCode()) % 10000);
        restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/request",
            Map.of("phone",
                phone),
            Map.class);
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "http://localhost:" + port + "/api/v1/auth/otp/verify",
            Map.of("phone",
                phone,
                "code",
                "123456"),
            Map.class
        );

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
        return Jwts.builder()
            .subject(userId)
            .claim("role",
                role)
            .claim("status",
                status)
            .claim("token_type",
                "access")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600000))
            .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
            .compact();
    }

    private String createBooking(String customerId,
                                 String taskerId) {
        Instant now = Instant.now();
        String categoryId = UUID.randomUUID()
            .toString();
        categoryDao.insert(
            categoryId,
            "Payout category",
            "Төлбөрийн ангилал",
            "https://example.com/icon.png",
            true,
            1
        );

        String taskId = UUID.randomUUID()
            .toString();
        taskDao.insert(
            taskId,
            customerId,
            categoryId,
            "Payout test task",
            10000,
            47.918,
            106.917,
            "Ulaanbaatar",
            "ASSIGNED",
            now.plusSeconds(3600),
            now,
            now
        );

        String bookingId = UUID.randomUUID()
            .toString();
        bookingDao.insert(
            bookingId,
            taskId,
            taskerId,
            customerId,
            10000,
            "COMPLETED",
            null,
            true,
            now,
            now
        );
        return bookingId;
    }

    private ResponseEntity<Map> postWithAuth(String path,
                                             String token,
                                             Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        if (requiresIdempotencyHeader(path)) {
            headers.set("Idempotency-Key",
                UUID.randomUUID()
                    .toString());
        }
        HttpEntity<Object> entity = new HttpEntity<>(body,
            headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.POST,
            entity,
            Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path,
                                            String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.GET,
            entity,
            Map.class);
    }

    private boolean requiresIdempotencyHeader(String path) {
        return path.matches("^/api/v1/wallet/payouts$")
            || path.matches("^/api/v1/admin/payouts/[^/]+/process$");
    }

    @Test
    @DisplayName("TID-TASK-034-API-PAYOUT-REQUEST payout fails if insufficient balance")
    void payoutFailsInsufficientBalance() {
        AuthContext tasker = authenticate("payout-2");
        AuthContext customer = authenticate("payout-customer-2");
        String taskerToken = tokenFor("TASKER",
            "ACTIVE",
            tasker.userId());

        walletService.creditTaskCompletion(tasker.userId(),
            createBooking(customer.userId(),
                tasker.userId()),
            10000,
            0.1); // 9000 credit

        ResponseEntity<Map> response = postWithAuth("/api/v1/wallet/payouts",
            taskerToken,
            Map.of("amount",
                10000));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()
            .get("error")).isEqualTo("Insufficient balance");
    }

    @Test
    @DisplayName("TID-TASK-034-API-PAYOUT-REQUEST amount must be positive")
    void payoutRejectsNonPositiveAmount() {
        AuthContext tasker = authenticate("payout-3");
        AuthContext customer = authenticate("payout-customer-3");
        String taskerToken = tokenFor("TASKER",
            "ACTIVE",
            tasker.userId());

        walletService.creditTaskCompletion(tasker.userId(),
            createBooking(customer.userId(),
                tasker.userId()),
            10000,
            0.1);

        ResponseEntity<Map> zeroAmount = postWithAuth("/api/v1/wallet/payouts",
            taskerToken,
            Map.of("amount",
                0));
        assertThat(zeroAmount.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        ResponseEntity<Map> negativeAmount = postWithAuth("/api/v1/wallet/payouts",
            taskerToken,
            Map.of("amount",
                -1));
        assertThat(negativeAmount.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("TID-TASK-034-DOMAIN-WALLET-DEDUP duplicate booking completion credit is ignored")
    void duplicateBookingCreditIsIgnored() {
        AuthContext tasker = authenticate("payout-4");
        AuthContext customer = authenticate("payout-customer-4");
        String taskerToken = tokenFor("TASKER",
            "ACTIVE",
            tasker.userId());

        String bookingId = createBooking(customer.userId(),
            tasker.userId());
        walletService.creditTaskCompletion(tasker.userId(),
            bookingId,
            10000,
            0.1);
        walletService.creditTaskCompletion(tasker.userId(),
            bookingId,
            10000,
            0.1);

        ResponseEntity<Map> balanceResponse = getWithAuth("/api/v1/wallet",
            taskerToken);
        assertThat(((Number) balanceResponse.getBody()
            .get("balance")).intValue()).isEqualTo(9000);
    }

    @Test
    @DisplayName("TID-TASK-034-API-ADMIN-PAYOUT-PROCESS TID-TASK-034-DOMAIN-PAYOUT-SCHEDULE admin" +
        " can list and processing is restricted by schedule")
    void adminPayoutFlow() {
        AuthContext tasker = authenticate("payout-5");
        AuthContext customer = authenticate("payout-customer-5");
        String taskerToken = tokenFor("TASKER",
            "ACTIVE",
            tasker.userId());
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);

        walletService.creditTaskCompletion(tasker.userId(),
            createBooking(customer.userId(),
                tasker.userId()),
            10000,
            0.1);
        String payoutId = (String) postWithAuth("/api/v1/wallet/payouts",
            taskerToken,
            Map.of("amount",
                5000)).getBody()
            .get("id");

        // Admin list
        ResponseEntity<Map> listResponse = getWithAuth("/api/v1/admin/payouts/pending",
            adminToken);
        assertThat(listResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map> data = (List<Map>) listResponse.getBody()
            .get("data");
        assertThat(data.stream()
            .map(item -> item.get("id")
                .toString())).contains(payoutId);

        // Process result depends on configured schedule days (Tuesday/Friday).
        ResponseEntity<Map> processResponse =
            postWithAuth("/api/v1/admin/payouts/" + payoutId + "/process",
                adminToken,
                null);
        DayOfWeek today = LocalDate.now()
            .getDayOfWeek();
        if (today == DayOfWeek.TUESDAY || today == DayOfWeek.FRIDAY) {
            assertThat(processResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(processResponse.getBody()
                .get("status")).isEqualTo("PROCESSED");
        } else {
            assertThat(processResponse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(processResponse.getBody()
                .get("error")
                .toString()).contains("Today is " + today);
        }
    }

    record AuthContext(String userId, String accessToken) {

    }
}
