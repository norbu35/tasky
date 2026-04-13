package mn.tasky.identity.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import org.springframework.stereotype.Service;

@Service
public class IdentityQueryHandler implements IdentityQueryPort {
    private final AuthService authService;

    public IdentityQueryHandler(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public Optional<UserProfile> getProfile(String userId) {
        return authService.getProfile(userId);
    }

    @Override
    public VerificationStatusResponse getVerificationStatus(String userId) {
        return authService.getVerificationStatus(userId);
    }

    @Override
    public Optional<VerificationDetail> getVerificationDetail(String verificationId) {
        return authService.getVerificationDetail(verificationId);
    }

    @Override
    public List<VerificationDetail> listPendingVerifications(String cursor, int limit) {
        return authService.listPendingVerifications(cursor, limit);
    }

    @Override
    public boolean verificationExists(String verificationId) {
        return authService.verificationExists(verificationId);
    }

    @Override
    public UserProfilePage searchUsersByPhone(String phonePart, String cursor, int limit) {
        return authService.searchUsersByPhone(phonePart, cursor, limit);
    }

    @Override
    public UserProfilePage searchUsersByName(String name, String cursor, int limit) {
        return authService.searchUsersByName(name, cursor, limit);
    }

    @Override
    public UserProfilePage searchUsersByFacebookId(String facebookId, String cursor, int limit) {
        return authService.searchUsersByFacebookId(facebookId, cursor, limit);
    }

    @Override
    public ModerationPolicy getModerationPolicy() {
        return authService.getModerationPolicy();
    }
}
