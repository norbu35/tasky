package mn.tasky.auth;

public class AccountRestrictedException extends RuntimeException {

    public AccountRestrictedException(String message) {
        super(message);
    }
}
