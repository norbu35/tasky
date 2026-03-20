package mn.tasky.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "mn.tasky", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTests {

    @ArchTest
    static final ArchRule booking_should_not_access_admin =
            noClasses().that().resideInAPackage("..booking..")
                    .should().accessClassesThat().resideInAPackage("..admin..");

    @ArchTest
    static final ArchRule wallet_only_accesses_common =
            noClasses().that().resideInAPackage("..wallet..")
                    .should().accessClassesThat().resideInAnyPackage(
                            "..task..", "..booking..", "..dispute..", "..review..",
                            "..messaging..", "..notification..", "..admin..", "..category..");

    @ArchTest
    static final ArchRule scheduling_does_not_import_api =
            noClasses().that().resideInAPackage("..scheduling..")
                    .should().dependOnClassesThat().resideInAPackage("..api..");

    @ArchTest
    static final ArchRule dtos_do_not_import_services =
            noClasses().that().resideInAPackage("..dto..")
                    .should().dependOnClassesThat().resideInAnyPackage("..dao..", "..application..");

    @ArchTest
    static final ArchRule controllers_annotated =
            classes().that().haveSimpleNameEndingWith("Controller")
                    .should().beAnnotatedWith(org.springframework.web.bind.annotation.RestController.class);

    @ArchTest
    static final ArchRule services_annotated =
            classes().that().haveSimpleNameEndingWith("Service")
                    .and().resideInAPackage("..application..")
                    .and().areNotInterfaces()
                    .should().beAnnotatedWith(org.springframework.stereotype.Service.class)
                    .because("concrete service classes in application packages must be Spring-managed beans");
}
