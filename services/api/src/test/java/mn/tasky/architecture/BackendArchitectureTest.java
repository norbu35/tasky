package mn.tasky.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@AnalyzeClasses(
        packages = "mn.tasky",
        importOptions = {ImportOption.DoNotIncludeTests.class})
class BackendArchitectureTest {

    private static final Set<String> FEATURE_MODULES = Set.of(
            "auth",
            "booking",
            "category",
            "task",
            "review",
            "wallet",
            "payment",
            "dispute",
            "messaging",
            "notification",
            "admin",
            "analytics",
            "user",
            "verification",
            "security");
    private static final Set<String> INTERNAL_FEATURE_SEGMENTS =
            Set.of("application", "dao", "api", "scheduling", "provider");
    private static final Set<String> EXPLICIT_BOUNDARY_SEGMENTS = Set.of("publicapi", "facade", "config");
    private static final Set<String> LEGACY_CROSS_FEATURE_INTERNAL_DEPENDENCIES = Set.of(
            "mn.tasky.auth.application.ReliabilityScoreService -> mn.tasky.booking.dao.BookingDao",
            "mn.tasky.auth.application.ReliabilityScoreService -> mn.tasky.review.dao.ReviewDao",
            "mn.tasky.booking.application.BookingIntentService -> mn.tasky.analytics.application.AnalyticsService",
            "mn.tasky.booking.application.BookingIntentService -> "
                    + "mn.tasky.notification.application.NotificationService",
            "mn.tasky.booking.application.BookingIntentService -> mn.tasky.task.dao.TaskApplicationDao",
            "mn.tasky.booking.application.BookingIntentService -> mn.tasky.task.dao.TaskDao",
            "mn.tasky.booking.application.BookingLifecycleService -> mn.tasky.auth.application.ModerationService",
            "mn.tasky.booking.application.BookingLifecycleService -> "
                    + "mn.tasky.notification.application.NotificationService",
            "mn.tasky.booking.application.BookingLifecycleService -> "
                    + "mn.tasky.review.application.ReviewEnforcementService",
            "mn.tasky.booking.application.BookingLifecycleService -> mn.tasky.task.application.TaskLifecycleService",
            "mn.tasky.booking.application.BookingLifecycleService -> mn.tasky.task.application.TaskQueryService",
            "mn.tasky.booking.application.BookingScheduleService -> "
                    + "mn.tasky.notification.application.NotificationService",
            "mn.tasky.booking.application.BookingService -> mn.tasky.auth.application.UserProfileService",
            "mn.tasky.booking.application.CompletionTimeoutService -> "
                    + "mn.tasky.notification.application.NotificationService",
            "mn.tasky.booking.application.NoShowService -> mn.tasky.auth.application.ModerationService",
            "mn.tasky.booking.application.NoShowService -> mn.tasky.messaging.dao.ConversationDao",
            "mn.tasky.booking.application.NoShowService -> mn.tasky.messaging.dao.MessageDao",
            "mn.tasky.booking.application.NoShowService -> mn.tasky.notification.application.NotificationService",
            "mn.tasky.booking.application.NoShowService -> mn.tasky.review.application.ReviewEnforcementService",
            "mn.tasky.booking.application.NoShowService -> mn.tasky.task.application.TaskLifecycleService",
            "mn.tasky.booking.application.RepeatBookingService -> mn.tasky.category.dao.CategorySchemaVersionDao",
            "mn.tasky.booking.application.RepeatBookingService -> mn.tasky.task.dao.TaskDao",
            "mn.tasky.messaging.application.MessagingService -> mn.tasky.analytics.application.AnalyticsService",
            "mn.tasky.notification.application.NotificationService -> mn.tasky.auth.dao.UserDao",
            "mn.tasky.payment.application.PaymentService -> mn.tasky.analytics.application.AnalyticsService",
            "mn.tasky.payment.application.PaymentService -> mn.tasky.booking.application.BookingService",
            "mn.tasky.payment.application.PaymentService -> mn.tasky.task.application.TaskLifecycleService",
            "mn.tasky.review.application.ReviewEnforcementService -> mn.tasky.dispute.dao.DisputeDao",
            "mn.tasky.review.application.ReviewEnforcementService -> "
                    + "mn.tasky.notification.application.NotificationService",
            "mn.tasky.review.application.ReviewService -> mn.tasky.auth.application.BadgeEvaluationService",
            "mn.tasky.review.application.ReviewService -> mn.tasky.auth.application.UserProfileService",
            "mn.tasky.review.application.ReviewService -> mn.tasky.booking.application.BookingService");

