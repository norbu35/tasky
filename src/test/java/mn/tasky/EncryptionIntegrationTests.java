package mn.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.util.Map;
import mn.tasky.auth.AuthService;
import mn.tasky.common.security.CryptoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class EncryptionIntegrationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private AuthService authService;

    @Autowired
    private CryptoService cryptoService;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    @DisplayName("TID-TASK-060-SEC-PII-ENCRYPTION phone is encrypted at rest and indexed by hash")
    void piiEncryptedAtRest() throws Exception {
        String phone = "+97699112233";
        
        // Register user
        restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/request", Map.of("phone", phone), Map.class);
        restTemplate.postForEntity("http://localhost:" + port + "/api/v1/auth/otp/verify", Map.of("phone", phone, "code", "123456"), Map.class);

        // Inspect AuthService internals via reflection
        Field usersByPhoneIndexField = AuthService.class.getDeclaredField("usersByPhoneIndex");
        usersByPhoneIndexField.setAccessible(true);
        Map<String, Object> usersByPhoneIndex = (Map<String, Object>) usersByPhoneIndexField.get(authService);

        String blindIndex = cryptoService.blindIndex(phone);
        assertThat(usersByPhoneIndex).containsKey(blindIndex);
        assertThat(usersByPhoneIndex).doesNotContainKey(phone);

        Object authUser = usersByPhoneIndex.get(blindIndex);
        // AuthUser is a record, inspect "phone" field
        // Since it's a private record in AuthService, we need reflection or inspect the toString if it's available?
        // It's a private record.
        // We can inspect the field "phone" of the record.
        Class<?> authUserClass = authUser.getClass();
        Field phoneField = authUserClass.getDeclaredField("phone");
        phoneField.setAccessible(true);
        String storedPhone = (String) phoneField.get(authUser);

        assertThat(storedPhone).isNotEqualTo(phone);
        assertThat(storedPhone).isNotEqualTo(blindIndex);
        
        // It should be decryptable
        String decrypted = cryptoService.decrypt(storedPhone);
        assertThat(decrypted).isEqualTo(phone);
    }
}
