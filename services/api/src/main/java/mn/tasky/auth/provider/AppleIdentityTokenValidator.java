package mn.tasky.auth.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class AppleIdentityTokenValidator {

    private static final Logger log = LoggerFactory.getLogger(AppleIdentityTokenValidator.class);
    private static final String APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
    private static final String APPLE_ISSUER = "https://appleid.apple.com";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private final Map<String, JsonNode> cachedKeys = new ConcurrentHashMap<>();
    private long keysFetchedAt = 0;
    private static final long KEYS_TTL_MS = 86_400_000L;

    private final String bundleId;

    public AppleIdentityTokenValidator(Environment env) {
        this.bundleId = env.getProperty("tasky.apple.bundle-id", "");
    }

    public String validate(String identityToken) {
        if (identityToken == null || identityToken.isBlank()) {
            throw new IllegalArgumentException("Apple identity token is required");
        }

        try {
            var parts = identityToken.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Malformed JWT");
            }
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            JsonNode header = objectMapper.readTree(headerJson);
            String kid = header.get("kid").asText();

            JsonNode appleKey = getAppleKey(kid);
            if (appleKey == null) {
                throw new IllegalArgumentException("No matching Apple key for kid: " + kid);
            }

            RSAPublicKey publicKey = buildRsaPublicKey(
                    appleKey.get("n").asText(), appleKey.get("e").asText());

            var jwtParser = Jwts.parser()
                    .requireIssuer(APPLE_ISSUER)
                    .verifyWith(publicKey)
                    .build();

            var claims = jwtParser.parseSignedClaims(identityToken).getPayload();
            String sub = claims.getSubject();
            if (sub == null || sub.isBlank()) {
                throw new IllegalArgumentException("Token missing subject (sub) claim");
            }

            if (!bundleId.isBlank()) {
                String aud = claims.getAudience().isEmpty()
                        ? ""
                        : claims.getAudience().iterator().next();
                if (!bundleId.equals(aud)) {
                    throw new IllegalArgumentException("Token audience mismatch");
                }
            }

            return sub;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Apple token validation failed: " + e.getMessage(), e);
        }
    }

    private JsonNode getAppleKey(String kid) throws Exception {
        fetchKeysIfNeeded();
        return cachedKeys.get(kid);
    }

    private synchronized void fetchKeysIfNeeded() throws Exception {
        if (!cachedKeys.isEmpty() && System.currentTimeMillis() - keysFetchedAt < KEYS_TTL_MS) {
            return;
        }

        HttpRequest request =
                HttpRequest.newBuilder().uri(URI.create(APPLE_KEYS_URL)).GET().build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            log.warn("Failed to fetch Apple keys: status {}", response.statusCode());
            return;
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode keys = root.get("keys");
        if (keys != null && keys.isArray()) {
            cachedKeys.clear();
            for (JsonNode key : keys) {
                String keyId = key.get("kid").asText();
                cachedKeys.put(keyId, key);
            }
            keysFetchedAt = System.currentTimeMillis();
        }
    }

    private RSAPublicKey buildRsaPublicKey(String nB64, String eB64) throws Exception {
        byte[] nBytes = Base64.getUrlDecoder().decode(nB64);
        byte[] eBytes = Base64.getUrlDecoder().decode(eB64);
        BigInteger n = new BigInteger(1, nBytes);
        BigInteger e = new BigInteger(1, eBytes);
        RSAPublicKeySpec spec = new RSAPublicKeySpec(n, e);
        KeyFactory factory = KeyFactory.getInstance("RSA");
        return (RSAPublicKey) factory.generatePublic(spec);
    }
}
