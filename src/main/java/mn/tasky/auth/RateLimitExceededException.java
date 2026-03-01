package mn.tasky.auth;

public class RateLimitExceededException extends RuntimeException {

    private final String errorCode;

    public RateLimitExceededException(String code, String message) {
        super(message);
        this.errorCode = code;
    }

    public String code() {
        return errorCode;
    }
}
