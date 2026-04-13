package mn.tasky.auth.provider;

import mn.tasky.automation.provider.ProviderHealth;

/**
 * Contract for OAuth identity providers (Facebook, Google, Apple, etc.).
 * Wraps token validation and profile fetch behind a provider-agnostic interface.
 */
public interface OAuthProvider {

    /**
     * Validates a user token and returns the provider's user identifier.
     *
     * @param userToken Provider-specific user access token.
     * @return Normalized user ID string.
     * @throws OAuthProviderException when the token is invalid or the provider is unavailable.
     */
    String validateToken(String userToken);

    /**
     * Fetches basic profile information for an authenticated user.
     *
     * @param userToken Provider-specific user access token.
     * @return Normalized profile data.
     * @throws OAuthProviderException when the token cannot be used to fetch a profile.
     */
    OAuthProfile fetchProfile(String userToken);

    /**
     * Returns the provider's current health status.
     */
    ProviderHealth health();

    /**
     * Returns the canonical provider name (e.g. "facebook", "google").
     */
    String providerName();

    record OAuthProfile(String providerUserId, String displayName, String pictureUrl) {}
}
