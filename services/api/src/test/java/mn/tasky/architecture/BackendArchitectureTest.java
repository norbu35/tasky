package mn.tasky.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "mn.tasky", importOptions = {ImportOption.DoNotIncludeTests.class})
class BackendArchitectureTest {

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
            .resideInAnyPackage("mn.tasky.auth..", "mn.tasky.booking..", "mn.tasky.category..", "mn.tasky.task..",
                    "mn.tasky.review..", "mn.tasky.wallet..", "mn.tasky.payment..", "mn.tasky.dispute..",
                    "mn.tasky.messaging..", "mn.tasky.notification..", "mn.tasky.admin..", "mn.tasky.analytics..",
                    "mn.tasky.user..", "mn.tasky.verification..", "mn.tasky.security..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.auth.scheduling..",
                    "mn.tasky.booking.scheduling..",
                    "mn.tasky.dispute.scheduling..",
                    "mn.tasky.review.scheduling..",
                    "mn.tasky.task.scheduling..")
            .allowEmptyShould(true);
}
