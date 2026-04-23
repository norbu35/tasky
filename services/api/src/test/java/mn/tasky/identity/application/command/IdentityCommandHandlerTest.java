package mn.tasky.identity.application.command;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import mn.tasky.auth.application.AuthService;
import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.ModerationService;
import mn.tasky.auth.application.ReliabilityScoreService;
import mn.tasky.auth.application.UserProfileService;
import mn.tasky.auth.application.VerificationService;
import mn.tasky.auth.dto.AuthSession;
import mn.tasky.auth.dto.AuthTokens;
import mn.tasky.auth.dto.ModerationPolicy;
import mn.tasky.auth.dto.ProfileUpdate;
import mn.tasky.auth.dto.RoleActivationResult;
import mn.tasky.auth.dto.UserProfile;
import mn.tasky.auth.dto.VerificationDetail;
import mn.tasky.auth.dto.VerificationSubmitResult;
import mn.tasky.common.dto.PresignedUpload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IdentityCommandHandlerTest {

    @Mock
    AuthService authService;

    @Mock
    UserProfileService userProfileService;

    @Mock
    VerificationService verificationService;

    @Mock
    ModerationService moderationService;

    @Mock
    ReliabilityScoreService reliabilityScoreService;

    @Mock
    BadgeEvaluationService badgeEvaluationService;

    IdentityCommandHandler handler;

    @BeforeEach
    void setUp() {
        handler = new IdentityCommandHandler(
                authService,
                userProfileService,
                verificationService,
                moderationService,
                reliabilityScoreService,
                badgeEvaluationService);
    }

    @Test
    void facebookLogin_delegates() {
        var session = mock(AuthSession.class);
        when(authService.facebookLogin("tok")).thenReturn(session);
        assertSame(session, handler.facebookLogin("tok"));
    }

    @Test
    void devLogin_delegates() {
        var session = mock(AuthSession.class);
        when(authService.devLogin("99112233", "CUSTOMER")).thenReturn(session);
        assertSame(session, handler.devLogin("99112233", "CUSTOMER"));
    }

    @Test
    void requestOtp_delegates() {
        when(authService.requestOtp("99112233")).thenReturn("req123");
        assertEquals("req123", handler.requestOtp("99112233"));
    }

    @Test
    void verifyOtp_delegates() {
        var session = Optional.of(mock(AuthSession.class));
        when(authService.verifyOtp("99112233", "1234", "fb")).thenReturn(session);
        assertEquals(session, handler.verifyOtp("99112233", "1234", "fb"));
    }

    @Test
    void refreshToken_delegates() {
        var tokens = Optional.of(mock(AuthTokens.class));
        when(authService.refreshToken("rt")).thenReturn(tokens);
        assertEquals(tokens, handler.refreshToken("rt"));
    }

    @Test
    void updateProfile_delegates() {
        var update = mock(ProfileUpdate.class);
        var profile = Optional.of(mock(UserProfile.class));
        when(userProfileService.updateProfile("u1", update)).thenReturn(profile);
        assertEquals(profile, handler.updateProfile("u1", update));
    }

    @Test
    void activateTaskerRole_delegates() {
        var result = Optional.of(mock(RoleActivationResult.class));
        when(userProfileService.activateTaskerRole("u1")).thenReturn(result);
        assertEquals(result, handler.activateTaskerRole("u1"));
    }

    @Test
    void createAvatarUploadUrl_delegates() {
        var upload = Optional.of(mock(PresignedUpload.class));
        when(userProfileService.createAvatarUploadUrl("u1", "image/png")).thenReturn(upload);
        assertEquals(upload, handler.createAvatarUploadUrl("u1", "image/png"));
    }

    @Test
    void createVerificationUploadUrl_delegates() {
        var upload = Optional.of(mock(PresignedUpload.class));
        when(verificationService.createVerificationUploadUrl("u1", "image/png")).thenReturn(upload);
        assertEquals(upload, handler.createVerificationUploadUrl("u1", "image/png"));
    }

    @Test
    void submitVerification_delegates() {
        var result = mock(VerificationSubmitResult.class);
        when(verificationService.submitVerification("u1", "front", "back", "v1"))
                .thenReturn(result);
        assertSame(result, handler.submitVerification("u1", "front", "back", "v1"));
    }

    @Test
    void approveVerification_delegates() {
        var detail = Optional.of(mock(VerificationDetail.class));
        when(verificationService.approveVerification("v1")).thenReturn(detail);
        assertEquals(detail, handler.approveVerification("v1"));
    }

    @Test
    void rejectVerification_delegates() {
        var detail = Optional.of(mock(VerificationDetail.class));
        when(verificationService.rejectVerification("v1", "bad")).thenReturn(detail);
        assertEquals(detail, handler.rejectVerification("v1", "bad"));
    }

    @Test
    void banUser_delegates() {
        when(moderationService.banUser("admin", "u1", "spam")).thenReturn(true);
        assertTrue(handler.banUser("admin", "u1", "spam"));
    }

    @Test
    void unbanUser_delegates() {
        when(moderationService.unbanUser("admin", "u1", "ok")).thenReturn(true);
        assertTrue(handler.unbanUser("admin", "u1", "ok"));
    }

    @Test
    void updateModerationPolicy_delegates() {
        var policy = mock(ModerationPolicy.class);
        when(moderationService.updateModerationPolicy(7, 3, 1, 7, 30, true)).thenReturn(policy);
        assertSame(policy, handler.updateModerationPolicy(7, 3, 1, 7, 30, true));
    }

    @Test
    void requestAccountDeletion_delegates() {
        handler.requestAccountDeletion("u1");
        verify(moderationService).requestAccountDeletion("u1");
    }

    @Test
    void recomputeReliabilityScore_delegates() {
        handler.recomputeReliabilityScore("t1");
        verify(reliabilityScoreService).recompute("t1");
    }

    @Test
    void evaluateBadges_delegates() {
        handler.evaluateBadges("t1");
        verify(badgeEvaluationService).evaluate("t1");
    }
}
