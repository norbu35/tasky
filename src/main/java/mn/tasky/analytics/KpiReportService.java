package mn.tasky.analytics;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class KpiReportService {

    private final AnalyticsService analyticsService;

    public KpiReportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    public KpiReport buildReport() {
        return buildReport(analyticsService.getEvents());
    }

    KpiReport buildReport(List<AnalyticsService.Event> events) {
        Set<String> postedTaskIds = referenceIds(
            events,
            AnalyticsService.EVENT_TASK_POSTED,
            AnalyticsService.PROPERTY_TASK_ID
        );
        Set<String> paidTaskIds = referenceIds(
            events,
            AnalyticsService.EVENT_PAYMENT_CONFIRMED,
            AnalyticsService.PROPERTY_TASK_ID
        );
        Set<String> paidBookingIds = referenceIds(
            events,
            AnalyticsService.EVENT_PAYMENT_CONFIRMED,
            AnalyticsService.PROPERTY_BOOKING_ID
        );
        Set<String> completedBookingIds = referenceIds(
            events,
            AnalyticsService.EVENT_BOOKING_COMPLETED,
            AnalyticsService.PROPERTY_BOOKING_ID
        );
        Set<String> disputedBookingIds = referenceIds(
            events,
            AnalyticsService.EVENT_DISPUTE_RAISED,
            AnalyticsService.PROPERTY_BOOKING_ID
        );

        return new KpiReport(
            postedTaskIds.size(),
            paidTaskIds.size(),
            paidBookingIds.size(),
            completedBookingIds.size(),
            disputedBookingIds.size(),
            ratio(paidTaskIds.size(), postedTaskIds.size()),
            ratio(completedBookingIds.size(), paidBookingIds.size()),
            ratio(disputedBookingIds.size(), completedBookingIds.size())
        );
    }

    private Set<String> referenceIds(List<AnalyticsService.Event> events, String eventName, String propertyKey) {
        Set<String> ids = new LinkedHashSet<>();
        for (AnalyticsService.Event event : events) {
            if (!eventName.equals(event.name())) {
                continue;
            }
            Object value = event.properties().get(propertyKey);
            if (value != null) {
                ids.add(value.toString());
            }
        }
        return ids;
    }

    private double ratio(int numerator, int denominator) {
        if (denominator == 0) {
            return 0.0d;
        }
        return (double) numerator / (double) denominator;
    }
}
