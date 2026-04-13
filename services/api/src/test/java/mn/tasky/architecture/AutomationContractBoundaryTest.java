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
class AutomationContractBoundaryTest {

    @Test
    void automationContractMarkersExist() {
        assertMarkerExists("mn.tasky.automation.event.PackageMarker");
        assertMarkerExists("mn.tasky.automation.job.PackageMarker");
        assertMarkerExists("mn.tasky.automation.broker.PackageMarker");
    }

    @ArchTest
    static final ArchRule eventEnvelopesMustNotDependOnTransport = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.automation.event..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.automation.broker..")
            .because("event contracts are transport-agnostic and must not leak broker details")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule jobEnvelopesMustNotDependOnTransport = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.automation.job..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.automation.broker..")
            .because("job contracts are transport-agnostic and must not leak broker details")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule brokerMustNotDependOnDomainModules = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.automation.broker..")
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
            .because("the broker relay is pure infrastructure and must not depend on domain logic")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule domainModulesMustNotDependOnBroker = noClasses()
            .that()
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
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.automation.broker..")
            .because("domain code publishes through kernel outbox, not directly to the broker")
            .allowEmptyShould(true);

    private static void assertMarkerExists(String fqcn) {
        assertDoesNotThrow(() -> Class.forName(fqcn), () -> fqcn + " should exist");
    }
}
