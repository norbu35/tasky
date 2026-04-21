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
class PublicPortBoundaryTest {

    @Test
    void modulePublicApiMarkersExist() {
        assertMarkerExists("mn.tasky.auth.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.booking.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.category.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.task.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.review.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.wallet.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.payment.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.dispute.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.messaging.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.notification.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.admin.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.analytics.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.user.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.verification.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.security.publicapi.PackageMarker");
        assertMarkerExists("mn.tasky.identity.publicapi.IdentityCommandPort");
        assertMarkerExists("mn.tasky.identity.publicapi.IdentityQueryPort");
        assertMarkerExists("mn.tasky.marketplace.publicapi.MarketplaceCommandPort");
        assertMarkerExists("mn.tasky.marketplace.publicapi.MarketplaceQueryPort");
        assertMarkerExists("mn.tasky.booking.publicapi.BookingCommandPort");
        assertMarkerExists("mn.tasky.booking.publicapi.BookingQueryPort");
        assertMarkerExists("mn.tasky.trust.publicapi.TrustCommandPort");
        assertMarkerExists("mn.tasky.trust.publicapi.TrustQueryPort");
        assertMarkerExists("mn.tasky.wallet.publicapi.WalletCommandPort");
        assertMarkerExists("mn.tasky.wallet.publicapi.WalletQueryPort");
        assertMarkerExists("mn.tasky.messaging.publicapi.MessagingCommandPort");
        assertMarkerExists("mn.tasky.messaging.publicapi.MessagingQueryPort");
        assertMarkerExists("mn.tasky.identity.application.command.IdentityCommandHandler");
        assertMarkerExists("mn.tasky.identity.application.query.IdentityQueryHandler");
        assertMarkerExists("mn.tasky.marketplace.application.command.MarketplaceCommandHandler");
        assertMarkerExists("mn.tasky.marketplace.application.query.MarketplaceQueryHandler");
        assertMarkerExists("mn.tasky.booking.application.command.BookingCommandHandler");
        assertMarkerExists("mn.tasky.booking.application.query.BookingQueryHandler");
        assertMarkerExists("mn.tasky.trust.application.command.TrustCommandHandler");
        assertMarkerExists("mn.tasky.trust.application.query.TrustQueryHandler");
        assertMarkerExists("mn.tasky.wallet.application.command.WalletCommandHandler");
        assertMarkerExists("mn.tasky.wallet.application.query.WalletQueryHandler");
        assertMarkerExists("mn.tasky.messaging.application.command.MessagingCommandHandler");
        assertMarkerExists("mn.tasky.messaging.application.query.MessagingQueryHandler");
    }

    @ArchTest
    static final ArchRule publicPortsMustNotDependOnInboundOrPersistenceLayers = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky..publicapi..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("mn.tasky..api..", "mn.tasky..dao..", "mn.tasky..scheduling..")
            .because("public ports should remain stable contracts instead of depending on adapters or persistence")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule apiControllersShouldDependOnPortsInsteadOfConcreteHotspotServices = noClasses()
            .that()
            .resideInAnyPackage("mn.tasky..api..")
            .and()
            .doNotHaveSimpleName("AuthController")
            .should()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.auth.application.AuthService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.task.application.TaskService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.booking.application.BookingService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.booking.application.BookingLifecycleService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.review.application.ReviewService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.dispute.application.DisputeService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.wallet.application.WalletService")
            .orShould()
            .dependOnClassesThat()
            .haveFullyQualifiedName("mn.tasky.messaging.application.MessagingService")
            .because("controllers should compose around public command/query ports instead of legacy concrete services")
            .allowEmptyShould(true);

    private static void assertMarkerExists(String fqcn) {
        assertDoesNotThrow(() -> Class.forName(fqcn), () -> fqcn + " should exist");
    }
}
