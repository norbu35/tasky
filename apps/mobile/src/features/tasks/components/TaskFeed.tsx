import React, { useState, useCallback } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, Briefcase, Wrench, Truck, Zap } from 'lucide-react-native';
import { useTasks } from '../hooks/useTasks';
import { TaskDetailsModal } from './TaskDetailsModal';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { PublicTask } from '../../../lib/mobileApiClient';
import { CategoryChip, TrustBanner, StatusBadge } from '../../../components/ui';
import { mobileTheme } from '../../../design/tokenAdapter';
import { useTranslation } from 'react-i18next';

const { colors, radius, typography, shadows } = mobileTheme;

const CATEGORIES = [
  { key: 'all', icon: null },
  { key: 'cleaning', icon: Briefcase },
  { key: 'repair', icon: Wrench },
  { key: 'moving', icon: Truck },
  { key: 'electric', icon: Zap },
];

function CategoryIcon({ category }: { category?: string }) {
  const iconColor = colors.primaryDeep;
  const size = 22;
  switch (category?.toLowerCase()) {
    case 'cleaning':
      return <Briefcase size={size} color={iconColor} />;
    case 'repair':
    case 'handyman':
      return <Wrench size={size} color={iconColor} />;
    case 'moving':
      return <Truck size={size} color={iconColor} />;
    case 'electrician':
    case 'electric':
      return <Zap size={size} color={iconColor} />;
    default:
      return <Briefcase size={size} color={iconColor} />;
  }
}

function TaskCard({ task, onPress }: { task: PublicTask; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} style={styles.taskCard}>
      <View style={styles.taskCardHeader}>
        <View style={styles.categoryIconContainer}>
          <CategoryIcon category={task.category?.name} />
        </View>
        <StatusBadge status="open" />
      </View>

      <Text style={styles.taskTitle} numberOfLines={2}>
        {task.description}
      </Text>

      <Text style={styles.taskPrice}>₮{task.budget?.toLocaleString()}</Text>

      <View style={styles.taskMeta}>
        <View style={styles.metaItem}>
          <MapPin size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>
            {task.approximate_location || t('taskFeed.unknownLocation')}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>
            {task.scheduled_at
              ? new Date(task.scheduled_at).toLocaleDateString('en', {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : t('taskFeed.flexible')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function TaskFeed() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useTasks();
  const [selectedTask, setSelectedTask] = useState<PublicTask | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tasks = data?.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: PublicTask }) => (
      <TaskCard task={item} onPress={() => setSelectedTask(item)} />
    ),
    [],
  );

  const ListHeader = (
    <>
      {/* Search & Greeting */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          {t('taskFeed.heroLine1')}
          {'\n'}
          <Text style={styles.heroAccent}>{t('taskFeed.heroLine2')}</Text>
        </Text>

        <View style={styles.searchContainer}>
          <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('taskFeed.searchPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={t(`categories.${cat.key}`, cat.key.charAt(0).toUpperCase() + cat.key.slice(1))}
            isActive={activeCategory === cat.key}
            onPress={() => setActiveCategory(cat.key)}
          />
        ))}
      </ScrollView>

      {/* Trust Banner */}
      <View style={styles.bannerContainer}>
        <TrustBanner
          title={t('taskFeed.verifiedTasker')}
          description={t('taskFeed.trustBannerDesc')}
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('taskFeed.availableTasks')}</Text>
        <Pressable>
          <Text style={styles.seeMapLink}>{t('taskFeed.seeMap')}</Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isLoading ? (
        <View style={styles.skeletonList}>
          {ListHeader}
          <View style={styles.contentPadding}>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </View>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TaskDetailsModal
        visible={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 128,
  },
  skeletonList: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 24,
  },

  // Hero
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
  },
  heroTitle: {
    fontSize: typography.heroTitle,
    fontWeight: '800',
    color: colors.foreground,
    lineHeight: 36,
    letterSpacing: -0.75,
  },
  heroAccent: {
    color: colors.primaryDeep,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    height: 56,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.foreground,
  },

  // Chips
  chipScroll: {
    marginTop: 24,
  },
  chipRow: {
    paddingHorizontal: 24,
    gap: 12,
  },

  // Banner
  bannerContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.foreground,
  },
  seeMapLink: {
    fontSize: typography.label,
    fontWeight: '700',
    color: colors.primaryDeep,
  },

  // Task Card
  taskCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 20,
    shadowColor: shadows.card.color,
    shadowOffset: shadows.card.offset,
    shadowOpacity: shadows.card.opacity,
    shadowRadius: shadows.card.radius,
    elevation: shadows.card.elevation,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.subtleViolet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: typography.subtitle,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 23,
  },
  taskPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryDeep,
    marginTop: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 17,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
});
