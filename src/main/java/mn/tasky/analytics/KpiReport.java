package mn.tasky.analytics;

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
