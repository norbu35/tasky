package mn.tasky.identity.application.query;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

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
import mn.tasky.user.dto.UserStatsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IdentityQueryHandlerTest {

    @Mock
    UserProfileService userProfileService;

    @Mock
    VerificationService verificationService;

    @Mock
    ModerationService moderationService;

    @Mock
    UserSearchService userSearchService;

    @Mock
    ProfileDao profileDao;

    @Mock
    ReliabilityScoreDao reliabilityScoreDao;

    IdentityQueryHandler handler;

    @BeforeEach
    void setUp() {
        handler = new IdentityQueryHandler(
                userProfileService,
                verificationService,
                moderationService,
                userSearchService,
                profileDao,
                reliabilityScoreDao);
    }

    @Test
    void getProfile_delegates() {
        var profile = mock(UserProfile.class);
        when(userProfileService.getProfile("u1")).thenReturn(Optional.of(profile));
        assertEquals(Optional.of(profile), handler.getProfile("u1"));
    }

    @Test
    void getVerificationStatus_delegates() {
        var resp = mock(VerificationStatusResponse.class);
        when(verificationService.getVerificationStatus("u1")).thenReturn(resp);
        assertSame(resp, handler.getVerificationStatus("u1"));
    }

    @Test
    void getVerificationDetail_delegates() {
        var detail = mock(VerificationDetail.class);
        when(verificationService.getVerificationDetail("v1")).thenReturn(Optional.of(detail));
        assertEquals(Optional.of(detail), handler.getVerificationDetail("v1"));
    }

    @Test
    void listPendingVerifications_delegates() {
        var list = List.of(mock(VerificationDetail.class));
        when(verificationService.listPendingVerifications("c", 10)).thenReturn(list);
        assertEquals(list, handler.listPendingVerifications("c", 10));
    }

    @Test
    void verificationExists_delegates() {
        when(verificationService.verificationExists("v1")).thenReturn(true);
        assertTrue(handler.verificationExists("v1"));
    }

    @Test
    void searchUsersByPhone_delegates() {
        var page = mock(UserProfilePage.class);
        when(userSearchService.searchUsersByPhone("99", "c", 5)).thenReturn(page);
        assertSame(page, handler.searchUsersByPhone("99", "c", 5));
    }

    @Test
    void searchUsersByName_delegates() {
        var page = mock(UserProfilePage.class);
        when(userSearchService.searchUsersByName("bat", "c", 5)).thenReturn(page);
        assertSame(page, handler.searchUsersByName("bat", "c", 5));
    }

    @Test
    void searchUsersByFacebookId_delegates() {
        var page = mock(UserProfilePage.class);
        when(userSearchService.searchUsersByFacebookId("fb1", "c", 5)).thenReturn(page);
        assertSame(page, handler.searchUsersByFacebookId("fb1", "c", 5));
    }

    @Test
    void getModerationPolicy_delegates() {
        var policy = mock(ModerationPolicy.class);
        when(moderationService.getModerationPolicy()).thenReturn(policy);
        assertSame(policy, handler.getModerationPolicy());
    }

    @Test
    void getUserStats_withProfileAndScore() {
        var state = new UserProfileState("Bat", null, null, 4.5, 10, null);
        when(profileDao.findByUserId("u1")).thenReturn(Optional.of(state));
        var scoreMock = mock(ReliabilityScore.class);
        when(scoreMock.score()).thenReturn(85.0);
        when(reliabilityScoreDao.findByTaskerId("u1")).thenReturn(Optional.of(scoreMock));

        Optional<UserStatsResponse> result = handler.getUserStats("u1");
        assertTrue(result.isPresent());
        assertEquals(10, result.get().jobsCompleted());
        assertEquals(4.5, result.get().averageRating());
        assertNull(result.get().responseTimeMinutes());
        assertEquals(85.0, result.get().reliabilityScore());
    }

    @Test
    void getUserStats_emptyProfile_defaultsUsed() {
        when(profileDao.findByUserId("u2")).thenReturn(Optional.empty());
        when(reliabilityScoreDao.findByTaskerId("u2")).thenReturn(Optional.empty());

        Optional<UserStatsResponse> result = handler.getUserStats("u2");
        assertTrue(result.isPresent());
        assertEquals(0, result.get().jobsCompleted());
        assertEquals(0.0, result.get().averageRating());
        assertNull(result.get().responseTimeMinutes());
        assertNull(result.get().reliabilityScore());
    }
}
