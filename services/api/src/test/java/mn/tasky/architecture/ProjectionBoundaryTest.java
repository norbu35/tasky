package mn.tasky.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
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
class ProjectionBoundaryTest {

    @Test
    void projectionPlaneMarkerExists() {
        assertMarkerExists("mn.tasky.projection.PackageMarker");
        assertMarkerExists("mn.tasky.projection.admin.PackageMarker");
        assertMarkerExists("mn.tasky.projection.publicfeed.PackageMarker");
    }

    @ArchTest
    static final ArchRule adminQueueCompositionMustDependOnAdminProjections = classes()
            .that()
            .haveFullyQualifiedName("mn.tasky.runtime.adminapi.composition.AdminVerificationCompositionService")
            .or()
            .haveFullyQualifiedName("mn.tasky.runtime.adminapi.composition.AdminDisputeCompositionService")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.projection.admin..")
            .because("read-heavy admin queues should flow through projection-owned read models");

    @ArchTest
    static final ArchRule projectionPackagesMustNotDependOnInboundAdapters = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.projection..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..api..", "mn.tasky..scheduling..")
            .because("projections are derived read models, not request handlers")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule onlyRuntimeAndAutomationMayDependOnProjectionPackages = noClasses()
            .that()
            .resideOutsideOfPackages(
                    "mn.tasky.projection..", "mn.tasky.runtime..", "mn.tasky.automation..", "mn.tasky.common.config..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky.projection..")
            .because("projection read models should be consumed through runtime or automation surfaces")
            .allowEmptyShould(true);

    private static void assertMarkerExists(String fqcn) {
        assertDoesNotThrow(() -> Class.forName(fqcn), () -> fqcn + " should exist");
    }
}
