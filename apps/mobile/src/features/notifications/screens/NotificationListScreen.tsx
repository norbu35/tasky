import { useRouter } from 'expo-router';
import { Bell, Briefcase, MessageSquare, ShieldAlert, Star } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View, type ListRenderItem } from 'react-native';

import { ScreenContainer } from '@/components/shells/ScreenContainer';
import { EmptyStateTemplate } from '@/components/templates/EmptyStateTemplate';
import { Button } from '@/components/ui/Button';
import { Touchable } from '@/components/ui/Touchable';
import { mobileSurfaces } from '@/design/surfaces';
import { mobileTheme } from '@/design/tokenAdapter';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

import { buildRows, formatRelativeTimestamp, type Row } from './NotificationList.model';

const { colors, spacing } = mobileTheme;

function getNotificationMeta(title: string): { icon: React.ReactNode; shellColor: string } {
  if (/message/i.test(title)) {
    return {
      icon: <MessageSquare size={20} color={colors.foreground} />,
      shellColor: colors.chipInactive,
    };
  }
  if (/booking/i.test(title)) {
    return {
      icon: <Briefcase size={20} color={colors.primaryDeep} />,
      shellColor: colors.statusOpen,
    };
  }
  if (/dispute/i.test(title)) {
    return {
      icon: <ShieldAlert size={20} color={colors.primaryForeground} />,
      shellColor: colors.danger,
    };
  }
  if (/review/i.test(title)) {
    return { icon: <Star size={20} color={colors.primaryDeep} />, shellColor: colors.muted };
  }
  return {
    icon: <Bell size={20} color={colors.primaryForeground} />,
    shellColor: colors.primaryDeep,
  };
}

export default function NotificationListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useNotifications();

  const notifications = useMemo(() => data?.data ?? [], [data?.data]);
  const rows = useMemo(
    () => buildRows(notifications, t('label.today'), t('label.earlier')),
    [notifications, t],
  );

  const renderRow: ListRenderItem<Row> = ({ item }) => {
    if (item.type === 'section') {
      return (
        <Text className="text-caption font-sans-bold text-text-tertiary uppercase mt-lg mb-sm tracking-normal">
          {item.label}
        </Text>
      );
    }

    const notification = item.notification;
    const meta = getNotificationMeta(notification.title);

    return (
      <Touchable
        testID={`notification-item-${notification.id}`}
        className={`flex-row gap-md p-md mb-[2px]${!notification.read ? ' bg-muted' : ''}`}
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/inbox' as never)}
      >
        {/* iconShell: runtime shellColor from getNotificationMeta → imperative */}
        <View
          className="w-10 h-10 rounded-md items-center justify-center"
          style={{ backgroundColor: meta.shellColor }}
        >
          {meta.icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-sm">
            <Text className="flex-1 text-body font-sans-bold text-foreground" numberOfLines={1}>
              {notification.title}
            </Text>
            <View className="flex-row items-center gap-xs">
              <Text className="text-micro text-text-tertiary">
                {formatRelativeTimestamp(notification.created_at, t)}
              </Text>
              {!notification.read ? (
                <View
                  testID={`notification-unread-dot-${notification.id}`}
                  className="w-2 h-2 rounded-full bg-secondary"
                />
              ) : null}
            </View>
          </View>
          <Text className="mt-xs text-body text-text-secondary leading-relaxed" numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
      </Touchable>
    );
  };

  return (
    <ScreenContainer edges={['left', 'right']} testID="SCR-SHARED-016">
      {isLoading ? (
        <View className="px-lg py-lg gap-sm" testID="notifications-loading">
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} className="h-[88px] rounded-md bg-muted" />
          ))}
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-xl" testID="notifications-error">
          <View
            className="rounded-full items-center justify-center bg-muted mb-lg"
            style={{
              width: mobileSurfaces.statusHero.iconBox,
              height: mobileSurfaces.statusHero.iconBox,
            }}
          >
            <Bell size={24} color={colors.danger} />
          </View>
          <Text className="text-title font-sans-bold text-foreground text-center">
            {t('shared.notifications.errorTitle')}
          </Text>
          <Text className="mt-sm text-body text-text-secondary text-center leading-relaxed">
            {t('shared.notifications.errorBody')}
          </Text>
          <Button
            testID="notifications-error-retry"
            label={t('shared.notifications.retry')}
            onPress={() => {
              void refetch();
            }}
            className="mt-xl self-stretch"
          />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyStateTemplate
          testID="notifications-empty"
          title={t('shared.notifications.emptyTitle')}
          description={t('shared.notifications.emptyDescription')}
          icon={<Bell size={24} color={colors.textSecondary} />}
        />
      ) : (
        <FlatList
          data={rows}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListFooterComponent={
            <View className="mt-xl bg-primary-deep rounded-lg p-lg justify-end h-[128px]">
              <Text className="text-subtitle font-display-bold text-primary-foreground">
                {t('shared.notifications.promoBannerTitle')}
              </Text>
              <Text
                className="text-caption mt-xs leading-relaxed"
                style={{ color: `${colors.primaryForeground}99` }}
              >
                {t('NotificationCenterScreen.copy2')}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
