package mn.tasky.analytics.application;

import mn.tasky.analytics.domain.KpiReport;
import mn.tasky.analytics.dto.Event;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Service responsible for generating Key Performance Indicator (KPI) reports
 * based on analytics events.
 */
@Service
public class KpiReportService {

    private final AnalyticsService analyticsService;

    public KpiReportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Builds a KPI report using all currently recorded analytics events.
     *
     * @return A {@link KpiReport} containing aggregated metrics.
     */
    public KpiReport buildReport() {
        return buildReport(analyticsService.getEvents());
    }

    /**
     * Builds a KPI report from a provided list of analytics events.
     * Calculates totals and conversion/dispute ratios.
     *
     * @param events The list of {@link Event} objects to analyze.
     * @return A {@link KpiReport} with calculated metrics.
     */
    public KpiReport buildReport(List<Event> events) {
        Set<String> postedTaskIds =
            referenceIds(events,
                AnalyticsService.EVENT_TASK_POSTED,
                AnalyticsService.PROPERTY_TASK_ID);
        Set<String> confirmedTaskIds =
            referenceIds(events,
                AnalyticsService.EVENT_BOOKING_CONFIRMED,
                AnalyticsService.PROPERTY_TASK_ID);
        Set<String> confirmedBookingIds =
            referenceIds(events,
                AnalyticsService.EVENT_BOOKING_CONFIRMED,
                AnalyticsService.PROPERTY_BOOKING_ID);
        Set<String> completedBookingIds =
            referenceIds(events,
                AnalyticsService.EVENT_BOOKING_COMPLETED,
                AnalyticsService.PROPERTY_BOOKING_ID);
        Set<String> disputedBookingIds =
            referenceIds(events,
                AnalyticsService.EVENT_DISPUTE_RAISED,
                AnalyticsService.PROPERTY_BOOKING_ID);

        return new KpiReport(
            postedTaskIds.size(),
            confirmedTaskIds.size(),
            confirmedBookingIds.size(),
            completedBookingIds.size(),
            disputedBookingIds.size(),
            ratio(confirmedTaskIds.size(),
                postedTaskIds.size()),
            ratio(completedBookingIds.size(),
                confirmedBookingIds.size()),
            ratio(disputedBookingIds.size(),
                completedBookingIds.size()));
    }

    private Set<String> referenceIds(List<Event> events, String eventName, String propertyKey) {
        Set<String> ids = new LinkedHashSet<>();
        for (Event event : events) {
            if (!eventName.equals(event.name())) {
                continue;
            }
            Object value = event.properties()
                .get(propertyKey);
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
