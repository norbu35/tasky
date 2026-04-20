import { Menu, Search } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, Text, View } from 'react-native';

import { InsetScrollView, ScreenContainer } from '@/components/shells';
import { Touchable } from '@/components/ui/Touchable';
import { screenLayout } from '@/design/screenLayout';
import { mobileTheme } from '@/design/tokenAdapter';
import { mobileSurfaces } from '@/design/surfaces';

import { TAB_IDS } from './model';
import { FilterTab } from './FilterBar';
import { BookingCard, LoadingSkeletonCard } from './BookingCard';
import { EmptyState } from './EmptyState';
import { useBookingsListScreen } from './useBookingsListScreen';

const { colors, spacing } = mobileTheme;
const { bookingList } = mobileSurfaces;

export default function BookingsListScreen() {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    isRefreshing,
    filteredBookings,
    isLoading,
    showEmptyState,
    showList,
    showOfflineBanner,
    handleRefresh,
    handleBookingPress,
    handlePostTask,
  } = useBookingsListScreen();

  return (
    <ScreenContainer testID="SCR-CUST-016">
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between py-md">
          <Touchable
            className="rounded-md items-center justify-center bg-card"
            style={{ width: bookingList.headerIconBox, height: bookingList.headerIconBox }}
            accessibilityRole="button"
          >
            <Menu size={20} color={colors.primaryDeep} />
          </Touchable>
          <Text className="flex-1 mx-md text-subtitle font-bold text-primary-deep">
            {t('customer.bookings.pageTitle')}
          </Text>
          <Touchable
            className="rounded-md items-center justify-center bg-card"
            style={{ width: bookingList.headerIconBox, height: bookingList.headerIconBox }}
            accessibilityRole="button"
          >
            <Search size={20} color={colors.primaryDeep} />
          </Touchable>
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
              paddingBottom: spacing['3xl'],
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
