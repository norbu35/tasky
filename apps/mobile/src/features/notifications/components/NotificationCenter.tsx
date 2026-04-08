import React, { useCallback } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Bell, CheckCircle, MessageSquare } from 'lucide-react-native';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { mobileTheme } from '../../../design/tokenAdapter';

const { colors, radius, spacing, typography } = mobileTheme;

type NotificationType = 'info' | 'success' | 'warning' | 'message';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  onPressNotification?: (notification: NotificationItem) => void;
}

function buildMockNotifications(t: TFunction): NotificationItem[] {
  return [
    {
      id: '1',
      type: 'info',
      title: t('shared.notifications.newApplicant'),
      body: t('NotificationCenter.copy1'),
      timestamp: t('NotificationCenter.copy2'),
      read: false,
    },
    {
      id: '2',
      type: 'success',
      title: t('shared.notifications.bookingConfirmed'),
      body: t('NotificationCenter.copy3'),
      timestamp: t('NotificationCenter.copy4'),
      read: false,
    },
    {
      id: '3',
      type: 'warning',
      title: t('shared.notifications.reviewReminder'),
      body: t('NotificationCenter.copy5'),
      timestamp: t('NotificationCenter.copy6'),
      read: true,
    },
    {
      id: '4',
      type: 'message',
      title: t('shared.notifications.newMessage'),
      body: t('NotificationCenter.copy7'),
      timestamp: t('common.yesterday'),
      read: true,
    },
    {
      id: '5',
      type: 'success',
      title: t('shared.notifications.taskCompleted'),
      body: t('NotificationCenter.copy8'),
      timestamp: t('NotificationCenter.copy9'),
      read: true,
    },
  ];
}

function getNotificationIcon(type: NotificationType) {
  const iconSize = 20;
  switch (type) {
    case 'success':
      return <CheckCircle size={iconSize} color={colors.verified} />;
    case 'warning':
      return <AlertTriangle size={iconSize} color={colors.accent} />;
    case 'message':
      return <MessageSquare size={iconSize} color={colors.primary} />;
    case 'info':
    default:
      return <Bell size={iconSize} color={colors.primaryDeep} />;
  }
}

function getIconBackground(type: NotificationType): string {
  switch (type) {
    case 'success':
      return colors.statusOpen;
    case 'warning':
      return colors.trust;
    case 'message':
      return colors.muted;
    case 'info':
    default:
      return colors.subtleViolet;
  }
}

export function NotificationCenter({ onPressNotification }: NotificationCenterProps) {
  const { t } = useTranslation();
  const notifications = buildMockNotifications(t);

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <Pressable
        style={styles.notificationRow}
        onPress={() => onPressNotification?.(item)}
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: getIconBackground(item.type) }]}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.notificationTitle, !item.read && styles.unreadTitle]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </Pressable>
    ),
    [onPressNotification],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Bell size={48} color={colors.mutedForeground} />
        </View>
        <Text style={styles.emptyTitle}>
          {t('notifications.emptyTitle')}
        </Text>
        <Text style={styles.emptySubtitle}>
          {t('notifications.emptySubtitle')}
        </Text>
      </View>
    ),
    [t],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
      </View>
      <FlatList
        style={{ flex: 1 }}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notificationTitle: {
    fontSize: typography.label,
    fontWeight: '500',
    color: colors.foreground,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryDeep,
    marginLeft: spacing.sm,
  },
  notificationBody: {
    fontSize: typography.caption,
    color: colors.mutedForeground,
    lineHeight: 17,
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: typography.micro,
    color: colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingTop: 120,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.label,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});
