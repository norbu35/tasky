import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNotifications, type Notification } from '../../features/notifications/hooks/useNotifications';
import { FeedListTemplate } from '../../components/templates/FeedListTemplate';
import { mobileTheme } from '../../design/tokenAdapter';

const { colors, spacing, typography, radius } = mobileTheme;

export default function NotificationCenterScreen() {
    const { t } = useTranslation();
    const { data, isLoading, isError, isRefetching, refetch } = useNotifications();

    const notifications: Notification[] = data?.data ?? [];

    const renderItem = useCallback(
        (item: Notification) => (
            <View testID={`notification-item-${item.id}`} style={styles.card}>
                <View style={styles.cardContent}>
                    {!item.read && <View style={styles.unreadDot} />}
                    <View style={styles.textBlock}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.body} numberOfLines={2}>
                            {item.body}
                        </Text>
                        <Text style={styles.timestamp}>
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </View>
        ),
        [],
    );

    return (
        <View style={styles.container}>
            <Text style={styles.screenTitle}>{t('shared.notifications.title')}</Text>
            <FeedListTemplate
                testID="notification-list"
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                isError={isError}
                isEmpty={notifications.length === 0}
                onRefresh={refetch}
                isRefreshing={isRefetching}
                onRetry={refetch}
                emptyTitle={t('shared.notifications.emptyTitle')}
                emptyDescription={t('shared.notifications.emptyDescription')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    screenTitle: {
        fontSize: typography.title,
        fontWeight: '700',
        color: colors.foreground,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.accent,
        marginTop: 6,
        marginRight: spacing.sm,
    },
    textBlock: {
        flex: 1,
    },
    title: {
        fontSize: typography.body,
        fontWeight: '600',
        color: colors.foreground,
    },
    body: {
        fontSize: typography.label,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    timestamp: {
        fontSize: typography.micro,
        color: colors.mutedForeground,
        marginTop: spacing.xs,
    },
});
