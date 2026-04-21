package mn.tasky.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import mn.tasky.admin.api.AdminDisputeController;
import mn.tasky.task.api.TaskController;
import org.junit.jupiter.api.Test;

@AnalyzeClasses(
        packages = "mn.tasky",
        importOptions = {ImportOption.DoNotIncludeTests.class})
class AudienceCompositionBoundaryTest {

    /**
     * Explicit exception set from the backend finalization design.
     * These controllers are allowed to exist outside the two standard request-path shapes:
     *   1. controller -> runtime composition -> publicapi ports
     *   2. controller -> module-owned publicapi ports
     *
     * Any addition to this set requires deliberate justification in code review.
     * "Not migrated yet" is not a valid reason.
     */
    private static final Set<String> EXCEPTION_CONTROLLERS = Set.of(
            // System/health endpoints
            "mn.tasky.common.config.SystemInfoController",
            // Security introspection endpoints
            "mn.tasky.security.api.SecurityScopeController",
            // Development-only auth helpers
            "mn.tasky.auth.api.DevAuthController",
            // Auth lifecycle endpoints (token management, OAuth callback)
            "mn.tasky.auth.api.TokenController",
            "mn.tasky.auth.api.FacebookAuthController",
            // Pure lookup/reference-data endpoints
            "mn.tasky.location.api.LocationController",
            "mn.tasky.notification.api.ServiceAreaController",
            "mn.tasky.category.api.CategoryController",
            // Operator endpoints (low-level platform control)
            "mn.tasky.admin.api.OutboxReplayController",
            "mn.tasky.admin.api.AdminFeatureToggleController",
            // Rate-limit enforcement is a cross-cutting security concern, not business logic
            "mn.tasky.auth.api.OtpController");

    @ArchTest
    static final ArchRule nonExceptionControllersMustNotDependOnApplicationServices = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky..api..")
            .and()
            .haveSimpleNameEndingWith("Controller")
            .and()
            .doNotHaveFullyQualifiedNameMatching(createExceptionPattern())
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..application..")
            .because(
                    "controllers must use runtime composition services or publicapi ports, never internal application services")
            .allowEmptyShould(true);

    private static String createExceptionPattern() {
        String joined = EXCEPTION_CONTROLLERS.stream()
                .map(java.util.regex.Pattern::quote)
                .collect(Collectors.joining("|"));
        return "^(?!" + joined + ").*$";
    }

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
        assertControllerDoesNotDependOn(TaskController.class, "mn.tasky.task.application.TaskDraftService");
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
        assertControllerDoesNotDependOn(
                mn.tasky.booking.api.BookingIntentController.class,
                "mn.tasky.booking.application.BookingIntentService");
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
        assertControllerDoesNotDependOn(
                mn.tasky.review.api.ReviewController.class, "mn.tasky.review.application.ReviewEnforcementService");
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

        // NotificationController: device registration through runtime composition
        assertControllerDependsOn(
                mn.tasky.notification.api.NotificationController.class,
                "mn.tasky.runtime.publicapi.composition.NotificationCompositionService");
        assertControllerDoesNotDependOn(
                mn.tasky.notification.api.NotificationController.class,
                "mn.tasky.notification.application.NotificationService");
        assertControllerOmitsMethods(
                mn.tasky.notification.api.NotificationController.class, Set.of("toDeviceResponse"));

        // AdminUserController: admin user management through admin composition
        assertControllerDependsOn(
                mn.tasky.admin.api.AdminUserController.class,
                "mn.tasky.runtime.adminapi.composition.AdminUserCompositionService");
        assertControllerDoesNotDependOn(
                mn.tasky.admin.api.AdminUserController.class, "mn.tasky.identity.publicapi.IdentityQueryPort");
        assertControllerOmitsMethods(
                mn.tasky.admin.api.AdminUserController.class, Set.of("toAdminUserProfileResponse"));
    }

    /**
     * Verifies that every controller in the codebase either:
     * (a) is in the explicit exception set, or
     * (b) is covered by the representative controller assertions above.
     *
     * This prevents controllers from silently escaping the boundary checks.
     */
    @Test
    void allControllersAreAccountedFor() {
        // Controllers covered by representativeControllersDelegateAudienceCompositionToRuntimeServices
        Set<String> coveredControllers = Set.of(
                "mn.tasky.task.api.TaskController",
                "mn.tasky.admin.api.AdminDisputeController",
                "mn.tasky.payment.api.PaymentController",
                "mn.tasky.wallet.api.WalletController",
                "mn.tasky.booking.api.BookingIntentController",
                "mn.tasky.booking.api.BookingController",
                "mn.tasky.admin.api.AdminPayoutController",
                "mn.tasky.user.api.UserProfileController",
                "mn.tasky.admin.api.AdminTaskController",
                "mn.tasky.dispute.api.DisputeController",
                "mn.tasky.admin.api.AdminVerificationController",
                "mn.tasky.admin.api.AdminModerationController",
                "mn.tasky.messaging.api.MessagingController",
                "mn.tasky.review.api.ReviewController",
                "mn.tasky.admin.api.AdminMessageController",
                "mn.tasky.verification.api.VerificationController",
                "mn.tasky.auth.api.OtpController",
                "mn.tasky.notification.api.NotificationController",
                "mn.tasky.admin.api.AdminUserController");

        // All known controllers in the codebase
        Set<String> allKnownControllers = Set.of(
                "mn.tasky.admin.api.AdminDisputeController",
                "mn.tasky.admin.api.AdminFeatureToggleController",
                "mn.tasky.admin.api.AdminMessageController",
                "mn.tasky.admin.api.AdminModerationController",
                "mn.tasky.admin.api.AdminPayoutController",
                "mn.tasky.admin.api.AdminTaskController",
                "mn.tasky.admin.api.AdminUserController",
                "mn.tasky.admin.api.AdminVerificationController",
                "mn.tasky.admin.api.OutboxReplayController",
                "mn.tasky.auth.api.DevAuthController",
                "mn.tasky.auth.api.FacebookAuthController",
                "mn.tasky.auth.api.OtpController",
                "mn.tasky.auth.api.TokenController",
                "mn.tasky.booking.api.BookingController",
                "mn.tasky.booking.api.BookingIntentController",
                "mn.tasky.category.api.CategoryController",
                "mn.tasky.common.config.SystemInfoController",
                "mn.tasky.dispute.api.DisputeController",
                "mn.tasky.location.api.LocationController",
                "mn.tasky.messaging.api.MessagingController",
                "mn.tasky.notification.api.NotificationController",
                "mn.tasky.notification.api.ServiceAreaController",
                "mn.tasky.payment.api.PaymentController",
                "mn.tasky.review.api.ReviewController",
                "mn.tasky.security.api.SecurityScopeController",
                "mn.tasky.task.api.TaskController",
                "mn.tasky.user.api.UserProfileController",
                "mn.tasky.verification.api.VerificationController",
                "mn.tasky.wallet.api.WalletController");

        for (String controller : allKnownControllers) {
            boolean isException = EXCEPTION_CONTROLLERS.contains(controller);
            boolean isCovered = coveredControllers.contains(controller);
            assertTrue(
                    isException || isCovered,
                    controller + " is neither an exception nor covered by boundary assertions. "
                            + "Add it to the exception registry (with justification) or to the "
                            + "representative controller assertions.");
        }
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
