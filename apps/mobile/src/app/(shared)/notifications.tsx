import { useRouter } from 'expo-router';
import { Bell, Briefcase, MessageSquare, ShieldAlert, Star } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, Text, View, type ListRenderItem } from 'react-native';

import { ScreenContainer } from '../../components/shells/ScreenContainer';
import { EmptyStateTemplate } from '../../components/templates/EmptyStateTemplate';
import { Button } from '../../components/ui/Button';
import { Touchable } from '../../components/ui/Touchable';
import { mobileSurfaces, mobileTheme } from '../../design/tokenAdapter';
import {
  useNotifications,
  type Notification,
} from '../../features/notifications/hooks/useNotifications';

const { colors, spacing } = mobileTheme;

type Row =
  | { type: 'section'; id: string; label: string }
  | { type: 'notification'; id: string; notification: Notification };

function formatRelativeTimestamp(timestamp: string, t: (key: string) => string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffMinutes < 1) {
    return t('NotificationCenterScreen.copy1');
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} мин өмнө`;
  }

  if (diffHours < 24) {
    return `${diffHours} цагийн өмнө`;
  }

  return date.toLocaleDateString('en-CA');
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function buildRows(notifications: Notification[], todayLabel: string, earlierLabel: string): Row[] {
  if (notifications.length === 0) return [];

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const anchorDate = new Date(sorted[0].created_at);

  const today = sorted.filter((item) => isSameDay(new Date(item.created_at), anchorDate));
  const earlier = sorted.filter((item) => !isSameDay(new Date(item.created_at), anchorDate));

  const rows: Row[] = [];

  if (today.length > 0) {
    rows.push({ type: 'section', id: 'today', label: todayLabel });
    rows.push(
      ...today.map((notification) => ({
        type: 'notification' as const,
        id: notification.id,
        notification,
      })),
    );
  }

  if (earlier.length > 0) {
    rows.push({ type: 'section', id: 'earlier', label: earlierLabel });
    rows.push(
      ...earlier.map((notification) => ({
        type: 'notification' as const,
        id: notification.id,
        notification,
      })),
    );
  }

  return rows;
}

function getNotificationMeta(title: string): { icon: React.ReactNode; shellColor: string } {
  if (/message/i.test(title)) {
    return {
      icon: <MessageSquare size={18} color={colors.foreground} />,
      shellColor: colors.chipInactive,
    };
  }
  if (/booking/i.test(title)) {
    return {
      icon: <Briefcase size={18} color={colors.primaryDeep} />,
      shellColor: colors.statusOpen,
    };
  }
  if (/dispute/i.test(title)) {
    return {
      icon: <ShieldAlert size={18} color={colors.primaryForeground} />,
      shellColor: colors.danger,
    };
  }
  if (/review/i.test(title)) {
    return { icon: <Star size={18} color={colors.primaryDeep} />, shellColor: colors.muted };
  }
  return {
    icon: <Bell size={18} color={colors.primaryForeground} />,
    shellColor: colors.primaryDeep,
  };
}

export default function NotificationCenterScreen() {
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
        <Text className="text-caption font-bold text-text-tertiary uppercase mt-lg mb-sm tracking-[1.2px]">
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
            <Text className="flex-1 text-body font-bold text-foreground" numberOfLines={1}>
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
          <Text className="mt-xs text-body text-text-secondary leading-[22px]" numberOfLines={2}>
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
            <Bell size={32} color={colors.danger} />
          </View>
          <Text className="text-title font-bold text-foreground text-center">
            {t('shared.notifications.errorTitle')}
          </Text>
          <Text className="mt-sm text-body text-text-secondary text-center leading-[24px]">
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
          icon={<Bell size={32} color={colors.textSecondary} />}
        />
      ) : (
        <FlatList
          data={rows}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          ListFooterComponent={
            <View className="mt-xl bg-primary-deep rounded-lg p-lg justify-end h-[128px]">
              <Text className="text-subtitle font-extrabold text-primary-foreground">
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
