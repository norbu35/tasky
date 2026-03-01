package mn.tasky.auth.application;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import mn.tasky.auth.FacebookAuthException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Thin client for Facebook Graph API token validation and profile fetch.
 */
@Service
public class FacebookGraphClient {

    private static final String TOKEN_INVALID_CODE = "FACEBOOK_TOKEN_INVALID";
    private static final String TOKEN_MISMATCH_CODE = "FACEBOOK_TOKEN_MISMATCH";

    private final RestClient restClient;
    private final String appId;
    private final String appSecret;

    public FacebookGraphClient(
        RestClient.Builder restClientBuilder,
        @Value("${tasky.facebook.app-id:}") String appId,
        @Value("${tasky.facebook.app-secret:}") String appSecret,
        @Value("${tasky.facebook.graph-api-base-url:https://graph.facebook.com}") String graphApiBaseUrl) {
        this.restClient = restClientBuilder.baseUrl(graphApiBaseUrl).build();
        this.appId = appId;
        this.appSecret = appSecret;
    }

    /**
     * Validates a user token via Facebook's {@code /debug_token} endpoint.
     *
     * @param userToken User access token.
     * @throws FacebookAuthException when OAuth config is missing, the token is invalid,
     *                               or the token app does not match this configured app.
     */
    public void debugToken(String userToken) {
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
        } catch (RestClientException exception) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Unable to validate Facebook token.", exception);
        }

        if (response == null
            || response.data() == null
            || !Boolean.TRUE.equals(response.data().isValid())) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook token is invalid.");
        }

        if (!appId.equals(response.data().appId())) {
            throw new FacebookAuthException(TOKEN_MISMATCH_CODE, "Facebook token does not match this app.");
        }
    }

    /**
     * Fetches basic profile information from Facebook's {@code /me} endpoint.
     *
     * @param userToken User access token.
     * @return Normalized Facebook profile payload.
     * @throws FacebookAuthException when the token cannot be used to fetch a valid profile.
     */
    public FacebookProfile fetchProfile(String userToken) {
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
        } catch (RestClientException exception) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Unable to read Facebook profile.", exception);
        }

        if (response == null || !StringUtils.hasText(response.id())) {
            throw new FacebookAuthException(TOKEN_INVALID_CODE, "Facebook token is invalid.");
        }

        String pictureUrl = null;
        if (response.picture() != null && response.picture().data() != null) {
            pictureUrl = response.picture().data().url();
        }

        return new FacebookProfile(response.id(), response.name(), pictureUrl);
    }

    public record FacebookProfile(String facebookId, String name, String pictureUrl) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DebugTokenResponse(DebugTokenData data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DebugTokenData(@JsonProperty("is_valid") Boolean isValid, @JsonProperty("app_id") String appId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record MeResponse(String id, String name, Picture picture) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Picture(PictureData data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PictureData(String url) {
    }
}
