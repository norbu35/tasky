import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Bolt,
  ChevronLeft,
  Hammer,
  Leaf,
  Package,
  Shirt,
  Sparkles,
  Search,
} from 'lucide-react-native';
import { Input } from '../../../../components/ui/Input';
import { StepIndicator } from '../../../../components/ui/StepIndicator';
import { useCategories } from '../../../../features/tasks/hooks/useCategories';
import { elevations } from '../../../../design/elevations';
import { mobileTheme } from '../../../../design/tokenAdapter';
import type { Category } from '../../../../lib/mobileApiClient';

const { colors, spacing, radius, typography } = mobileTheme;

type CategoryVisual = {
  description: string;
  icon: typeof Sparkles;
  tint: string;
  tone: string;
};

function getCategoryVisual(name: string): CategoryVisual {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes('clean')) {
    return {
      description: 'Deep, regular, or move-out',
      icon: Sparkles,
      tint: colors.primary,
      tone: `${colors.primary}12`,
    };
  }

  if (normalized.includes('handy') || normalized.includes('repair')) {
    return {
      description: 'Repairs and installations',
      icon: Hammer,
      tint: colors.secondary,
      tone: `${colors.secondary}1A`,
    };
  }

  if (normalized.includes('moving')) {
    return {
      description: 'Furniture, boxes, delivery',
      icon: Package,
      tint: colors.accent,
      tone: `${colors.accent}1A`,
    };
  }

  if (normalized.includes('laundry')) {
    return {
      description: 'Wash, fold, and iron',
      icon: Shirt,
      tint: colors.primaryDeep,
      tone: `${colors.primaryDeep}14`,
    };
  }

  if (normalized.includes('electric')) {
    return {
      description: 'Wiring, lighting, outlets',
      icon: Bolt,
      tint: colors.secondary,
      tone: `${colors.secondary}1A`,
    };
  }

  if (normalized.includes('garden')) {
    return {
      description: 'Mowing, weeding, planting',
      icon: Leaf,
      tint: colors.trust,
      tone: `${colors.trust}18`,
    };
  }

  return {
    description: 'Pick the best fit and add details next',
    icon: Sparkles,
    tint: colors.primary,
    tone: `${colors.primary}12`,
  };
}

function CategoryCard({
  category,
  onPress,
}: {
  category: Category;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const visual = getCategoryVisual(category.name);
  const Icon = visual.icon;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={`category-item-${category.id}`}
      style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}
    >
      <View style={[styles.categoryIconWrap, { backgroundColor: visual.tone }]}>
        <Icon color={visual.tint} size={22} />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categoryDescription}>{visual.description}</Text>
    </Pressable>
  );
}

export default function CategorySelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useCategories();
  const [query, setQuery] = useState('');

  const categories = data?.data ?? [];
  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(normalizedQuery));
  }, [categories, query]);

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      router.push({
        pathname: '/(customer)/tasks/new/intake',
        params: { categoryId },
      });
    },
    [router],
  );

  return (
    <View style={styles.container} testID="category-selection-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          testID="category-selection-back"
          accessibilityRole="button"
        >
          <ChevronLeft size={22} color={colors.primary} />
          <Text style={styles.backLabel}>{t('common.back', 'Back')}</Text>
        </Pressable>
        <Text style={styles.pageTitle}>{t('customer.postTask.selectCategory', 'Select Category')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        testID="category-selection-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.stepLabel}>{t('taskPost.step', 'Step {{current}} of {{total}}').replace('{{current}}', '1').replace('{{total}}', '7')}</Text>
          <StepIndicator currentStep={1} totalSteps={7} testID="category-selection-step-indicator" />
          <Text style={styles.title}>{t('customer.postTask.categoryInstruction', 'What type of task do you need?')}</Text>
          <Text style={styles.support}>
            {t(
              'customer.postTask.categorySupport',
              'Pick the closest match. You can refine the scope in the next step.',
            )}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color={colors.textSecondary} />
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t('customer.postTask.searchCategories', 'Search categories')}
            testID="category-selection-search"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.featuredBanner}>
          <View style={styles.featuredIcon}>
            <Sparkles size={18} color={colors.primary} />
          </View>
          <View style={styles.featuredCopy}>
            <Text style={styles.featuredTitle}>
              {t('customer.postTask.featuredTitle', 'Need help choosing?')}
            </Text>
            <Text style={styles.featuredBody}>
              {t(
                'customer.postTask.featuredBody',
                'Pick the closest match and refine the job scope in the next step.',
              )}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingState} testID="category-selection-loading">
            <ActivityIndicator color={colors.primary} />
            <View style={styles.grid}>
              {Array.from({ length: 8 }).map((_, index) => (
                <View key={index} style={styles.loadingCard} />
              ))}
            </View>
          </View>
        ) : isError ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>
              {t('customer.postTask.categoryLoadError', 'Failed to load categories')}
            </Text>
            <Text style={styles.messageBody}>
              {t('customer.postTask.categoryLoadHint', 'Pull to refresh or try again shortly.')}
            </Text>
            <Pressable onPress={() => refetch()} style={styles.retryButton} testID="category-selection-retry">
              <Text style={styles.retryLabel}>{t('customer.postTask.categoryRetry', 'Try again')}</Text>
            </Pressable>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>{t('categories.empty', 'No categories available')}</Text>
          </View>
        ) : (
          <View style={styles.grid} testID="category-selection-grid">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.primary,
  },
  pageTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.primaryDeep,
    lineHeight: typography.title * 1.2,
  },
  support: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: typography.body * 1.5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...elevations.card,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 40,
    backgroundColor: 'transparent',
  },
  featuredBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}18`,
  },
  featuredCopy: {
    flex: 1,
    gap: 2,
  },
  featuredTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  featuredBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
  loadingState: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  loadingCard: {
    width: '48%',
    minHeight: 132,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
  },
  messageCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...elevations.card,
  },
  messageTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  messageBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.5,
  },
  retryButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  retryLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.secondaryForeground,
  },
  categoryCard: {
    width: '48%',
    minHeight: 132,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...elevations.card,
  },
  categoryCardPressed: {
    opacity: 0.95,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.primaryDeep,
  },
  categoryDescription: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: typography.caption * 1.4,
  },
});
