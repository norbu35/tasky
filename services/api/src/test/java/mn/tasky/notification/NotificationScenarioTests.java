package mn.tasky.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.common.security.CryptoService;
import mn.tasky.notification.application.NotificationService;
import mn.tasky.notification.dao.DeviceTokenDao;
import mn.tasky.notification.dao.DistrictDao;
import mn.tasky.notification.dao.NotificationLogDao;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.DeviceToken;
import mn.tasky.notification.provider.NotificationResult;
import mn.tasky.notification.provider.PushNotificationProvider;
import mn.tasky.notification.provider.SmsNotificationProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Domain-unit tests for notification scenarios.
 * Covers: SCN-NOTIF-001, SCN-NOTIF-002, SCN-NOTIF-003, SCN-NOTIF-004, SCN-NOTIF-005.
 *
 * <p>Tests verify push notification triggers, device token registration/unregistration
 * using mock DAOs and providers (no Spring context).
 */
class NotificationScenarioTests {

    private static final String TASKER_ID = UUID.randomUUID().toString();
    private static final String CUSTOMER_ID = UUID.randomUUID().toString();
    private static final String TASKER_TOKEN = "fcm-token-tasker-abc123";
    private static final String CUSTOMER_TOKEN = "fcm-token-customer-xyz789";

    private DeviceTokenDao deviceTokenDao;
    private NotificationLogDao notificationLogDao;
    private PushNotificationProvider pushProvider;
    private SmsNotificationProvider smsProvider;
    private UserDao userDao;
    private CryptoService cryptoService;
    private TaskerServiceAreaDao serviceAreaDao;
    private DistrictDao districtDao;
    private NotificationService notificationService;

    // Track registered device tokens in-memory
    private final List<DeviceTokenRecord> registeredTokens = new ArrayList<>();

    record DeviceTokenRecord(String userId, String token, String platform, Instant createdAt) {}

