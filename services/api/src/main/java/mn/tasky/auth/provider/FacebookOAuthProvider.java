package mn.tasky.auth.provider;

import mn.tasky.auth.FacebookAuthException;
import mn.tasky.auth.application.FacebookCircuitBreaker;
import mn.tasky.auth.application.FacebookGraphClient;
import mn.tasky.automation.provider.ProviderHealth;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * OAuthProvider adapter wrapping the existing FacebookGraphClient.
 * Activated when tasky.auth.oauth.provider=facebook.
 */
@Component
@ConditionalOnProperty(name = "tasky.auth.oauth.provider", havingValue = "facebook")
public class FacebookOAuthProvider implements OAuthProvider {

    private final FacebookGraphClient facebookGraphClient;
    private final FacebookCircuitBreaker circuitBreaker;

    public FacebookOAuthProvider(FacebookGraphClient facebookGraphClient, FacebookCircuitBreaker circuitBreaker) {
        this.facebookGraphClient = facebookGraphClient;
        this.circuitBreaker = circuitBreaker;
    }

    @Override
    public String validateToken(String userToken) {
        try {
            return facebookGraphClient.debugToken(userToken);
        } catch (FacebookAuthException exception) {
            throw new OAuthProviderException(exception.code(), exception.getMessage(), exception);
        }
    }

    @Override
    public OAuthProfile fetchProfile(String userToken) {
        try {
            FacebookGraphClient.FacebookProfile profile = facebookGraphClient.fetchProfile(userToken);
            return new OAuthProfile(profile.facebookId(), profile.name(), profile.pictureUrl());
        } catch (FacebookAuthException exception) {
            throw new OAuthProviderException(exception.code(), exception.getMessage(), exception);
        }
    }

    @Override
    public ProviderHealth health() {
        if (circuitBreaker.isOpen()) {
            return ProviderHealth.unhealthy(providerName(), "Circuit breaker is OPEN");
        }
        return ProviderHealth.healthy(providerName());
    }

    @Override
    public String providerName() {
        return "facebook";
    }
}