    @ArchTest
    static final ArchRule daoMustNotDependOnInboundOrServiceLayers = classes()
            .that()
            .resideInAnyPackage("mn.tasky..dao..")
            .should()
            .onlyDependOnClassesThat()
            .resideOutsideOfPackages("mn.tasky..api..", "mn.tasky..application..", "mn.tasky..scheduling..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule serviceAndPersistenceLayersMustNotDependOnControllers = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky..application..", "mn.tasky..dao..", "mn.tasky..scheduling..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..api..")
            .because("controllers are inbound adapters and must stay at the edge of each domain")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule commonConfigShouldRemainAnInternalDetail = noClasses()
            .that()
            .resideOutsideOfPackages("mn.tasky.common..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.common.config..")
            .because("common.config wiring must not leak into domain code")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule crossDomainSchedulingDependenciesAreForbidden = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.auth..",
                    "mn.tasky.booking..",
                    "mn.tasky.category..",
                    "mn.tasky.task..",
                    "mn.tasky.review..",
                    "mn.tasky.wallet..",
                    "mn.tasky.payment..",
                    "mn.tasky.dispute..",
                    "mn.tasky.messaging..",
                    "mn.tasky.notification..",
                    "mn.tasky.admin..",
                    "mn.tasky.analytics..",
                    "mn.tasky.user..",
                    "mn.tasky.verification..",
                    "mn.tasky.security..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.auth.scheduling..",
                    "mn.tasky.booking.scheduling..",
                    "mn.tasky.dispute.scheduling..",
                    "mn.tasky.review.scheduling..",
                    "mn.tasky.task.scheduling..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule kernelMustNotDependOnFeatureModules = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.kernel..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.auth..",
                    "mn.tasky.booking..",
                    "mn.tasky.category..",
                    "mn.tasky.task..",
                    "mn.tasky.review..",
                    "mn.tasky.wallet..",
                    "mn.tasky.payment..",
                    "mn.tasky.dispute..",
                    "mn.tasky.messaging..",
                    "mn.tasky.notification..",
                    "mn.tasky.admin..",
                    "mn.tasky.analytics..",
                    "mn.tasky.user..",
                    "mn.tasky.verification..",
                    "mn.tasky.security..")
            .because("kernel should remain a narrow shared plane instead of accumulating feature logic")
            .allowEmptyShould(true);

    // -- Finalization rules (Tranche 10) -----------------------------------------------

    /**
     * Runtime composition services must not reach into DAOs.
     * They may depend on module publicapi ports and same-module application services,
     * but never on DAOs directly.
     */
    @ArchTest
    static final ArchRule runtimeCompositionMustNotDependOnDaos = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.runtime.publicapi.composition..",
                    "mn.tasky.runtime.adminapi.composition..",
                    "mn.tasky.runtime.user.composition..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..dao..")
            .because("runtime composition must use publicapi ports, not DAOs");

    /**
     * Runtime composition services must depend on module publicapi ports, not on
     * feature-module application services directly.
     * This enforces the two allowed request-path shapes from the finalization design.
     */
    @ArchTest
    static final ArchRule runtimeCompositionMustUsePublicPorts = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.runtime.publicapi.composition..",
                    "mn.tasky.runtime.adminapi.composition..",
                    "mn.tasky.runtime.user.composition..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.analytics.application..",
                    "mn.tasky.auth.application..",
                    "mn.tasky.booking.application..",
                    "mn.tasky.category.application..",
                    "mn.tasky.dispute.application..",
                    "mn.tasky.location.application..",
                    "mn.tasky.messaging.application..",
                    "mn.tasky.notification.application..",
                    "mn.tasky.payment.application..",
                    "mn.tasky.review.application..",
                    "mn.tasky.task.application..",
                    "mn.tasky.user.application..",
                    "mn.tasky.verification.application..",
                    "mn.tasky.wallet.application..")
            .because("runtime composition must use publicapi ports, not feature-module application services");

    /**
     * Runtime composition must not depend on common.audit internals.
     * Use AdminAuditCommandPort instead.
     */
    @ArchTest
    static final ArchRule runtimeCompositionMustNotDependOnAuditDao = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.runtime.publicapi.composition..",
                    "mn.tasky.runtime.adminapi.composition..",
                    "mn.tasky.runtime.user.composition..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.common.audit..")
            .because("runtime composition must use AdminAuditCommandPort, not AuditEventDao");

    @ArchTest
    static final ArchRule assistanceServicesMustUseCategoryPublicPort = noClasses()
            .that()
            .haveSimpleName("TaskAssistanceService")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.category.dao..")
            .because("task assistance crosses the category boundary through CategoryQueryPort");

    @ArchTest
    static final ArchRule taskSchedulersMustUseNotificationPublicPort = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.task.scheduling..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.notification.application..")
            .because("task schedulers cross the notification boundary through NotificationCommandPort");

    @ArchTest
    static void featureModulesMustNotAddCrossFeatureInternalDependencies(JavaClasses importedClasses) {
        Set<String> violations = importedClasses.stream()
                .flatMap(origin -> origin.getDirectDependenciesFromSelf().stream())
                .map(BackendArchitectureTest::crossFeatureInternalDependency)
                .flatMap(Optional::stream)
                .filter(dependency -> !LEGACY_CROSS_FEATURE_INTERNAL_DEPENDENCIES.contains(dependency))
                .collect(Collectors.toCollection(TreeSet::new));

        assertTrue(
                violations.isEmpty(),
                () -> "Feature modules must cross boundaries through publicapi ports, facade, or config packages. "
                        + "New internal dependencies: "
                        + violations);
    }

    private static Optional<String> crossFeatureInternalDependency(Dependency dependency) {
        JavaClass origin = dependency.getOriginClass();
        JavaClass target = dependency.getTargetClass();
        String originFeature = featureRoot(origin);
        String targetFeature = featureRoot(target);
        if (originFeature == null
                || targetFeature == null
                || originFeature.equals(targetFeature)
                || !FEATURE_MODULES.contains(originFeature)
                || !FEATURE_MODULES.contains(targetFeature)) {
            return Optional.empty();
        }
        String targetSegment = segmentAfterFeature(target);
        if (EXPLICIT_BOUNDARY_SEGMENTS.contains(targetSegment)) {
            return Optional.empty();
        }
        if (!INTERNAL_FEATURE_SEGMENTS.contains(targetSegment)) {
            return Optional.empty();
        }
        return Optional.of(origin.getName() + " -> " + target.getName());
    }

    private static String featureRoot(JavaClass javaClass) {
        String packageName = javaClass.getPackageName();
        if (!packageName.startsWith("mn.tasky.")) {
            return null;
        }
        String remainder = packageName.substring("mn.tasky.".length());
        int separator = remainder.indexOf('.');
        return separator >= 0 ? remainder.substring(0, separator) : remainder;
    }

    private static String segmentAfterFeature(JavaClass javaClass) {
        String packageName = javaClass.getPackageName();
        String prefix = "mn.tasky." + featureRoot(javaClass) + ".";
        if (!packageName.startsWith(prefix)) {
            return "";
        }
        String remainder = packageName.substring(prefix.length());
        int separator = remainder.indexOf('.');
        return separator >= 0 ? remainder.substring(0, separator) : remainder;
    }
}
