package mn.tasky.auth;

import static org.assertj.core.api.Assertions.assertThat;

import mn.tasky.auth.application.LoggingSmsService;
import mn.tasky.common.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import java.util.Map;
import java.util.UUID;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"tasky.auth.otp-test-code="}
)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OtpSecurityIntegrationTests
        extends IntegrationTestBase {

    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Autowired
    private LoggingSmsService loggingSmsService;

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
                url("/api/v1/auth/otp/verify"),
                Map.of("phone",
                       phone,
                       "code",
                       firstCode),
                Map.class
        );
        assertThat(oldCodeResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Map> currentCodeResponse = restTemplate.postForEntity(
                url("/api/v1/auth/otp/verify"),
                Map.of("phone",
                       phone,
                       "code",
                       secondCode),
                Map.class
        );
        assertThat(currentCodeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    private String uniquePhone() {
        String digits = UUID.randomUUID()
                .toString()
                .replaceAll("[^0-9]",
                            "") + "0123456789";
        return "+97655" + digits.substring(0,
                                           6);
    }

    private String requestAndReadCode(String phone) {
        ResponseEntity<Map> requestResponse = restTemplate.postForEntity(
                url("/api/v1/auth/otp/request"),
                Map.of("phone",
                       phone),
                Map.class
        );
        assertThat(requestResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        return loggingSmsService.latestOtpForPhone(phone)
                .orElseThrow();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
