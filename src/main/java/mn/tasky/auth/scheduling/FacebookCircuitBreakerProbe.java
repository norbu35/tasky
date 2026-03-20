package mn.tasky.auth.scheduling;

import mn.tasky.auth.application.FacebookCircuitBreaker;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
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
 */
@Component
public class FacebookCircuitBreakerProbe {

    private static final Logger log = LoggerFactory.getLogger(FacebookCircuitBreakerProbe.class);

    private final FacebookCircuitBreaker circuitBreaker;
    private final RestClient restClient;
    private final String appId;
    private final String appSecret;

    public FacebookCircuitBreakerProbe(
            FacebookCircuitBreaker circuitBreaker,
            RestClient.Builder restClientBuilder,
            @Value("${tasky.facebook.app-id:}") String appId,
            @Value("${tasky.facebook.app-secret:}") String appSecret,
            @Value("${tasky.facebook.graph-api-base-url:https://graph.facebook.com}") String graphApiBaseUrl) {
        this.circuitBreaker = circuitBreaker;
        this.restClient = restClientBuilder.baseUrl(graphApiBaseUrl).build();
        this.appId = appId;
        this.appSecret = appSecret;
    }

    @Scheduled(fixedRate = 60_000)
    @SchedulerLock(name = "facebook_circuit_breaker_probe", lockAtMostFor = "50s", lockAtLeastFor = "10s")
    public void probe() {
        doProbe();
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
