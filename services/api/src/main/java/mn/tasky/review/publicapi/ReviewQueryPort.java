package mn.tasky.review.publicapi;

import java.util.List;
import mn.tasky.review.dto.ReviewEnforcementCase;

public interface ReviewQueryPort {

    List<ReviewEnforcementCase> getOpenCases(String userId);
}
