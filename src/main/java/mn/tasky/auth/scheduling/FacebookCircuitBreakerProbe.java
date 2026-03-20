package mn.tasky.auth.scheduling;

import mn.tasky.auth.application.FacebookCircuitBreaker;
import mn.tasky.common.scheduling.SchedulerLockRunner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Periodic recovery probe for the Facebook OAuth circuit breaker.
 *
 * <p>When the circuit is OPEN the probe transitions it to HALF_OPEN and makes a lightweight
 * call to the Facebook {@code /app} endpoint using the app access token
 * ({@code appId|appSecret}). A successful response closes the circuit; any error leaves the
 * breaker in its current state (HALF_OPEN → stays HALF_OPEN, which {@code isOpen()} still
 * treats as non-CLOSED so user-facing calls remain blocked until the next probe succeeds).
 *
 * <p>Uses {@link SchedulerLockRunner} to prevent concurrent probe executions on the same JVM.
 */
@Component
public class FacebookCircuitBreakerProbe {

    private static final Logger log = LoggerFactory.getLogger(FacebookCircuitBreakerProbe.class);
    private static final String JOB_NAME = "facebook_circuit_breaker_probe";

    private final FacebookCircuitBreaker circuitBreaker;
    private final SchedulerLockRunner lockRunner;
    private final RestClient restClient;
    private final String appId;
    private final String appSecret;

    public FacebookCircuitBreakerProbe(
            FacebookCircuitBreaker circuitBreaker,
            SchedulerLockRunner lockRunner,
            RestClient.Builder restClientBuilder,
            @Value("${tasky.facebook.app-id:}") String appId,
            @Value("${tasky.facebook.app-secret:}") String appSecret,
            @Value("${tasky.facebook.graph-api-base-url:https://graph.facebook.com}") String graphApiBaseUrl) {
        this.circuitBreaker = circuitBreaker;
        this.lockRunner = lockRunner;
        this.restClient = restClientBuilder.baseUrl(graphApiBaseUrl).build();
        this.appId = appId;
        this.appSecret = appSecret;
    }

    @Scheduled(fixedRate = 60_000)
    public void probe() {
        lockRunner.runWithLock(JOB_NAME, this::doProbe);
    }

    private void doProbe() {
        if (!circuitBreaker.isOpen()) {
            return;
        }

        circuitBreaker.tryHalfOpen();
        log.info("Facebook circuit breaker probe started (state=HALF_OPEN)");

        try {
            String appAccessToken = appId + "|" + appSecret;
            restClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/{appId}")
                            .queryParam("access_token", appAccessToken)
                            .build(appId))
                    .retrieve()
                    .toBodilessEntity();

            circuitBreaker.recordSuccess();
            log.info("Facebook circuit breaker probe succeeded — circuit CLOSED");
        } catch (RestClientException e) {
            // Leave the breaker in HALF_OPEN; it will be probed again next cycle.
            log.warn("Facebook circuit breaker probe failed — circuit remains open: {}", e.getMessage());
        }
    }
}
