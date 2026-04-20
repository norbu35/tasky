package mn.tasky.identity.application.query;

import java.util.List;
import java.util.Optional;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.application.UserSearchService;
import mn.tasky.auth.application.VerificationService;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.ReliabilityScoreDao;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.ReliabilityScore;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.UserProfilePage;
import mn.tasky.auth.dto.UserProfileState;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationStatusResponse;
import mn.tasky.identity.publicapi.IdentityQueryPort;
import mn.tasky.user.dto.UserStatsResponse;
import org.springframework.stereotype.Service;

@Service
public class IdentityQueryHandler implements IdentityQueryPort {
    private final UserProfileService userProfileService;
    private final VerificationService verificationService;
    private final ModerationService moderationService;
    private final UserSearchService userSearchService;
    private final ProfileDao profileDao;
    private final ReliabilityScoreDao reliabilityScoreDao;

    public IdentityQueryHandler(
            UserProfileService userProfileService,
            VerificationService verificationService,
            ModerationService moderationService,
            UserSearchService userSearchService,
            ProfileDao profileDao,
            ReliabilityScoreDao reliabilityScoreDao) {
        this.userProfileService = userProfileService;
        this.verificationService = verificationService;
        this.moderationService = moderationService;
        this.userSearchService = userSearchService;
        this.profileDao = profileDao;
        this.reliabilityScoreDao = reliabilityScoreDao;
    }

    @Override
    public Optional<UserProfile> getProfile(String userId) {
        return userProfileService.getProfile(userId);
    }

    @Override
    public VerificationStatusResponse getVerificationStatus(String userId) {
        return verificationService.getVerificationStatus(userId);
    }

    @Override
    public Optional<VerificationDetail> getVerificationDetail(String verificationId) {
        return verificationService.getVerificationDetail(verificationId);
    }

    @Override
    public List<VerificationDetail> listPendingVerifications(String cursor, int limit) {
        return verificationService.listPendingVerifications(cursor, limit);
    }

    @Override
    public boolean verificationExists(String verificationId) {
        return verificationService.verificationExists(verificationId);
    }

    @Override
    public UserProfilePage searchUsersByPhone(String phonePart, String cursor, int limit) {
        return userSearchService.searchUsersByPhone(phonePart, cursor, limit);
    }

    @Override
    public UserProfilePage searchUsersByName(String name, String cursor, int limit) {
        return userSearchService.searchUsersByName(name, cursor, limit);
    }

    @Override
    public UserProfilePage searchUsersByFacebookId(String facebookId, String cursor, int limit) {
        return userSearchService.searchUsersByFacebookId(facebookId, cursor, limit);
    }

    @Override
    public ModerationPolicy getModerationPolicy() {
        return moderationService.getModerationPolicy();
    }

    @Override
    public Optional<UserStatsResponse> getUserStats(String userId) {
        UserProfileState profile = profileDao.findByUserId(userId).orElse(UserProfileState.defaultState());
        Double reliabilityScore = reliabilityScoreDao
                .findByTaskerId(userId)
                .map(ReliabilityScore::score)
                .orElse(null);
        return Optional.of(
                new UserStatsResponse(profile.completedTasks(), profile.ratingAvg(), null, reliabilityScore));
    }
}
