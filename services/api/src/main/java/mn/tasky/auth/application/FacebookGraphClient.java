package mn.tasky.auth.application;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.PostConstruct;
import mn.tasky.auth.FacebookAuthException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Thin client for Facebook Graph API token validation and profile fetch.
 *
 * <p>All outbound calls are guarded by a {@link FacebookCircuitBreaker}. When the breaker is
 * OPEN or HALF_OPEN the methods throw immediately without touching the network.
 */
@Service
public class FacebookGraphClient {

    private static final String TOKEN_INVALID_CODE = "FACEBOOK_TOKEN_INVALID";
    private static final String TOKEN_MISMATCH_CODE = "FACEBOOK_TOKEN_MISMATCH";
    private static final String PROVIDER_UNAVAILABLE_CODE = "AUTH_PROVIDER_UNAVAILABLE";

    private final RestClient restClient;
    private final String appId;
    private final String appSecret;
    private final FacebookCircuitBreaker circuitBreaker;
    private final Environment environment;

    public FacebookGraphClient(
            RestClient.Builder restClientBuilder,
            @Value("${tasky.facebook.app-id:}") String appId,
            @Value("${tasky.facebook.app-secret:}") String appSecret,
            @Value("${tasky.facebook.graph-api-base-url:https://graph.facebook.com}") String graphApiBaseUrl,
            FacebookCircuitBreaker circuitBreaker,
            Environment environment) {
        this.restClient = restClientBuilder.baseUrl(graphApiBaseUrl).build();
        this.appId = appId;
        this.appSecret = appSecret;
        this.circuitBreaker = circuitBreaker;
        this.environment = environment;
    }

    @PostConstruct
    void validateConfig() {
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            for (String profile : environment.getActiveProfiles()) {
                if ("local".equals(profile)) {
                    return;
                }
            }
            throw new IllegalStateException(
                    "tasky.facebook.app-id and tasky.facebook.app-secret must be set in non-local profiles");
        }
    }

    /**
     * Validates a user token via Facebook's {@code /debug_token} endpoint.
     *
     * @param userToken User access token.
     * @throws FacebookAuthException when OAuth config is missing, the token is invalid,
     *                               or the token app does not match this configured app.
     */
    public String debugToken(String userToken) {
        if (circuitBreaker.isOpen()) {
            throw new FacebookAuthException(
                    PROVIDER_UNAVAILABLE_CODE, "Facebook authentication is temporarily unavailable");
        }

        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook OAuth is not configured.");
        }

        String appAccessToken = appId + "|" + appSecret;
        DebugTokenResponse response;
        try {
            response = restClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/debug_token")
                            .queryParam("input_token", userToken)
                            .queryParam("access_token", appAccessToken)
                            .build())
                    .retrieve()
                    .body(DebugTokenResponse.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                // Client errors (bad token, etc.) are not provider failures — do not trip breaker.
                throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook token is invalid.", exception);
            }
            circuitBreaker.recordFailure();
            throw new FacebookAuthException(
                    PROVIDER_UNAVAILABLE_CODE, "Facebook authentication provider is unavailable.", exception);
        } catch (RestClientException exception) {
            circuitBreaker.recordFailure();
            throw new FacebookAuthException(
                    PROVIDER_UNAVAILABLE_CODE, "Facebook authentication provider is unavailable.", exception);
        }

        if (response == null
                || response.data() == null
                || !Boolean.TRUE.equals(response.data().isValid())) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook token is invalid.");
        }

        if (!appId.equals(response.data().appId())) {
            throw new FacebookAuthException(TOKEN_MISMATCH_CODE, "Facebook token does not match this app.");
        }

        circuitBreaker.recordSuccess();
        return response.data().userId();
    }

    /**
     * Fetches basic profile information from Facebook's {@code /me} endpoint.
     *
     * @param userToken User access token.
     * @return Normalized Facebook profile payload.
     * @throws FacebookAuthException when the token cannot be used to fetch a valid profile.
     */
    public FacebookProfile fetchProfile(String userToken) {
        if (circuitBreaker.isOpen()) {
            throw new FacebookAuthException(
                    PROVIDER_UNAVAILABLE_CODE, "Facebook authentication is temporarily unavailable");
        }

        MeResponse response;
        try {
            response = restClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/me")
                            .queryParam("fields", "id,name,picture")
                            .queryParam("access_token", userToken)
                            .build())
                    .retrieve()
                    .body(MeResponse.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().is4xxClientError()) {
                // Client errors are not provider failures — do not trip breaker.
                throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook token is invalid.", exception);
            }
            circuitBreaker.recordFailure();
            throw new FacebookAuthException(
                    PROVIDER_UNAVAILABLE_CODE, "Facebook authentication provider is unavailable.", exception);
        } catch (RestClientException exception) {
            circuitBreaker.recordFailure();
            throw new FacebookAuthException(
                    PROVIDER_UNAVAILABLE_CODE, "Facebook authentication provider is unavailable.", exception);
        }

        if (response == null || !StringUtils.hasText(response.id())) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook token is invalid.");
        }

        String pictureUrl = null;
        if (response.picture() != null && response.picture().data() != null) {
            pictureUrl = response.picture().data().url();
        }

        circuitBreaker.recordSuccess();
        return new FacebookProfile(response.id(), response.name(), pictureUrl);
    }

    public record FacebookProfile(String facebookId, String name, String pictureUrl) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DebugTokenResponse(DebugTokenData data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DebugTokenData(
            @JsonProperty("is_valid") Boolean isValid,
            @JsonProperty("app_id") String appId,
            @JsonProperty("user_id") String userId) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record MeResponse(String id, String name, Picture picture) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Picture(PictureData data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PictureData(String url) {}
}
