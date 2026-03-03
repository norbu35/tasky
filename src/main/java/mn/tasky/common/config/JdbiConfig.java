package mn.tasky.common.config;

import mn.tasky.analytics.dao.AnalyticsEventDao;
import mn.tasky.auth.dao.*;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.common.idempotency.IdempotencyDao;
import mn.tasky.common.outbox.OutboxEventDao;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.notification.dao.DeviceTokenDao;
import mn.tasky.notification.dao.NotificationLogDao;
import mn.tasky.payment.dao.PaymentIntentDao;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.wallet.dao.CreditedBookingDao;
import mn.tasky.wallet.dao.LedgerEntryDao;
import mn.tasky.wallet.dao.PayoutRequestDao;
import mn.tasky.wallet.dao.WalletDao;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.ColumnMappers;
import org.jdbi.v3.core.mapper.reflect.ReflectionMappers;
import org.jdbi.v3.jackson2.Jackson2Plugin;
import org.jdbi.v3.postgres.PostgresPlugin;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class JdbiConfig {

    @Bean
    public Jdbi jdbi(DataSource dataSource) {
        Jdbi jdbi = Jdbi.create(dataSource);
        jdbi.installPlugin(new SqlObjectPlugin());
        jdbi.installPlugin(new PostgresPlugin());
        jdbi.installPlugin(new Jackson2Plugin());
        jdbi.getConfig(ColumnMappers.class)
            .setCoalesceNullPrimitivesToDefaults(true);
        jdbi.getConfig(ReflectionMappers.class)
            .setStrictMatching(false);
        return jdbi;
    }

    // Auth DAOs
    @Bean
    public UserDao userDao(Jdbi jdbi) {
        return jdbi.onDemand(UserDao.class);
    }

    @Bean
    public ProfileDao profileDao(Jdbi jdbi) {
        return jdbi.onDemand(ProfileDao.class);
    }

    @Bean
    public OtpChallengeDao otpChallengeDao(Jdbi jdbi) {
        return jdbi.onDemand(OtpChallengeDao.class);
    }

    @Bean
    public RefreshSessionDao refreshSessionDao(Jdbi jdbi) {
        return jdbi.onDemand(RefreshSessionDao.class);
    }

    @Bean
    public RateLimitCounterDao rateLimitCounterDao(Jdbi jdbi) {
        return jdbi.onDemand(RateLimitCounterDao.class);
    }

    @Bean
    public VerificationDao verificationDao(Jdbi jdbi) {
        return jdbi.onDemand(VerificationDao.class);
    }

    @Bean
    public AuditLogDao auditLogDao(Jdbi jdbi) {
        return jdbi.onDemand(AuditLogDao.class);
    }

    @Bean
    public StrikeDao strikeDao(Jdbi jdbi) {
        return jdbi.onDemand(StrikeDao.class);
    }

    @Bean
    public ModerationPolicyDao moderationPolicyDao(Jdbi jdbi) {
        return jdbi.onDemand(ModerationPolicyDao.class);
    }

    @Bean
    public SuspensionEventDao suspensionEventDao(Jdbi jdbi) {
        return jdbi.onDemand(SuspensionEventDao.class);
    }

    // Category DAO
    @Bean
    public CategoryDao categoryDao(Jdbi jdbi) {
        return jdbi.onDemand(CategoryDao.class);
    }

    // Task DAOs
    @Bean
    public TaskDao taskDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskDao.class);
    }

    @Bean
    public TaskPhotoDao taskPhotoDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskPhotoDao.class);
    }

    @Bean
    public TaskApplicationDao taskApplicationDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskApplicationDao.class);
    }

    // Booking DAO
    @Bean
    public BookingDao bookingDao(Jdbi jdbi) {
        return jdbi.onDemand(BookingDao.class);
    }

    @Bean
    public BookingCompletionSignalDao bookingCompletionSignalDao(Jdbi jdbi) {
        return jdbi.onDemand(BookingCompletionSignalDao.class);
    }

    @Bean
    public BookingReliabilityIncidentDao bookingReliabilityIncidentDao(Jdbi jdbi) {
        return jdbi.onDemand(BookingReliabilityIncidentDao.class);
    }

    // Wallet DAOs
    @Bean
    public WalletDao walletDao(Jdbi jdbi) {
        return jdbi.onDemand(WalletDao.class);
    }

    @Bean
    public LedgerEntryDao ledgerEntryDao(Jdbi jdbi) {
        return jdbi.onDemand(LedgerEntryDao.class);
    }

    @Bean
    public PayoutRequestDao payoutRequestDao(Jdbi jdbi) {
        return jdbi.onDemand(PayoutRequestDao.class);
    }

    @Bean
    public CreditedBookingDao creditedBookingDao(Jdbi jdbi) {
        return jdbi.onDemand(CreditedBookingDao.class);
    }

    // Messaging DAOs
    @Bean
    public ConversationDao conversationDao(Jdbi jdbi) {
        return jdbi.onDemand(ConversationDao.class);
    }

    @Bean
    public MessageDao messageDao(Jdbi jdbi) {
        return jdbi.onDemand(MessageDao.class);
    }

    // Notification DAOs
    @Bean
    public DeviceTokenDao deviceTokenDao(Jdbi jdbi) {
        return jdbi.onDemand(DeviceTokenDao.class);
    }

    @Bean
    public NotificationLogDao notificationLogDao(Jdbi jdbi) {
        return jdbi.onDemand(NotificationLogDao.class);
    }

    // Dispute DAO
    @Bean
    public DisputeDao disputeDao(Jdbi jdbi) {
        return jdbi.onDemand(DisputeDao.class);
    }

    // Review DAO
    @Bean
    public ReviewDao reviewDao(Jdbi jdbi) {
        return jdbi.onDemand(ReviewDao.class);
    }

    // Analytics DAO
    @Bean
    public AnalyticsEventDao analyticsEventDao(Jdbi jdbi) {
        return jdbi.onDemand(AnalyticsEventDao.class);
    }

    // Payment DAO
    @Bean
    public PaymentIntentDao paymentIntentDao(Jdbi jdbi) {
        return jdbi.onDemand(PaymentIntentDao.class);
    }

    // Idempotency DAO
    @Bean
    public IdempotencyDao idempotencyDao(Jdbi jdbi) {
        return jdbi.onDemand(IdempotencyDao.class);
    }

    @Bean
    public OutboxEventDao outboxEventDao(Jdbi jdbi) {
        return jdbi.onDemand(OutboxEventDao.class);
    }
}
