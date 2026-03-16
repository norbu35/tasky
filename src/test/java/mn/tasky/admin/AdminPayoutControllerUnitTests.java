package mn.tasky.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.admin.api.AdminPayoutController;
import mn.tasky.common.feature.FeatureToggleService;
import mn.tasky.common.idempotency.IdempotencyClaim;
import mn.tasky.common.idempotency.IdempotencyOperations;
import mn.tasky.common.idempotency.IdempotencyRecord;
import mn.tasky.common.idempotency.IdempotencyService;
import mn.tasky.common.security.JwtPrincipal;
import mn.tasky.wallet.application.WalletService;
import mn.tasky.wallet.dto.PayoutRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

@ExtendWith(MockitoExtension.class)
class AdminPayoutControllerUnitTests {

    @Mock
    private WalletService walletService;

    @Mock
    private IdempotencyService idempotencyService;

    private FeatureToggleService featureToggleService(boolean enabled) {
        FeatureToggleService fts = mock(FeatureToggleService.class);
        lenient().when(fts.isEnabled("escrow_enabled")).thenReturn(enabled);
        return fts;
    }

    @Test
    void listPendingReturnsDeferredWhenMonetizationDisabled() {
        AdminPayoutController controller =
                new AdminPayoutController(walletService, idempotencyService, featureToggleService(false));

        ResponseEntity<?> response = controller.listPendingPayouts(request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "FEATURE_DEFERRED");
    }

    private MockHttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("trace_id", "trace-admin-payout");
        return request;
    }

    @Test
    void processPayoutReturnsInProgressWhenClaimIsRunning() {
        AdminPayoutController controller =
                new AdminPayoutController(walletService, idempotencyService, featureToggleService(true));
        JwtPrincipal principal = adminPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.PROCESS_PAYOUT, "idem-1"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.IN_PROGRESS, null));

        ResponseEntity<?> response = controller.processPayout(principal, uuid(1), "idem-1", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_IN_PROGRESS");
    }

    private JwtPrincipal adminPrincipal() {
        return new JwtPrincipal(uuid(100), "ADMIN", "ACTIVE");
    }

    private String uuid(int suffix) {
        return String.format("00000000-0000-0000-0000-%012d", suffix);
    }

    @Test
    void processPayoutReturnsReplayMissingWhenCompletedRecordMissingResource() {
        AdminPayoutController controller =
                new AdminPayoutController(walletService, idempotencyService, featureToggleService(true));
        JwtPrincipal principal = adminPrincipal();
        IdempotencyRecord record = new IdempotencyRecord(
                UUID.fromString(uuid(11)),
                UUID.fromString(uuid(12)),
                IdempotencyOperations.PROCESS_PAYOUT,
                "idem-2",
                "COMPLETED",
                "PAYOUT",
                null,
                Instant.now(),
                Instant.now());
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.PROCESS_PAYOUT, "idem-2"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, record));

        ResponseEntity<?> response = controller.processPayout(principal, uuid(2), "idem-2", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("code", "IDEMPOTENCY_REPLAY_MISSING");
    }

    @Test
    void processPayoutReplaysCompletedResourceWhenPresent() {
        AdminPayoutController controller =
                new AdminPayoutController(walletService, idempotencyService, featureToggleService(true));
        JwtPrincipal principal = adminPrincipal();
        String payoutId = uuid(3);
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.PROCESS_PAYOUT, "idem-3"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.COMPLETED, completedRecord(payoutId)));
        when(walletService.getPayout(payoutId))
                .thenReturn(Optional.of(new PayoutRequest(
                        payoutId, uuid(4), 4000, "PROCESSED", Instant.parse("2026-02-17T00:00:00Z"))));

        ResponseEntity<?> response = controller.processPayout(principal, uuid(5), "idem-3", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat((Map<String, Object>) response.getBody()).containsEntry("status", "PROCESSED");
    }

    private IdempotencyRecord completedRecord(String payoutId) {
        Instant now = Instant.parse("2026-02-17T00:00:00Z");
        return new IdempotencyRecord(
                UUID.fromString(uuid(21)),
                UUID.fromString(uuid(22)),
                IdempotencyOperations.PROCESS_PAYOUT,
                "idem-complete",
                "COMPLETED",
                "PAYOUT",
                UUID.fromString(payoutId),
                now,
                now);
    }

    @Test
    void processPayoutReturnsDeferredWhenMonetizationDisabled() {
        AdminPayoutController controller =
                new AdminPayoutController(walletService, idempotencyService, featureToggleService(false));
        JwtPrincipal principal = adminPrincipal();
        when(idempotencyService.claim(principal.userId(), IdempotencyOperations.PROCESS_PAYOUT, "idem-4"))
                .thenReturn(new IdempotencyClaim(IdempotencyClaim.Status.NEW, null));

        ResponseEntity<?> response = controller.processPayout(principal, uuid(6), "idem-4", request());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verify(idempotencyService)
                .abandon(eq(principal.userId()), eq(IdempotencyOperations.PROCESS_PAYOUT), eq("idem-4"));
    }
}
