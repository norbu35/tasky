package mn.tasky.analytics.application.command;

import java.util.Map;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.analytics.publicapi.AnalyticsCommandPort;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsCommandHandler implements AnalyticsCommandPort {

    private final AnalyticsService analyticsService;

    public AnalyticsCommandHandler(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Override
    public void track(String eventName, String userId, Map<String, Object> properties) {
        analyticsService.track(eventName, userId, properties);
    }
}
