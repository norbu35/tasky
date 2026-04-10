import React from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Menu, Search, CalendarDays } from 'lucide-react-native';
import { useBookings } from '../../../features/bookings/hooks/useBookings';
import { elevations } from '../../../design/elevations';
import { mobileTheme } from '../../../design/tokenAdapter';
import { screenLayout } from '../../../design/screenLayout';
import { ProfileAvatar } from '../../../components/ui/ProfileAvatar';
import { PriceTag } from '../../../components/ui/PriceTag';
import { InsetScrollView, ScreenContainer } from '../../../components/shells';

const { colors } = mobileTheme;

type BookingTab = 'active' | 'completed';

const TAB_IDS: BookingTab[] = ['active', 'completed'];

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

function getBookingStatusLabel(status: string | undefined, t: (key: string) => string): string {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return t('BookingsListScreen.assigned');
    case 'COMPLETED':
      return t('BookingsListScreen.completed');
    case 'CANCELLED':
      return t('BookingsListScreen.cancelled');
    case 'NO_SHOW':
      return t('BookingsListScreen.noShow');
    default:
      return t('BookingsListScreen.pending');
  }
}

function getBookingStatusColors(status?: string): { bg: string; text: string } {
  switch ((status ?? '').toUpperCase()) {
    case 'ASSIGNED':
      return { bg: colors.statusAssigned, text: colors.statusAssignedForeground };
    case 'COMPLETED':
      return { bg: colors.verified, text: colors.verifiedForeground };
    case 'CANCELLED':
      return { bg: colors.muted, text: colors.textSecondary };
    case 'NO_SHOW':
      return { bg: colors.danger, text: colors.dangerForeground };
    default:
      return { bg: colors.secondary, text: colors.secondaryForeground };
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
      className="pb-xs items-start"
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-label font-semibold${active ? ' text-primary-deep' : ' text-text-secondary'}`}
      >
        {label}
      </Text>
      {active ? <View className="mt-xs w-12 h-1 rounded-full bg-primary-deep" /> : null}
    </Pressable>
  );
}

function BookingCard({
  booking,
  t,
  onPress,
}: {
  booking: {
    id: string;
    status?: string;
    task?: { description?: string | null; budget?: number | null; scheduled_at?: string | null };
    tasker?: { full_name?: string | null; avatar_url?: string | null };
  };
  t: (key: string) => string;
  onPress: () => void;
}) {
  const schedule = formatSchedule(booking.task?.scheduled_at);
  const statusColors = getBookingStatusColors(booking.status);

  return (
    <Pressable
      onPress={onPress}
      className="bg-card rounded-lg p-card gap-item"
      style={elevations.soft}
      testID={`booking-card-${booking.id}`}
    >
      <View
        className="flex-row items-start justify-between gap-item"
      >
        <View className="flex-row items-center flex-1 gap-item">
          <ProfileAvatar
            uri={booking.tasker?.avatar_url}
            name={booking.tasker?.full_name ?? t('BookingsListScreen.taskerFallback')}
            size="md"
            showVerified
          />
          <View className="flex-1 gap-[2px]">
            <Text className="text-body font-bold text-primary-deep" numberOfLines={1}>
              {booking.tasker?.full_name ?? t('BookingsListScreen.taskerFallback')}
            </Text>
            <Text className="text-caption text-text-secondary" numberOfLines={1}>
              {booking.task?.description ?? t('BookingsListScreen.taskFallback')}
            </Text>
          </View>
        </View>

        {/* statusPill: runtime colors → imperative */}
        <View
          className="self-start rounded-full px-md py-xs"
          style={{ backgroundColor: statusColors.bg }}
        >
          <Text
            className="text-micro font-bold uppercase tracking-[0.6px]"
            style={{ color: statusColors.text }}
          >
            {getBookingStatusLabel(booking.status, t)}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-border opacity-40" />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-xs flex-1">
          <CalendarDays size={14} color={colors.textSecondary} />
          <Text className="text-caption text-text-secondary flex-1">{schedule ?? '—'}</Text>
        </View>
        <PriceTag amount={booking.task?.budget ?? 0} size="sm" />
      </View>
    </Pressable>
  );
}

function LoadingSkeletonCard() {
  return (
    <View className="bg-card rounded-lg p-lg gap-md" style={elevations.soft}>
      <View className="flex-row items-center gap-md">
        <View className="w-10 h-10 rounded-md bg-muted" />
        <View className="flex-1 gap-xs">
          <View className="h-3 rounded-xs bg-muted w-[72%]" />
          <View className="h-[10px] rounded-xs bg-muted w-[48%]" />
        </View>
        <View className="w-[72px] h-6 rounded-full bg-muted" />
      </View>
      <View className="h-[1px] bg-border opacity-40" />
      <View className="flex-row justify-between items-center">
        <View className="h-[10px] rounded-xs bg-muted w-[42%]" />
        <View className="h-4 w-[72px] rounded-xs bg-muted" />
      </View>
    </View>
  );
}

function EmptyState({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center gap-md py-2xl px-xl">
      <View className="w-16 h-16 rounded-lg items-center justify-center bg-muted">
        <ClipboardList size={28} color={colors.secondary} />
      </View>
      <Text className="text-title font-bold text-primary-deep text-center">
        {t('customer.bookings.emptyTitle')}
      </Text>
      <Text className="text-body text-text-secondary text-center leading-relaxed">
        {t('customer.bookings.emptyDescription')}
      </Text>
      <Pressable
        onPress={onPress}
        className="min-h-[48px] px-xl rounded-md bg-secondary items-center justify-center"
        testID="bookings-empty-cta"
      >
        <Text className="text-label font-bold text-secondary-foreground">
          {t('customer.bookings.emptyCta')}
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
    <ScreenContainer testID="SCR-CUST-016">
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between py-md">
          <Pressable
            className="w-10 h-10 rounded-md items-center justify-center bg-card"
            accessibilityRole="button"
          >
            <Menu size={22} color={colors.primaryDeep} />
          </Pressable>
          <Text className="flex-1 mx-md text-subtitle font-bold text-primary-deep">
            {t('customer.bookings.pageTitle')}
          </Text>
          <Pressable
            className="w-10 h-10 rounded-md items-center justify-center bg-card"
            accessibilityRole="button"
          >
            <Search size={20} color={colors.primaryDeep} />
          </Pressable>
        </View>

        <View className="flex-row gap-section px-screen-x mb-block">
          {TAB_IDS.map((tab) => (
            <FilterTab
              key={tab}
              label={t(`BookingsListScreen.tab.${tab}`)}
              active={activeTab === tab}
              onPress={() => setActiveTab(tab)}
            />
          ))}
        </View>

        <InsetScrollView
          className="flex-1"
          contentContainerStyle={[
            {
              paddingHorizontal: screenLayout.insetX,
              paddingBottom: 40,
            },
            showList && { gap: screenLayout.body.blockGap },
            showEmptyState && { flexGrow: 1, justifyContent: 'center' },
          ]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {showOfflineBanner ? (
            <View className="bg-muted rounded-md px-md py-sm mb-item">
              <Text className="text-label text-text-secondary">
                {t('BookingsListScreen.offlineBanner')}
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <View className="gap-md">
              {Array.from({ length: 3 }).map((_, index) => (
                <LoadingSkeletonCard key={index} />
              ))}
            </View>
          ) : showEmptyState ? (
            <EmptyState onPress={handlePostTask} />
          ) : (
            <View className="gap-item">
              {filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  t={t}
                  onPress={() => handleBookingPress(booking.id)}
                />
              ))}
              {filteredBookings.length === 0 ? (
                <View className="items-center py-2xl">
                  <Text className="text-body text-text-secondary text-center">
                    {activeTab === 'active'
                      ? t('BookingsListScreen.emptyTitle')
                      : t('BookingsListScreen.completedEmptyTitle')}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </InsetScrollView>
      </View>
    </ScreenContainer>
  );
}
