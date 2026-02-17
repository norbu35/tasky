package mn.tasky.auth.dto;

public record VerificationSubmitResult(String outcome, VerificationStatusResponse statusResponse) {

    public static final String USER_NOT_FOUND = "USER_NOT_FOUND";
    public static final String NOT_TASKER = "NOT_TASKER";
    public static final String CONFLICT = "CONFLICT";
    public static final String SUCCESS = "SUCCESS";
}
