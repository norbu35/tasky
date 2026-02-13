package mn.tasky.analytics;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    private final List<Event> events = new ArrayList<>();

    public void track(String eventName, String userId, Map<String, Object> properties) {
        Event event = new Event(
            UUID.randomUUID().toString(),
            eventName,
            userId,
            properties,
            Instant.now()
        );
        events.add(event);
        log.info("TRACK event={} user={} props={}", eventName, userId, properties);
    }

    public List<Event> getEvents() {
        return List.copyOf(events);
    }

    public record Event(
        String id,
        String name,
        String userId,
        Map<String, Object> properties,
        Instant timestamp
    ) {}
}
