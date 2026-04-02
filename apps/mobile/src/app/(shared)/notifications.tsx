import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Briefcase, MessageSquare, ShieldAlert, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  useNotifications,
  type Notification,
} from '../../features/notifications/hooks/useNotifications';
import { EmptyStateTemplate } from '../../components/templates/EmptyStateTemplate';
import { Button } from '../../components/ui/Button';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

type Row =
  | { type: 'section'; id: string; label: string }
  | { type: 'notification'; id: string; notification: Notification };

function formatRelativeTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffMinutes < 1) {
    return 'Дөнгөж сая';
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
    rows.push(...today.map((notification) => ({ type: 'notification' as const, id: notification.id, notification })));
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

function getNotificationIcon(title: string) {
  if (/message/i.test(title)) {
    return <MessageSquare size={18} color={colors.primary} />;
  }

  if (/booking/i.test(title)) {
    return <Briefcase size={18} color={colors.primary} />;
  }

  if (/dispute/i.test(title)) {
    return <ShieldAlert size={18} color={colors.danger} />;
  }

  if (/review/i.test(title)) {
    return <Star size={18} color={colors.secondary} />;
  }

  return <Bell size={18} color={colors.primary} />;
}

export default function NotificationCenterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, isRefetching, refetch } = useNotifications();

  const notifications = data?.data ?? [];
  const rows = useMemo(
    () =>
      buildRows(
        notifications,
        t('label.today', 'Өнөөдөр'),
        t('label.earlier', 'Өмнөх'),
      ),
    [notifications, t],
  );

  const renderRow: ListRenderItem<Row> = ({ item }) => {
    if (item.type === 'section') {
      return <Text style={styles.sectionLabel}>{item.label}</Text>;
    }

    const notification = item.notification;

    return (
      <Pressable
        testID={`notification-item-${notification.id}`}
        style={styles.card}
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/inbox' as never)}
      >
        <View style={styles.iconShell}>{getNotificationIcon(notification.title)}</View>
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{notification.title}</Text>
            {!notification.read ? (
              <View
                testID={`notification-unread-dot-${notification.id}`}
                style={styles.unreadDot}
              />
            ) : null}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.timestamp}>{formatRelativeTimestamp(notification.created_at)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container} testID="notifications-screen">
      <View style={styles.header}>
        <Pressable
          testID="notifications-back"
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.screenTitle}>{t('shared.notifications.title', 'Мэдэгдлүүд')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonList} testID="notifications-loading">
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.skeletonCard} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.errorState} testID="notifications-error">
          <View style={styles.errorIconShell}>
            <Bell size={32} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>
            {t('shared.notifications.errorTitle', 'Алдаа гарлаа')}
          </Text>
          <Text style={styles.errorBody}>
            {t('shared.notifications.errorBody', 'Мэдэгдлүүдийг ачаалахад алдаа гарлаа')}
          </Text>
          <Button
            testID="notifications-error-retry"
            label={t('shared.notifications.retry', 'Дахин оролдох')}
            onPress={() => {
              void refetch();
            }}
            style={styles.errorButton}
          />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyStateTemplate
          testID="notifications-empty"
          title={t('shared.notifications.emptyTitle', 'Мэдэгдэл алга')}
          description={t('shared.notifications.emptyDescription', 'Танд одоогоор мэдэгдэл ирээгүй байна')}
          icon={<Bell size={32} color={colors.textSecondary} />}
        />
      ) : (
        <FlatList
          data={rows}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  screenTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  iconShell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.foreground,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  body: {
    marginTop: spacing.xs,
    fontSize: typography.label,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  timestamp: {
    marginTop: spacing.xs,
    fontSize: typography.micro,
    color: colors.textTertiary,
  },
  skeletonList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  skeletonCard: {
    height: 88,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIconShell: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  errorBody: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorButton: {
    marginTop: spacing.xl,
    alignSelf: 'stretch',
  },
});
