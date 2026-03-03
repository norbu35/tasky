package mn.tasky.auth;

public class FacebookAuthException extends RuntimeException {

    private final String errorCode;

    public FacebookAuthException(String code, String message) {
        super(message);
        this.errorCode = code;
    }

    public FacebookAuthException(String code, String message, Throwable cause) {
        super(message,
            cause);
        this.errorCode = code;
    }

    public String code() {
        return errorCode;
    }
}
