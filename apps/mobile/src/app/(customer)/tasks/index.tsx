import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { FeedListTemplate } from '../../../components/templates/FeedListTemplate';
import { FilterBar } from '../../../components/ui/FilterBar';
import { SplitCard } from '../../../components/ui/SplitCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PriceTag } from '../../../components/ui/PriceTag';
import { useMyTasks } from '../../../features/tasks/hooks/useMyTasks';
import { mobileTheme } from '../../../design/tokenAdapter';
import type { Task } from '../../../lib/mobileApiClient';

const { colors, spacing, typography } = mobileTheme;

const FILTER_TABS = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'completed', label: 'Completed' },
];

function mapStatus(status: string): 'open' | 'assigned' | 'completed' | 'cancelled' | 'no_show' {
    const lower = status.toLowerCase();
    if (lower === 'open') return 'open';
    if (lower === 'assigned') return 'assigned';
    if (lower === 'completed') return 'completed';
    if (lower === 'cancelled') return 'cancelled';
    if (lower === 'no_show') return 'no_show';
    return 'open';
}

export default function MyTasksListScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { data, isLoading, isError, refetch } = useMyTasks();
    const [activeFilter, setActiveFilter] = useState<string[]>(['all']);

    const tasks = data?.data ?? [];

    const filteredTasks = activeFilter.includes('all')
        ? tasks
        : tasks.filter((task: any) => activeFilter.includes(task.status?.toLowerCase()));

    const handleToggleFilter = useCallback((id: string) => {
        setActiveFilter([id]);
    }, []);

    const handleFabPress = useCallback(() => {
        router.push('/(customer)/tasks/new/category');
    }, [router]);

    const renderTaskCard = useCallback(
        (task: any) => (
            <SplitCard
                testID={`task-card-${task.id}`}
                headerContent={
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{task.description}</Text>
                        <PriceTag amount={task.budget ?? 0} size="sm" />
                    </View>
                }
                bodyContent={
                    <View style={styles.cardBody}>
                        <StatusBadge status={mapStatus(task.status ?? 'open')} />
                        {task.scheduled_at && (
                            <Text style={styles.cardSchedule}>
                                {new Date(task.scheduled_at).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                }
            />
        ),
        [],
    );

    const filterBar = (
        <FilterBar
            filters={FILTER_TABS.map((f) => ({ id: f.id, label: t(`customer.taskList.filter${f.label}`, f.label) }))}
            activeFilters={activeFilter}
            onToggle={handleToggleFilter}
            testID="my-tasks-filter-bar"
        />
    );

    return (
        <View style={styles.container} testID="my-tasks-screen">
            <FeedListTemplate
                data={filteredTasks}
                renderItem={renderTaskCard}
                keyExtractor={(task: any) => task.id}
                isLoading={isLoading}
                isError={isError}
                isEmpty={tasks.length === 0}
                onRefresh={refetch}
                emptyTitle={t('customer.taskList.emptyTitle', 'No tasks yet')}
                emptyDescription={t('customer.taskList.emptyDescription', 'Post your first task and find trusted help')}
                emptyCtaLabel={t('customer.taskList.emptyCta', 'Post a Task')}
                emptyCtaOnPress={handleFabPress}
                filterBar={filterBar}
                testID="my-tasks-feed"
            />
            <Pressable
                style={styles.fab}
                onPress={handleFabPress}
                testID="my-tasks-fab"
                accessibilityRole="button"
                accessibilityLabel={t('customer.taskList.emptyCta', 'Post a Task')}
            >
                <Plus size={28} color={colors.primaryForeground} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: mobileTheme.shadows.elevated.color,
        shadowOffset: mobileTheme.shadows.elevated.offset,
        shadowOpacity: mobileTheme.shadows.elevated.opacity,
        shadowRadius: mobileTheme.shadows.elevated.radius,
        elevation: mobileTheme.shadows.elevated.elevation,
        zIndex: 999,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        flex: 1,
        fontSize: typography.body,
        fontWeight: '600',
        color: colors.primaryForeground,
        marginRight: spacing.sm,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardSchedule: {
        fontSize: typography.caption,
        color: colors.textSecondary,
    },
});
