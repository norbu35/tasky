package mn.tasky.auth;

public class RateLimitExceededException extends RuntimeException {

    private final String code;

    public RateLimitExceededException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
