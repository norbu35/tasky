package mn.tasky.auth.scheduling;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.DataRetentionService;
import mn.tasky.auth.application.FacebookCircuitBreaker;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@ExtendWith(MockitoExtension.class)
class AuthSchedulerTests {

    @Mock
    private BadgeEvaluationService badgeEvaluationService;

    @Mock
    private DataRetentionService dataRetentionService;

    @Mock
    private FacebookCircuitBreaker circuitBreaker;

    @Mock
    private SchedulerLockRunner lockRunner;

    @Mock
    private RestClient.Builder restClientBuilder;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;

    @Mock
    private RestClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private BadgeRevocationScheduler badgeRevocationScheduler;
    private DataRetentionScheduler dataRetentionScheduler;
    private FacebookCircuitBreakerProbe facebookCircuitBreakerProbe;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        badgeRevocationScheduler = new BadgeRevocationScheduler(badgeEvaluationService, lockRunner);
        dataRetentionScheduler = new DataRetentionScheduler(dataRetentionService, lockRunner);

        when(restClientBuilder.baseUrl(any(String.class))).thenReturn(restClientBuilder);
        when(restClientBuilder.build()).thenReturn(restClient);

        facebookCircuitBreakerProbe = new FacebookCircuitBreakerProbe(
                circuitBreaker, lockRunner, restClientBuilder, "app-id", "app-secret", "https://graph.facebook.com");
    }

    // --- BadgeRevocationScheduler ---

    @Test
    @DisplayName("BadgeRevocationScheduler sweepBadges delegates to lock runner and badge service")
    void sweepBadgesDelegatesToService() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("badge_revocation_sweep"), any(Runnable.class));

        badgeRevocationScheduler.sweepBadges();

        verify(lockRunner).runWithLock(eq("badge_revocation_sweep"), any(Runnable.class));
        verify(badgeEvaluationService).sweepAllBadges();
    }

    // --- DataRetentionScheduler ---

    @Test
    @DisplayName("DataRetentionScheduler processRetention delegates to lock runner and retention service")
    void processRetentionDelegatesToService() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("data_retention_sweep"), any(Runnable.class));

        dataRetentionScheduler.processRetention();

        verify(lockRunner).runWithLock(eq("data_retention_sweep"), any(Runnable.class));
        verify(dataRetentionService).processRetention();
    }

    // --- FacebookCircuitBreakerProbe ---

    @Test
    @DisplayName("FacebookCircuitBreakerProbe probe delegates to lock runner")
    void probeDelegatesToLockRunner() {
        facebookCircuitBreakerProbe.probe();

        verify(lockRunner).runWithLock(eq("facebook_circuit_breaker_probe"), any(Runnable.class));
    }

    @Test
    @DisplayName("FacebookCircuitBreakerProbe skips probe when circuit is closed")
    void probeSkipsWhenCircuitClosed() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("facebook_circuit_breaker_probe"), any(Runnable.class));
        when(circuitBreaker.isOpen()).thenReturn(false);

        facebookCircuitBreakerProbe.probe();

        verify(circuitBreaker).isOpen();
        verify(circuitBreaker, never()).tryHalfOpen();
    }

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("FacebookCircuitBreakerProbe closes circuit on successful probe")
    void probeClosesCircuitOnSuccess() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("facebook_circuit_breaker_probe"), any(Runnable.class));
        when(circuitBreaker.isOpen()).thenReturn(true);
        when(restClient.get()).thenReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(java.util.function.Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);

        facebookCircuitBreakerProbe.probe();

        verify(circuitBreaker).tryHalfOpen();
        verify(circuitBreaker).recordSuccess();
    }

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("FacebookCircuitBreakerProbe leaves circuit open on failed probe")
    void probeLeavesCircuitOpenOnFailure() {
        doAnswer(invocation -> {
                    Runnable task = invocation.getArgument(1);
                    task.run();
                    return null;
                })
                .when(lockRunner)
                .runWithLock(eq("facebook_circuit_breaker_probe"), any(Runnable.class));
        when(circuitBreaker.isOpen()).thenReturn(true);
        when(restClient.get()).thenReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(java.util.function.Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenThrow(new RestClientException("Connection refused"));

        facebookCircuitBreakerProbe.probe();

        verify(circuitBreaker).tryHalfOpen();
        verify(circuitBreaker, never()).recordSuccess();
    }
}
