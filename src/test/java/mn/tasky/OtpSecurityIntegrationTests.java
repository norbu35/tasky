package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.UUID;
import mn.tasky.auth.application.LoggingSmsService;
import mn.tasky.common.IntegrationTestBase;
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
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(
        properties = {
            "tasky.auth.otp-test-code=",
            "tasky.auth.rate-limit.otp-request-per-ip=2",
            "tasky.auth.rate-limit.refresh-per-ip=2"
        })
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OtpSecurityIntegrationTests extends IntegrationTestBase {

    @LocalServerPort
    private int port;

    @Autowired
    private LoggingSmsService loggingSmsService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-010-SECURITY-OTP-RANDOM consecutive OTP requests rotate to a new code")
    void otpRequestGeneratesNewCodeAndInvalidatesPreviousCode() {
        String phone = uniquePhone();

        String firstCode = requestAndReadCode(phone);
        String secondCode = requestAndReadCode(phone);
        int retries = 0;
        while (firstCode.equals(secondCode) && retries < 5) {
            secondCode = requestAndReadCode(phone);
            retries++;
        }

        assertThat(secondCode).isNotEqualTo(firstCode);

        ResponseEntity<Map> oldCodeResponse = restTemplate.postForEntity(
                url("/api/v1/auth/otp/verify"), Map.of("phone", phone, "code", firstCode), Map.class);
        assertThat(oldCodeResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> currentCodeResponse = restTemplate.postForEntity(
                url("/api/v1/auth/otp/verify"), Map.of("phone", phone, "code", secondCode), Map.class);
        assertThat(currentCodeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("TID-TASK-010-SECURITY-OTP-RATE-LIMIT spoofed XFF does not bypass OTP request rate limits")
    void spoofedForwardedForDoesNotBypassOtpRequestRateLimit() {
        ResponseEntity<Map> firstResponse =
                post("/api/v1/auth/otp/request", Map.of("phone", uniquePhone()), "203.0.113.10");
        ResponseEntity<Map> secondResponse =
                post("/api/v1/auth/otp/request", Map.of("phone", uniquePhone()), "203.0.113.11");
        ResponseEntity<Map> blockedResponse =
                post("/api/v1/auth/otp/request", Map.of("phone", uniquePhone()), "203.0.113.12");

        assertThat(firstResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(secondResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(blockedResponse.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    @DisplayName("TID-TASK-010-SECURITY-REFRESH-RATE-LIMIT spoofed XFF does not bypass refresh rate limits")
    void spoofedForwardedForDoesNotBypassRefreshRateLimit() {
        ResponseEntity<Map> firstResponse =
                post("/api/v1/auth/token/refresh", Map.of("refresh_token", "invalid-refresh-token-1"), "203.0.113.20");
        ResponseEntity<Map> secondResponse =
                post("/api/v1/auth/token/refresh", Map.of("refresh_token", "invalid-refresh-token-2"), "203.0.113.21");
        ResponseEntity<Map> blockedResponse =
                post("/api/v1/auth/token/refresh", Map.of("refresh_token", "invalid-refresh-token-3"), "203.0.113.22");

        assertThat(firstResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(secondResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(blockedResponse.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }

    private String requestAndReadCode(String phone) {
        ResponseEntity<Map> requestResponse =
                restTemplate.postForEntity(url("/api/v1/auth/otp/request"), Map.of("phone", phone), Map.class);
        assertThat(requestResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        return loggingSmsService.latestOtpForPhone(phone).orElseThrow();
    }

    private ResponseEntity<Map> post(String path, Map<String, String> body, String clientIp) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (clientIp != null && !clientIp.isBlank()) {
            headers.set("X-Forwarded-For", clientIp);
        }
        return restTemplate.exchange(url(path), HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private String uniquePhone() {
        String digits = UUID.randomUUID().toString().replaceAll("[^0-9]", "") + "0123456789";
        return "+97655" + digits.substring(0, 6);
    }
}
