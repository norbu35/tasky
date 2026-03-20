package mn.tasky.auth.scheduling;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import mn.tasky.auth.application.BadgeEvaluationService;
import mn.tasky.auth.application.DataRetentionService;
import mn.tasky.auth.application.FacebookCircuitBreaker;
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
        badgeRevocationScheduler = new BadgeRevocationScheduler(badgeEvaluationService);
        dataRetentionScheduler = new DataRetentionScheduler(dataRetentionService);

        when(restClientBuilder.baseUrl(any(String.class))).thenReturn(restClientBuilder);
        when(restClientBuilder.build()).thenReturn(restClient);

        facebookCircuitBreakerProbe = new FacebookCircuitBreakerProbe(
                circuitBreaker, restClientBuilder, "app-id", "app-secret", "https://graph.facebook.com");
    }

    // --- BadgeRevocationScheduler ---

    @Test
    @DisplayName("BadgeRevocationScheduler sweepBadges delegates to badge service")
    void sweepBadgesDelegatesToService() {
        badgeRevocationScheduler.sweepBadges();

        verify(badgeEvaluationService).sweepAllBadges();
    }

    // --- DataRetentionScheduler ---

    @Test
    @DisplayName("DataRetentionScheduler processRetention delegates to retention service")
    void processRetentionDelegatesToService() {
        dataRetentionScheduler.processRetention();

        verify(dataRetentionService).processRetention();
    }

    // --- FacebookCircuitBreakerProbe ---

    @Test
    @DisplayName("FacebookCircuitBreakerProbe skips probe when circuit is closed")
    void probeSkipsWhenCircuitClosed() {
        when(circuitBreaker.isOpen()).thenReturn(false);

        facebookCircuitBreakerProbe.probe();

        verify(circuitBreaker).isOpen();
        verify(circuitBreaker, never()).tryHalfOpen();
    }

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("FacebookCircuitBreakerProbe closes circuit on successful probe")
    void probeClosesCircuitOnSuccess() {
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
        when(circuitBreaker.isOpen()).thenReturn(true);
        when(restClient.get()).thenReturn((RestClient.RequestHeadersUriSpec) requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(java.util.function.Function.class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenThrow(new RestClientException("Connection refused"));

        facebookCircuitBreakerProbe.probe();

        verify(circuitBreaker).tryHalfOpen();
        verify(circuitBreaker, never()).recordSuccess();
    }
}
