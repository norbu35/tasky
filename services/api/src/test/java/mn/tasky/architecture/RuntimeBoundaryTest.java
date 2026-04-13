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
class RuntimeBoundaryTest {

    @Test
    void canonicalPlaneMarkersExist() {
        assertMarkerExists("mn.tasky.kernel.PackageMarker");
        assertMarkerExists("mn.tasky.runtime.PackageMarker");
        assertMarkerExists("mn.tasky.automation.PackageMarker");
        assertMarkerExists("mn.tasky.runtime.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.runtime.adminapi.PackageMarker");
        assertMarkerExists("mn.tasky.runtime.worker.PackageMarker");
        assertMarkerExists("mn.tasky.runtime.scheduler.PackageMarker");
    }

    @Test
    void runtimeConfigurationShellsExist() {
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.RuntimeConfiguration"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.RuntimeSurfaceProperties"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.publicapi.PublicApiRuntimeConfiguration"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.adminapi.AdminApiRuntimeConfiguration"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.worker.WorkerRuntimeConfiguration"));
        assertDoesNotThrow(() -> Class.forName("mn.tasky.runtime.scheduler.SchedulerRuntimeConfiguration"));
    }

    @ArchTest
    static final ArchRule runtimePlanesMustNotDependOnInboundAdapters = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky.kernel..", "mn.tasky.runtime..", "mn.tasky.automation..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..api..", "mn.tasky..scheduling..")
            .because("v2 runtime planes should sit beneath controller and scheduler adapters")
            .allowEmptyShould(true);

    private static void assertMarkerExists(String fqcn) {
        assertDoesNotThrow(() -> Class.forName(fqcn), () -> fqcn + " should exist");
    }
}
