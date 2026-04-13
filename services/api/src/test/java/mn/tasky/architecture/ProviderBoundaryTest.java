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
class ProviderBoundaryTest {

    @Test
    void providerPlaneMarkersExist() {
        assertMarkerExists("mn.tasky.automation.provider.PackageMarker");
        assertMarkerExists("mn.tasky.automation.provider.llm.PackageMarker");
        assertMarkerExists("mn.tasky.auth.provider.PackageMarker");
        assertMarkerExists("mn.tasky.notification.provider.PackageMarker");
        assertMarkerExists("mn.tasky.payment.provider.PackageMarker");
    }

    @ArchTest
    static final ArchRule providerAdaptersMustNotDependOnUnrelatedApplicationServices = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.automation.provider..", "mn.tasky.payment.provider..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.booking.application..",
                    "mn.tasky.task.application..",
                    "mn.tasky.review.application..",
                    "mn.tasky.wallet.application..",
                    "mn.tasky.messaging.application..",
                    "mn.tasky.notification.application..",
                    "mn.tasky.verification.application..")
            .because("provider adapters should validate external signals, not orchestrate domain state machines; "
                    + "booking/task transitions belong in PaymentService")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule controllersMustNotDependOnProviders = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky..api..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.automation.provider..",
                    "mn.tasky.auth.provider..",
                    "mn.tasky.payment.provider..",
                    "mn.tasky.location.provider..",
                    "mn.tasky.notification.provider..")
            .because("controllers must depend on application ports, not provider adapters")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule providersMustNotDependOnBroker = noClasses()
            .that()
            .resideInAnyPackage(
                    "mn.tasky.automation.provider..", "mn.tasky.auth.provider..", "mn.tasky.payment.provider..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.automation.broker..")
            .because("providers publish through the outbox path, not directly to the broker")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule llmProviderMustNotDependOnDomainModules = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.automation.provider.llm..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "mn.tasky.auth..",
                    "mn.tasky.booking..",
                    "mn.tasky.task..",
                    "mn.tasky.review..",
                    "mn.tasky.wallet..",
                    "mn.tasky.payment..",
                    "mn.tasky.messaging..",
                    "mn.tasky.notification..",
                    "mn.tasky.admin..",
                    "mn.tasky.analytics..",
                    "mn.tasky.user..",
                    "mn.tasky.verification..",
                    "mn.tasky.security..")
            .because("LLM providers must remain domain-agnostic infrastructure")
            .allowEmptyShould(true);

    private static void assertMarkerExists(String fqcn) {
        assertDoesNotThrow(() -> Class.forName(fqcn), () -> fqcn + " should exist");
    }
}
