package mn.tasky.auth;

public class FacebookAuthException
        extends RuntimeException {

    private final String code;

    public FacebookAuthException(String code,
                                 String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
