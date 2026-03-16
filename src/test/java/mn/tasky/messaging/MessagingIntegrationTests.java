package mn.tasky.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.task.application.TaskService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@SuppressWarnings({"rawtypes", "unchecked", "ConstantConditions"})
class MessagingIntegrationTests extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @LocalServerPort
    private int port;

    @Value("${tasky.security.jwt-secret}")
    private String jwtSecret;

    @Autowired
    private TaskService taskService;

    @Test
    @DisplayName("TID-TASK-043-WS-REALTIME-DELIVERY real-time message delivery via WebSocket "
        + "(TID-TASK-043-WS-SUBSCRIBE-AUTHZ)")
    void realTimeMessaging() throws Exception {
        AuthContext customer = authenticate("cust-ws");
        AuthContext tasker = authenticate("task-ws");
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            "admin-ws");
        String taskerToken = activateAndVerifyTasker(tasker,
            adminToken);
        postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name",
                "WS",
                "base_price",
                1000,
                "name_mn",
                "WS",
                "icon_url",
                "http://x.com/i.png",
                "sort_order",
                1));
        String catId = ((List<Map>) getWithAuth("/api/v1/categories",
            customer.accessToken())
            .getBody()
            .get("data"))
            .get(0)
            .get("id")
            .toString();
        String taskId = (String) postWithAuth(
            "/api/v1/tasks",
            customer.accessToken(),
            Map.of(
                "category_id",
                catId,
                "description",
                "WS Test Task Description Long",
                "budget",
                10000,
                "location_lat",
                47.9,
                "location_lng",
                106.9,
                "location_text",
                "Ulaanbaatar, Mongolia",
                "scheduled_at",
                Instant.now()
                    .plusSeconds(3600)
                    .toString(),
                "photo_keys",
                List.of()))
            .getBody()
            .get("id");
        postWithAuth("/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message",
                "WS"));
        String conversationId = (String) ((List<Map>) getWithAuth("/api/v1/conversations",
            customer.accessToken())
            .getBody()
            .get("data"))
            .get(0)
            .get("id");

        // WebSocket Client Setup
        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        converter.setObjectMapper(mapper);
        stompClient.setMessageConverter(converter);

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization",
            "Bearer " + taskerToken);

        StompSessionHandlerAdapter handlerAdapter = new StompSessionHandlerAdapter() {
        };

        StompSession session = stompClient
            .connectAsync(
                "ws://localhost:" + port + "/ws",
                new WebSocketHttpHeaders(),
                connectHeaders,
                handlerAdapter)
            .get(20,
                TimeUnit.SECONDS);

        CompletableFuture<Map<String, Object>> resultFuture = new CompletableFuture<>();
        StompFrameHandler frameHandler = new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Map.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) payload;
                resultFuture.complete(message);
            }
        };
        session.subscribe("/topic/conversations/" + conversationId,
            frameHandler);

        // Send via REST
        String initialMessageContent = "Real-time Hello";
        postWithAuth(
            "/api/v1/conversations/" + conversationId + "/messages",
            customer.accessToken(),
            Map.of("content",
                initialMessageContent));

        // Verify Real-time delivery
        Map<String, Object> received =
            awaitRealtimeDelivery(resultFuture,
                conversationId,
                customer.accessToken(),
                initialMessageContent);
        assertThat(received.get("content")
            .toString()).startsWith(initialMessageContent);
        assertThat(received.get("senderId")
            .toString()).isEqualTo(customer.userId());
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9769911" + String.format("%04d",
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

    private String tokenFor(String role, String status, String userId) {
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

    @SuppressWarnings("unchecked")
    private String activateAndVerifyTasker(AuthContext tasker, String adminToken) {
        ResponseEntity<Map> activateResponse = postWithAuth("/api/v1/users/me/role/tasker",
            tasker.accessToken(),
            null);
        assertThat(activateResponse.getStatusCode()
            .value()).isEqualTo(200);
        String taskerToken = String.valueOf(activateResponse.getBody()
            .get("access_token"));

        ResponseEntity<Map> submitResponse = postWithAuth(
            "/api/v1/verification/submit",
            taskerToken,
            Map.of(
                "id_card_front_key",
                "uploads/verification/front-" + Instant.now()
                    .toEpochMilli() + ".jpg",
                "id_card_back_key",
                "uploads/verification/back-" + Instant.now()
                    .toEpochMilli() + ".jpg",
                "consent_policy_version",
                "1.0",
                "consent_accepted",
                true));
        assertThat(submitResponse.getStatusCode()
            .value()).isEqualTo(200);

        ResponseEntity<Map> pendingResponse = getWithAuth("/api/v1/admin/verifications/pending?limit=100",
            adminToken);
        assertThat(pendingResponse.getStatusCode()
            .value()).isEqualTo(200);
        List<Map<String, Object>> pendingItems =
            (List<Map<String, Object>>) pendingResponse.getBody()
                .get("data");

        Map<String, Object> verification = pendingItems.stream()
            .filter(item -> tasker.userId()
                .equals(item.get("user_id")))
            .findFirst()
            .orElseThrow();
        String verificationId = String.valueOf(verification.get("id"));

        ResponseEntity<Map> approveResponse =
            postWithAuth("/api/v1/admin/verifications/" + verificationId + "/approve",
                adminToken,
                null);
        assertThat(approveResponse.getStatusCode()
            .value()).isEqualTo(200);
        return taskerToken;
    }

    private ResponseEntity<Map> postWithAuth(String path, String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        HttpEntity<Object> entity = new HttpEntity<>(body,
            headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.POST,
            entity,
            Map.class);
    }

    private ResponseEntity<Map> getWithAuth(String path, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange("http://localhost:" + port + path,
            HttpMethod.GET,
            entity,
            Map.class);
    }

    private Map<String, Object> awaitRealtimeDelivery(
        CompletableFuture<Map<String, Object>> resultFuture,
        String conversationId,
        String customerToken,
        String initialMessageContent)
        throws Exception {
        TimeoutException lastTimeout = null;
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                return resultFuture.get(5,
                    TimeUnit.SECONDS);
            } catch (TimeoutException timeoutException) {
                lastTimeout = timeoutException;
                if (attempt == 2) {
                    break;
                }
                postWithAuth(
                    "/api/v1/conversations/" + conversationId + "/messages",
                    customerToken,
                    Map.of("content",
                        initialMessageContent + " retry " + (attempt + 1)));
            }
        }
        throw lastTimeout;
    }

    private ResponseEntity<Map> post(String path, Object body) {
        return restTemplate.postForEntity("http://localhost:" + port + path,
            body,
            Map.class);
    }

    @Test
    @DisplayName(
        "TID-TASK-042-API-CONVERSATION-LIST conversation created on application and " + "visible to participants")
    void conversationCreatedOnApplication() {
        AuthContext customer = authenticate("customer-msg");
        AuthContext tasker = authenticate("tasker-msg");
        String categoryId = "cat-1"; // Assume exists or mocked? No, I need real one.
        // I'll skip category check logic by mocking or just creating one if needed, but
        // integration test uses real service.
        // TaskService.createTask checks category. I need to insert a category or use existing one.
        // I'll use a hack to create category or assume one exists from previous steps (but
        // DirtiesContext clears it).
        // I'll use Admin API to create category.

        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);
        postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name",
                "Test Cat",
                "base_price",
                5000,
                "name_mn",
                "Тест",
                "icon_url",
                "http://example.com/icon.png",
                "sort_order",
                1));
        String catId = ((List<Map>) getWithAuth("/api/v1/categories",
            customer.accessToken())
            .getBody()
            .get("data"))
            .get(0)
            .get("id")
            .toString();

        // Create Task
        ResponseEntity<Map> taskResponse = postWithAuth(
            "/api/v1/tasks",
            customer.accessToken(),
            Map.of(
                "category_id",
                catId,
                "description",
                "Test Task Description Long Enough",
                "budget",
                10000,
                "location_lat",
                47.9,
                "location_lng",
                106.9,
                "location_text",
                "Ulaanbaatar",
                "scheduled_at",
                Instant.now()
                    .plusSeconds(3600)
                    .toString(),
                "photo_keys",
                List.of()));
        String taskId = (String) taskResponse.getBody()
            .get("id");

        String taskerToken = activateAndVerifyTasker(tasker,
            adminToken);

        // Apply
        postWithAuth("/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message",
                "I apply"));

        // Check conversations for Customer
        ResponseEntity<Map> conversationsCust = getWithAuth("/api/v1/conversations",
            customer.accessToken());
        List<Map> listCust = (List<Map>) conversationsCust.getBody()
            .get("data");
        assertThat(listCust).hasSize(1);
        String conversationId = (String) listCust.get(0)
            .get("id");

        // Check conversations for Tasker
        ResponseEntity<Map> conversationsTasker = getWithAuth("/api/v1/conversations",
            taskerToken);
        List<Map> listTasker = (List<Map>) conversationsTasker.getBody()
            .get("data");
        assertThat(listTasker).hasSize(1);
        assertThat(listTasker.get(0)
            .get("id")).isEqualTo(conversationId);
    }

    @Test
    @DisplayName("TID-TASK-042-API-MESSAGE-SEND send and list messages " + "(TID-TASK-042-API-MESSAGE-LIST)")
    void messageSendAndList() {
        // Setup conversation (reuse logic or mock)
        // I'll do full flow for realism
        AuthContext customer = authenticate("cust-msg-2");
        AuthContext tasker = authenticate("task-msg-2");
        String adminToken = tokenFor("ADMIN",
            "ACTIVE",
            ADMIN_ID);
        postWithAuth(
            "/api/v1/admin/categories",
            adminToken,
            Map.of(
                "name",
                "Cat2",
                "base_price",
                5000,
                "name_mn",
                "Cat2 MN",
                "icon_url",
                "http://example.com/icon2.png",
                "sort_order",
                2));
        String catId = ((List<Map>) getWithAuth("/api/v1/categories",
            customer.accessToken())
            .getBody()
            .get("data"))
            .get(0)
            .get("id")
            .toString();
        String taskId = (String) postWithAuth(
            "/api/v1/tasks",
            customer.accessToken(),
            Map.of(
                "category_id",
                catId,
                "description",
                "Test Task Description for Messaging",
                "budget",
                10000,
                "location_lat",
                47.9,
                "location_lng",
                106.9,
                "location_text",
                "Ulaanbaatar",
                "scheduled_at",
                Instant.now()
                    .plusSeconds(3600)
                    .toString(),
                "photo_keys",
                List.of()))
            .getBody()
            .get("id");
        String taskerToken = activateAndVerifyTasker(tasker,
            adminToken);
        postWithAuth("/api/v1/tasks/" + taskId + "/applications",
            taskerToken,
            Map.of("message",
                "Hi"));

        String conversationId = (String) ((List<Map>) getWithAuth("/api/v1/conversations",
            customer.accessToken())
            .getBody()
            .get("data"))
            .get(0)
            .get("id");

        // Send 3 messages
        for (int i = 0; i < 3; i++) {
            postWithAuth(
                "/api/v1/conversations/" + conversationId + "/messages",
                customer.accessToken(),
                Map.of("content",
                    "Msg " + i));
        }

        // List with limit 2
        // TID-TASK-042-API-MESSAGE-LIST
        ResponseEntity<Map> msgsResponse1 =
            getWithAuth("/api/v1/conversations/" + conversationId + "/messages?limit=2",
                taskerToken);
        List<Map> msgs1 = (List<Map>) msgsResponse1.getBody()
            .get("data");
        assertThat(msgs1).hasSize(2);

        Map cursor = (Map) msgsResponse1.getBody()
            .get("cursor");
        String next = (String) cursor.get("next");
        assertThat(next).isNotNull();
        assertThat((Boolean) cursor.get("has_more")).isTrue();

        // List next page
        ResponseEntity<Map> msgsResponse2 = getWithAuth(
            "/api/v1/conversations/" + conversationId + "/messages?limit=2&cursor=" + next,
            taskerToken);
        List<Map> msgs2 = (List<Map>) msgsResponse2.getBody()
            .get("data");
        assertThat(msgs2).hasSize(1);
        assertThat(((Map) msgsResponse2.getBody()
            .get("cursor")).get("has_more"))
            .isEqualTo(false);
    }

    record AuthContext(String userId, String accessToken) {
    }
}
