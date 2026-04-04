import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ClipboardList,
  Menu,
  Search,
  CalendarDays,
} from 'lucide-react-native';
import { useBookings } from '../../../features/bookings/hooks/useBookings';
import { elevations } from '../../../design/elevations';
import { mobileTheme } from '../../../design/tokenAdapter';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { PriceTag } from '../../../components/ui/PriceTag';
import { ScreenContainer } from '../../../components/shells';

const { colors, spacing, typography, radius } = mobileTheme;

type BookingTab = 'active' | 'completed';

const TAB_LABELS: { id: BookingTab; label: string }[] = [
  { id: 'active', label: 'Идэвхтэй' },
  { id: 'completed', label: 'Дууссан' },
];

function formatSchedule(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}`;
}

function getBookingStatusLabel(status?: string): string {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return 'Хувиарласан';
    case 'COMPLETED':
      return 'Дууссан';
    case 'CANCELLED':
      return 'Цуцлагдсан';
    case 'NO_SHOW':
      return 'Ирээгүй';
    default:
      return 'Хүлээгдэж буй';
  }
}

function getBookingStatusStyles(status?: string) {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return {
        backgroundColor: colors.statusAssigned,
        color: colors.statusAssignedForeground,
      };
    case 'COMPLETED':
      return {
        backgroundColor: colors.verified,
        color: colors.verifiedForeground,
      };
    case 'CANCELLED':
      return {
        backgroundColor: colors.muted,
        color: colors.textSecondary,
      };
    case 'NO_SHOW':
      return {
        backgroundColor: colors.danger,
        color: colors.dangerForeground,
      };
    default:
      return {
        backgroundColor: colors.secondary,
        color: colors.secondaryForeground,
      };
  }
}

function isActiveStatus(status?: string): boolean {
  return (status ?? '').toUpperCase() === 'ASSIGNED';
}

function isCompletedStatus(status?: string): boolean {
  const upper = (status ?? '').toUpperCase();
  return upper === 'COMPLETED' || upper === 'CANCELLED' || upper === 'NO_SHOW';
}

function FilterTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.filterTab}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.filterTabLabel, active && styles.filterTabLabelActive]}>{label}</Text>
      {active ? <View style={styles.filterTabIndicator} /> : null}
    </Pressable>
  );
}

function BookingCard({
  booking,
  onPress,
}: {
  booking: {
    id: string;
    status?: string;
    task?: { description?: string | null; budget?: number | null; scheduled_at?: string | null };
    tasker?: { full_name?: string | null; avatar_url?: string | null };
  };
  onPress: () => void;
}) {
  const schedule = formatSchedule(booking.task?.scheduled_at);
  const statusStyle = getBookingStatusStyles(booking.status);

  return (
    <Pressable onPress={onPress} style={styles.card} testID={`booking-card-${booking.id}`}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardIdentity}>
          <ProfileAvatar
            uri={booking.tasker?.avatar_url}
            name={booking.tasker?.full_name ?? 'Tasker'}
            size="md"
            showVerified
          />
          <View style={styles.cardIdentityCopy}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {booking.tasker?.full_name ?? 'Гүйцэтгэгч'}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {booking.task?.description ?? 'Даалгавар'}
            </Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusPillText, { color: statusStyle.color }]}>
            {getBookingStatusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBottomRow}>
        <View style={styles.scheduleRow}>
          <CalendarDays size={14} color={colors.textSecondary} />
          <Text style={styles.scheduleText}>{schedule ?? '—'}</Text>
        </View>
        <PriceTag amount={booking.task?.budget ?? 0} size="sm" />
      </View>
    </Pressable>
  );
}

function LoadingSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonTopRow}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonTitleBlock}>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineShort} />
        </View>
        <View style={styles.skeletonChip} />
      </View>
      <View style={styles.skeletonDivider} />
      <View style={styles.skeletonBottomRow}>
        <View style={styles.skeletonLineSchedule} />
        <View style={styles.skeletonPrice} />
      </View>
    </View>
  );
}

function EmptyState({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <ClipboardList size={28} color={colors.secondary} />
      </View>
      <Text style={styles.emptyTitle}>
        {t('customer.bookings.emptyTitle', 'Захиалга байхгүй байна')}
      </Text>
      <Text style={styles.emptyDescription}>
        {t('customer.bookings.emptyDescription', 'Даалгавар нийтэлж, гүйцэтгэгч сонгоорой')}
      </Text>
      <Pressable onPress={onPress} style={styles.emptyButton} testID="bookings-empty-cta">
        <Text style={styles.emptyButtonText}>
          {t('customer.bookings.emptyCta', 'Даалгавар нийтлэх')}
        </Text>
      </Pressable>
    </View>
  );
}

export default function BookingsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBookings();
  const [activeTab, setActiveTab] = React.useState<BookingTab>('active');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const bookings = data?.data ?? [];
  const filteredBookings = bookings.filter((booking) =>
    activeTab === 'active' ? isActiveStatus(booking.status) : isCompletedStatus(booking.status),
  );

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleBookingPress = React.useCallback(
    (bookingId: string) => {
      router.push(`/(customer)/bookings/${bookingId}`);
    },
    [router],
  );

  const handlePostTask = React.useCallback(() => {
    router.push('/(customer)/tasks/new');
  }, [router]);

  const showEmptyState = !isLoading && bookings.length === 0;
  const showList = !isLoading && bookings.length > 0;
  const showOfflineBanner = isError && bookings.length > 0;

  return (
    <ScreenContainer testID="bookings-list-screen">
      <View style={styles.shell}>
        <View style={styles.header}>
          <Pressable style={styles.headerIconButton} accessibilityRole="button">
            <Menu size={22} color={colors.primaryDeep} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('customer.bookings.pageTitle', 'Захиалгууд')}</Text>
          <Pressable style={styles.headerIconButton} accessibilityRole="button">
            <Search size={20} color={colors.primaryDeep} />
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          {TAB_LABELS.map((tab) => (
            <FilterTab
              key={tab.id}
              label={t(`customer.bookings.tab.${tab.id}`, tab.label)}
              active={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            showList && styles.scrollContentWithList,
            showEmptyState && styles.scrollContentWithEmpty,
          ]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {showOfflineBanner ? (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                {t(
                  'customer.bookings.offlineBanner',
                  'Офлайн горим — хуучин мэдээлэл харагдаж байна',
                )}
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <LoadingSkeletonCard key={index} />
              ))}
            </View>
          ) : showEmptyState ? (
            <EmptyState onPress={handlePostTask} />
          ) : (
            <View style={styles.cardList}>
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => handleBookingPress(booking.id)}
                />
              ))}
              {filteredBookings.length === 0 ? (
                <View style={styles.tabEmptyState}>
                  <Text style={styles.tabEmptyTitle}>
                    {activeTab === 'active'
                      ? t('customer.bookings.emptyTitle', 'Захиалга байхгүй байна')
                      : t(
                          'customer.bookings.completedEmptyTitle',
                          'Энэ ангилалд захиалга алга байна',
                        )}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterTab: {
    paddingBottom: spacing.xs,
    alignItems: 'flex-start',
  },
  filterTabLabel: {
    fontSize: typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTabLabelActive: {
    color: colors.primaryDeep,
  },
  filterTabIndicator: {
    marginTop: spacing.xs,
    width: 48,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  scrollContentWithList: {
    gap: spacing.lg,
  },
  scrollContentWithEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  offlineBanner: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineBannerText: {
    fontSize: typography.label,
    color: colors.textSecondary,
  },
  cardList: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevations.soft,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  cardIdentityCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primaryDeep,
  },
  cardSubtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusPillText: {
    fontSize: typography.micro,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  scheduleText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  emptyTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.primaryDeep,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.5,
  },
  emptyButton: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.secondaryForeground,
  },
  skeletonList: {
    gap: spacing.md,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevations.soft,
  },
  skeletonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  skeletonTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  skeletonLineLong: {
    height: 12,
    width: '72%',
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
  },
  skeletonLineShort: {
    height: 10,
    width: '48%',
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
  },
  skeletonChip: {
    width: 72,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.4,
  },
  skeletonBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonLineSchedule: {
    height: 10,
    width: '42%',
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
  },
  skeletonPrice: {
    height: 16,
    width: 72,
    borderRadius: radius.xs,
    backgroundColor: colors.muted,
  },
  tabEmptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  tabEmptyTitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
