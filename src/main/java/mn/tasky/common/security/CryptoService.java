package mn.tasky.common.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class CryptoService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final String BLIND_INDEX_ALGORITHM = "HmacSHA256";

    private final SecretKey secretKey;
    private final SecretKey blindIndexKey;

    public CryptoService(
            @Value("${tasky.security.encryption-key}") String base64Key,
            @Value("${tasky.security.blind-index-key}") String blindIndexKey
    ) {
        if (!StringUtils.hasText(base64Key)) {
            throw new IllegalStateException("tasky.security.encryption-key must be configured.");
        }
        if (!StringUtils.hasText(blindIndexKey)) {
            throw new IllegalStateException("tasky.security.blind-index-key must be configured.");
        }

        byte[] decodedKey = Base64.getDecoder()
                .decode(base64Key);
        this.secretKey     = new SecretKeySpec(decodedKey,
                                               "AES");
        this.blindIndexKey = new SecretKeySpec(
                blindIndexKey.getBytes(StandardCharsets.UTF_8),
                BLIND_INDEX_ALGORITHM
        );
    }

    @PostConstruct
    void validateKeys() {
        if (secretKey.getEncoded().length != 32) {
            throw new IllegalStateException("Encryption key must decode to exactly 32 bytes for " +
                                                    "AES-256.");
        }
        if (blindIndexKey.getEncoded().length < 32) {
            throw new IllegalStateException("Blind index key must be at least 32 bytes.");
        }
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH,
                                                                  iv);
            cipher.init(Cipher.ENCRYPT_MODE,
                        secretKey,
                        parameterSpec);

            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + cipherText.length];
            System.arraycopy(iv,
                             0,
                             combined,
                             0,
                             iv.length);
            System.arraycopy(cipherText,
                             0,
                             combined,
                             iv.length,
                             cipherText.length);

            return Base64.getEncoder()
                    .encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed",
                                       e);
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null) return null;
        try {
            byte[] decoded = Base64.getDecoder()
                    .decode(ciphertext);

            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH,
                                                                  decoded,
                                                                  0,
                                                                  GCM_IV_LENGTH);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE,
                        secretKey,
                        parameterSpec);

            byte[] plaintext = cipher.doFinal(decoded,
                                              GCM_IV_LENGTH,
                                              decoded.length - GCM_IV_LENGTH);
            return new String(plaintext,
                              StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed",
                                       e);
        }
    }

    public String blindIndex(String input) {
        if (input == null) return null;
        try {
            Mac mac = Mac.getInstance(BLIND_INDEX_ALGORITHM);
            mac.init(blindIndexKey);
            byte[] hash = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder()
                    .encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed",
                                       e);
        }
    }
}
