package mn.tasky.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("CryptoService")
class CryptoServiceTest {

    private static String validKey() {
        byte[] key = new byte[32];
        java.util.Arrays.fill(key, (byte) 'A');
        return Base64.getEncoder().encodeToString(key);
    }

    private static String validBlindIndexKey() {
        byte[] key = new byte[32];
        java.util.Arrays.fill(key, (byte) 'B');
        return Base64.getEncoder().encodeToString(key);
    }

    private CryptoService cryptoService;

    @BeforeEach
    void setUp() {
        cryptoService = new CryptoService(validKey(), validBlindIndexKey());
    }

    @Nested
    @DisplayName("constructor validation")
    class Constructor {

        @Test
        @DisplayName("rejects blank encryption key")
        void rejectsBlankEncryptionKey() {
            assertThatThrownBy(() -> new CryptoService("", validBlindIndexKey()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("encryption-key");
        }

        @Test
        @DisplayName("rejects blank blind index key")
        void rejectsBlankBlindIndexKey() {
            assertThatThrownBy(() -> new CryptoService(validKey(), ""))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("blind-index-key");
        }

        @Test
        @DisplayName("rejects short encryption key")
        void rejectsShortEncryptionKey() {
            byte[] shortKey = new byte[16];
            String encoded = Base64.getEncoder().encodeToString(shortKey);
            CryptoService svc = new CryptoService(encoded, validBlindIndexKey());
            assertThatThrownBy(svc::validateKeys)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("32 bytes");
        }

        @Test
        @DisplayName("rejects short blind index key")
        void rejectsShortBlindIndexKey() {
            byte[] shortKey = new byte[16];
            String encoded = Base64.getEncoder().encodeToString(shortKey);
            CryptoService svc = new CryptoService(validKey(), encoded);
            assertThatThrownBy(svc::validateKeys)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Blind index key");
        }
    }

    @Nested
    @DisplayName("encrypt / decrypt")
    class EncryptDecrypt {

        @Test
        @DisplayName("round-trips plaintext")
        void roundTrips() {
            String plaintext = "hello-world-加密";
            String encrypted = cryptoService.encrypt(plaintext);
            assertThat(encrypted).isNotEqualTo(plaintext);
            assertThat(cryptoService.decrypt(encrypted)).isEqualTo(plaintext);
        }

        @Test
        @DisplayName("encrypt returns null for null input")
        void encryptNull() {
            assertThat(cryptoService.encrypt(null)).isNull();
        }

        @Test
        @DisplayName("decrypt returns null for null input")
        void decryptNull() {
            assertThat(cryptoService.decrypt(null)).isNull();
        }

        @Test
        @DisplayName("produces different ciphertexts for same plaintext (random IV)")
        void differentCiphertexts() {
            String plaintext = "same-input";
            assertThat(cryptoService.encrypt(plaintext)).isNotEqualTo(cryptoService.encrypt(plaintext));
        }

        @Test
        @DisplayName("decrypt throws on tampered ciphertext")
        void decryptTampered() {
            String encrypted = cryptoService.encrypt("data");
            String tampered = encrypted.substring(0, encrypted.length() / 2) + "AAAA";
            assertThatThrownBy(() -> cryptoService.decrypt(tampered))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Decryption failed");
        }
    }

    @Nested
    @DisplayName("blindIndex")
    class BlindIndex {

        @Test
        @DisplayName("produces consistent HMAC")
        void consistent() {
            String input = "phone-number";
            assertThat(cryptoService.blindIndex(input)).isEqualTo(cryptoService.blindIndex(input));
        }

        @Test
        @DisplayName("returns null for null input")
        void nullInput() {
            assertThat(cryptoService.blindIndex(null)).isNull();
        }

        @Test
        @DisplayName("produces different results for different inputs")
        void differentInputs() {
            assertThat(cryptoService.blindIndex("a")).isNotEqualTo(cryptoService.blindIndex("b"));
        }
    }
}
