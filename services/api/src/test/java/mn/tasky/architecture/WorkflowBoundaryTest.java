package mn.tasky.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

@AnalyzeClasses(
        packages = "mn.tasky",
        importOptions = {ImportOption.DoNotIncludeTests.class})
class WorkflowBoundaryTest {

    @Test
    void workflowAndAutomationPlaneMarkersExist() {
        assertMarkerExists("mn.tasky.automation.PackageMarker");
        assertMarkerExists("mn.tasky.automation.event.PackageMarker");
        assertMarkerExists("mn.tasky.automation.job.PackageMarker");
        assertMarkerExists("mn.tasky.automation.broker.PackageMarker");
        assertMarkerExists("mn.tasky.automation.worker.PackageMarker");
        assertMarkerExists("mn.tasky.automation.workflow.PackageMarker");
        assertMarkerExists("mn.tasky.kernel.outbox.PackageMarker");
    }

    @ArchTest
    static final ArchRule workflowPackagesMustNotDependOnControllers = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky..workflow..", "mn.tasky.automation.workflow..", "mn.tasky.automation.job..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..api..")
            .because("workflows own multi-step aftermath logic and must not be inbound adapters")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule automationMustNotDependOnRequestPathServices = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.automation..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..application..")
            .allowEmptyShould(true)
            .because("automation handlers should depend on public ports, not broad application services");

    @ArchTest
    static final ArchRule onlyAutomationMayDependOnWorkerPackages = noClasses()
            .that()
            .resideOutsideOfPackages(
                    "mn.tasky.automation..",
                    "mn.tasky.common.config..",
                    "mn.tasky.common.outbox..",
                    "mn.tasky..workflow..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.automation.worker..", "mn.tasky.automation.broker..")
            .because("worker consumers and broker relay are automation-owned concerns, "
                    + "except for the outbox relay path and domain workflow handlers")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule kernelOutboxMustRemainNarrow = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.kernel.outbox..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.auth..",
                    "mn.tasky.booking..",
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
            .because("kernel outbox primitives must not know about feature modules")
            .allowEmptyShould(true);

    private static void assertMarkerExists(String fqcn) {
        assertDoesNotThrow(() -> Class.forName(fqcn), () -> fqcn + " should exist");
    }
}
