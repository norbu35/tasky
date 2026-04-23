package mn.tasky.notification.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dto.AuthUser;
import mn.tasky.common.security.CryptoService;
import mn.tasky.notification.dao.DeviceTokenDao;
import mn.tasky.notification.dao.DistrictDao;
import mn.tasky.notification.dao.NotificationLogDao;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.notification.dto.DeviceToken;
import mn.tasky.notification.dto.District;
import mn.tasky.notification.dto.NotificationLog;
import mn.tasky.notification.provider.NotificationResult;
import mn.tasky.notification.provider.PushNotificationProvider;
import mn.tasky.notification.provider.SmsNotificationProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private DeviceTokenDao deviceTokenDao;

    @Mock
    private NotificationLogDao notificationLogDao;

    @Mock
    private PushNotificationProvider pushProvider;

    @Mock
    private SmsNotificationProvider smsProvider;

    @Mock
    private UserDao userDao;

    @Mock
    private CryptoService cryptoService;

    @Mock
    private TaskerServiceAreaDao serviceAreaDao;

    @Mock
    private DistrictDao districtDao;

    private NotificationService service;

    private final Instant now = Instant.now();

    @BeforeEach
    void setUp() {
        service = new NotificationService(
                deviceTokenDao,
                notificationLogDao,
                pushProvider,
                smsProvider,
                userDao,
                cryptoService,
                serviceAreaDao,
                districtDao);
    }

    private AuthUser makeUser(String id, String phone, String role) {
        return new AuthUser(id, phone, "fb123", role, "ACTIVE", "FACEBOOK", now, now);
    }

    private DeviceToken makeToken(String token, String platform) {
        return new DeviceToken(token, platform, now);
    }

    @Test
    void registerDevice_upsertsToken() {
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", null, "CUSTOMER")));

        service.registerDevice("u1", "token123", "IOS");

        verify(deviceTokenDao).upsert(eq("u1"), eq("token123"), eq("IOS"), any(Instant.class));
    }

    @Test
    void registerDevice_subscribesCustomerToPlatformAllOnly() {
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", null, "CUSTOMER")));

        service.registerDevice("u1", "token123", "IOS");

        verify(pushProvider).subscribeToTopics(eq("token123"), eq(List.of("platform.all")));
    }

    @Test
    void registerDevice_subscribesTaskerToDistrictAndCategoryTopics() {
        AuthUser tasker = makeUser("u1", null, "TASKER");
        when(userDao.findById("u1")).thenReturn(Optional.of(tasker));
        when(serviceAreaDao.findByUserId("u1"))
                .thenReturn(List.of(new District("d1", "Bayangol", "Баянгол", "bayangol")));
        when(districtDao.findAllActiveCategorySlugs()).thenReturn(List.of("cleaning", "plumbing"));

        service.registerDevice("u1", "fcm-token", "ANDROID");

        ArgumentCaptor<List<String>> topicsCaptor = ArgumentCaptor.forClass(List.class);
        verify(pushProvider).subscribeToTopics(eq("fcm-token"), topicsCaptor.capture());

        List<String> topics = topicsCaptor.getValue();
        assertThat(topics).contains("platform.all");
        assertThat(topics).contains("taskers.district.bayangol");
        assertThat(topics).contains("taskers.category.cleaning");
        assertThat(topics).contains("taskers.category.plumbing");
        assertThat(topics).contains("taskers.district.bayangol.cleaning");
        assertThat(topics).contains("taskers.district.bayangol.plumbing");
    }

    @Test
    void registerDevice_noFcmTopics_whenUserNotFound() {
        when(userDao.findById("u1")).thenReturn(Optional.empty());

        service.registerDevice("u1", "token123", "IOS");

        verifyNoInteractions(pushProvider);
    }

    @Test
    void unregisterDevice_deletesToken() {
        service.unregisterDevice("u1", "token123");

        verify(deviceTokenDao).delete("u1", "token123");
    }

    @Test
    void sendPush_delegatesToSendPushWithEventKey() {
        when(notificationLogDao.existsByEventKey(anyString())).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(List.of(makeToken("tok1", "IOS")));
        when(pushProvider.sendPush(anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new NotificationResult(true, "msg1", null));

        service.sendPush("u1", "Title", "Body", "TEST_TYPE");

        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("TEST_TYPE"),
                        eq("PUSH"),
                        eq("SENT"),
                        anyString(),
                        eq("msg1"),
                        eq(null),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_skipsDuplicateEventKey() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(true);

        service.sendPushWithEventKey("u1", "Title", "Body", "TYPE", "ev1");

        verify(deviceTokenDao, never()).findByUserId(anyString());
        verify(pushProvider, never()).sendPush(anyString(), anyString(), anyString(), anyString(), any());
        verify(notificationLogDao, never())
                .insert(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_sendsToAllTokens() {
        DeviceToken iosToken = makeToken("tok-ios", "IOS");
        DeviceToken androidToken = makeToken("tok-android", "ANDROID");
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(List.of(iosToken, androidToken));
        when(pushProvider.sendPush(eq("tok-ios"), anyString(), anyString(), anyString(), any()))
                .thenReturn(new NotificationResult(true, "msg-ios", null));
        when(pushProvider.sendPush(eq("tok-android"), anyString(), anyString(), anyString(), any()))
                .thenReturn(new NotificationResult(true, "msg-android", null));

        service.sendPushWithEventKey("u1", "Title", "Body", "TYPE", "ev1");

        verify(pushProvider).sendPush(eq("tok-ios"), eq("IOS"), eq("Title"), eq("Body"), any());
        verify(pushProvider).sendPush(eq("tok-android"), eq("ANDROID"), eq("Title"), eq("Body"), any());
        verify(notificationLogDao, times(2))
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("TYPE"),
                        eq("PUSH"),
                        eq("SENT"),
                        eq("ev1"),
                        anyString(),
                        any(),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_logsFailedStatus_whenPushFails() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(List.of(makeToken("tok1", "IOS")));
        when(pushProvider.sendPush(anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new NotificationResult(false, null, "DEVICE_UNREGISTERED"));

        service.sendPushWithEventKey("u1", "Title", "Body", "TYPE", "ev1");

        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("TYPE"),
                        eq("PUSH"),
                        eq("FAILED"),
                        eq("ev1"),
                        eq(null),
                        eq("DEVICE_UNREGISTERED"),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_noTokens_criticalType_triggersSmsFallback() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", "enc-phone", "TASKER")));
        when(cryptoService.decrypt("enc-phone")).thenReturn("97612345678");
        when(smsProvider.sendSms(anyString(), anyString())).thenReturn(new NotificationResult(true, "sms-msg1", null));

        service.sendPushWithEventKey("u1", "You're Hired", "A customer hired you", "HIRED", "ev1");

        verify(smsProvider).sendSms(eq("97612345678"), eq("You're Hired: A customer hired you"));
        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("HIRED"),
                        eq("SMS"),
                        eq("SENT"),
                        eq("ev1_SMS_FALLBACK"),
                        eq("sms-msg1"),
                        eq(null),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_noTokens_bookingConfirmed_triggersSmsFallback() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", "enc-phone", "CUSTOMER")));
        when(cryptoService.decrypt("enc-phone")).thenReturn("97699887766");
        when(smsProvider.sendSms(anyString(), anyString())).thenReturn(new NotificationResult(true, "sms-msg1", null));

        service.sendPushWithEventKey(
                "u1", "Booking Confirmed", "Your booking is confirmed", "BOOKING_CONFIRMED", "ev1");

        verify(smsProvider).sendSms(eq("97699887766"), eq("Booking Confirmed: Your booking is confirmed"));
    }

    @Test
    void sendPushWithEventKey_noTokens_nonCriticalType_noSmsFallback() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());

        service.sendPushWithEventKey("u1", "Title", "Body", "REVIEW_PROMPT", "ev1");

        verifyNoInteractions(smsProvider);
        verifyNoInteractions(cryptoService);
    }

    @Test
    void sendPushWithEventKey_noTokens_noPhone_logsFailedSms() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", null, "TASKER")));

        service.sendPushWithEventKey("u1", "Title", "Body", "HIRED", "ev1");

        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("HIRED"),
                        eq("SMS"),
                        eq("FAILED"),
                        eq("ev1_SMS_FALLBACK"),
                        eq(null),
                        eq("NO_PHONE"),
                        any(Instant.class));
        verify(smsProvider, never()).sendSms(anyString(), anyString());
    }

    @Test
    void sendPushWithEventKey_noTokens_emptyPhone_logsFailedSms() {
        AuthUser user = makeUser("u1", "", "TASKER");
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.of(user));

        service.sendPushWithEventKey("u1", "Title", "Body", "HIRED", "ev1");

        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("HIRED"),
                        eq("SMS"),
                        eq("FAILED"),
                        eq("ev1_SMS_FALLBACK"),
                        eq(null),
                        eq("NO_PHONE"),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_smsFallback_skipsDuplicateEventKey() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(true);

        service.sendPushWithEventKey("u1", "Title", "Body", "HIRED", "ev1");

        verify(smsProvider, never()).sendSms(anyString(), anyString());
        verify(userDao, never()).findById(anyString());
    }

    @Test
    void sendPushWithEventKey_smsFallback_userNotFound_logsFailedSms() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.empty());

        service.sendPushWithEventKey("u1", "Title", "Body", "HIRED", "ev1");

        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("HIRED"),
                        eq("SMS"),
                        eq("FAILED"),
                        eq("ev1_SMS_FALLBACK"),
                        eq(null),
                        eq("NO_PHONE"),
                        any(Instant.class));
    }

    @Test
    void sendPushWithEventKey_smsFallback_smsFails_logsFailedStatus() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(Collections.emptyList());
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", "enc-phone", "TASKER")));
        when(cryptoService.decrypt("enc-phone")).thenReturn("97612345678");
        when(smsProvider.sendSms(anyString(), anyString()))
                .thenReturn(new NotificationResult(false, null, "RATE_LIMITED"));

        service.sendPushWithEventKey("u1", "Title", "Body", "HIRED", "ev1");

        verify(notificationLogDao)
                .insert(
                        anyString(),
                        eq("u1"),
                        eq("HIRED"),
                        eq("SMS"),
                        eq("FAILED"),
                        eq("ev1_SMS_FALLBACK"),
                        eq(null),
                        eq("RATE_LIMITED"),
                        any(Instant.class));
    }

    @Test
    void sendPushWithSmsFallback_sendsPushAndSms() {
        when(notificationLogDao.existsByEventKey("ev1")).thenReturn(false);
        when(deviceTokenDao.findByUserId("u1")).thenReturn(List.of(makeToken("tok1", "IOS")));
        when(pushProvider.sendPush(anyString(), anyString(), anyString(), anyString(), any()))
                .thenReturn(new NotificationResult(true, "msg1", null));
        when(notificationLogDao.existsByEventKey("ev1_SMS_FALLBACK")).thenReturn(false);
        when(userDao.findById("u1")).thenReturn(Optional.of(makeUser("u1", "enc-phone", "TASKER")));
        when(cryptoService.decrypt("enc-phone")).thenReturn("97612345678");
        when(smsProvider.sendSms(anyString(), anyString())).thenReturn(new NotificationResult(true, "sms-msg", null));

        service.sendPushWithSmsFallback("u1", "Title", "Body", "TYPE", "ev1");

        verify(pushProvider).sendPush(eq("tok1"), eq("IOS"), eq("Title"), eq("Body"), any());
        verify(smsProvider).sendSms(eq("97612345678"), eq("Title: Body"));
    }

    @Test
    void getLogs_delegatesToDao() {
        List<NotificationLog> expected =
                List.of(new NotificationLog("l1", "u1", "TYPE", "PUSH", "SENT", "ev1", "msg1", null, now));
        when(notificationLogDao.findAll()).thenReturn(expected);

        List<NotificationLog> result = service.getLogs();

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void getLogs_returnsEmpty_whenNoLogs() {
        when(notificationLogDao.findAll()).thenReturn(Collections.emptyList());

        assertThat(service.getLogs()).isEmpty();
    }
}
