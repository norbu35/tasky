package mn.tasky.analytics.domain;

public record KpiReport(
        int taskPostedCount,
        int paidTaskCount,
        int paidBookingCount,
        int completedBookingCount,
        int disputedBookingCount,
        double conversionRate,
        double fulfillmentRate,
        double disputeRate
) {

}
