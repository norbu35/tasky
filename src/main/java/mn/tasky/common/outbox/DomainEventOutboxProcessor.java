package mn.tasky.common.outbox;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import mn.tasky.analytics.application.AnalyticsService;
import mn.tasky.messaging.application.MessagingService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.wallet.application.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DomainEventOutboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(DomainEventOutboxProcessor.class);
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final OutboxEventDao outboxEventDao;
    private final ObjectMapper objectMapper;
    private final MessagingService messagingService;
    private final NotificationService notificationService;
    private final AnalyticsService analyticsService;
    private final WalletService walletService;
    private final int batchSize;
    private final long retryDelaySeconds;
    private final long processingLeaseSeconds;
    private final double platformFeePercent;

    public DomainEventOutboxProcessor(OutboxEventDao outboxEventDao,
                                      ObjectMapper objectMapper,
                                      MessagingService messagingService,
                                      NotificationService notificationService,
                                      AnalyticsService analyticsService,
                                      WalletService walletService,
                                      @Value("${tasky.outbox.processor.batch-size:25}") int batchSize,
                                      @Value("${tasky.outbox.processor.retry-delay-seconds:15}") long retryDelaySeconds,
                                      @Value("${tasky.outbox.processor.processing-lease-seconds:60}")
                                      long processingLeaseSeconds,
                                      @Value("${tasky.wallet.platform-fee-percent:0.15}") double platformFeePercent) {
        this.outboxEventDao = outboxEventDao;
        this.objectMapper = objectMapper;
        this.messagingService = messagingService;
        this.notificationService = notificationService;
        this.analyticsService = analyticsService;
        this.walletService = walletService;
        this.batchSize = batchSize;
        this.retryDelaySeconds = retryDelaySeconds;
        this.processingLeaseSeconds = processingLeaseSeconds;
        this.platformFeePercent = platformFeePercent;
    }

    @Scheduled(fixedDelayString = "${tasky.outbox.processor.poll-interval-ms:1000}")
    public void processBatch() {
        Instant now = Instant.now();
        List<OutboxEvent> events = outboxEventDao.claimBatch(
            now,
            now.plusSeconds(processingLeaseSeconds),
            batchSize
        );
        for (OutboxEvent event : events) {
            try {
                dispatch(event);
                outboxEventDao.markProcessed(event.id(),
                    Instant.now());
            } catch (RuntimeException exception) {
                String error = exception.getMessage() == null
                    ? exception.getClass()
                    .getSimpleName()
                    : exception.getMessage();
                if (error.length() > 1024) {
                    error = error.substring(0,
                        1024);
                }
                outboxEventDao.markFailed(event.id(),
                    Instant.now()
                        .plusSeconds(retryDelaySeconds),
                    error);
                log.warn("Outbox event processing failed: id={} type={} error={}",
                    event.id(),
                    event.eventType(),
                    error);
            }
        }
    }

    private void dispatch(OutboxEvent event) {
        Map<String, Object> payload = parsePayload(event.payload());
        switch (event.eventType()) {
            case OutboxEventTypes.TASK_APPLICATION_ACCEPTED -> handleTaskApplicationAccepted(payload);
            case OutboxEventTypes.PAYMENT_CONFIRMED -> handlePaymentConfirmed(payload);
            case OutboxEventTypes.BOOKING_COMPLETED -> handleBookingCompleted(payload);
            default -> throw new IllegalArgumentException("Unsupported outbox event type: " +
                event.eventType());
        }
    }

    private Map<String, Object> parsePayload(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson,
                MAP_TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Failed to parse outbox event payload.",
                exception);
        }
    }

    private void handleTaskApplicationAccepted(Map<String, Object> payload) {
        String taskId = requiredString(payload,
            "task_id");
        String bookingId = requiredString(payload,
            "booking_id");
        String customerId = requiredString(payload,
            "customer_id");
        String taskerId = requiredString(payload,
            "tasker_id");
        String applicationId = requiredString(payload,
            "application_id");

        String conversationId = messagingService.startConversation(taskId,
            taskerId,
            customerId);
        notificationService.sendPush(taskerId,
            "You are hired!",
            "Your application has been accepted.",
            "HIRED");

        analyticsService.track(
            AnalyticsService.EVENT_TASKER_ACCEPTED,
            customerId,
            withObservability(
                payload,
                Map.of(
                    AnalyticsService.PROPERTY_TASK_ID,
                    taskId,
                    AnalyticsService.PROPERTY_BOOKING_ID,
                    bookingId,
                    "tasker_id",
                    taskerId,
                    "application_id",
                    applicationId,
                    "conversation_id",
                    conversationId
                )
            )
        );
        analyticsService.track(
            AnalyticsService.EVENT_BOOKING_CONFIRMED,
            customerId,
            withObservability(
                payload,
                Map.of(
                    AnalyticsService.PROPERTY_TASK_ID,
                    taskId,
                    AnalyticsService.PROPERTY_BOOKING_ID,
                    bookingId,
                    "tasker_id",
                    taskerId,
                    "application_id",
                    applicationId
                )
            )
        );
    }

    private void handlePaymentConfirmed(Map<String, Object> payload) {
        String paymentId = requiredString(payload,
            "payment_id");
        String bookingId = requiredString(payload,
            "booking_id");
        String taskId = requiredString(payload,
            "task_id");
        String customerId = requiredString(payload,
            "customer_id");
        String taskerId = requiredString(payload,
            "tasker_id");

        notificationService.sendPush(taskerId,
            "Booking Confirmed",
            "Payment received for booking #" + bookingId,
            "BOOKING_CONFIRMED");
        notificationService.sendPush(customerId,
            "Booking Confirmed",
            "Your payment for booking #" + bookingId + " was successful.",
            "BOOKING_CONFIRMED");
        analyticsService.track(
            AnalyticsService.EVENT_PAYMENT_CONFIRMED,
            customerId,
            withObservability(
                payload,
                Map.of(
                    AnalyticsService.PROPERTY_BOOKING_ID,
                    bookingId,
                    AnalyticsService.PROPERTY_TASK_ID,
                    taskId,
                    "payment_id",
                    paymentId
                )
            )
        );
    }

    private void handleBookingCompleted(Map<String, Object> payload) {
        String bookingId = requiredString(payload,
            "booking_id");
        String taskId = requiredString(payload,
            "task_id");
        String customerId = requiredString(payload,
            "customer_id");
        String taskerId = requiredString(payload,
            "tasker_id");
        int price = requiredInt(payload
        );

        walletService.creditTaskCompletion(taskerId,
            bookingId,
            price,
            platformFeePercent);
        notificationService.sendPush(taskerId,
            "Job Complete",
            "The customer has marked the job as complete.",
            "JOB_COMPLETED");
        analyticsService.track(
            AnalyticsService.EVENT_BOOKING_COMPLETED,
            customerId,
            withObservability(
                payload,
                Map.of(
                    AnalyticsService.PROPERTY_BOOKING_ID,
                    bookingId,
                    AnalyticsService.PROPERTY_TASK_ID,
                    taskId,
                    "tasker_id",
                    taskerId
                )
            )
        );
    }

    private String requiredString(Map<String, Object> payload,
                                  String key) {
        Object value = payload.get(key);
        if (value == null) {
            throw new IllegalArgumentException("Missing payload field: " + key);
        }
        return value.toString();
    }

    private int requiredInt(Map<String, Object> payload) {
        Object value = payload.get("price");
        if (value == null) {
            throw new IllegalArgumentException("Missing payload field: " + "price");
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Payload field is not an integer: " + "price",
                exception);
        }
    }

    private Map<String, Object> withObservability(Map<String, Object> payload,
                                                  Map<String, Object> base) {
        Map<String, Object> enriched = new LinkedHashMap<>(base);
        copyIfPresent(payload,
            enriched,
            AnalyticsService.PROPERTY_CORRELATION_ID);
        copyIfPresent(payload,
            enriched,
            AnalyticsService.PROPERTY_LOCALE);
        copyIfPresent(payload,
            enriched,
            AnalyticsService.PROPERTY_PLATFORM);
        return enriched;
    }

    private void copyIfPresent(Map<String, Object> source,
                               Map<String, Object> target,
                               String key) {
        Object value = source.get(key);
        if (value != null) {
            target.putIfAbsent(key,
                value);
        }
    }
}