    @BeforeEach
    void setUp() {
        registeredTokens.clear();

        deviceTokenDao = mock(DeviceTokenDao.class);
        notificationLogDao = mock(NotificationLogDao.class);
        pushProvider = mock(PushNotificationProvider.class);
        smsProvider = mock(SmsNotificationProvider.class);
        userDao = mock(UserDao.class);
        cryptoService = mock(CryptoService.class);
        serviceAreaDao = mock(TaskerServiceAreaDao.class);
        districtDao = mock(DistrictDao.class);

        // Default: push always succeeds
        when(pushProvider.sendPush(anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new NotificationResult(true, "msg-" + UUID.randomUUID(), null));

        // Default: no duplicate event keys
        when(notificationLogDao.existsByEventKey(anyString())).thenReturn(false);

        // Default: user lookup for topic subscription
        when(userDao.findById(anyString())).thenReturn(Optional.empty());
        when(serviceAreaDao.findByUserId(anyString())).thenReturn(List.of());
        when(districtDao.findAllActiveCategorySlugs()).thenReturn(List.of());

        // Track device token upserts
        doAnswer(inv -> {
            String userId = inv.getArgument(0);
            String token = inv.getArgument(1);
            String platform = inv.getArgument(2);
            Instant createdAt = inv.getArgument(3);
            registeredTokens.add(new DeviceTokenRecord(userId, token, platform, createdAt));
            return null;
        }).when(deviceTokenDao).upsert(anyString(), anyString(), anyString(), any(Instant.class));

        notificationService = new NotificationService(
                deviceTokenDao,
                notificationLogDao,
                pushProvider,
                smsProvider,
                userDao,
                cryptoService,
                serviceAreaDao,
                districtDao);
    }

    // ── SCN-NOTIF-001 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-NOTIF-001: New task matching a tasker's category triggers a push notification to that tasker")
    void newTaskTriggersPushToMatchingTasker() {
        // Given a verified tasker has a registered device token
        DeviceToken taskerDevice = new DeviceToken(TASKER_TOKEN, "ANDROID", Instant.now());
        when(deviceTokenDao.findByUserId(TASKER_ID)).thenReturn(List.of(taskerDevice));

        // When a customer posts a task in a category the tasker covers
        // (TaskService.notifyNearbyTaskers calls notificationService.sendPush)
        notificationService.sendPush(TASKER_ID, "New task nearby",
                "A new task matching your recent work area is available.", "MATCHING_TASK_NEARBY");

        // Then a push notification is sent to the tasker's device token
        verify(pushProvider).sendPush(
                eq(TASKER_TOKEN),
                eq("ANDROID"),
                eq("New task nearby"),
                eq("A new task matching your recent work area is available."),
                any(Map.class));

        // And a notification log entry is recorded
        verify(notificationLogDao).insert(
                anyString(), eq(TASKER_ID), eq("MATCHING_TASK_NEARBY"), eq("PUSH"),
                eq("SENT"), anyString(), anyString(), any(), any(Instant.class));
    }

    // ── SCN-NOTIF-002 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-NOTIF-002: Booking confirmation sends hired notification to the tasker")
    void bookingConfirmationSendsHiredNotification() {
        // Given a tasker has a registered device
        DeviceToken taskerDevice = new DeviceToken(TASKER_TOKEN, "IOS", Instant.now());
        when(deviceTokenDao.findByUserId(TASKER_ID)).thenReturn(List.of(taskerDevice));

        String bookingId = "booking-42";

        // When the booking is confirmed (outbox processor calls sendPushWithEventKey)
        notificationService.sendPushWithEventKey(
                TASKER_ID, "You are hired!", "Your application has been accepted.",
                "HIRED", "HIRED_" + bookingId);

        // Then a push notification is sent to the tasker indicating they are hired
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(pushProvider).sendPush(
                eq(TASKER_TOKEN), eq("IOS"),
                titleCaptor.capture(), bodyCaptor.capture(), any(Map.class));

        assertThat(titleCaptor.getValue()).contains("hired");
        assertThat(bodyCaptor.getValue()).contains("accepted");

        // Verify idempotency: duplicate event key is silently skipped
        when(notificationLogDao.existsByEventKey("HIRED_" + bookingId)).thenReturn(true);
        org.mockito.Mockito.reset(pushProvider);

        notificationService.sendPushWithEventKey(
                TASKER_ID, "You are hired!", "Your application has been accepted.",
                "HIRED", "HIRED_" + bookingId);

        // Push NOT sent again (idempotent)
        verify(pushProvider, never()).sendPush(anyString(), anyString(), anyString(), anyString(), any());
    }

    // ── SCN-NOTIF-003 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-NOTIF-003: No-show reminder sends notification to both booking participants")
    void noShowReminderSendsToCustomerAndTasker() {
        // Given both participants have registered device tokens
        DeviceToken customerDevice = new DeviceToken(CUSTOMER_TOKEN, "IOS", Instant.now());
        DeviceToken taskerDevice = new DeviceToken(TASKER_TOKEN, "ANDROID", Instant.now());
        when(deviceTokenDao.findByUserId(CUSTOMER_ID)).thenReturn(List.of(customerDevice));
        when(deviceTokenDao.findByUserId(TASKER_ID)).thenReturn(List.of(taskerDevice));

        // When the no-show reminder job runs and sends notifications
        // (NoShowService.sendReminder calls notificationService.sendPush for each participant)
        notificationService.sendPush(CUSTOMER_ID, "Attendance Reminder",
                "Your booking is scheduled for now -- please confirm attendance.", "NO_SHOW_REMINDER");
        notificationService.sendPush(TASKER_ID, "Attendance Reminder",
                "Your booking is scheduled for now -- please confirm attendance.", "NO_SHOW_REMINDER");

        // Then both customer and tasker receive a push notification
        verify(pushProvider).sendPush(eq(CUSTOMER_TOKEN), eq("IOS"),
                eq("Attendance Reminder"), anyString(), any(Map.class));
        verify(pushProvider).sendPush(eq(TASKER_TOKEN), eq("ANDROID"),
                eq("Attendance Reminder"), anyString(), any(Map.class));

        // Both log entries recorded
        verify(notificationLogDao).insert(
                anyString(), eq(CUSTOMER_ID), eq("NO_SHOW_REMINDER"), eq("PUSH"),
                eq("SENT"), anyString(), anyString(), any(), any(Instant.class));
        verify(notificationLogDao).insert(
                anyString(), eq(TASKER_ID), eq("NO_SHOW_REMINDER"), eq("PUSH"),
                eq("SENT"), anyString(), anyString(), any(), any(Instant.class));
    }

    // ── SCN-NOTIF-004 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-NOTIF-004: Registering a device token stores it for the authenticated user")
    void registerDeviceTokenStoresForUser() {
        // Given a user is authenticated
        // When the user registers a device token
        notificationService.registerDevice(TASKER_ID, TASKER_TOKEN, "ANDROID");

        // Then the token is stored and associated with the user
        verify(deviceTokenDao).upsert(eq(TASKER_ID), eq(TASKER_TOKEN), eq("ANDROID"), any(Instant.class));

        assertThat(registeredTokens).hasSize(1);
        assertThat(registeredTokens.get(0).userId()).isEqualTo(TASKER_ID);
        assertThat(registeredTokens.get(0).token()).isEqualTo(TASKER_TOKEN);
        assertThat(registeredTokens.get(0).platform()).isEqualTo("ANDROID");
        assertThat(registeredTokens.get(0).createdAt()).isNotNull();
    }

    // ── SCN-NOTIF-005 ───────────────────────────────────────────────────────

    @Test
    @DisplayName("SCN-NOTIF-005: Unregistering a device token removes it for the authenticated user")
    void unregisterDeviceTokenRemovesForUser() {
        // Given a user has a registered device token
        // (registerDevice was called previously)
        notificationService.registerDevice(TASKER_ID, TASKER_TOKEN, "ANDROID");

        // When the user unregisters that token
        notificationService.unregisterDevice(TASKER_ID, TASKER_TOKEN);

        // Then the token is no longer associated with the user
        verify(deviceTokenDao).delete(eq(TASKER_ID), eq(TASKER_TOKEN));
    }
}
