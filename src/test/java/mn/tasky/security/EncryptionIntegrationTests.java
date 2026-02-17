package mn.tasky.security;

import static org.assertj.core.api.Assertions.assertThat;

import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuditLogEntry;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.common.IntegrationTestBase;
import mn.tasky.common.security.CryptoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;
import java.util.Map;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class EncryptionIntegrationTests
        extends IntegrationTestBase {

    private static final String ADMIN_ID = "00000000-0000-0000-0000-000000000001";
    private final TestRestTemplate restTemplate = new TestRestTemplate();
    @LocalServerPort
    private int port;
    @Autowired
    private AuthService authService;
    @Autowired
    private CryptoService cryptoService;
    @Autowired
    private UserDao userDao;

    @Test
    @DisplayName("TID-TASK-060-SEC-PII-ENCRYPTION phone is encrypted at rest and indexed by hash")
    void piiEncryptedAtRest() {
        String phone = "+97699112233";

        // Register user
        restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/request",
                                   Map.of("phone",
                                          phone),
                                   Map.class);
        restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/verify",
                                   Map.of("phone",
                                          phone,
                                          "code",
                                          "123456"),
                                   Map.class);

        String blindIndex = cryptoService.blindIndex(phone);
        var storedUser = userDao.findByPhoneBlindIndex(blindIndex);
        assertThat(storedUser).isPresent();
        String storedPhone = storedUser.get()
                .phone();

        assertThat(storedPhone).isNotEqualTo(phone);
        assertThat(storedPhone).isNotEqualTo(blindIndex);

        // It should be decryptable
        String decrypted = cryptoService.decrypt(storedPhone);
        assertThat(decrypted).isEqualTo(phone);
    }

    @Test
    @DisplayName("TID-TASK-060-SEC-ID-ASSET-PRIVATE ID assets remain private and use short-lived " +
            "URLs")
    void idAssetPrivacy() {
        AuthContext user = authenticate("user-id");
        authService.activateTaskerRole(user.userId());
        authService.submitVerification(user.userId(),
                                       "front.jpg",
                                       "back.jpg");

        VerificationStatusResponse status = authService.getVerificationStatus(user.userId());
        assertThat(status.status()).isEqualTo("PENDING");

        // Admin lists verifications
        List<VerificationDetail> pending = authService.listPendingVerifications(10);
        assertThat(pending).anySatisfy(v -> {
            assertThat(v.userId()).isEqualTo(user.userId());
            assertThat(v.idCardFrontUrl()).contains("presigned-get");
        });
    }

    private AuthContext authenticate(String seed) {
        String phone = "+9767711" + String.format("%04d",
                                                  Math.abs(seed.hashCode()) % 10000);
        restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/request",
                                   Map.of("phone",
                                          phone),
                                   Map.class);
        ResponseEntity<Map> response =
                restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/verify",
                                           Map.of("phone",
                                                  phone,
                                                  "code",
                                                  "123456"),
                                           Map.class);
        String accessToken = (String) response.getBody()
                .get("access_token");
        String userId = (String) ((Map) response.getBody()
                .get("user")).get("id");
        return new AuthContext(userId,
                               accessToken);
    }

    @Test
    @DisplayName("TID-TASK-060-SEC-PII-AUDIT-ACCESS production PII access is auditable")
    void piiAuditAccess() {
        AuthContext user = authenticate("user-audit");

        authService.banUser(ADMIN_ID,
                            user.userId(),
                            "Audit Test");

        List<AuditLogEntry> logs = authService.getAuditLog();
        assertThat(logs).anySatisfy(l -> {
            assertThat(l.adminId()).isEqualTo(ADMIN_ID);
            assertThat(l.action()).isEqualTo("BAN_USER");
            assertThat(l.targetId()).isEqualTo(user.userId());
        });
    }

    record AuthContext(String userId, String accessToken) {

    }
}
