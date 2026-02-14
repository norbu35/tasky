package mn.tasky.review.dto;

public record ReviewSubmitResult(Review review, String error) {
    public boolean isSuccess() {
        return review != null;
    }
}
