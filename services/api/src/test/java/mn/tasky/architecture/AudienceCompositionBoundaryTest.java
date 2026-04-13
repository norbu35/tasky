package mn.tasky.architecture;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import mn.tasky.admin.api.AdminDisputeController;
import mn.tasky.task.api.TaskController;
import org.junit.jupiter.api.Test;

class AudienceCompositionBoundaryTest {

    @Test
    void runtimeAudienceCompositionPackagesAndServicesExist() {
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.PackageMarker"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.adminapi.composition.PackageMarker"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.PublicTaskCompositionService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.TaskApplicationAcceptanceService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.PaymentInitiationService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.WalletPayoutRequestService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.BookingIntentConfirmationService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.BookingPublicCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.BookingPublicOperationService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.DisputePublicCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.DisputeRaiseService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.MessagingPublicCompositionService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.ReviewPublicCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.ReviewSubmissionService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.publicapi.composition.VerificationPublicCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.VerificationSubmissionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.OtpPublicCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.UserProfileCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.composition.UserProfileUpdateService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.user.composition.UserAccountDeletionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminDisputeCompositionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminDisputeResolutionService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminPayoutProcessingService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminTaskConciergeAssignmentService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminVerificationCompositionService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminVerificationDecisionService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminModerationCompositionService"));
        assertDoesNotThrow(
                () -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminModerationPolicyUpdateService"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.adminapi.composition.AdminMessageCompositionService"));
    }

    @Test
    void representativeControllersDelegateAudienceCompositionToRuntimeServices() {
        assertControllerDependsOn(
                TaskController.class, "mn.tasky.runtime.publicapi.composition.PublicTaskCompositionService");
        assertControllerDependsOn(
                TaskController.class, "mn.tasky.runtime.publicapi.composition.TaskApplicationAcceptanceService");
        assertControllerDoesNotDependOn(TaskController.class, "mn.tasky.booking.publicapi.BookingQueryPort");
        assertControllerOmitsMethods(
                TaskController.class,
                Set.of(
                        "toPublicTaskResponse",
                        "toTaskResponse",
                        "toApplicationResponse",
                        "toOwnedPhotoResponse",
                        "toCategoryPayload",
                        "parseJsonOrEmptyObject",
                        "parseJson"));

        assertControllerDependsOn(
                AdminDisputeController.class, "mn.tasky.runtime.adminapi.composition.AdminDisputeCompositionService");
        assertControllerDependsOn(
                AdminDisputeController.class, "mn.tasky.runtime.adminapi.composition.AdminDisputeResolutionService");
        assertControllerDoesNotDependOn(AdminDisputeController.class, "mn.tasky.trust.publicapi.TrustQueryPort");
        assertControllerOmitsMethods(AdminDisputeController.class, Set.of("toMessageResponse"));

        assertControllerDependsOn(
                mn.tasky.payment.api.PaymentController.class,
                "mn.tasky.runtime.publicapi.composition.PaymentInitiationService");
        assertControllerDoesNotDependOn(
                mn.tasky.payment.api.PaymentController.class, "mn.tasky.booking.publicapi.BookingQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.payment.api.PaymentController.class, "mn.tasky.booking.publicapi.BookingCommandPort");
        assertControllerOmitsMethods(mn.tasky.payment.api.PaymentController.class, Set.of("deferredResponse"));

        assertControllerDependsOn(
                mn.tasky.wallet.api.WalletController.class,
                "mn.tasky.runtime.publicapi.composition.WalletPayoutRequestService");
        assertControllerDoesNotDependOn(
                mn.tasky.wallet.api.WalletController.class, "mn.tasky.wallet.publicapi.WalletCommandPort");
        assertControllerOmitsMethods(
                mn.tasky.wallet.api.WalletController.class, Set.of("deferredResponse", "toLedgerResponse"));

        assertControllerDependsOn(
                mn.tasky.booking.api.BookingIntentController.class,
                "mn.tasky.runtime.publicapi.composition.BookingIntentConfirmationService");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingIntentController.class, "mn.tasky.booking.publicapi.BookingQueryPort");
        assertControllerOmitsMethods(mn.tasky.booking.api.BookingIntentController.class, Set.of("toResponse", "error"));

        assertControllerDependsOn(
                mn.tasky.booking.api.BookingController.class,
                "mn.tasky.runtime.publicapi.composition.BookingPublicCompositionService");
        assertControllerDependsOn(
                mn.tasky.booking.api.BookingController.class,
                "mn.tasky.runtime.publicapi.composition.BookingPublicOperationService");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.booking.publicapi.BookingQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.booking.publicapi.BookingCommandPort");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.booking.application.BookingScheduleService");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.booking.application.NoShowService");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.booking.application.RepeatBookingService");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.notification.application.NotificationService");
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingController.class, "mn.tasky.common.idempotency.IdempotencyService");
        assertControllerOmitsMethods(mn.tasky.booking.api.BookingController.class, Set.of("toScheduleEventResponse"));

        assertControllerDependsOn(
                mn.tasky.admin.api.AdminPayoutController.class,
                "mn.tasky.runtime.adminapi.composition.AdminPayoutProcessingService");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminPayoutController.class, "mn.tasky.wallet.publicapi.WalletCommandPort");
        assertControllerOmitsMethods(
                mn.tasky.admin.api.AdminPayoutController.class, Set.of("deferredResponse", "toPayoutResponse"));

        assertControllerDependsOn(
                mn.tasky.user.api.UserProfileController.class,
                "mn.tasky.runtime.publicapi.composition.UserProfileCompositionService");
        assertControllerDependsOn(
                mn.tasky.user.api.UserProfileController.class,
                "mn.tasky.runtime.publicapi.composition.UserProfileUpdateService");
        assertControllerDependsOn(
                mn.tasky.user.api.UserProfileController.class,
                "mn.tasky.runtime.user.composition.UserAccountDeletionService");
        assertControllerDoesNotDependOn(mn.tasky.user.api.UserProfileController.class, "mn.tasky.auth.dao.UserDao");
        assertControllerDoesNotDependOn(
                mn.tasky.user.api.UserProfileController.class, "mn.tasky.common.audit.AuditEventDao");
        assertControllerDoesNotDependOn(
                mn.tasky.user.api.UserProfileController.class, "mn.tasky.common.storage.StorageKeyPolicy");
        assertControllerOmitsMethods(
                mn.tasky.user.api.UserProfileController.class,
                Set.of("toProfileResponse", "unauthorizedResponse", "extractAvatarStorageKey"));

        assertControllerDependsOn(
                mn.tasky.admin.api.AdminTaskController.class,
                "mn.tasky.runtime.adminapi.composition.AdminTaskConciergeAssignmentService");
        assertControllerDoesNotDependOn(mn.tasky.admin.api.AdminTaskController.class, "mn.tasky.task.dao.TaskDao");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminTaskController.class, "mn.tasky.identity.publicapi.IdentityQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminTaskController.class, "mn.tasky.booking.publicapi.BookingCommandPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminTaskController.class, "mn.tasky.booking.publicapi.BookingQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminTaskController.class, "mn.tasky.common.idempotency.IdempotencyService");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminTaskController.class, "mn.tasky.common.audit.AuditEventDao");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminTaskController.class, "com.fasterxml.jackson.databind.ObjectMapper");

        assertControllerDependsOn(
                mn.tasky.dispute.api.DisputeController.class,
                "mn.tasky.runtime.publicapi.composition.DisputePublicCompositionService");
        assertControllerDependsOn(
                mn.tasky.dispute.api.DisputeController.class,
                "mn.tasky.runtime.publicapi.composition.DisputeRaiseService");
        assertControllerDoesNotDependOn(
                mn.tasky.dispute.api.DisputeController.class, "mn.tasky.trust.publicapi.TrustCommandPort");
        assertControllerDoesNotDependOn(
                mn.tasky.dispute.api.DisputeController.class, "mn.tasky.trust.publicapi.TrustQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.dispute.api.DisputeController.class, "mn.tasky.analytics.application.AnalyticsService");
        assertControllerDoesNotDependOn(
                mn.tasky.dispute.api.DisputeController.class, "mn.tasky.booking.publicapi.BookingQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.dispute.api.DisputeController.class, "mn.tasky.common.idempotency.IdempotencyService");

        assertControllerDependsOn(
                mn.tasky.admin.api.AdminVerificationController.class,
                "mn.tasky.runtime.adminapi.composition.AdminVerificationCompositionService");
        assertControllerDependsOn(
                mn.tasky.admin.api.AdminVerificationController.class,
                "mn.tasky.runtime.adminapi.composition.AdminVerificationDecisionService");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminVerificationController.class, "mn.tasky.identity.publicapi.IdentityQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminVerificationController.class,
                "mn.tasky.identity.publicapi.IdentityCommandPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminVerificationController.class, "mn.tasky.common.audit.AuditEventDao");
        assertControllerOmitsMethods(mn.tasky.admin.api.AdminVerificationController.class, Set.of("toDetailBody"));

        assertControllerDependsOn(
                mn.tasky.admin.api.AdminModerationController.class,
                "mn.tasky.runtime.adminapi.composition.AdminModerationCompositionService");
        assertControllerDependsOn(
                mn.tasky.admin.api.AdminModerationController.class,
                "mn.tasky.runtime.adminapi.composition.AdminModerationPolicyUpdateService");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminModerationController.class, "mn.tasky.identity.publicapi.IdentityQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminModerationController.class, "mn.tasky.identity.publicapi.IdentityCommandPort");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminModerationController.class, "mn.tasky.common.audit.AuditEventDao");
        assertControllerOmitsMethods(mn.tasky.admin.api.AdminModerationController.class, Set.of("toResponse"));

        assertControllerDependsOn(
                mn.tasky.messaging.api.MessagingController.class,
                "mn.tasky.runtime.publicapi.composition.MessagingPublicCompositionService");
        assertControllerDoesNotDependOn(
                mn.tasky.messaging.api.MessagingController.class, "mn.tasky.messaging.publicapi.MessagingQueryPort");
        assertControllerOmitsMethods(
                mn.tasky.messaging.api.MessagingController.class,
                Set.of("toEnrichedResponse", "truncate", "toMessageResponse"));

        assertControllerDependsOn(
                mn.tasky.review.api.ReviewController.class,
                "mn.tasky.runtime.publicapi.composition.ReviewPublicCompositionService");
        assertControllerDependsOn(
                mn.tasky.review.api.ReviewController.class,
                "mn.tasky.runtime.publicapi.composition.ReviewSubmissionService");
        assertControllerDoesNotDependOn(
                mn.tasky.review.api.ReviewController.class, "mn.tasky.trust.publicapi.TrustCommandPort");
        assertControllerDoesNotDependOn(
                mn.tasky.review.api.ReviewController.class, "mn.tasky.trust.publicapi.TrustQueryPort");
        assertControllerOmitsMethods(mn.tasky.review.api.ReviewController.class, Set.of("toReviewResponse"));

        assertControllerDependsOn(
                mn.tasky.admin.api.AdminMessageController.class,
                "mn.tasky.runtime.adminapi.composition.AdminMessageCompositionService");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminMessageController.class, "mn.tasky.messaging.dao.MessageDao");
        assertControllerOmitsMethods(mn.tasky.admin.api.AdminMessageController.class, Set.of("toResponse"));

        assertControllerDependsOn(
                mn.tasky.verification.api.VerificationController.class,
                "mn.tasky.runtime.publicapi.composition.VerificationPublicCompositionService");
        assertControllerDependsOn(
                mn.tasky.verification.api.VerificationController.class,
                "mn.tasky.runtime.publicapi.composition.VerificationSubmissionService");
        assertControllerDoesNotDependOn(
                mn.tasky.verification.api.VerificationController.class,
                "mn.tasky.identity.publicapi.IdentityQueryPort");
        assertControllerDoesNotDependOn(
                mn.tasky.verification.api.VerificationController.class, "mn.tasky.common.storage.StorageKeyPolicy");
        assertControllerOmitsMethods(
                mn.tasky.verification.api.VerificationController.class, Set.of("toStatusResponse"));

        assertControllerDependsOn(
                mn.tasky.auth.api.OtpController.class,
                "mn.tasky.runtime.publicapi.composition.OtpPublicCompositionService");
        assertControllerOmitsMethods(mn.tasky.auth.api.OtpController.class, Set.of("featureDisabled"));
    }

    private static void assertControllerDependsOn(Class<?> controllerType, String dependencyTypeName) {
        boolean present = Arrays.stream(controllerType.getDeclaredFields())
                .map(Field::getType)
                .map(Class::getName)
                .anyMatch(dependencyTypeName::equals);
        assertTrue(present, () -> controllerType.getSimpleName() + " should depend on " + dependencyTypeName);
    }

    private static void assertControllerDoesNotDependOn(Class<?> controllerType, String dependencyTypeName) {
        boolean present = Arrays.stream(controllerType.getDeclaredFields())
                .map(Field::getType)
                .map(Class::getName)
                .anyMatch(dependencyTypeName::equals);
        assertFalse(present, () -> controllerType.getSimpleName() + " should not depend on " + dependencyTypeName);
    }

    private static void assertControllerOmitsMethods(Class<?> controllerType, Set<String> forbiddenMethodNames) {
        Set<String> declaredMethodNames = Arrays.stream(controllerType.getDeclaredMethods())
                .map(Method::getName)
                .collect(Collectors.toSet());
        assertFalse(
                declaredMethodNames.stream().anyMatch(forbiddenMethodNames::contains),
                () -> controllerType.getSimpleName() + " should delegate audience composition to runtime services");
    }
}
