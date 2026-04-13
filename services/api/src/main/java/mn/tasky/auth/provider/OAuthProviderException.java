package mn.tasky.auth.provider;

/**
 * Thrown when an OAuth provider operation fails.
 */
public class OAuthProviderException extends RuntimeException {

    private final String errorCode;

    public OAuthProviderException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public OAuthProviderException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String errorCode() {
        return errorCode;
    }
}
