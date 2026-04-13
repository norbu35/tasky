package mn.tasky.identity.publicapi;

import java.util.List;
import java.util.Optional;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationStatusResponse;

public interface IdentityQueryPort {
    Optional<UserProfile> getProfile(String userId);

    VerificationStatusResponse getVerificationStatus(String userId);

    Optional<VerificationDetail> getVerificationDetail(String verificationId);

    List<VerificationDetail> listPendingVerifications(String cursor, int limit);

    boolean verificationExists(String verificationId);

    UserProfilePage searchUsersByPhone(String phonePart, String cursor, int limit);

    UserProfilePage searchUsersByName(String name, String cursor, int limit);

    UserProfilePage searchUsersByFacebookId(String facebookId, String cursor, int limit);

    ModerationPolicy getModerationPolicy();
}
