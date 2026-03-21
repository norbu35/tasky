package mn.tasky.common.config;

import javax.sql.DataSource;
import mn.tasky.analytics.dao.AnalyticsEventDao;
import mn.tasky.auth.dao.BadgeDao;
import mn.tasky.auth.dao.ModerationPolicyDao;
import mn.tasky.auth.dao.OtpChallengeDao;
import mn.tasky.auth.dao.ProfileDao;
import mn.tasky.auth.dao.RateLimitCounterDao;
import mn.tasky.auth.dao.RefreshSessionDao;
import mn.tasky.auth.dao.ReliabilityScoreDao;
import mn.tasky.auth.dao.StrikeDao;
import mn.tasky.auth.dao.SuspensionEventDao;
import mn.tasky.auth.dao.UserDao;
import mn.tasky.auth.dao.VerificationDao;
import mn.tasky.booking.dao.BookingCompletionSignalDao;
import mn.tasky.booking.dao.BookingDao;
import mn.tasky.booking.dao.BookingReliabilityIncidentDao;
import mn.tasky.booking.dao.BookingScheduleEventDao;
import mn.tasky.booking.dao.BookingTimelineEventDao;
import mn.tasky.category.dao.CategoryDao;
import mn.tasky.category.dao.CategorySchemaVersionDao;
import mn.tasky.common.audit.AuditEventDao;
import mn.tasky.common.feature.FeatureToggleDao;
import mn.tasky.common.idempotency.IdempotencyDao;
import mn.tasky.common.outbox.OutboxEventDao;
import mn.tasky.dispute.dao.DisputeDao;
import mn.tasky.dispute.dao.DisputeEvidenceDao;
import mn.tasky.messaging.dao.ConversationDao;
import mn.tasky.messaging.dao.MessageDao;
import mn.tasky.notification.dao.DeviceTokenDao;
import mn.tasky.notification.dao.DistrictDao;
import mn.tasky.notification.dao.NotificationLogDao;
import mn.tasky.notification.dao.TaskerServiceAreaDao;
import mn.tasky.payment.dao.PaymentIntentDao;
import mn.tasky.review.dao.ReviewDao;
import mn.tasky.review.dao.ReviewEnforcementCaseDao;
import mn.tasky.task.dao.TaskApplicationDao;
import mn.tasky.task.dao.TaskDao;
import mn.tasky.task.dao.TaskDraftDao;
import mn.tasky.task.dao.TaskPhotoDao;
import mn.tasky.task.dao.TaskRescueEventDao;
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

@Configuration
public class JdbiConfig {

    @Bean
    public Jdbi jdbi(DataSource dataSource) {
        Jdbi jdbi = Jdbi.create(dataSource);
        jdbi.installPlugin(new SqlObjectPlugin());
        jdbi.installPlugin(new PostgresPlugin());
        jdbi.installPlugin(new Jackson2Plugin());
        jdbi.getConfig(ColumnMappers.class).setCoalesceNullPrimitivesToDefaults(true);
        jdbi.getConfig(ReflectionMappers.class).setStrictMatching(false);
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
    public AuditEventDao auditEventDao(Jdbi jdbi) {
        return jdbi.onDemand(AuditEventDao.class);
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

    @Bean
    public ReliabilityScoreDao reliabilityScoreDao(Jdbi jdbi) {
        return jdbi.onDemand(ReliabilityScoreDao.class);
    }

    @Bean
    public BadgeDao badgeDao(Jdbi jdbi) {
        return jdbi.onDemand(BadgeDao.class);
    }

    // Category DAOs
    @Bean
    public CategoryDao categoryDao(Jdbi jdbi) {
        return jdbi.onDemand(CategoryDao.class);
    }

    @Bean
    public CategorySchemaVersionDao categorySchemaVersionDao(Jdbi jdbi) {
        return jdbi.onDemand(CategorySchemaVersionDao.class);
    }

    // Task DAOs
    @Bean
    public TaskDao taskDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskDao.class);
    }

    @Bean
    public TaskDraftDao taskDraftDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskDraftDao.class);
    }

    @Bean
    public TaskPhotoDao taskPhotoDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskPhotoDao.class);
    }

    @Bean
    public TaskApplicationDao taskApplicationDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskApplicationDao.class);
    }

    @Bean
    public TaskRescueEventDao taskRescueEventDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskRescueEventDao.class);
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

    @Bean
    public BookingScheduleEventDao bookingScheduleEventDao(Jdbi jdbi) {
        return jdbi.onDemand(BookingScheduleEventDao.class);
    }

    @Bean
    public BookingTimelineEventDao bookingTimelineEventDao(Jdbi jdbi) {
        return jdbi.onDemand(BookingTimelineEventDao.class);
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

    @Bean
    public DistrictDao districtDao(Jdbi jdbi) {
        return jdbi.onDemand(DistrictDao.class);
    }

    @Bean
    public TaskerServiceAreaDao taskerServiceAreaDao(Jdbi jdbi) {
        return jdbi.onDemand(TaskerServiceAreaDao.class);
    }

    // Dispute DAOs
    @Bean
    public DisputeDao disputeDao(Jdbi jdbi) {
        return jdbi.onDemand(DisputeDao.class);
    }

    @Bean
    public DisputeEvidenceDao disputeEvidenceDao(Jdbi jdbi) {
        return jdbi.onDemand(DisputeEvidenceDao.class);
    }

    // Review DAOs
    @Bean
    public ReviewDao reviewDao(Jdbi jdbi) {
        return jdbi.onDemand(ReviewDao.class);
    }

    @Bean
    public ReviewEnforcementCaseDao reviewEnforcementCaseDao(Jdbi jdbi) {
        return jdbi.onDemand(ReviewEnforcementCaseDao.class);
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

    // Feature toggle DAO
    @Bean
    public FeatureToggleDao featureToggleDao(Jdbi jdbi) {
        return jdbi.onDemand(FeatureToggleDao.class);
    }
}
